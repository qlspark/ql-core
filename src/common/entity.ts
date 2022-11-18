import { Expose } from 'class-transformer'

export default class BaseEntity {
  @Expose()
  id!: string
  @Expose()
  createTime!: number
  @Expose()
  updateTime!: number
  @Expose()
  deleteTime!: number
}
