import BaseEntity from './entity'
import { IManager, IType } from './interfaces'
import { ReflectKeys } from './enums'
import { instanceToPlain, plainToInstance } from 'class-transformer'
import { objKeyToUnderline, objKeyToHump } from './utils'

export default class Repository<T extends BaseEntity> {
  manager!: IManager
  collectionName!: string

  constructor(private entity: IType) {
    this.collectionName = this.getCollectionName(entity)
  }

  async add(entity: T): Promise<string> {
    const data = this.transformWithCreateTime(entity)
    const res = await this.getDbJQLCollection().add(data)
    const { id } = res
    return id
  }

  async update(id: string, entity: T): Promise<number> {
    const data = this.transformWithUpdateTime(entity)
    const res = await this.getDbJQLCollection().doc(id).update(data)
    const { updated } = res
    return updated
  }

  async getOneById(id: string): Promise<T | undefined> {
    const res = await this.getDbJQLCollection().doc(id).get({
      getOne: true
    })
    if (!res.data) return res.data
    const data = objKeyToHump(res.data)
    const ins = plainToInstance(this.entity, data, {
      excludeExtraneousValues: true
    }) as T
    return ins
  }

  async addForTransaction(entity: T) {
    const data = this.transformWithCreateTime(entity)
    const res = await this.getTransactionCollection().add(data)
    return res
  }

  async updateForTransaction(id: string, entity: T) {
    const data = this.transformWithUpdateTime(entity)
    const res = await this.getTransactionCollection().doc(id).update(data)
    return res
  }

  private getCollectionName(entity: IType) {
    const name = Reflect.getMetadata(ReflectKeys.DATABASE_KEY, entity)
    return name
  }

  private transformWithUpdateTime(entity: T) {
    entity.updateTime = Date.now()
    const data = objKeyToUnderline(instanceToPlain(entity))
    return data
  }

  private transformWithCreateTime(entity: T) {
    const now = Date.now()
    entity.createTime = now
    entity.updateTime = now
    const data = objKeyToUnderline(instanceToPlain(entity))
    return data
  }

  private getDbJQLCollection() {
    return this.manager.dbJQL.collection(this.collectionName)
  }

  private getTransactionCollection() {
    return this.manager.transaction.collection(this.collectionName)
  }

  async commit() {
    await this.manager.transaction.commit()
  }
}
