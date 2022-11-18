/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-empty-function */
import { LoginType, ReflectKeys } from './enums'

export const Module = (info: unknown): ClassDecorator => {
  return (target) => {
    Reflect.defineMetadata(ReflectKeys.MODULE_KEY, info, target)
  }
}

export const Controller = (): ClassDecorator => {
  return () => {}
}

export const Service = (): ClassDecorator => {
  return () => {}
}

export const Method = (): MethodDecorator => {
  return (target, propKey) => {
    Reflect.defineMetadata(ReflectKeys.METHOD_KEY, true, target, propKey)
  }
}

export const RequestBody = (): ParameterDecorator => {
  return (target, propKey, index) => {
    Reflect.defineMetadata(ReflectKeys.REQUEST_BODY_KEY, index, target, propKey)
  }
}

export const Validation = (): ClassDecorator => {
  return (target) => {
    Reflect.defineMetadata(ReflectKeys.VALIDATE_KEY, true, target)
  }
}

export const LoginRequired = (type: LoginType): MethodDecorator => {
  return (target, propKey) => {
    Reflect.defineMetadata(ReflectKeys.LOGIN_KEY, type, target, propKey)
  }
}

export const Permission = (name: string): MethodDecorator => {
  return (target, propKey) => {
    Reflect.defineMetadata(ReflectKeys.PERMISSION_KEY, name, target, propKey)
  }
}

export const Entity = (name?: string): ClassDecorator => {
  return (target) => {
    Reflect.defineMetadata(ReflectKeys.DATABASE_KEY, name ?? target.name.toLocaleLowerCase(), target)
  }
}

export const Transaction = (): MethodDecorator => {
  return (target, propName) => {
    Reflect.defineMetadata(ReflectKeys.TRANSACTION_KEY, true, target, propName)
  }
}

export const IdString = (): ParameterDecorator => {
  return (target, propKey, index) => {
    Reflect.defineMetadata(ReflectKeys.ID_KEY, index, target, propKey)
  }
}
