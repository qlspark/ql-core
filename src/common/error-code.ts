const codes: string[] = []
codes[0] = 'ok'
codes[999] = '服务器未知异常'
codes[1000] = '用户通用错误'
codes[2000] = '参数错误'
codes[3000] = '资源不存在'
codes[3001] = '订单不存在'
codes[4000] = '用户认证通用失败'
codes[4001] = '用户登录失败或未注册'
codes[4002] = '用户token令牌刷新'
codes[4003] = '用户状态异常，请重试或联系管理员'
codes[4004] = '用户没有权限访问'

export default codes
