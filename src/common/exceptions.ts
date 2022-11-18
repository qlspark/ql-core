import codes from './error-code'

export class HttpException extends Error {
  errCode = 0
  errMsg = codes[0]
}

export class ParameterException extends HttpException {
  constructor(errCode = 2000, errMsg?: string) {
    super()
    this.errCode = errCode
    this.errMsg = errMsg || codes[errCode]
  }
}

export class NotFound extends HttpException {
  constructor(errCode = 3000, errMsg?: string) {
    super()
    this.errCode = errCode
    this.errMsg = errMsg || codes[errCode]
  }
}

export class AuthFailed extends HttpException {
  constructor(errCode = 4000, errMsg?: string) {
    super()
    this.errCode = errCode
    this.errMsg = errMsg || codes[errCode]
  }
}
