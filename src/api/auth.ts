import request from '@/utils/request'
import type { LoginRequest, RegisterRequest, LoginVO, UserVO, Result } from '@/types'

export function login(data: LoginRequest) {
  return request.post<Result<LoginVO>>('/auth/login', data)
}

export function register(data: RegisterRequest) {
  return request.post<Result<UserVO>>('/auth/register', data)
}

export function getMe() {
  return request.get<Result<UserVO>>('/auth/me')
}
