import axios from 'axios'
import type { AxiosInstance, AxiosResponse } from 'axios'
import { ElMessage } from 'element-plus'
import type { Result } from '@/types'

const request: AxiosInstance = axios.create({
  baseURL: '/api/v1',
  timeout: 30000,
})

request.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

function redirectToLogin() {
  if (window.location.pathname !== '/login') {
    window.location.href = '/login'
  }
}

request.interceptors.response.use(
  (response: AxiosResponse<Result<unknown>>) => {
    const res = response.data
    if (res.code !== 200) {
      // 403: 数据隔离导致无权限访问，静默处理（不弹错误）
      if (res.code !== 403) {
        ElMessage.error(res.message || '请求失败')
      }
      if (res.code === 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        redirectToLogin()
      }
      return Promise.reject(new Error(res.message))
    }
    return response
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      redirectToLogin()
    } else if (error.response?.status !== 403) {
      ElMessage.error(error.message || '网络错误')
    }
    return Promise.reject(error)
  }
)

export default request
