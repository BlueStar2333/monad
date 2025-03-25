import axios from 'axios'
import { MessageBox, Message } from 'element-ui'
import store from '@/store'
import router from "@/router"
import { getToken, setToken } from '@/utils/auth'

// const url = 'http://localhost:3100/api/'
const url = 'http://172.18.0.1:3100/api/' // 服务器内网
// const url = 'http://172.27.11.79:3100/api/'

const service = axios.create({
  baseURL: url,
  // withCredentials: true, // 当跨域请求时发送cookie
  timeout: 5000 // request timeout
})

// 请求拦截器
service.interceptors.request.use(
  config => {
    if (store.getters.token) {
      axios({
        url: url + 'admin/refreshToken',
        headers: {
          'Content-Type': 'application/json;charset=UTF-8',
          // 'Content-Type': 'application/json',
          'x-token': getToken()
        },
        method: 'post'
      }).then(res => {
        store.commit('user/SET_TOKEN', res.data.data.token)
        setToken(res.data.data.token)
        // console.log(res.data.data.token)
      })
      // 让每个请求携带令牌
      // ['x-token']是一个自定义的标头键
      config.headers['x-token'] = getToken()
      config.headers['Content-Type'] = 'application/json'
    }
    return config
  },
  error => {
    // console.log(error)
    return Promise.reject(error)
  }
)

// 回复拦截器
service.interceptors.response.use(
  /**
   * 可以获得http信息，例如头或状态
  */

  /**
   *
   * 根据返回的状态来触发事件，例如:添加成功，错误等等；
   *
   */
  response => {
    const res = response.data

    if (res.code === 20000 || response.status === 200 || response.status === 204) {
      return res
    } else {
      Message({
        message: res.message || 'Error',
        type: 'error',
        duration: 5 * 1000
      })

      //50008:非法令牌;50012:其他客户端已登录;50014:令牌过期
      // 重新登录
      // if (res.code === 50008 || res.code === 50012 || res.code === 50014) {
      //
      //   MessageBox.confirm('你是否重新登录', 'logout', {
      //     confirmButtonText: '重新登录',
      //     cancelButtonText: '取消',
      //     type: 'warning'
      //   }).then(() => {
      //     store.dispatch('user/resetToken').then(() => {
      //       //删除之后重新加载,跳转到登录界面
      //       location.reload()
      //     })
      //   })
      // }
      return Promise.reject(new Error(res.message || 'Error'))
    }
  },
  error => {
    // console.log(error,error.response.status,563339)
    if (error.response.status === 406) {
      Message({
        message: '登陆状态过期',
        type: 'error',
        duration: 5 * 1000
      })
      store.dispatch('user/logout')
      router.push(`/login`)
    } else {
      Message({
        message: error.message,
        type: 'error',
        duration: 5 * 1000
      })
    }
    return Promise.reject(error)
  }
)

export default service
