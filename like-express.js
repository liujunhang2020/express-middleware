const http = require('http')
const slice = Array.prototype.slice

class LikeExpress {

    constructor() {
        // 存放中间件的列表
        this.routes = {
            all: [], // 存放所有通过app.use() 注册的中间件
            get: [], // 存放所有通过app.get() 注册的中间件
            post: [] // 存放所有通过app.post() 注册的中间件
        }
    }
    // 下面三个use、get、post三个函数注册中间件的方法 
    register(path) {
        const info = {} 
        if ( typeof path === 'string' ) {
            // 对应中间件第一个参数是路由的情况
            info.path = path 
            // info.stack 当前注册信息的所有的中间件的信息
            // 从第二个参数开始，转换为数组存入到stack中
            info.stack = slice.call(arguments,1) // stack 最终是一个数组
        }else {
            // 如果中间件的第一个参数是一个中间件的函数不是一个路由的情况
            info.path = '/'  // 直接设置为根路由
            info.stack = slice.call(arguments,0)
        }
        return info 
    }

    use() {
        const info = this.register.apply(this,arguments)
        this.routes.all.push(info) // 将注册好的所有的路由全部放到this.router.all中
    }

    get() {
        const info = this.register.apply(this,arguments)
        this.routes.get.push(info)
    }

    post() {
        const info = this.register.apply(this,arguments)
        this.routes.post.push(info)
    }

    match(method, url) {
        let stack = [] 
        if (url === '/favicon.ico') {
            return stack 
        }
        // 获取 routes 
        let curRoutes = []
        curRoutes = curRoutes.concat(this.routes.all) // 将使用use注册的中间件全部获取到
        curRoutes = curRoutes.concat(this.routes[method]) // 根据method来获取内容


        // 遍历
        curRoutes.forEach(routeInfo=> {
            if (url.indexOf(routeInfo.path) === 0 ) {
                stack = stack.concat(routeInfo.stack)
            }
        })

        return stack 
    }
    
    // 核心的next机制
    handle(req, res, stack) {
        const next = () => {
            const middleware = stack.shift() // 拿到第一个中间件
            if (middleware) {
                middleware(req, res, next) // 执行中间件函数
            } 
        }
        next() 
    }

    callback() {
        return (req, res) => {
            res.json = (data) => {
                res.setHeader('Content-type', 'application/json')
                res.end(
                    JSON.stringify(data)
                )
            }

            const url = req.url 
            const method = req.method.toLowerCase() 

            const resultList = this.match(method, url)
            this.handle(req, res, resultList)
        }
    }

    listen(...args) {
        const server = http.createServer(this.callback())
        server.listen(...args)
    }

}

// 工厂函数
module.exports = () => {
    return new LikeExpress() 
}