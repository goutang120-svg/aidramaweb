<template>
  <div class="prop-detail">
    <div class="page-header">
      <el-button link @click="$router.back()">
        <el-icon><ArrowLeft /></el-icon> 返回
      </el-button>
      <h2 class="page-title">{{ prop?.name || '道具详情' }}</h2>
    </div>

    <el-empty v-if="!prop && !loading" description="未找到该道具" />

    <div v-else v-loading="loading" class="detail-content">
      <el-tabs v-model="activeTab">
        <el-tab-pane label="基础信息" name="basic">
          <el-card class="info-card">
            <el-descriptions :column="2" border>
              <el-descriptions-item label="道具名称">{{ prop?.name }}</el-descriptions-item>
              <el-descriptions-item label="编号">{{ prop?.propCode || '-' }}</el-descriptions-item>
              <el-descriptions-item label="分类">
                <el-tag size="small" effect="plain">{{ categoryLabel(prop?.category) }}</el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="描述" :span="2">{{ prop?.description || '-' }}</el-descriptions-item>
              <el-descriptions-item label="视觉描述" :span="2">{{ prop?.visualDescription || '-' }}</el-descriptions-item>
              <el-descriptions-item label="备注" :span="2">{{ prop?.remark || '-' }}</el-descriptions-item>
            </el-descriptions>
          </el-card>
        </el-tab-pane>

        <el-tab-pane label="视觉资产" name="assets">
          <div class="asset-toolbar">
            <el-upload
              :http-request="customUpload"
              :show-file-list="false"
              accept="image/*"
            >
              <el-button type="primary" size="small" :loading="uploading">
                <el-icon><Plus /></el-icon> {{ uploading ? '上传中...' : '上传图片' }}
              </el-button>
            </el-upload>
          </div>
          <div v-if="assetList.length" class="asset-grid">
            <div v-for="asset in assetList" :key="asset.id" class="asset-item">
              <el-image
                v-if="asset.previewUrl"
                :src="asset.previewUrl"
                fit="cover"
                class="asset-image"
                :preview-src-list="[asset.previewUrl]"
              />
              <div v-else class="asset-placeholder">
                <el-icon :size="32"><Picture /></el-icon>
              </div>
              <div class="asset-name">{{ asset.assetName || asset.fileName }}</div>
            </div>
          </div>
          <el-empty v-else description="暂无视觉资产" />
        </el-tab-pane>

        <el-tab-pane label="使用情况" name="usage">
          <el-card class="info-card" v-loading="loadingUsage">
            <div v-if="usageData && usageData.episodes && usageData.episodes.length">
              <div v-for="ep in usageData.episodes" :key="ep.episodeId" class="episode-section">
                <h4 class="section-title">
                  {{ ep.episodeCode || 'EP' }} - {{ ep.episodeTitle || '未知集' }}
                </h4>
                <div v-if="ep.shots && ep.shots.length" class="shot-list">
                  <div v-for="s in ep.shots" :key="s.shotId" class="shot-item" @click="goShotDetail(s.shotId)">
                    <span class="shot-code">EP{{ String(ep.episodeCode || '').replace(/\D/g, '').substring(0,2) }}-S{{ s.shotNo }}</span>
                    <span class="shot-name">{{ s.shotName || '-' }}</span>
                    <el-tag size="small" :color="statusColor(s.status)" effect="dark">{{ statusLabel(s.status) }}</el-tag>
                  </div>
                </div>
              </div>
            </div>
            <span v-else class="no-data">暂无使用记录</span>
          </el-card>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, Picture, Plus } from '@element-plus/icons-vue'
import { ElMessage, type UploadRequestOptions } from 'element-plus'
import { listAll, getAssets, getUploadUrl, createAsset, getOne } from '@/api/index'
import { useAppStore } from '@/stores/app'

interface Prop {
  id: number
  name: string
  propCode: string
  category: string
  description: string
  visualDescription: string
  remark: string
  projectId: number
}

interface Asset {
  id: number
  assetName: string
  fileName: string
  previewUrl: string
  assetType: string
}

interface Episode { id: number; title: string; episodeNo: number }
interface ShotInfo { id: number; shotCode: string; shotNo: number; description: string; episodeId: number; episodeTitle: string }

// Usage data types
interface UsageData {
  propId: number
  episodes: {
    episodeId: number
    episodeCode: string
    episodeTitle: string
    shots: {
      shotId: number
      shotNo: number
      shotName: string
      description: string
      status: string
    }[]
  }[]
}

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()
const prop = ref<Prop | null>(null)
const assetList = ref<Asset[]>([])
const relatedEpisodes = ref<Episode[]>([])
const relatedShots = ref<ShotInfo[]>([])
const activeTab = ref('basic')
const loading = ref(false)
const uploading = ref(false)
const loadingUsage = ref(false)
const usageData = ref<UsageData | null>(null)

async function fetchProp() {
  const id = route.params.id as string
  if (!id) return
  loading.value = true
  try {
    const res = await listAll(`/projects/${appStore.currentProjectId}/props`, { id: Number(id), page: 1, pageSize: 1 })
    const records = res.data.data.records as Prop[]
    if (records?.length) {
      prop.value = records[0]
      fetchAssets(records[0].id)
      fetchRelatedShots(records[0].projectId, records[0].id)
    }
  } catch { /* handled */ } finally { loading.value = false }
}

async function fetchAssets(propId: number) {
  try {
    const res = await getAssets({ propId, page: 1, pageSize: 200 })
    assetList.value = (res.data.data.records || []) as Asset[]
  } catch { /* handled */ }
}

async function fetchRelatedShots(projectId: number, propId: number) {
  try {
    const shotRes = await listAll(`/projects/${projectId}/props/${propId}/shots`, { page: 1, pageSize: 200 })
    const shotIds: number[] = (shotRes.data.data as any)?.records || (shotRes.data.data as any) || []
    if (!shotIds.length) return

    const shotPromises = shotIds.map((sid: number) => getOne(`/shots/${sid}`).then(r => (r.data.data as any)).catch(() => null))
    const shots = (await Promise.all(shotPromises)).filter(Boolean)

    const episodeIds = [...new Set(shots.map((s: any) => s.episodeId).filter(Boolean))]
    const episodePromises = episodeIds.map((eid: number) => getOne(`/episodes/${eid}`).then(r => {
      const ep = r.data.data as any
      return { id: ep.id, title: ep.title, episodeNo: ep.episodeNo }
    }).catch(() => null))
    const episodes = (await Promise.all(episodePromises)).filter(Boolean)
    relatedEpisodes.value = episodes as Episode[]

    const epMap = new Map(episodes.map((ep: any) => [ep.id, ep]))
    relatedShots.value = shots.map((s: any) => ({
      ...s,
      episodeTitle: epMap.get(s.episodeId)?.title || `第${epMap.get(s.episodeId)?.episodeNo || '?'}集`,
    }))
  } catch { /* handled */ }
}

function goShotDetail(shotId: number) {
  router.push(`/shots/${shotId}`)
}

async function customUpload(options: UploadRequestOptions) {
  if (!prop.value) return
  uploading.value = true
  try {
    const file = options.file as File
    const contentType = file.type || 'image/png'

    const urlRes = await getUploadUrl({
      fileName: file.name,
      contentType,
      fileSize: file.size,
      assetType: 'IMAGE',
    })
    const { uploadUrl, objectKey } = urlRes.data.data as { uploadUrl: string; objectKey: string; bucketName: string }

    await fetch(uploadUrl, {
      method: 'PUT',
      body: file,
      headers: { 'Content-Type': contentType },
    })

    await createAsset({
      objectKey,
      fileName: file.name,
      contentType,
      fileSize: file.size,
      assetType: 'IMAGE',
      assetName: file.name,
      projectId: prop.value.projectId,
      propId: prop.value.id,
    })
    ElMessage.success('上传成功')
    await fetchAssets(prop.value.id)
  } catch { ElMessage.error('上传失败') } finally { uploading.value = false }
}

function categoryLabel(c?: string) {
  const map: Record<string, string> = { WEAPON: '武器', CLOTHING: '服饰', FURNITURE: '家具', PROP: '道具', ACCESSORY: '饰品', OTHER: '其他' }
  return map[c || ''] || c || '未分类'
}
function statusLabel(s?: string) {
  const map: Record<string, string> = { NOT_STARTED: '未开始', IN_PROGRESS: '进行中', COMPLETED: '已完成' }
  return map[s || ''] || s || '-'
}
function statusColor(s?: string) {
  const map: Record<string, string> = { NOT_STARTED: '#909399', IN_PROGRESS: '#e8a850', COMPLETED: '#67c23a' }
  return map[s || ''] || '#909399'
}

async function fetchUsage() {
  if (!prop.value?.id || !appStore.currentProjectId) return
  loadingUsage.value = true
  try {
    const res = await listAll(`/projects/${appStore.currentProjectId}/props/${prop.value.id}/usage`)
    usageData.value = res.data.data as UsageData
  } catch { usageData.value = null } finally { loadingUsage.value = false }
}

onMounted(fetchProp)

watch(activeTab, (tab) => {
  if (tab === 'usage' && !usageData.value) {
    fetchUsage()
  }
})
</script>

<style scoped>
.prop-detail { height: 100%; display: flex; flex-direction: column; }
.page-header { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
.page-title { color: #e8a850; font-size: 20px; font-weight: 600; }

.detail-content { flex: 1; overflow-y: auto; }
.info-card { background: #16162a; border: 1px solid #2a2a3e; margin-bottom: 16px; }

.asset-toolbar { margin-bottom: 12px; }
.asset-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 12px; }
.asset-item { background: #16162a; border: 1px solid #2a2a3e; border-radius: 8px; overflow: hidden; }
.asset-image { width: 100%; height: 160px; display: block; }
.asset-placeholder { width: 100%; height: 160px; display: flex; align-items: center; justify-content: center; background: #1a1a2e; color: #808090; }
.asset-name { padding: 8px; font-size: 12px; color: #a0a0b0; text-align: center; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.usage-section { margin-bottom: 20px; }
.section-title { color: #e8a850; font-size: 15px; margin-bottom: 10px; }
.usage-tag { margin-right: 8px; margin-bottom: 8px; }
.no-data { color: #808090; font-size: 13px; }
.shot-list { display: flex; flex-direction: column; gap: 6px; }
.shot-item {
  display: flex; align-items: center; gap: 12px;
  padding: 8px 12px; background: #1a1a2e; border: 1px solid #2a2a3e;
  border-radius: 6px; cursor: pointer; transition: border-color 0.2s;
}
.shot-item:hover { border-color: #e8a850; }
.shot-code { color: #e8a850; font-size: 13px; font-family: monospace; min-width: 80px; }
.shot-name { color: #c0c0d0; font-size: 13px; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.shot-ep { color: #808090; font-size: 12px; min-width: 100px; }
.shot-desc { color: #a0a0b0; font-size: 13px; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.episode-section { margin-bottom: 20px; }

:deep(.el-tabs__header) { margin-bottom: 16px; }
:deep(.el-tabs__item) { color: #808090; }
:deep(.el-tabs__item.is-active) { color: #e8a850; }
:deep(.el-tabs__active-bar) { background: #e8a850; }
:deep(.el-descriptions__label) { background: #1a1a2e; color: #808090; }
:deep(.el-descriptions__content) { background: #16162a; color: #c0c0d0; }
</style>
