/* eslint-disable @typescript-eslint/no-explicit-any */
import { ReflectKeys, LoginType } from './enums'
import { IModuleMetadata, IType, IMessageVO, IManager } from './interfaces'
import { plainToInstance } from 'class-transformer'
import { validateOrReject } from 'class-validator'
import codes from './error-code'
import { HttpException, ParameterException } from './exceptions'
import Repository from './repository'

export default class Factory {
  private context!: any

  private appControllers: IType<object>[] = []

  private appServices: IType<object>[] = []

  private appMethodObj: { [key: string]: IType<object> } = {}

  private controllerMap: Map<string, object> = new Map()

  private serviceMap: Map<string, object> = new Map()

  private methodMap: Map<IType<object>, string[]> = new Map()

  private repositoryMap: Map<string, object> = new Map()

  private permissionMap: Map<string, string> = new Map()

  constructor(private readonly appModule: IModuleMetadata<object>) {
    const appImports = Reflect.getMetadata(ReflectKeys.MODULE_KEY, appModule).imports
    appImports.forEach((item: object) => {
      const info: IModuleMetadata<object> = Reflect.getMetadata(ReflectKeys.MODULE_KEY, item)
      this.appControllers = [...this.appControllers, ...(info.controllers ?? [])]
      this.appServices = [...this.appServices, ...(info.services ?? [])]
    })
    this.appControllers.forEach((controller) => {
      // 注入service
      this.injectService(controller)
      // 注册路由方法对象和权限信息
      this.initMethodObj(controller)
    })
  }

  public getMethodObj() {
    return this.appMethodObj
  }

  public async validateParams() {
    const method = this.context.__internalObject.methodName
    const params = this.context.__internalObject.params
    const target = this.getTargetByMethod(method)
    const idIndex = Reflect.getMetadata(ReflectKeys.ID_KEY, target.prototype, method) as number
    const bodyIndex = Reflect.getMetadata(ReflectKeys.REQUEST_BODY_KEY, target.prototype, method) as number
    // 存在请求id参数
    if (idIndex !== undefined) {
      if (typeof params[idIndex] !== 'string' || !params[idIndex]) {
        throw new ParameterException(2000, 'id值不合法')
      }
    }
    // 存在请求参数对象
    if (bodyIndex !== undefined) {
      const types = Reflect.getMetadata(ReflectKeys.SELF_PARAM_KEY, target.prototype, method) as IType[]
      // 请求参数对象转实例类
      params[bodyIndex] = plainToInstance(types[bodyIndex], params[bodyIndex])
      const valid = <boolean>Reflect.getMetadata(ReflectKeys.VALIDATE_KEY, types[bodyIndex])
      // 参数验证 失败抛出错误
      if (valid)
        await validateOrReject(params[bodyIndex]).catch((error) => {
          const message = error
            .map(
              (item: { constraints: { [s: string]: unknown } | ArrayLike<unknown> }) =>
                Object.values(item.constraints)[0]
            )
            .join('&')
          throw new ParameterException(2000, message)
        })
    }
  }

  public hasPermission(permissions: string[]): boolean {
    const method = this.context.__internalObject.methodName
    const target = this.getTargetByMethod(method)
    const loginType = Reflect.getMetadata(ReflectKeys.LOGIN_KEY, target.prototype, method)
    if (!loginType || loginType === LoginType.ANONYMOUS) return true
    if (loginType === LoginType.ADMIN) {
      return permissions.includes('admin')
    }
    if (loginType === LoginType.GROUP) {
      const permission = this.permissionMap.get(method) as string
      return permissions.includes(permission)
    }
    return true
  }

  public handleError(error: Error): IMessageVO {
    const method = this.context.__internalObject.methodName
    if (error instanceof HttpException) {
      return {
        errCode: error.errCode,
        errMsg: error.errMsg,
        method
      }
    }
    return {
      errCode: 999,
      errMsg: codes[999],
      method
    }
  }

  public async mount(context: any, uniCloud: any) {
    const clientInfo = context.__internalObject.context
    const dbJQL = uniCloud.databaseForJQL({
      clientInfo
    })
    const db = uniCloud.database()
    const transaction = await db.startTransaction()
    this.context = { ...context, db, dbJQL, transaction }
    this.setContextRepository({ db, dbJQL, transaction })
  }

  private getTargetByMethod(method: string): IType {
    let target
    for (const [key, value] of this.methodMap) {
      if (value.includes(method)) {
        target = key
      }
    }
    return <IType>target
  }

  private initMethodObj(controller: IType<object>) {
    Object.getOwnPropertyNames(controller.prototype).forEach((k) => {
      if (k === 'constructor') return
      const refMethodKey = Reflect.getMetadata(ReflectKeys.METHOD_KEY, controller.prototype, k)
      // 未标注 @Method 不能作为视图函数
      if (!refMethodKey) return
      // 已存在重复方法名
      if (this.appMethodObj[k]) throw new Error(`重复方法名 ${k}`)
      const controllerMethod = this.methodMap.get(controller)
      if (!controllerMethod) {
        this.methodMap.set(controller, [k])
      } else {
        controllerMethod?.push(k)
      }
      const controllerIns = this.controllerMap.get(controller.name) as { [key: string]: any }
      this.appMethodObj[k] = controllerIns[k].bind(controllerIns)
      // 设置权限信息
      this.setPermission(controller, k)
    })
  }

  private injectService(controller: IType<object>) {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const app = this
    const serviceTypes = Reflect.getMetadata(ReflectKeys.SELF_PARAM_KEY, controller)
    if (!serviceTypes) {
      this.controllerMap.set(controller.name, new controller())
    } else {
      const services = serviceTypes.map((service: IType<object>) => {
        const serviceIns = this.serviceMap.get(service.name)
        if (serviceIns) return serviceIns
        // 处理事务方法
        Object.getOwnPropertyNames(service.prototype).forEach((name) => {
          const transaction = Reflect.getMetadata(ReflectKeys.TRANSACTION_KEY, service.prototype, name)
          if (transaction) {
            const handler = service.prototype[name]
            service.prototype[name] = async function (...args: unknown[]) {
              try {
                const res = await handler.apply(this, args)
                return res
              } catch (error) {
                app.context.transaction.rollback()
                throw error
              }
            }
          }
        })
        // 注入repository
        let newServiceIns
        const repositoryTypes = Reflect.getMetadata(ReflectKeys.SELF_PARAM_KEY, service)
        if (!repositoryTypes) {
          newServiceIns = new service()
        } else {
          const repositoryInsList = repositoryTypes.map((repository: IType) => {
            const repositoryIns = this.repositoryMap.get(repository.name)
            if (repositoryIns) return repositoryIns
            const newRepositoryIns = new repository() as object
            this.repositoryMap.set(repository.name, newRepositoryIns)
            return newRepositoryIns
          })
          newServiceIns = new service(...repositoryInsList)
        }
        this.serviceMap.set(service.name, newServiceIns)
        return newServiceIns
      })
      this.controllerMap.set(controller.name, new controller(...services))
    }
  }

  private setPermission(controller: IType<unknown>, methodName: string) {
    const permission = Reflect.getMetadata(ReflectKeys.PERMISSION_KEY, controller.prototype, methodName)
    if (permission) {
      this.permissionMap.set(methodName, permission)
    }
  }

  private setContextRepository(manager: IManager) {
    Repository.prototype.manager = manager
  }
}

