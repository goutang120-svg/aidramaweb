import request from '@/utils/request'
import type { Result, PageResult, Project, AssetVO } from '@/types'

// --- Project ---
export function getProjects(params: Record<string, unknown>) {
  return request.get<Result<PageResult<Project>>>('/projects', { params })
}
export function getProject(id: number) {
  return request.get<Result<Project>>('/projects/detail', { params: { id } })
}
export function createProject(data: Record<string, unknown>) {
  return request.post<Result<Project>>('/projects', data)
}
export function updateProject(id: number, data: Record<string, unknown>) {
  return request.put<Result<Project>>('/projects', { ...data, id })
}
export function deleteProject(id: number) {
  return request.delete<Result<void>>('/projects', { params: { id } })
}

// --- Dashboard ---
export function getDashboardStats() {
  return request.get<Result<Record<string, unknown>>>('/dashboard/stats')
}
export function getRecentProjects() {
  return request.get<Result<Project[]>>('/dashboard/recent-projects')
}
export function getRecentAssets() {
  return request.get<Result<AssetVO[]>>('/dashboard/recent-assets')
}

// --- Generic CRUD helpers ---
export function listAll(url: string, params?: Record<string, unknown>) {
  return request.get<Result<PageResult<unknown>>>(url, { params })
}
export function getOne(url: string, params?: Record<string, unknown>) {
  return request.get<Result<unknown>>(url, { params })
}
export function createOne(url: string, data: Record<string, unknown>, params?: Record<string, unknown>) {
  return request.post<Result<unknown>>(url, data, { params })
}
export function updateOne(url: string, data: Record<string, unknown>, params?: Record<string, unknown>) {
  return request.put<Result<unknown>>(url, data, { params })
}
export function deleteOne(url: string, params?: Record<string, unknown>) {
  return request.delete<Result<void>>(url, { params })
}

// --- Asset ---
export function getUploadUrl(data: Record<string, unknown>) {
  return request.post<Result<{ uploadUrl: string; objectKey: string; bucketName: string }>>('/assets/upload-url', data)
}
export function createAsset(data: Record<string, unknown>) {
  return request.post<Result<AssetVO>>('/assets', data)
}
export function getAssets(params: Record<string, unknown>) {
  return request.get<Result<PageResult<AssetVO>>>('/assets', { params })
}
export function getAssetVersions(assetId: number) {
  return request.get<Result<unknown[]>>('/assets/versions', { params: { id: assetId } })
}
export function uploadNewVersion(assetId: number, data: Record<string, unknown>) {
  return request.post<Result<AssetVO>>('/assets/versions', data, { params: { id: assetId } })
}
export function setCurrentVersion(assetId: number, versionId: number) {
  return request.put<Result<void>>('/assets/current-version', { versionId }, { params: { id: assetId } })
}

// --- Character / Scene / Prop ---
export function listCharacters(projectId: number, params?: Record<string, unknown>) {
  return request.get<Result<PageResult<unknown>>>('/projects/characters', { params: { projectId, ...params } })
}
export function listScenes(projectId: number, params?: Record<string, unknown>) {
  return request.get<Result<PageResult<unknown>>>('/projects/scenes', { params: { projectId, ...params } })
}
export function listProps(projectId: number, params?: Record<string, unknown>) {
  return request.get<Result<PageResult<unknown>>>('/projects/props', { params: { projectId, ...params } })
}

// --- Shot Relations ---
export function listShotCharacters(episodeId: number, shotId: number) {
  return request.get<Result<number[]>>('/episodes/shots/characters', { params: { id: shotId, episodeId } })
}
export function addShotCharacter(episodeId: number, shotId: number, characterId: number) {
  return request.post<Result<void>>('/episodes/shots/characters', { characterId }, { params: { id: shotId, episodeId } })
}
export function removeShotCharacter(episodeId: number, shotId: number, characterId: number) {
  return request.delete<Result<void>>('/episodes/shots/characters', { params: { id: shotId, episodeId, characterId } })
}
export function listShotScenes(episodeId: number, shotId: number) {
  return request.get<Result<number[]>>('/episodes/shots/scenes', { params: { id: shotId, episodeId } })
}
export function addShotScene(episodeId: number, shotId: number, sceneId: number) {
  return request.post<Result<void>>('/episodes/shots/scenes', { sceneId }, { params: { id: shotId, episodeId } })
}
export function removeShotScene(episodeId: number, shotId: number, sceneId: number) {
  return request.delete<Result<void>>('/episodes/shots/scenes', { params: { id: shotId, episodeId, sceneId } })
}
export function listShotProps(episodeId: number, shotId: number) {
  return request.get<Result<number[]>>('/episodes/shots/props', { params: { id: shotId, episodeId } })
}
export function addShotProp(episodeId: number, shotId: number, propId: number) {
  return request.post<Result<void>>('/episodes/shots/props', { propId }, { params: { id: shotId, episodeId } })
}
export function removeShotProp(episodeId: number, shotId: number, propId: number) {
  return request.delete<Result<void>>('/episodes/shots/props', { params: { id: shotId, episodeId, propId } })
}

// --- User Management (Admin) ---
export function listUsers(params: Record<string, unknown>) {
  return request.get<Result<PageResult<unknown>>>('/admin/users', { params })
}
export function getUser(id: number) {
  return request.get<Result<unknown>>('/admin/users', { params: { id } })
}
export function createUser(data: Record<string, unknown>) {
  return request.post<Result<unknown>>('/admin/users', data)
}
export function updateUser(id: number, data: Record<string, unknown>) {
  return request.put<Result<unknown>>('/admin/users', { ...data, id })
}
export function deleteUser(id: number) {
  return request.delete<Result<void>>('/admin/users', { params: { id } })
}
export function toggleUserEnabled(id: number) {
  return request.put<Result<void>>('/admin/users/toggle', { params: { id } })
}

// --- Tag ---
export function getTags() {
  return request.get<Result<unknown[]>>('/tags')
}
export function createTag(data: Record<string, string>) {
  return request.post<Result<unknown>>('/tags', data)
}
export function bindAssetTags(assetId: number, tagIds: number[]) {
  return request.post<Result<void>>('/tags/bind', { tagIds }, { params: { assetId } })
}
export function getAssetTags(assetId: number) {
  return request.get<Result<unknown[]>>('/tags/asset', { params: { assetId } })
}
