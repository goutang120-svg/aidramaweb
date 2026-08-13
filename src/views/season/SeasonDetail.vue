<template>
  <div class="season-detail">
    <div class="page-header">
      <el-button link @click="$router.back()">
        <el-icon><ArrowLeft /></el-icon> 返回
      </el-button>
      <h2 class="page-title">{{ season?.name || '分季详情' }}</h2>
    </div>

    <el-empty v-if="!season && !loading" description="未找到该分季" />

    <div v-else v-loading="loading" class="detail-content">
      <el-tabs v-model="activeTab">
        <el-tab-pane label="概览" name="overview">
          <el-card class="info-card">
            <div class="basic-toolbar">
              <span></span>
              <div style="display:flex;gap:8px">
                <el-button v-if="editing" @click="cancelEdit">取消</el-button>
                <el-button type="primary" :loading="saving" @click="editing ? saveEdit() : (editing = true)">
                  {{ editing ? '保存' : '编辑' }}
                </el-button>
              </div>
            </div>
            <el-form v-if="editing" :model="form" label-width="80px" label-position="top">
              <el-row :gutter="16">
                <el-col :span="12">
                  <el-form-item label="季度编号" required>
                    <el-input-number v-model="form.seasonNo" :min="1" style="width:100%" />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="名称" required>
                    <el-input v-model="form.name" placeholder="如：第一季" />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="总集数">
                    <el-input-number v-model="form.totalEpisodes" :min="0" style="width:100%" />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="状态">
                    <el-select v-model="form.status" style="width:100%">
                      <el-option label="未开始" value="NOT_STARTED" />
                      <el-option label="进行中" value="IN_PROGRESS" />
                      <el-option label="已完成" value="COMPLETED" />
                    </el-select>
                  </el-form-item>
                </el-col>
              </el-row>
              <el-form-item label="描述">
                <el-input v-model="form.description" type="textarea" :rows="3" placeholder="季度描述" />
              </el-form-item>
            </el-form>
            <el-descriptions v-else :column="2" border>
              <el-descriptions-item label="季度编号">第 {{ season?.seasonNo }} 季</el-descriptions-item>
              <el-descriptions-item label="名称">{{ season?.name }}</el-descriptions-item>
              <el-descriptions-item label="总集数">{{ season?.totalEpisodes || 0 }} 集</el-descriptions-item>
              <el-descriptions-item label="状态">
                <el-tag :color="statusColor(season?.status)" effect="dark" size="small" style="border-color:transparent">
                  {{ statusLabel(season?.status) }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="描述" :span="2">{{ season?.description || '-' }}</el-descriptions-item>
            </el-descriptions>
          </el-card>
        </el-tab-pane>

        <el-tab-pane label="分集" name="episodes">
          <div class="tab-toolbar">
            <div><span class="tab-heading">分集列表</span><span class="tab-subtitle">{{ episodes.length }} 集</span></div>
            <el-button type="primary" size="small" @click="openEpisodeDialog">
              <el-icon><Plus /></el-icon> 添加分集
            </el-button>
          </div>
          <div v-loading="episodeLoading" class="episode-table-wrap">
            <el-table v-if="episodes.length" :data="episodes" class="dark-table" size="small" @row-click="goEpisode" style="cursor:pointer">
              <el-table-column prop="episodeNo" label="集号" width="80" />
              <el-table-column prop="title" label="标题" min-width="200" show-overflow-tooltip />
              <el-table-column prop="scriptStatus" label="剧本" width="90">
                <template #default="{ row }">
                  <el-tag :color="statusColor(row.scriptStatus)" effect="dark" size="small" style="border-color:transparent">
                    {{ statusLabel(row.scriptStatus) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="storyboardStatus" label="分镜" width="90">
                <template #default="{ row }">
                  <el-tag :color="statusColor(row.storyboardStatus)" effect="dark" size="small" style="border-color:transparent">
                    {{ statusLabel(row.storyboardStatus) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="progress" label="进度" width="100">
                <template #default="{ row }">
                  <el-progress :percentage="row.progress ?? 0" :stroke-width="6" :show-text="true" />
                </template>
              </el-table-column>
              <el-table-column label="操作" width="100" fixed="right">
                <template #default="{ row }">
                  <el-button text size="small" type="danger" @click.stop="handleEpisodeDelete(row)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>
            <el-empty v-else description="暂无分集" />
          </div>
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
              <div class="asset-thumb">
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
                <el-button class="asset-delete-btn" size="small" type="danger" circle
                  @click.stop="handleAssetDelete(asset)">
                  <el-icon :size="12"><Delete /></el-icon>
                </el-button>
              </div>
              <div class="asset-name">{{ asset.assetName || asset.fileName }}</div>
            </div>
          </div>
          <el-empty v-else description="暂无视觉资产" />
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- 添加分集对话框 -->
    <el-dialog
      v-model="episodeDialogVisible"
      title="添加分集"
      width="480px"
      class="dark-dialog"
    >
      <el-form ref="episodeFormRef" :model="episodeForm" :rules="episodeRules" label-width="100px">
        <el-form-item label="集号" prop="episodeNo">
          <el-input-number v-model="episodeForm.episodeNo" :min="1" style="width:100%" />
        </el-form-item>
        <el-form-item label="标题" prop="title">
          <el-input v-model="episodeForm.title" placeholder="如：第一集" />
        </el-form-item>
        <el-form-item label="摘要">
          <el-input v-model="episodeForm.summary" type="textarea" :rows="2" placeholder="本集摘要" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="episodeDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="episodeSubmitting" @click="handleEpisodeSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, Plus, Picture, Delete } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox, type UploadRequestOptions } from 'element-plus'
import { getOne, listAll, updateOne, createOne, deleteOne, getAssets, getUploadUrl, createAsset } from '@/api/index'
import { useAppStore } from '@/stores/app'

interface Season {
  id: number
  seasonNo: number
  name: string
  description: string
  totalEpisodes: number
  status: string
  projectId: number
}

interface Asset {
  id: number
  assetName: string
  fileName: string
  previewUrl: string
  assetType: string
}

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()

const season = ref<Season | null>(null)
const assetList = ref<Asset[]>([])
const episodes = ref<any[]>([])
const activeTab = ref('overview')
const loading = ref(false)
const episodeLoading = ref(false)
const uploading = ref(false)
const saving = ref(false)
const editing = ref(false)

const form = reactive({
  seasonNo: 1,
  name: '',
  description: '',
  totalEpisodes: 12,
  status: 'IN_PROGRESS',
})

// Episode dialog
const episodeDialogVisible = ref(false)
const episodeSubmitting = ref(false)
const episodeFormRef = ref()
const episodeForm = reactive({
  episodeNo: 1,
  title: '',
  summary: '',
})
const episodeRules = {
  episodeNo: [{ required: true, message: '请输入集号', trigger: 'blur' }],
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
}

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    NOT_STARTED: '未开始', IN_PROGRESS: '进行中', COMPLETED: '已完成',
  }
  return map[status] || status || '未开始'
}

function statusColor(status: string): string {
  const map: Record<string, string> = {
    NOT_STARTED: '#909399', IN_PROGRESS: '#e8a850', COMPLETED: '#67c23a',
  }
  return map[status] || '#909399'
}

async function fetchSeason() {
  const id = route.params.id as string
  if (!id) return
  loading.value = true
  try {
    const res = await getOne('/projects/seasons/detail', { projectId: appStore.currentProjectId, id: Number(id) })
    season.value = res.data.data as Season
    if (season.value) {
      populateForm()
      fetchAssets(season.value.id)
      fetchEpisodes()
    }
  } catch {
    // handled
  } finally {
    loading.value = false
  }
}

function populateForm() {
  const s = season.value
  if (!s) return
  form.seasonNo = s.seasonNo
  form.name = s.name || ''
  form.description = s.description || ''
  form.totalEpisodes = s.totalEpisodes || 0
  form.status = s.status || 'IN_PROGRESS'
}

function cancelEdit() {
  editing.value = false
  populateForm()
}

async function saveEdit() {
  if (!season.value || !form.name) return
  saving.value = true
  try {
    await updateOne('/projects/seasons', { ...form }, { projectId: appStore.currentProjectId, id: season.value.id })
    ElMessage.success('保存成功')
    editing.value = false
    const res = await getOne('/projects/seasons/detail', { projectId: appStore.currentProjectId, id: season.value.id })
    season.value = res.data.data as Season
  } catch {
    // handled
  } finally {
    saving.value = false
  }
}

async function fetchEpisodes() {
  if (!season.value) return
  episodeLoading.value = true
  try {
    const res = await listAll('/seasons/episodes', { seasonId: season.value.id })
    const data = res.data.data as any
    episodes.value = data.records || []
  } catch {
    // handled
  } finally {
    episodeLoading.value = false
  }
}

async function fetchAssets(seasonId: number) {
  try {
    const res = await getAssets({ seasonId, page: 1, pageSize: 200 })
    assetList.value = (res.data.data.records || []) as Asset[]
  } catch {
    // handled
  }
}

function openEpisodeDialog() {
  episodeForm.episodeNo = episodes.value.length + 1
  episodeForm.title = ''
  episodeForm.summary = ''
  episodeDialogVisible.value = true
}

async function handleEpisodeSubmit() {
  const valid = await episodeFormRef.value.validate().catch(() => false)
  if (!valid) return
  episodeSubmitting.value = true
  try {
    await createOne('/seasons/episodes', { ...episodeForm, status: 'NOT_STARTED' }, { seasonId: season.value!.id })
    ElMessage.success('添加成功')
    episodeDialogVisible.value = false
    await fetchEpisodes()
  } catch {
    // handled
  } finally {
    episodeSubmitting.value = false
  }
}

function goEpisode(row: any) {
  router.push(`/episodes/${row.id}`)
}

async function handleEpisodeDelete(row: any) {
  try {
    await ElMessageBox.confirm(`确定删除「第${row.episodeNo}集 ${row.title}」吗？`, '确认删除', {
      confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning',
    })
    await deleteOne('/seasons/episodes', { seasonId: season.value!.id, id: row.id })
    ElMessage.success('删除成功')
    await fetchEpisodes()
  } catch {
    // cancelled
  }
}

async function customUpload(options: UploadRequestOptions) {
  if (!season.value) return
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
      projectId: season.value.projectId,
      seasonId: season.value.id,
    })
    ElMessage.success('上传成功')
    await fetchAssets(season.value.id)
  } catch {
    ElMessage.error('上传失败')
  } finally {
    uploading.value = false
  }
}

async function handleAssetDelete(asset: Asset) {
  try {
    await ElMessageBox.confirm(`确定删除「${asset.assetName || asset.fileName}」吗？`, '确认删除', {
      confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning',
    })
    await deleteOne('/assets', { id: asset.id })
    ElMessage.success('已删除')
    if (season.value) await fetchAssets(season.value.id)
  } catch {
    // cancelled
  }
}

onMounted(() => {
  fetchSeason()
})

watch(() => route.params.id, () => {
  fetchSeason()
})
</script>

<style scoped>
.season-detail { height: 100%; display: flex; flex-direction: column; }
.page-header { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
.page-title { color: var(--primary-color); font-size: 20px; font-weight: 600; }

.detail-content { flex: 1; overflow-y: auto; }
.info-card { background: var(--bg-white); border: 1px solid var(--border-hairline); }
.basic-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }

/* Tabs */
.tab-toolbar {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 16px;
}
.tab-heading { color: var(--text-secondary); font-size: 15px; font-weight: 600; }
.tab-subtitle { color: var(--text-muted); font-size: 12px; margin-left: 10px; }

.episode-table-wrap { min-height: 120px; }

/* Assets */
.asset-toolbar { margin-bottom: 12px; }
.asset-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 12px; }
.asset-item { background: var(--bg-white); border: 1px solid var(--border-hairline); border-radius: var(--radius-md); overflow: hidden; transition: all 0.3s ease; }
.asset-item:hover { border-color: var(--primary-color); box-shadow: var(--shadow-glow); }
.asset-thumb { position: relative; }
.asset-image { width: 100%; height: 160px; display: block; }
.asset-placeholder { width: 100%; height: 160px; display: flex; align-items: center; justify-content: center; background: var(--bg-cream); color: var(--text-muted); }
.asset-delete-btn {
  position: absolute; top: 4px; right: 4px; opacity: 0; transition: opacity 0.2s;
}
.asset-thumb:hover .asset-delete-btn { opacity: 1; }
.asset-name { padding: 8px; font-size: 12px; color: var(--text-secondary); text-align: center; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

/* Deep styles */
:deep(.el-tabs__header) { margin-bottom: 16px; }
:deep(.el-tabs__item) { color: var(--text-muted); }
:deep(.el-tabs__item.is-active) { color: var(--primary-color); }
:deep(.el-tabs__active-bar) { background: var(--primary-color); }
:deep(.el-descriptions__label) { background: var(--bg-white) !important; color: var(--text-muted); }
:deep(.el-descriptions__content) { background: var(--bg-white) !important; color: var(--text-secondary); }
:deep(.dark-table) { background: var(--bg-white); }
:deep(.dark-table th.el-table__cell) { background: var(--bg-cream); color: var(--text-secondary); }
</style>
