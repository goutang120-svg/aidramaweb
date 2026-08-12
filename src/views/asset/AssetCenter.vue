<template>
  <div class="asset-center">
    <div class="page-toolbar">
      <h3 class="page-title">资源中心</h3>
      <el-button type="primary" @click="openUploadDialog">
        <el-icon><Plus /></el-icon> 上传
      </el-button>
    </div>

    <!-- 筛选栏 -->
    <div class="filter-bar">
      <el-select
        v-model="filters.projectId"
        placeholder="项目"
        style="width:160px"
        clearable
        @change="fetchAssets"
      >
        <el-option v-for="p in projects" :key="p.id" :label="p.name" :value="p.id" />
      </el-select>
      <el-select
        v-model="filters.episodeId"
        placeholder="分集"
        style="width:180px"
        clearable
        @change="fetchAssets"
      >
        <el-option v-for="ep in episodes" :key="ep.id" :label="`#${ep.episodeNo} ${ep.title}`" :value="ep.id" />
      </el-select>
      <el-select
        v-model="filters.keyword"
        placeholder="关键词搜索"
        style="width:180px"
        clearable
        filterable
        @change="fetchAssets"
      >
        <!-- keyword is typed manually; we use filterable -->
      </el-select>
      <el-input
        v-model="filters.keywordInput"
        placeholder="输入关键词..."
        style="width:180px"
        clearable
        @clear="fetchAssets"
        @keyup.enter="fetchAssets"
      />
      <el-select
        v-model="filters.tagId"
        placeholder="标签"
        style="width:140px"
        clearable
        @change="fetchAssets"
      >
        <el-option v-for="t in tags" :key="t.id" :label="t.name" :value="t.id" />
      </el-select>
      <span class="total-count">共 {{ totalCount }} 条</span>
    </div>

    <!-- 内容区 Tabs -->
    <el-tabs v-model="activeTab" @tab-change="fetchAssets">
      <el-tab-pane label="全部" name="ALL" />
      <el-tab-pane label="图片" name="IMAGE" />
      <el-tab-pane label="视频" name="VIDEO" />
      <el-tab-pane label="音频" name="AUDIO" />
      <el-tab-pane label="文件" name="DOCUMENT" />
    </el-tabs>

    <div v-loading="loading" class="asset-content">
      <div v-if="assets.length === 0 && !loading" class="empty-wrap">
        <el-empty description="暂无资源" />
      </div>

      <!-- 图片 Tab -->
      <div v-if="activeTab === 'ALL' || activeTab === 'IMAGE'" class="image-grid">
        <el-row :gutter="12">
          <el-col
            v-for="asset in assets"
            :key="asset.id"
            :xs="12" :sm="8" :md="6" :lg="4" :xl="3"
          >
            <div class="asset-card" @click="handleAssetClick(asset)">
              <div class="card-thumb">
                <img v-if="asset.previewUrl" :src="asset.previewUrl" :alt="asset.assetName" loading="lazy" />
                <el-icon v-else :size="36" color="#4a4a6e"><PictureFilled /></el-icon>
                <el-button class="card-delete-btn" size="small" type="danger" circle
                  @click.stop="handleAssetDelete(asset)">
                  <el-icon :size="12"><Delete /></el-icon>
                </el-button>
              </div>
              <div class="card-info">
                <div class="card-name" :title="asset.assetName">{{ asset.assetName }}</div>
                <div class="card-meta">
                  <el-tag size="small" :type="assetTagType(asset.assetType)" effect="dark" style="border-color:transparent">
                    {{ assetTypeLabel(asset.assetType) }}
                  </el-tag>
                  <span class="card-version">v{{ asset.currentVersion || 1 }}</span>
                </div>
                <div class="card-date">{{ formatDate(asset.createdAt) }}</div>
              </div>
            </div>
          </el-col>
        </el-row>
      </div>

      <!-- 视频 Tab -->
      <div v-if="activeTab === 'VIDEO'" class="video-grid">
        <el-row :gutter="12">
          <el-col
            v-for="asset in assets"
            :key="asset.id"
            :xs="12" :sm="8" :md="6" :lg="4"
          >
            <div class="video-card" @click="openVideoPreview(asset)">
              <div class="vid-thumb">
                <img v-if="asset.previewUrl" :src="asset.previewUrl" :alt="asset.assetName" />
                <el-icon v-else :size="32" color="#4a4a6e"><VideoCamera /></el-icon>
                <div class="play-overlay">
                  <el-icon :size="32" color="#fff"><VideoPlay /></el-icon>
                </div>
                <el-button class="card-delete-btn" size="small" type="danger" circle
                  @click.stop="handleAssetDelete(asset)">
                  <el-icon :size="12"><Delete /></el-icon>
                </el-button>
              </div>
              <div class="vid-info">
                <div class="vid-name" :title="asset.assetName">{{ asset.assetName }}</div>
                <div class="vid-meta">
                  <span v-if="asset.duration" class="vid-duration">{{ asset.duration }}</span>
                  <span class="vid-size">{{ formatFileSize(asset.fileSize) }}</span>
                </div>
              </div>
            </div>
          </el-col>
        </el-row>
      </div>

      <!-- 音频 Tab -->
      <div v-if="activeTab === 'AUDIO'" class="audio-list">
        <div v-for="asset in assets" :key="asset.id" class="audio-card">
          <div class="audio-icon">
            <el-icon :size="28" color="#e8a850"><Headset /></el-icon>
          </div>
          <div class="audio-info">
            <div class="audio-name" :title="asset.assetName">{{ asset.assetName }}</div>
            <div class="audio-meta">{{ formatFileSize(asset.fileSize) }} | {{ formatDate(asset.createdAt) }}</div>
          </div>
          <audio v-if="asset.previewUrl" :src="asset.previewUrl" controls class="audio-player" preload="none" />
          <div class="audio-actions">
            <el-button text size="small" type="primary" @click="downloadAsset(asset)">下载</el-button>
            <el-button text size="small" type="danger" @click="handleAssetDelete(asset)">删除</el-button>
          </div>
        </div>
      </div>

      <!-- 文件 Tab -->
      <div v-if="activeTab === 'DOCUMENT'" class="file-list">
        <div v-for="asset in assets" :key="asset.id" class="file-card">
          <div class="file-icon">
            <el-icon :size="28" color="#409eff"><Document /></el-icon>
          </div>
          <div class="file-info">
            <div class="file-name" :title="asset.assetName">{{ asset.assetName }}</div>
            <div class="file-meta">
              <span>{{ asset.fileName }}</span>
              <span>{{ formatFileSize(asset.fileSize) }}</span>
              <span>{{ formatDate(asset.createdAt) }}</span>
            </div>
          </div>
          <div class="file-actions">
            <el-button text size="small" type="primary" @click="downloadAsset(asset)">
              <el-icon><Download /></el-icon> 下载
            </el-button>
            <el-button text size="small" type="danger" @click="handleAssetDelete(asset)">删除</el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 分页 -->
    <div v-if="totalCount > pageSize" class="pagination-wrap">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="totalCount"
        :page-sizes="[20, 40, 60]"
        layout="total, sizes, prev, pager, next"
        small
        @change="fetchAssets"
      />
    </div>

    <!-- 图片预览对话框 -->
    <el-dialog v-model="imageDialogVisible" width="80%" class="dark-dialog">
      <div class="preview-wrap">
        <div class="preview-viewport">
          <img :src="previewImageUrl" class="preview-img" :style="{ transform: `scale(${zoomLevel})` }" />
        </div>
        <div class="preview-toolbar">
          <el-button-group>
            <el-button @click="zoomIn"><el-icon><ZoomIn /></el-icon></el-button>
            <el-button @click="zoomOut"><el-icon><ZoomOut /></el-icon></el-button>
            <el-button @click="resetZoom"><el-icon><FullScreen /></el-icon></el-button>
          </el-button-group>
          <div class="preview-right">
            <el-select
              v-model="selectedVersionId"
              size="small"
              style="width:120px"
              @change="handleVersionSwitch"
              placeholder="版本"
            >
              <el-option v-for="v in currentVersions" :key="v.id" :label="'v' + v.version" :value="v.id" />
            </el-select>
            <el-button size="small" @click="downloadCurrentAsset">下载</el-button>
          </div>
        </div>
      </div>
    </el-dialog>

    <!-- 视频预览对话框 -->
    <el-dialog v-model="videoDialogVisible" width="70%" class="dark-dialog">
      <video v-if="previewVideoUrl" :src="previewVideoUrl" controls class="preview-video" />
    </el-dialog>

    <!-- 上传对话框 -->
    <el-dialog v-model="uploadDialogVisible" title="上传资源" width="520px" class="dark-dialog">
      <el-form ref="uploadFormRef" :model="uploadForm" label-width="100px">
        <el-form-item label="选择文件" prop="file">
          <el-upload
            class="upload-drag"
            :auto-upload="false"
            :show-file-list="true"
            :on-change="handleFileSelect"
            :limit="10"
            accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.psd,.fbx,.obj"
            drag
            multiple
          >
            <div class="upload-trigger">
              <el-icon :size="32" color="#4a4a6e"><UploadFilled /></el-icon>
              <div class="upload-text">拖拽文件或<em>点击选择</em></div>
            </div>
          </el-upload>
        </el-form-item>
        <el-form-item label="资源类型" prop="assetType">
          <el-select v-model="uploadForm.assetType" style="width:100%">
            <el-option label="图片" value="IMAGE" />
            <el-option label="视频" value="VIDEO" />
            <el-option label="音频" value="AUDIO" />
            <el-option label="文档" value="DOCUMENT" />
          </el-select>
        </el-form-item>
        <el-form-item label="关联项目">
          <el-select v-model="uploadForm.projectId" style="width:100%" clearable placeholder="选择关联项目">
            <el-option v-for="p in projects" :key="p.id" :label="p.name" :value="p.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="关联分集">
          <el-select v-model="uploadForm.episodeId" style="width:100%" clearable placeholder="选择关联分集">
            <el-option v-for="ep in episodes" :key="ep.id" :label="`#${ep.episodeNo} ${ep.title}`" :value="ep.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="关联镜头">
          <el-input-number v-model="uploadForm.shotId" style="width:100%" :min="1" placeholder="输入镜头ID" />
        </el-form-item>
      </el-form>

      <div v-if="uploading" class="batch-progress">
        <el-progress :percentage="uploadProgress" :color="'#e8a850'" :stroke-width="8" />
        <div class="progress-detail">
          正在上传 {{ uploadStatus }} ({{ uploadedCount }}/{{ selectedFiles.length }})
        </div>
      </div>

      <template #footer>
        <el-button @click="uploadDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="uploading" :disabled="selectedFiles.length === 0" @click="handleBatchUpload">
          开始上传
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus, PictureFilled, VideoCamera, VideoPlay, Headset,
  ZoomIn, ZoomOut, FullScreen, UploadFilled, Download, Document, Delete,
} from '@element-plus/icons-vue'
import {
  getAssets, getUploadUrl, createAsset, getAssetVersions, setCurrentVersion, deleteOne,
  getTags, listAll, getProject,
} from '@/api/index'
import { useAppStore } from '@/stores/app'
import type { AssetVO } from '@/types'

const appStore = useAppStore()

// --- State ---
const activeTab = ref('ALL')
const loading = ref(false)
const assets = ref<AssetVO[]>([])
const totalCount = ref(0)
const currentPage = ref(1)
const pageSize = ref(40)

const filters = reactive({
  projectId: appStore.currentProjectId,
  episodeId: null as number | null,
  keyword: '',
  keywordInput: '',
  tagId: null as number | null,
})

const projects = ref<any[]>([])
const episodes = ref<any[]>([])
const tags = ref<any[]>([])

// Preview
const imageDialogVisible = ref(false)
const videoDialogVisible = ref(false)
const previewImageUrl = ref('')
const previewVideoUrl = ref('')
const previewingAsset = ref<AssetVO | null>(null)
const currentVersions = ref<any[]>([])
const selectedVersionId = ref<number | null>(null)
const zoomLevel = ref(1)

// Upload
const uploadDialogVisible = ref(false)
const uploading = ref(false)
const uploadProgress = ref(0)
const uploadStatus = ref('')
const uploadedCount = ref(0)
const selectedFiles = ref<File[]>([])
const uploadForm = reactive({
  assetType: 'IMAGE',
  projectId: null as number | null,
  episodeId: null as number | null,
  shotId: null as number | null,
})

// --- Helpers ---
function assetTypeLabel(type: string): string {
  const map: Record<string, string> = { IMAGE: '图片', VIDEO: '视频', AUDIO: '音频', DOCUMENT: '文档' }
  return map[type] || type
}
function assetTagType(type: string): 'success' | 'warning' | 'danger' | 'info' | '' {
  const map: Record<string, 'success' | 'warning' | 'danger' | 'info' | ''> = {
    IMAGE: '', VIDEO: 'danger', AUDIO: 'warning', DOCUMENT: 'info',
  }
  return map[type] || 'info'
}
function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
function formatFileSize(bytes: number): string {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let i = 0
  let size = bytes
  while (size >= 1024 && i < units.length - 1) { size /= 1024; i++ }
  return size.toFixed(i === 0 ? 0 : 1) + ' ' + units[i]
}

function handleAssetClick(asset: AssetVO) {
  if (asset.assetType === 'IMAGE' || asset.contentType?.startsWith('image/')) {
    openImagePreview(asset)
  } else if (asset.assetType === 'VIDEO' || asset.contentType?.startsWith('video/')) {
    openVideoPreview(asset)
  } else {
    downloadAsset(asset)
  }
}

// --- Delete ---
async function handleAssetDelete(asset: AssetVO) {
  try {
    await ElMessageBox.confirm(`确定删除「${asset.assetName}」吗？删除后不可恢复。`, '确认删除', {
      confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning',
    })
    await deleteOne('/assets', { id: asset.id })
    ElMessage.success('已删除')
    await fetchAssets()
  } catch { /* cancelled */ }
}

// --- Fetch ---
async function fetchAssets() {
  loading.value = true
  try {
    const params: Record<string, any> = {
      page: currentPage.value,
      pageSize: pageSize.value,
    }
    if (filters.projectId) params.projectId = filters.projectId
    if (filters.episodeId) params.episodeId = filters.episodeId
    if (filters.keywordInput.trim()) params.keyword = filters.keywordInput.trim()
    if (filters.tagId) params.tagId = filters.tagId
    if (activeTab.value && activeTab.value !== 'ALL') {
      params.assetType = activeTab.value
    }

    const res = await getAssets(params)
    const data = res.data.data as any
    assets.value = data.records || []
    totalCount.value = data.total || 0
  } catch { /* handled */ } finally { loading.value = false }
}

async function fetchFilters() {
  // Fetch projects
  if (appStore.currentProjectId) {
    try {
      const res = await getProject(appStore.currentProjectId)
      projects.value = [res.data.data]
      if (!filters.projectId) filters.projectId = appStore.currentProjectId
    } catch { /* handled */ }
  }

  // Fetch tags
  try {
    const res = await getTags()
    tags.value = (res.data.data as any[]) || []
  } catch { /* handled */ }
}

async function fetchEpisodesForFilters() {
  if (!filters.projectId) return
  try {
    const seasonsRes = await listAll('/projects/seasons', { projectId: filters.projectId })
    const sRecords = (seasonsRes.data.data as any).records || []
    const allEps: any[] = []
    for (const s of sRecords) {
      const epRes = await listAll('/seasons/episodes', { seasonId: s.id })
      const epRecords = (epRes.data.data as any).records || []
      allEps.push(...epRecords.map((ep: any) => ({ ...ep, seasonId: s.id, seasonName: s.name })))
    }
    episodes.value = allEps
  } catch { /* handled */ }
}

// --- Upload ---
async function uploadFile(file: File, assetType: string, extraMeta: Record<string, any> = {}): Promise<AssetVO> {
  // Step 1: Get presigned URL
  const urlRes = await getUploadUrl({
    fileName: file.name,
    contentType: file.type,
    fileSize: file.size,
    assetType,
  })
  const { uploadUrl, objectKey, bucketName } = urlRes.data.data

  // Step 2: PUT file
  await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type || 'application/octet-stream' },
    body: file,
  })

  // Step 3: Create asset
  const assetRes = await createAsset({
    assetName: file.name,
    assetType,
    fileName: file.name,
    objectKey,
    bucketName,
    fileSize: file.size,
    contentType: file.type,
    ...extraMeta,
  })

  return assetRes.data.data as AssetVO
}

function handleFileSelect(file: any) {
  const raw = file.raw as File
  if (raw) {
    if (!selectedFiles.value.find(f => f.name === raw.name && f.size === raw.size)) {
      selectedFiles.value.push(raw)
    }
  }
}

function openUploadDialog() {
  uploadForm.assetType = 'IMAGE'
  uploadForm.projectId = filters.projectId
  uploadForm.episodeId = filters.episodeId
  uploadForm.shotId = null
  selectedFiles.value = []
  uploadDialogVisible.value = true
}

async function handleBatchUpload() {
  if (selectedFiles.value.length === 0) return
  uploading.value = true
  uploadedCount.value = 0
  uploadProgress.value = 0

  const total = selectedFiles.value.length
  for (let i = 0; i < total; i++) {
    const file = selectedFiles.value[i]
    uploadStatus.value = `${file.name}`

    // Determine assetType
    let assetType = uploadForm.assetType
    if (assetType === 'IMAGE' && file.type.startsWith('video/')) assetType = 'VIDEO'
    else if (assetType === 'IMAGE' && file.type.startsWith('audio/')) assetType = 'AUDIO'
    else if (assetType === 'IMAGE' && !file.type.startsWith('image/')) assetType = 'DOCUMENT'

    const extraMeta: Record<string, any> = {}
    if (uploadForm.projectId) extraMeta.projectId = uploadForm.projectId
    if (uploadForm.episodeId) extraMeta.episodeId = uploadForm.episodeId
    if (uploadForm.shotId) extraMeta.shotId = uploadForm.shotId

    try {
      await uploadFile(file, assetType, extraMeta)
    } catch (e: any) {
      ElMessage.error(`${file.name} 上传失败: ${e.message || '未知错误'}`)
    }

    uploadedCount.value = i + 1
    uploadProgress.value = Math.round(((i + 1) / total) * 100)
  }

  ElMessage.success(`完成：${uploadedCount.value}/${total} 个文件上传`)
  uploading.value = false
  uploadDialogVisible.value = false
  await fetchAssets()
}

// --- Preview ---
async function openImagePreview(asset: AssetVO) {
  previewingAsset.value = asset
  previewImageUrl.value = asset.previewUrl || ''
  selectedVersionId.value = asset.currentVersion
  zoomLevel.value = 1

  try {
    const res = await getAssetVersions(asset.id)
    currentVersions.value = (res.data.data as any[]) || []
  } catch { currentVersions.value = [] }

  imageDialogVisible.value = true
}

function openVideoPreview(asset: AssetVO) {
  previewVideoUrl.value = asset.previewUrl || ''
  videoDialogVisible.value = true
}

async function handleVersionSwitch(versionId: number) {
  if (!previewingAsset.value) return
  try {
    await setCurrentVersion(previewingAsset.value.id, versionId)
    const res = await getAssets({ id: previewingAsset.value.id, page: 1, pageSize: 1 })
    const data = res.data.data as any
    if (data.records?.[0]) {
      previewImageUrl.value = data.records[0].previewUrl || ''
    }
    ElMessage.success('版本已切换')
  } catch { /* handled */ }
}

function downloadAsset(asset: AssetVO) {
  if (asset.previewUrl) window.open(asset.previewUrl, '_blank')
}
function downloadCurrentAsset() {
  downloadAsset(previewingAsset.value!)
}

function zoomIn() { zoomLevel.value = Math.min(zoomLevel.value + 0.25, 3) }
function zoomOut() { zoomLevel.value = Math.max(zoomLevel.value - 0.25, 0.25) }
function resetZoom() { zoomLevel.value = 1 }

onMounted(() => {
  fetchFilters()
  fetchEpisodesForFilters()
  fetchAssets()
})
</script>

<style scoped>
.asset-center { padding: 4px; }
.page-toolbar {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 12px;
}
.page-title {
  color: #c0c0d0; font-size: 16px; font-weight: 600;
  padding-left: 10px; border-left: 3px solid #e8a850;
}

/* 筛选栏 */
.filter-bar {
  display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
  padding: 12px 16px; background: #1a1a2e; border: 1px solid #2a2a3e;
  border-radius: 8px; margin-bottom: 16px;
}
.filter-bar :deep(.el-select) { min-width: 120px; }
.total-count { color: #6a6a7e; font-size: 13px; margin-left: auto; }

/* 内容区 */
.asset-content { min-height: 300px; }
.empty-wrap { padding: 60px 0; }

/* 图片卡片 */
.image-grid { min-height: 120px; }
.asset-card {
  background: #1a1a2e; border: 1px solid #2a2a3e; border-radius: 8px;
  overflow: hidden; margin-bottom: 12px; cursor: pointer;
  transition: transform 0.2s, border-color 0.2s;
}
.asset-card:hover { border-color: #e8a850; transform: translateY(-2px); }
.card-thumb {
  width: 100%; height: 140px; background: #16162a;
  display: flex; align-items: center; justify-content: center; overflow: hidden;
  position: relative;
}
.card-thumb img { width: 100%; height: 100%; object-fit: cover; }
.card-info { padding: 10px 12px; }
.card-name {
  font-size: 13px; color: #c0c0d0; margin-bottom: 6px;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.card-meta { display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px; }
.card-version { color: #6a6a7e; font-size: 12px; }
.card-date { color: #5a5a6e; font-size: 11px; }

/* 视频卡片 */
.video-grid { min-height: 120px; }
.video-card {
  background: #1a1a2e; border: 1px solid #2a2a3e; border-radius: 8px;
  overflow: hidden; margin-bottom: 12px; cursor: pointer;
  transition: transform 0.2s, border-color 0.2s;
}
.video-card:hover { border-color: #e8a850; transform: translateY(-2px); }
.vid-thumb {
  width: 100%; height: 130px; background: #16162a;
  display: flex; align-items: center; justify-content: center; overflow: hidden;
  position: relative;
}
.vid-thumb img { width: 100%; height: 100%; object-fit: cover; }
.play-overlay {
  position: absolute; inset: 0; background: var(--bg-cream);
  display: flex; align-items: center; justify-content: center;
  opacity: 0; transition: opacity 0.2s;
}
.video-card:hover .play-overlay { opacity: 1; }
.vid-info { padding: 10px 12px; }
.vid-name {
  font-size: 13px; color: #c0c0d0; margin-bottom: 4px;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.vid-meta { display: flex; gap: 8px; font-size: 11px; color: #6a6a7e; }
.vid-duration::after { content: ''; }

/* 音频列表 */
.audio-list { margin-bottom: 16px; }
.audio-card {
  display: flex; align-items: center; gap: 14px;
  padding: 12px 16px; background: #1a1a2e; border: 1px solid #2a2a3e;
  border-radius: 8px; margin-bottom: 8px;
}
.audio-icon { flex-shrink: 0; }
.audio-info { flex: 1; min-width: 0; }
.audio-name {
  color: #c0c0d0; font-size: 14px; margin-bottom: 2px;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.audio-meta { color: #6a6a7e; font-size: 12px; }
.audio-player { width: 180px; height: 32px; flex-shrink: 0; }
.audio-actions { flex-shrink: 0; }

/* 文件列表 */
.file-list { margin-bottom: 16px; }
.file-card {
  display: flex; align-items: center; gap: 14px;
  padding: 12px 16px; background: #1a1a2e; border: 1px solid #2a2a3e;
  border-radius: 8px; margin-bottom: 8px;
}
.file-icon { flex-shrink: 0; }
.file-info { flex: 1; min-width: 0; }
.file-name {
  color: #c0c0d0; font-size: 14px; margin-bottom: 2px;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.file-meta { display: flex; gap: 12px; color: #6a6a7e; font-size: 12px; }
.file-actions { flex-shrink: 0; }

/* 分页 */
.pagination-wrap {
  display: flex; justify-content: center; margin-top: 20px; padding-bottom: 20px;
}

/* 预览对话框 */
.preview-wrap { display: flex; flex-direction: column; }
.preview-viewport {
  text-align: center; max-height: 60vh; overflow: auto; margin-bottom: 12px;
}
.preview-img {
  max-width: 100%; object-fit: contain; transition: transform 0.2s;
}
.preview-toolbar {
  display: flex; align-items: center; justify-content: space-between;
  padding-top: 8px; border-top: 1px solid #2a2a3e;
}
.preview-right { display: flex; gap: 8px; align-items: center; }
.preview-video { width: 100%; max-height: 60vh; }

/* 上传对话框 */
.upload-drag :deep(.el-upload-dragger) {
  background: #16162a; border-color: #2a2a3e; border-radius: 8px;
}
.upload-drag :deep(.el-upload-dragger:hover) { border-color: #e8a850; }
.upload-trigger { padding: 24px; text-align: center; }
.upload-text { color: #808090; font-size: 14px; margin-top: 8px; }
.upload-text em { color: #e8a850; font-style: normal; }

.batch-progress { margin-top: 16px; }
.progress-detail { color: #808090; font-size: 12px; margin-top: 6px; }

/* 删除按钮 */
.card-delete-btn {
  position: absolute; top: 4px; right: 4px; opacity: 0; transition: opacity 0.2s;
}
.card-thumb:hover .card-delete-btn,
.vid-thumb:hover .card-delete-btn { opacity: 1; }
</style>
