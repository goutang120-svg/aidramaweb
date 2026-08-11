export interface LoginRequest {
  username: string
  password: string
}

export interface LoginVO {
  token: string
  userId: number
  username: string
  nickname: string
  avatar: string
  role: string
}

export interface RegisterRequest {
  username: string
  password: string
  nickname: string
  email: string
}

export interface UserVO {
  id: number
  username: string
  nickname: string
  avatar: string
  email: string
  role: string
  createdAt: string
}

export interface Result<T> {
  code: number
  message: string
  data: T
}

export interface PageResult<T> {
  records: T[]
  total: number
  page: number
  pageSize: number
}

export interface Project {
  id: number
  projectCode: string
  name: string
  type: string
  summary: string
  coverAssetId: number
  status: string
  progress: number
  createdAt: string
  updatedAt: string
}

export interface AssetVO {
  id: number
  assetCode: string
  assetName: string
  assetType: string
  fileName: string
  fileSize: number
  contentType: string
  width: number
  height: number
  duration: string
  description: string
  currentVersion: number
  previewUrl: string
  projectId: number
  episodeId: number
  shotId: number
  createdAt: string
}
