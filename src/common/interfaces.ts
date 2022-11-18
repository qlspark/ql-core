/* eslint-disable @typescript-eslint/no-explicit-any */
export interface IType<T = unknown> extends Function {
  new (...args: unknown[]): T
}

export interface IModuleMetadata<T> {
  imports?: IType<T>[]
  controllers?: IType<T>[]
  services?: IType<T>[]
}

export interface IMessageVO {
  errCode: number
  errMsg: string
  method: string
}

export interface IPageVO extends IMessageVO {
  data: object[]
  total: number
}

export interface IManager {
  db: any
  dbJQL: any
  transaction: any
  // uniIDIns: object
}
