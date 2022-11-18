/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * 下划线转驼峰
 */
export const underlineToHump = (str: string): string => {
  return str.replace(/_(\w)/g, (x, y) => y.toUpperCase())
}
/**
 * 驼峰转下划线
 */
export const humpToUnderline = (str: string): string => {
  return str.replace(/[A-Z]/g, (x) => '_' + x.toLowerCase())
}
/**
 * 对象key驼峰转下划线
 */
export const objKeyToUnderline = (obj: object): object => {
  const newObj: any = {}
  for (const [key, value] of Object.entries(obj)) {
    newObj[humpToUnderline(key)] = value
  }
  return newObj
}
/**
 * 对象key下划线转驼峰
 */
export const objKeyToHump = (obj: object): object => {
  const newObj: any = {}
  for (const [key, value] of Object.entries(obj)) {
    key === '_id' ? (newObj['id'] = value) : (newObj[underlineToHump(key)] = value)
  }
  return newObj
}
