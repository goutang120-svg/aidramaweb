<template>
  <div class="episode-detail">
    <div v-loading="loading.episode" class="detail-container">
      <!-- 顶部信息 -->
      <div class="ep-header">
        <el-button text @click="goBack" class="back-btn">
          <el-icon><ArrowLeft /></el-icon> 返回
        </el-button>
        <div class="ep-info">
          <div class="ep-title-row">
            <span class="ep-no">#{{ episode.episodeNo }}</span>
            <span class="ep-title">{{ episode.title }}</span>
          </div>
          <div v-if="episode.summary" class="ep-summary">{{ episode.summary }}</div>
          <div class="ep-progress-row">
            <span>整体进度</span>
            <el-progress
              :percentage="episode.progress || 0"
              :color="progressColor(episode.progress)"
              :stroke-width="8"
              style="flex:1;margin:0 12px"
            />
            <span>{{ episode.progress || 0 }}%</span>
          </div>
        </div>
      </div>

      <!-- Tab 导航 -->
      <el-tabs v-model="activeTab" class="detail-tabs">
        <!-- 剧本 tab -->
        <el-tab-pane label="剧本" name="script">
          <div class="tab-content">
            <div class="tab-toolbar">
              <span class="tab-label">剧本内容 (Markdown)</span>
              <div class="tab-actions">
                <el-button v-if="activeScriptVersion" size="small" @click="setScriptCurrent(activeScriptVersion)">
                  设为当前版本
                </el-button>
                <el-button type="primary" size="small" :loading="savingScript" @click="saveScript">保存</el-button>
              </div>
            </div>
            <el-input
              v-model="scriptForm.content"
              type="textarea"
              :rows="18"
              placeholder="在此编写剧本内容，支持Markdown格式..."
              class="script-editor"
            />
            <div class="version-section">
              <span class="version-title">版本历史</span>
              <div v-loading="loading.scriptVersions" class="version-list">
                <div v-if="scriptVersions.length === 0" class="no-data">暂无版本记录</div>
                <div
                  v-for="v in scriptVersions"
                  :key="v.id"
                  class="version-item"
                  :class="{ active: activeScriptVersion === v.id }"
                  @click="activeScriptVersion = v.id"
                >
                  <span class="v-number">v{{ v.version }}</span>
                  <span class="v-time">{{ formatDate(v.createdAt) }}</span>
                  <el-tag v-if="v.isCurrent" size="small" type="success">当前</el-tag>
                </div>
              </div>
            </div>
          </div>
        </el-tab-pane>

        <!-- 分镜 tab -->
        <el-tab-pane label="分镜" name="storyboard">
          <div class="tab-content">
            <div class="tab-toolbar">
              <span class="tab-label">分镜内容</span>
              <div class="tab-actions">
                <el-button v-if="activeStoryboardVersion" size="small" @click="setStoryboardCurrent(activeStoryboardVersion)">
                  设为当前版本
                </el-button>
                <el-button type="primary" size="small" :loading="savingStoryboard" @click="saveStoryboard">保存</el-button>
              </div>
            </div>
            <el-input
              v-model="storyboardForm.content"
              type="textarea"
              :rows="18"
              placeholder="在此编写分镜内容..."
              class="script-editor"
            />
            <div class="version-section">
              <span class="version-title">版本历史</span>
              <div v-loading="loading.storyboardVersions" class="version-list">
                <div v-if="storyboardVersions.length === 0" class="no-data">暂无版本记录</div>
                <div
                  v-for="v in storyboardVersions"
                  :key="v.id"
                  class="version-item"
                  :class="{ active: activeStoryboardVersion === v.id }"
                  @click="activeStoryboardVersion = v.id"
                >
                  <span class="v-number">v{{ v.version }}</span>
                  <span class="v-time">{{ formatDate(v.createdAt) }}</span>
                  <el-tag v-if="v.isCurrent" size="small" type="success">当前</el-tag>
                </div>
              </div>
            </div>
          </div>
        </el-tab-pane>

        <!-- 镜头 tab -->
        <el-tab-pane label="镜头" name="shots">
          <div class="tab-content">
            <div class="tab-toolbar">
              <span class="tab-label">镜头列表</span>
              <el-button type="primary" size="small" @click="openShotDialog()">
                <el-icon><Plus /></el-icon> 添加镜头
              </el-button>
            </div>
            <el-table
              :data="shots"
              v-loading="loading.shots"
              class="dark-table"
              size="small"
              @row-click="goShot"
              style="cursor:pointer"
            >
              <el-table-column prop="shotNo" label="镜头号" width="80" />
              <el-table-column prop="shotCode" label="编号" width="140" />
              <el-table-column prop="shotType" label="类型" width="100">
                <template #default="{ row }">{{ shotTypeLabel(row.shotType) }}</template>
              </el-table-column>
              <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
              <el-table-column prop="status" label="状态" width="100">
                <template #default="{ row }">
                  <el-tag :color="statusColor(row.status)" effect="dark" size="small" style="border-color:transparent">
                    {{ statusLabel(row.status) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="120" fixed="right">
                <template #default="{ row }">
                  <el-button text size="small" @click.stop="openShotDialog(row)">编辑</el-button>
                  <el-button text size="small" type="danger" @click.stop="handleShotDelete(row)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-tab-pane>

        <!-- 资产 tab -->
        <el-tab-pane label="资产" name="assets">
          <div class="tab-content">
            <div class="tab-toolbar">
              <span class="tab-label">关联资产</span>
              <el-button type="primary" size="small" @click="goAssets">资源中心</el-button>
            </div>
            <div v-loading="loading.assets" class="asset-grid">
              <div v-if="episodeAssets.length === 0 && !loading.assets" class="no-data">暂无关联资产</div>
              <div v-for="asset in episodeAssets" :key="asset.id" class="asset-item">
                <div class="asset-thumb">
                  <img v-if="asset.previewUrl" :src="asset.previewUrl" :alt="asset.assetName" />
                  <el-icon v-else :size="32" color="#4a4a6e"><PictureFilled /></el-icon>
                </div>
                <div class="asset-name" :title="asset.assetName">{{ asset.assetName }}</div>
                <el-tag size="small" :type="assetTagType(asset.assetType)">{{ assetTypeLabel(asset.assetType) }}</el-tag>
              </div>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- 镜头添加/编辑对话框 -->
    <el-dialog
      v-model="shotDialogVisible"
      :title="shotEditId ? '编辑镜头' : '添加镜头'"
      width="560px"
      class="dark-dialog"
    >
      <el-form ref="shotFormRef" :model="shotForm" :rules="shotRules" label-width="100px">
        <el-form-item label="镜头编号" prop="shotNo">
          <el-input-number v-model="shotForm.shotNo" :min="1" style="width:100%" />
        </el-form-item>
        <el-form-item label="类型" prop="shotType">
          <el-select v-model="shotForm.shotType" style="width:100%">
            <el-option label="远景" value="EXTREME_LONG" />
            <el-option label="全景" value="LONG" />
            <el-option label="中景" value="MEDIUM" />
            <el-option label="近景" value="CLOSE_UP" />
            <el-option label="特写" value="EXTREME_CLOSE_UP" />
            <el-option label="空镜" value="EMPTY" />
          </el-select>
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="shotForm.description" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="shotForm.status" style="width:100%">
            <el-option label="未开始" value="NOT_STARTED" />
            <el-option label="进行中" value="IN_PROGRESS" />
            <el-option label="已完成" value="COMPLETED" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="shotDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="shotSubmitting" @click="handleShotSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft, Plus, PictureFilled } from '@element-plus/icons-vue'
import {
  getOne, listAll, createOne, updateOne, deleteOne,
  getAssets, getUploadUrl, createAsset,
} from '@/api/index'
import type { AssetVO } from '@/types'

const router = useRouter()
const route = useRoute()
const episodeId = Number(route.params.id)

const activeTab = ref('script')
const episode = ref<Record<string, any>>({})

const loading = reactive({
  episode: false,
  scriptVersions: false,
  storyboardVersions: false,
  shots: false,
  assets: false,
})

const savingScript = ref(false)
const savingStoryboard = ref(false)

// --- Script ---
const scriptForm = reactive({ content: '' })
const scriptVersions = ref<any[]>([])
const activeScriptVersion = ref<number | null>(null)

// --- Storyboard ---
const storyboardForm = reactive({ content: '' })
const storyboardVersions = ref<any[]>([])
const activeStoryboardVersion = ref<number | null>(null)

// --- Shots ---
const shots = ref<any[]>([])
const shotDialogVisible = ref(false)
const shotEditId = ref<number | null>(null)
const shotSubmitting = ref(false)
const shotFormRef = ref()
const shotForm = reactive({
  shotNo: 1,
  shotType: 'MEDIUM',
  description: '',
  status: 'NOT_STARTED',
})
const shotRules = {
  shotNo: [{ required: true, message: '请输入镜头编号', trigger: 'blur' }],
  shotType: [{ required: true, message: '请选择类型', trigger: 'change' }],
}

// --- Assets ---
const episodeAssets = ref<AssetVO[]>([])

// Helpers
function statusLabel(status: string): string {
  const map: Record<string, string> = { NOT_STARTED: '未开始', IN_PROGRESS: '进行中', COMPLETED: '已完成' }
  return map[status] || status || '未开始'
}
function statusColor(status: string): string {
  const map: Record<string, string> = { NOT_STARTED: '#909399', IN_PROGRESS: '#e8a850', COMPLETED: '#67c23a' }
  return map[status] || '#909399'
}
function progressColor(prog: number): string {
  if (!prog) return '#409eff'
  if (prog >= 100) return '#67c23a'
  if (prog >= 50) return '#e8a850'
  return '#409eff'
}
function shotTypeLabel(type: string): string {
  const map: Record<string, string> = {
    EXTREME_LONG: '远景', LONG: '全景', MEDIUM: '中景', CLOSE_UP: '近景',
    EXTREME_CLOSE_UP: '特写', EMPTY: '空镜',
  }
  return map[type] || type
}
function assetTypeLabel(assetType: string): string {
  const map: Record<string, string> = { IMAGE: '图片', VIDEO: '视频', AUDIO: '音频', DOCUMENT: '文档' }
  return map[assetType] || assetType
}
function assetTagType(assetType: string): 'success' | 'warning' | 'danger' | 'info' | '' {
  const map: Record<string, 'success' | 'warning' | 'danger' | 'info' | ''> = {
    IMAGE: '', VIDEO: 'danger', AUDIO: 'warning', DOCUMENT: 'info',
  }
  return map[assetType] || 'info'
}
function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function goBack() { router.back() }
function goShot(row: any) { router.push(`/shots/${row.id}`) }
function goAssets() { router.push('/assets') }

// --- Fetch episode ---
async function fetchEpisode() {
  loading.episode = true
  try {
    const res = await getOne(`/episodes/${episodeId}`)
    episode.value = res.data.data as any
  } catch {
    // handled
  } finally {
    loading.episode = false
  }
}

// --- Script ---
async function fetchScripts() {
  loading.scriptVersions = true
  try {
    const res = await listAll(`/episodes/${episodeId}/scripts`)
    const data = res.data.data as any
    scriptVersions.value = data.records || []
    const current = scriptVersions.value.find((v: any) => v.isCurrent)
    if (current) {
      scriptForm.content = current.content || ''
      activeScriptVersion.value = current.id
    } else if (scriptVersions.value.length > 0) {
      scriptForm.content = scriptVersions.value[0].content || ''
      activeScriptVersion.value = scriptVersions.value[0].id
    }
  } catch { /* handled */ } finally { loading.scriptVersions = false }
}

async function saveScript() {
  savingScript.value = true
  try {
    await createOne(`/episodes/${episodeId}/scripts`, { content: scriptForm.content })
    ElMessage.success('剧本保存成功')
    await fetchScripts()
  } catch { /* handled */ } finally { savingScript.value = false }
}

async function setScriptCurrent(versionId: number) {
  try {
    await updateOne(`/episodes/${episodeId}/scripts/${versionId}/set-current`, {})
    ElMessage.success('已设为当前版本')
    await fetchScripts()
  } catch { /* handled */ }
}

// --- Storyboard ---
async function fetchStoryboards() {
  loading.storyboardVersions = true
  try {
    const res = await listAll(`/episodes/${episodeId}/storyboards`)
    const data = res.data.data as any
    storyboardVersions.value = data.records || []
    const current = storyboardVersions.value.find((v: any) => v.isCurrent)
    if (current) {
      storyboardForm.content = current.content || ''
      activeStoryboardVersion.value = current.id
    } else if (storyboardVersions.value.length > 0) {
      storyboardForm.content = storyboardVersions.value[0].content || ''
      activeStoryboardVersion.value = storyboardVersions.value[0].id
    }
  } catch { /* handled */ } finally { loading.storyboardVersions = false }
}

async function saveStoryboard() {
  savingStoryboard.value = true
  try {
    await createOne(`/episodes/${episodeId}/storyboards`, { content: storyboardForm.content })
    ElMessage.success('分镜保存成功')
    await fetchStoryboards()
  } catch { /* handled */ } finally { savingStoryboard.value = false }
}

async function setStoryboardCurrent(versionId: number) {
  try {
    await updateOne(`/episodes/${episodeId}/storyboards/${versionId}/set-current`, {})
    ElMessage.success('已设为当前版本')
    await fetchStoryboards()
  } catch { /* handled */ }
}

// --- Shots ---
async function fetchShots() {
  loading.shots = true
  try {
    const res = await listAll(`/episodes/${episodeId}/shots`)
    const data = res.data.data as any
    shots.value = data.records || []
  } catch { /* handled */ } finally { loading.shots = false }
}

function openShotDialog(row?: any) {
  shotEditId.value = row ? row.id : null
  if (row) {
    shotForm.shotNo = row.shotNo
    shotForm.shotType = row.shotType || 'MEDIUM'
    shotForm.description = row.description || ''
    shotForm.status = row.status || 'NOT_STARTED'
  } else {
    shotForm.shotNo = shots.value.length + 1
    shotForm.shotType = 'MEDIUM'
    shotForm.description = ''
    shotForm.status = 'NOT_STARTED'
  }
  shotDialogVisible.value = true
}

async function handleShotSubmit() {
  const valid = await shotFormRef.value.validate().catch(() => false)
  if (!valid) return
  shotSubmitting.value = true
  try {
    const payload = { ...shotForm }
    if (shotEditId.value) {
      await updateOne(`/episodes/${episodeId}/shots/${shotEditId.value}`, payload)
      ElMessage.success('更新成功')
    } else {
      await createOne(`/episodes/${episodeId}/shots`, payload)
      ElMessage.success('添加成功')
    }
    shotDialogVisible.value = false
    await fetchShots()
  } catch { /* handled */ } finally { shotSubmitting.value = false }
}

async function handleShotDelete(row: any) {
  try {
    await ElMessageBox.confirm(`确定删除镜头「${row.shotCode || row.shotNo}」吗？`, '确认删除', {
      confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning',
    })
    await deleteOne(`/episodes/${episodeId}/shots/${row.id}`)
    ElMessage.success('删除成功')
    await fetchShots()
  } catch { /* cancelled */ }
}

// --- Assets ---
async function fetchEpisodeAssets() {
  loading.assets = true
  try {
    const res = await getAssets({ episodeId, page: 1, pageSize: 50 })
    const data = res.data.data as any
    episodeAssets.value = data.records || []
  } catch { /* handled */ } finally { loading.assets = false }
}

onMounted(() => {
  fetchEpisode()
  fetchScripts()
  fetchStoryboards()
  fetchShots()
  fetchEpisodeAssets()
})
</script>

<style scoped>
.episode-detail { padding: 4px; }
.detail-container { max-width: 1200px; }

/* 头部 */
.ep-header { margin-bottom: 16px; }
.back-btn { margin-bottom: 12px; color: #808090; }
.ep-info {
  background: #1a1a2e; border: 1px solid #2a2a3e; border-radius: 8px;
  padding: 20px;
}
.ep-title-row { margin-bottom: 8px; }
.ep-no { color: #e8a850; font-size: 14px; font-weight: 500; margin-right: 8px; }
.ep-title { color: #c0c0d0; font-size: 20px; font-weight: 700; }
.ep-summary { color: #808090; font-size: 14px; line-height: 1.6; margin-bottom: 16px; }
.ep-progress-row { display: flex; align-items: center; color: #6a6a7e; font-size: 13px; }

/* Tabs */
.detail-tabs { margin-top: 8px; }
.tab-content { padding: 4px 0; }
.tab-toolbar {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 12px;
}
.tab-label { color: #c0c0d0; font-size: 14px; font-weight: 500; }
.tab-actions { display: flex; gap: 8px; }

/* 编辑器 */
.script-editor :deep(textarea) {
  background: #16162a; color: #c0c0d0; border-color: #2a2a3e;
  font-family: 'Courier New', monospace; font-size: 14px; line-height: 1.6;
}
.script-editor :deep(textarea):focus { border-color: #e8a850; }

/* 版本历史 */
.version-section { margin-top: 16px; }
.version-title { color: #808090; font-size: 13px; font-weight: 500; display: block; margin-bottom: 8px; }
.version-list { max-height: 200px; overflow-y: auto; }
.no-data { color: #6a6a7e; font-size: 13px; padding: 20px 0; text-align: center; }
.version-item {
  display: flex; align-items: center; gap: 10px;
  padding: 8px 12px; border-radius: 6px; background: #16162a;
  margin-bottom: 6px; cursor: pointer; transition: background 0.2s;
}
.version-item:hover { background: #2a2a3e; }
.version-item.active { border: 1px solid #e8a850; }
.v-number { color: #e8a850; font-size: 13px; font-weight: 500; min-width: 50px; }
.v-time { color: #808090; font-size: 12px; flex: 1; }

/* 资产网格 */
.asset-grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 12px;
}
.asset-item {
  background: #1a1a2e; border: 1px solid #2a2a3e; border-radius: 8px;
  overflow: hidden; transition: border-color 0.2s;
}
.asset-item:hover { border-color: #e8a850; }
.asset-thumb {
  width: 100%; height: 120px; background: #16162a;
  display: flex; align-items: center; justify-content: center; overflow: hidden;
}
.asset-thumb img { width: 100%; height: 100%; object-fit: cover; }
.asset-name {
  padding: 6px 10px 0; font-size: 12px; color: #c0c0d0;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.asset-item .el-tag { margin: 6px 10px 8px; }
</style>
