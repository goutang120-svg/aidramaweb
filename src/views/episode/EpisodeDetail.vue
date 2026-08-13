<template>
  <div class="episode-detail">
    <div v-loading="loading.episode" class="detail-container">
      <div class="ep-header">
        <el-button text @click="goBack" class="back-btn">
          <el-icon><ArrowLeft /></el-icon> 返回分集列表
        </el-button>
        <div class="ep-hero">
          <div class="hero-main">
            <div class="ep-title-row">
              <span class="ep-no">#{{ episode.episodeNo }}</span>
              <h1 class="ep-title">{{ episode.title || '分集详情' }}</h1>
            </div>
            <div v-if="episode.summary" class="ep-summary">{{ episode.summary }}</div>
            <div class="workflow-strip">
              <div v-for="item in workflowItems" :key="item.key" class="workflow-item">
                <span class="workflow-dot" :style="{ background: statusColor(episode[item.key]) }"></span>
                <span class="workflow-label">{{ item.label }}</span>
                <span class="workflow-status">{{ statusLabel(episode[item.key]) }}</span>
              </div>
            </div>
          </div>
          <div class="progress-card">
            <span class="progress-caption">整体进度</span>
            <strong>{{ progressData?.overallProgress ?? episode.progress ?? 0 }}%</strong>
            <el-progress
              :percentage="progressData?.overallProgress ?? episode.progress ?? 0"
              :color="progressColor(progressData?.overallProgress ?? episode.progress)"
              :stroke-width="7" :show-text="false"
            />
            <div class="progress-hint">动态计算 · 由 6 维加权</div>
          </div>
        </div>
      </div>

      <!-- Progress breakdown -->
      <ProgressBreakdown
        v-if="progressData"
        :overall="progressData.overallProgress"
        overall-label="综合进度"
        title="分集制作进度"
        :subtitle="`剧本 15% · 分镜 15% · 镜头 30% · 资产 15% · 视频 15% · 后期 10%`"
        :dimensions="episodeDimensions"
        class="detail-progress"
      />

      <!-- Tab 导航 -->
      <el-tabs v-model="activeTab" class="detail-tabs">
        <el-tab-pane name="script">
          <template #label><span class="tab-label"><el-icon><Document /></el-icon>剧本</span></template>
          <div class="tab-content">
            <div class="tab-toolbar">
              <div><span class="tab-heading">剧本内容</span><span class="tab-subtitle">Markdown 编辑器</span></div>
              <div class="tab-actions">
                <span class="content-count">{{ scriptForm.content.length }} 字</span>
                <input ref="scriptFileInput" type="file" accept=".md,.txt" style="display:none" @change="handleScriptFile" />
                <el-button size="small" plain class="toolbar-btn" @click="($refs.scriptFileInput as HTMLInputElement).click()"><el-icon><Upload /></el-icon> 导入 MD</el-button>
                <el-button v-if="activeScriptVersion" size="small" plain class="toolbar-btn" @click="setScriptCurrent(activeScriptVersion)"><el-icon><CircleCheck /></el-icon> 设为当前</el-button>
                <el-button type="primary" size="small" class="btn-save" :loading="savingScript" @click="saveScript"><el-icon><Check /></el-icon> 保存</el-button>
              </div>
            </div>
            <el-input v-model="scriptForm.content" type="textarea" :rows="18" placeholder="在此编写剧本内容，支持Markdown格式..." class="script-editor" />
            <div class="editor-footer"><span>{{ scriptForm.content.length }} 字符</span><span>保存后将生成新版本</span></div>
            <div class="version-section">
              <div class="section-heading"><span class="version-title">版本历史</span><span class="version-count">{{ scriptVersions.length }} 个版本</span></div>
              <div v-loading="loading.scriptVersions" class="version-list">
                <div v-if="scriptVersions.length === 0" class="no-data"><el-icon><Clock /></el-icon><span>暂无版本记录</span></div>
                <div v-for="v in scriptVersions" :key="v.id" class="version-item" :class="{ active: activeScriptVersion === v.id }" @click="activeScriptVersion = v.id">
                  <span class="version-indicator"></span><span class="v-number">v{{ v.version }}</span><span class="v-time">{{ formatDate(v.createdAt) }}</span><el-tag v-if="v.isCurrent" size="small" type="success">当前</el-tag>
                </div>
              </div>
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane name="storyboard">
          <template #label><span class="tab-label"><el-icon><VideoCamera /></el-icon>分镜</span></template>
          <div class="tab-content">
            <div class="tab-toolbar">
              <div><span class="tab-heading">分镜内容</span><span class="tab-subtitle">镜头设计文档</span></div>
              <div class="tab-actions">
                <span class="content-count">{{ storyboardForm.content.length }} 字</span>
                <input ref="storyboardFileInput" type="file" accept=".md,.txt" style="display:none" @change="handleStoryboardFile" />
                <el-button size="small" plain class="toolbar-btn" @click="($refs.storyboardFileInput as HTMLInputElement).click()"><el-icon><Upload /></el-icon> 导入 MD</el-button>
                <el-button v-if="activeStoryboardVersion" size="small" plain class="toolbar-btn" @click="setStoryboardCurrent(activeStoryboardVersion)"><el-icon><CircleCheck /></el-icon> 设为当前</el-button>
                <el-button type="primary" size="small" class="btn-save" :loading="savingStoryboard" @click="saveStoryboard"><el-icon><Check /></el-icon> 保存</el-button>
              </div>
            </div>
            <el-input v-model="storyboardForm.content" type="textarea" :rows="18" placeholder="在此编写分镜内容..." class="script-editor" />
            <div class="editor-footer"><span>{{ storyboardForm.content.length }} 字符</span><span>保存后将生成新版本</span></div>
            <div class="version-section">
              <div class="section-heading"><span class="version-title">版本历史</span><span class="version-count">{{ storyboardVersions.length }} 个版本</span></div>
              <div v-loading="loading.storyboardVersions" class="version-list">
                <div v-if="storyboardVersions.length === 0" class="no-data"><el-icon><Clock /></el-icon><span>暂无版本记录</span></div>
                <div v-for="v in storyboardVersions" :key="v.id" class="version-item" :class="{ active: activeStoryboardVersion === v.id }" @click="activeStoryboardVersion = v.id">
                  <span class="version-indicator"></span><span class="v-number">v{{ v.version }}</span><span class="v-time">{{ formatDate(v.createdAt) }}</span><el-tag v-if="v.isCurrent" size="small" type="success">当前</el-tag>
                </div>
              </div>
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane name="shots">
          <template #label><span class="tab-label"><el-icon><Film /></el-icon>镜头</span></template>
          <div class="tab-content">
            <div class="tab-toolbar">
              <div><span class="tab-heading">镜头列表</span><span class="tab-subtitle">{{ shots.length }} 个镜头</span></div>
              <div class="tab-actions">
                <input ref="shotsFileInput" type="file" accept=".md,.txt" style="display:none" @change="handleShotsFile" />
                <el-button size="small" plain class="toolbar-btn" @click="($refs.shotsFileInput as HTMLInputElement).click()"><el-icon><Upload /></el-icon> 导入分镜 MD</el-button>
                <el-button type="primary" size="small" class="btn-save" @click="openShotDialog()"><el-icon><Plus /></el-icon> 添加镜头</el-button>
              </div>
            </div>
            <div v-if="!loading.shots && shots.length === 0" class="table-empty">
              <div class="empty-icon-wrap small"><el-icon size="30"><Film /></el-icon></div>
              <p>暂无镜头</p><span>可以手动添加镜头，或导入分镜 Markdown 文件</span>
              <el-button size="small" plain @click="openShotDialog()"><el-icon><Plus /></el-icon> 添加第一个镜头</el-button>
            </div>
            <el-table v-else :data="shots" v-loading="loading.shots" class="dark-table" size="small" @row-click="goShot" style="cursor:pointer">
              <el-table-column prop="shotNo" label="镜头号" width="80" />
              <el-table-column prop="shotCode" label="编号" width="140" />
              <el-table-column prop="shotType" label="类型" width="100"><template #default="{ row }">{{ shotTypeLabel(row.shotType) }}</template></el-table-column>
              <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
              <el-table-column prop="status" label="状态" width="100"><template #default="{ row }"><el-tag :color="statusColor(row.status)" effect="dark" size="small" class="status-tag">{{ statusLabel(row.status) }}</el-tag></template></el-table-column>
              <el-table-column label="操作" width="120" fixed="right"><template #default="{ row }"><el-button text size="small" @click.stop="openShotDialog(row)">编辑</el-button><el-button text size="small" type="danger" @click.stop="handleShotDelete(row)">删除</el-button></template></el-table-column>
            </el-table>
          </div>
        </el-tab-pane>

        <el-tab-pane name="scenes">
          <template #label><span class="tab-label"><el-icon><Connection /></el-icon>场景</span></template>
          <div class="tab-content">
            <div class="tab-toolbar">
              <div><span class="tab-heading">关联场景</span><span class="tab-subtitle">{{ episodeScenes.length }} 个场景</span></div>
              <el-button type="primary" size="small" class="btn-save" @click="openSceneDialog"><el-icon><Plus /></el-icon> 添加场景</el-button>
            </div>
            <div v-loading="loading.scenes" class="scene-list">
              <div v-if="episodeScenes.length === 0 && !loading.scenes" class="table-empty">
                <div class="empty-icon-wrap small"><el-icon size="30"><Connection /></el-icon></div>
                <p>暂无关联场景</p><span>为本集关联拍摄场景</span>
              </div>
              <div v-for="scene in episodeScenes" :key="scene.id" class="scene-row">
                <div class="scene-info">
                  <div class="scene-name">{{ scene.name }}</div>
                  <div class="scene-meta">
                    <el-tag size="small" effect="plain">{{ scene.location || '未设定地点' }}</el-tag>
                    <el-tag v-if="scene.timePeriod" size="small" effect="plain" type="info">{{ scene.timePeriod }}</el-tag>
                    <span v-if="scene.description" class="scene-desc">{{ scene.description }}</span>
                  </div>
                </div>
                <el-button text size="small" type="danger" @click="removeEpisodeSceneRel(scene.id)">移除</el-button>
              </div>
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane name="assets">
          <template #label><span class="tab-label"><el-icon><PictureFilled /></el-icon>资产</span></template>
          <div class="tab-content">
            <div class="tab-toolbar">
              <div><span class="tab-heading">关联资产</span><span class="tab-subtitle">{{ episodeAssets.length }} 个资产</span></div>
              <el-button type="primary" size="small" class="btn-save" @click="goAssets"><el-icon><FolderOpened /></el-icon> 资源中心</el-button>
            </div>
            <div v-loading="loading.assets" class="asset-grid">
              <div v-if="episodeAssets.length === 0 && !loading.assets" class="asset-empty">
                <div class="empty-icon-wrap small"><el-icon size="30"><PictureFilled /></el-icon></div>
                <p>暂无关联资产</p><span>前往资源中心为本集管理图片、视频和文档</span>
                <el-button size="small" plain @click="goAssets"><el-icon><FolderOpened /></el-icon> 打开资源中心</el-button>
              </div>
              <div v-for="asset in episodeAssets" :key="asset.id" class="asset-item">
                <div class="asset-thumb">
                  <img v-if="asset.previewUrl" :src="asset.previewUrl" :alt="asset.assetName" />
                  <el-icon v-else :size="32" class="asset-placeholder"><PictureFilled /></el-icon>
                  <el-button class="asset-delete-btn" size="small" type="danger" circle @click.stop="handleEpisodeAssetDelete(asset)">
                    <el-icon :size="12"><Delete /></el-icon>
                  </el-button>
                </div>
                <div class="asset-name" :title="asset.assetName">{{ asset.assetName }}</div>
                <el-tag size="small" :type="assetTagType(asset.assetType)">{{ assetTypeLabel(asset.assetType) }}</el-tag>
              </div>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- 场景添加对话框 -->
    <el-dialog v-model="sceneDialogVisible" title="添加场景" width="480px" class="dark-dialog">
      <el-select
        v-model="selectedSceneId"
        placeholder="选择要关联的场景"
        style="width:100%"
        filterable
        clearable
      >
        <el-option
          v-for="s in availableScenes"
          :key="s.id"
          :label="s.name + (s.location ? ' - ' + s.location : '')"
          :value="s.id"
        />
      </el-select>
      <template #footer>
        <el-button @click="sceneDialogVisible = false">取消</el-button>
        <el-button type="primary" :disabled="!selectedSceneId" @click="addEpisodeSceneRel">确定</el-button>
      </template>
    </el-dialog>

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
    <!-- 分镜MD导入预览对话框 -->
    <el-dialog
      v-model="shotsImportVisible"
      title="导入分镜镜头"
      width="900px"
      class="dark-dialog"
      :close-on-click-modal="false"
    >
      <div v-if="parsedShots.length === 0 && !parsingShots" style="text-align:center;padding:40px;color:#808090">
        请选择包含分镜内容的 .md 文件
      </div>
      <el-table v-else :data="parsedShots" class="dark-table" max-height="450" size="small">
        <el-table-column prop="shotNo" label="镜号" width="60" />
        <el-table-column prop="shotType" label="类型" width="90">
          <template #default="{ row }">
            <el-input v-model="row.shotType" size="small" />
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" min-width="160">
          <template #default="{ row }">
            <el-input v-model="row.description" size="small" />
          </template>
        </el-table-column>
        <el-table-column prop="action" label="动作" min-width="120">
          <template #default="{ row }">
            <el-input v-model="row.action" size="small" />
          </template>
        </el-table-column>
        <el-table-column prop="dialogue" label="对白" min-width="120">
          <template #default="{ row }">
            <el-input v-model="row.dialogue" size="small" />
          </template>
        </el-table-column>
        <el-table-column prop="cameraAngle" label="角度" width="80">
          <template #default="{ row }">
            <el-input v-model="row.cameraAngle" size="small" />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="60" fixed="right">
          <template #default="{ $index }">
            <el-button text size="small" type="danger" @click="parsedShots.splice($index, 1)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <template #footer>
        <el-button @click="shotsImportVisible = false">取消</el-button>
        <el-button type="primary" :loading="importingShots" :disabled="parsedShots.length === 0" @click="handleShotsImport">
          导入 {{ parsedShots.length }} 个镜头
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  ArrowLeft, Plus, PictureFilled, Delete, Document, VideoCamera,
  Film, Upload, CircleCheck, Check, Clock, FolderOpened, Connection,
} from '@element-plus/icons-vue'
import {
  getOne, listAll, createOne, updateOne, deleteOne,
  getAssets, getUploadUrl, createAsset,
  getEpisodeProgress,
  listEpisodeScenes, addEpisodeScene, removeEpisodeScene,
} from '@/api/index'
import type { AssetVO } from '@/types'
import type { EpisodeProgressVO } from '@/api/index'
import ProgressBreakdown from '@/components/ProgressBreakdown.vue'

const router = useRouter()
const route = useRoute()
const episodeId = Number(route.params.id)

const activeTab = ref('script')
const episode = ref<Record<string, any>>({})
const progressData = ref<EpisodeProgressVO | null>(null)

const episodeDimensions = computed(() => {
  const p = progressData.value
  if (!p) return []
  return [
    { key: 'script',     label: '剧本',     value: p.scriptProgress,     weight: 15, caption: '按剧本工作流状态计分' },
    { key: 'storyboard', label: '分镜',     value: p.storyboardProgress, weight: 15, caption: '按分镜工作流状态计分' },
    { key: 'shot',       label: '镜头制作', value: p.shotProgress,       weight: 30,
      caption: `${p.completedShots}/${p.totalShots} 已完成，${p.inProgressShots} 进行中` },
    { key: 'asset',      label: '资产',     value: p.assetProgress,      weight: 15, caption: '关联资产就绪度' },
    { key: 'video',      label: '视频',     value: p.videoProgress,      weight: 15, caption: '视频生成进度' },
    { key: 'post',       label: '后期',     value: p.postProgress,       weight: 10, caption: '剪辑与调色状态' },
  ]
})

const workflowItems = [
  { key: 'scriptStatus', label: '剧本' },
  { key: 'storyboardStatus', label: '分镜' },
  { key: 'assetStatus', label: '资产' },
  { key: 'videoStatus', label: '视频' },
  { key: 'postStatus', label: '后期' },
]

const loading = reactive({
  episode: false,
  scriptVersions: false,
  storyboardVersions: false,
  shots: false,
  scenes: false,
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

// --- MD Import ---
const shotsImportVisible = ref(false)
const parsedShots = ref<Record<string, any>[]>([])
const parsingShots = ref(false)
const importingShots = ref(false)

// --- Assets ---
const episodeAssets = ref<AssetVO[]>([])

// --- Scenes ---
const episodeScenes = ref<any[]>([])
const sceneDialogVisible = ref(false)
const selectedSceneId = ref<number | null>(null)
const availableScenes = ref<any[]>([])

// Helpers
function statusLabel(status: string): string {
  const map: Record<string, string> = { NOT_STARTED: '未开始', IN_PROGRESS: '进行中', COMPLETED: '已完成' }
  return map[status] || status || '未开始'
}
function statusColor(status: string): string {
  const map: Record<string, string> = { NOT_STARTED: '#6b6b82', IN_PROGRESS: '#a78bfa', COMPLETED: '#38ef7d' }
  return map[status] || '#6b6b82'
}
function progressColor(prog: number): string {
  if (!prog) return '#667eea'
  if (prog >= 100) return '#38ef7d'
  if (prog >= 50) return '#a78bfa'
  return '#667eea'
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
    const res = await getOne('/episodes', { id: episodeId })
    episode.value = res.data.data as any
  } catch {
    // handled
  } finally {
    loading.episode = false
  }
}

async function fetchProgress() {
  try {
    const res = await getEpisodeProgress(episodeId)
    progressData.value = res.data.data as EpisodeProgressVO
  } catch { /* ignore */ }
}

// --- Script ---
async function fetchScripts() {
  loading.scriptVersions = true
  try {
    const res = await listAll('/episodes/scripts', { episodeId })
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
    await createOne('/episodes/scripts', { content: scriptForm.content }, { episodeId })
    ElMessage.success('剧本保存成功')
    await fetchScripts(); await fetchProgress()
  } catch { /* handled */ } finally { savingScript.value = false }
}

async function setScriptCurrent(versionId: number) {
  try {
    await updateOne('/episodes/scripts/set-current', {}, { episodeId, id: versionId })
    ElMessage.success('已设为当前版本')
    await fetchScripts(); await fetchProgress()
  } catch { /* handled */ }
}

// --- Storyboard ---
async function fetchStoryboards() {
  loading.storyboardVersions = true
  try {
    const res = await listAll('/episodes/storyboards', { episodeId })
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
    await createOne('/episodes/storyboards', { content: storyboardForm.content }, { episodeId })
    ElMessage.success('分镜保存成功')
    await fetchStoryboards(); await fetchProgress()
  } catch { /* handled */ } finally { savingStoryboard.value = false }
}

async function setStoryboardCurrent(versionId: number) {
  try {
    await updateOne('/episodes/storyboards/set-current', {}, { episodeId, id: versionId })
    ElMessage.success('已设为当前版本')
    await fetchStoryboards(); await fetchProgress()
  } catch { /* handled */ }
}

// --- Shots ---
async function fetchShots() {
  loading.shots = true
  try {
    const res = await listAll('/episodes/shots', { episodeId })
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
      await updateOne('/episodes/shots', payload, { episodeId, id: shotEditId.value })
      ElMessage.success('更新成功')
    } else {
      await createOne('/episodes/shots', payload, { episodeId })
      ElMessage.success('添加成功')
    }
    shotDialogVisible.value = false
    await fetchShots(); await fetchProgress()
  } catch { /* handled */ } finally { shotSubmitting.value = false }
}

async function handleShotDelete(row: any) {
  try {
    await ElMessageBox.confirm(`确定删除镜头「${row.shotCode || row.shotNo}」吗？`, '确认删除', {
      confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning',
    })
    await deleteOne('/episodes/shots', { episodeId, id: row.id })
    ElMessage.success('删除成功')
    await fetchShots(); await fetchProgress()
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

// --- Episode Scenes ---
async function fetchEpisodeScenes() {
  loading.scenes = true
  try {
    const res = await listEpisodeScenes(episodeId)
    const sceneIds = (res.data.data as number[]) || []
    if (sceneIds.length === 0) { episodeScenes.value = []; return }
    const scenesRes = await listAll('/projects/scenes', { projectId: episode.value.projectId, page: 1, pageSize: 200 })
    const allScenes = ((scenesRes.data.data as any).records || []) as any[]
    episodeScenes.value = allScenes.filter((s: any) => sceneIds.includes(s.id))
  } catch { /* handled */ } finally { loading.scenes = false }
}

async function openSceneDialog() {
  selectedSceneId.value = null
  try {
    const res = await listAll('/projects/scenes', { projectId: episode.value.projectId, page: 1, pageSize: 200 })
    const allScenes = ((res.data.data as any).records || []) as any[]
    const linkedIds = episodeScenes.value.map((s: any) => s.id)
    availableScenes.value = allScenes.filter((s: any) => !linkedIds.includes(s.id))
  } catch { availableScenes.value = [] }
  sceneDialogVisible.value = true
}

async function addEpisodeSceneRel() {
  if (!selectedSceneId.value) return
  try {
    await addEpisodeScene(episodeId, selectedSceneId.value)
    ElMessage.success('场景已关联')
    sceneDialogVisible.value = false
    await fetchEpisodeScenes()
  } catch { /* handled */ }
}

async function removeEpisodeSceneRel(sceneId: number) {
  try {
    await removeEpisodeScene(episodeId, sceneId)
    ElMessage.success('已移除关联')
    await fetchEpisodeScenes()
  } catch { /* handled */ }
}

// --- Episode Asset Delete ---
async function handleEpisodeAssetDelete(asset: AssetVO) {
  try {
    await ElMessageBox.confirm(`确定删除「${asset.assetName}」吗？删除后不可恢复。`, '确认删除', {
      confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning',
    })
    await deleteOne('/assets', { id: asset.id })
    ElMessage.success('已删除')
    await fetchEpisodeAssets()
  } catch { /* cancelled */ }
}

// --- MD Import handlers ---
function handleScriptFile(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => { scriptForm.content = reader.result as string }
  reader.readAsText(file)
  ;(e.target as HTMLInputElement).value = ''
}

function handleStoryboardFile(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => { storyboardForm.content = reader.result as string }
  reader.readAsText(file)
  ;(e.target as HTMLInputElement).value = ''
}

async function handleShotsFile(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  ;(e.target as HTMLInputElement).value = ''
  parsingShots.value = true
  shotsImportVisible.value = true
  try {
    const reader = new FileReader()
    reader.onload = async () => {
      try {
        const res = await createOne('/episodes/shots/parse', { content: reader.result as string })
        parsedShots.value = (res.data.data as any[]) || []
      } catch { ElMessage.error('解析失败') }
      parsingShots.value = false
    }
    reader.readAsText(file)
  } catch { parsingShots.value = false }
}

async function handleShotsImport() {
  if (parsedShots.value.length === 0) return
  importingShots.value = true
  try {
    await createOne('/episodes/shots/batch', { shots: parsedShots.value }, { episodeId })
    ElMessage.success(`成功导入 ${parsedShots.value.length} 个镜头`)
    shotsImportVisible.value = false
    parsedShots.value = []
    await fetchShots(); await fetchProgress()
  } catch { /* handled */ } finally { importingShots.value = false }
}

onMounted(() => {
  fetchEpisode()
  fetchProgress()
  fetchScripts()
  fetchStoryboards()
  fetchShots()
  fetchEpisodeScenes()
  fetchEpisodeAssets()
})
</script>

<style scoped>
.episode-detail { min-height: 100%; padding: 4px; }
.detail-container { max-width: 1240px; margin: 0 auto; }
.ep-header { margin-bottom: 18px; }
.back-btn { margin-bottom: 12px; padding-left: 0; color: var(--text-muted); }
.back-btn:hover { color: var(--primary-color); }
.ep-hero { display: flex; justify-content: space-between; gap: 24px; padding: 24px 28px; background: linear-gradient(135deg, var(--primary-tint), rgba(118,75,162,.06) 55%, transparent); border: 1px solid var(--border-hairline); border-left: 4px solid var(--primary-color); border-radius: var(--radius-lg); box-shadow: var(--shadow-card); }
.hero-main { min-width: 0; flex: 1; }
.ep-title-row { display: flex; align-items: baseline; gap: 10px; margin-bottom: 8px; }
.ep-no { color: var(--primary-color); font-size: 14px; font-weight: 600; }
.ep-title { margin: 0; color: var(--text-ink); font-size: 24px; font-weight: 700; }
.ep-summary { max-width: 760px; margin: 0 0 18px; color: var(--text-secondary); font-size: 14px; line-height: 1.7; }
.workflow-strip { display: flex; flex-wrap: wrap; gap: 8px 18px; }
.workflow-item { display: flex; align-items: center; gap: 6px; color: var(--text-muted); font-size: 12px; }
.workflow-dot { width: 7px; height: 7px; border-radius: 50%; box-shadow: 0 0 8px currentColor; }
.workflow-status { color: var(--text-secondary); }
.progress-card { align-self: center; width: 150px; flex-shrink: 0; padding: 14px; background: rgba(18,18,42,.35); border: 1px solid var(--border-hairline); border-radius: var(--radius-md); }
.progress-caption { display: block; margin-bottom: 5px; color: var(--text-muted); font-size: 12px; }
.progress-card strong { display: block; margin-bottom: 9px; color: var(--text-ink); font-size: 22px; }
.progress-hint { margin-top: 6px; color: var(--text-secondary); font-size: 10px; }
.detail-progress { margin-top: 16px; }
.detail-tabs { margin-top: 8px; }
.detail-tabs :deep(.el-tabs__header) { margin-bottom: 0; border-bottom: 1px solid var(--border-hairline); }
.detail-tabs :deep(.el-tabs__nav-wrap::after) { background-color: transparent; }
.detail-tabs :deep(.el-tabs__item) { height: 46px; color: var(--text-muted); font-size: 13px; }
.detail-tabs :deep(.el-tabs__item.is-active) { color: var(--primary-color); }
.detail-tabs :deep(.el-tabs__active-bar) { height: 2px; background: var(--primary-color); }
.tab-content { padding: 18px 0 6px; }
.tab-label { display: inline-flex; align-items: center; gap: 5px; }
.tab-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 12px; }
.tab-heading { color: var(--text-ink); font-size: 14px; font-weight: 600; }
.tab-subtitle { margin-left: 8px; color: var(--text-muted); font-size: 11px; }
.tab-actions { display: flex; align-items: center; justify-content: flex-end; flex-wrap: wrap; gap: 7px; }
.content-count { color: var(--text-muted); font-size: 11px; }
.toolbar-btn { background: var(--bg-white) !important; border-color: var(--border-hairline) !important; color: var(--text-secondary) !important; }
.toolbar-btn:hover { border-color: var(--primary-color) !important; color: var(--primary-color) !important; }
.btn-save { background: var(--primary-color) !important; color: white !important; border: none !important; font-weight: 600; }
.script-editor :deep(.el-textarea__inner) { min-height: 360px !important; padding: 18px 20px; background: var(--bg-white); border: 1px solid var(--border-hairline); color: var(--text-ink); font-family: 'JetBrains Mono', 'Consolas', 'Courier New', monospace; font-size: 14px; line-height: 1.75; resize: vertical; }
.script-editor :deep(.el-textarea__inner):focus { border-color: var(--primary-color); box-shadow: 0 0 0 2px var(--primary-tint); }
.editor-footer { display: flex; justify-content: space-between; padding: 6px 12px; color: var(--text-muted); font-size: 11px; background: var(--bg-cream); border: 1px solid var(--border-hairline); border-top: none; }
.version-section { margin-top: 18px; padding-top: 16px; border-top: 1px solid var(--border-hairline); }
.section-heading { display: flex; align-items: center; justify-content: space-between; margin-bottom: 9px; }
.version-title { color: var(--text-secondary); font-size: 13px; font-weight: 600; }
.version-count { color: var(--text-muted); font-size: 11px; }
.version-list { max-height: 220px; overflow-y: auto; }
.no-data { display: flex; align-items: center; justify-content: center; gap: 7px; min-height: 100px; color: var(--text-muted); font-size: 13px; }
.version-item { display: flex; align-items: center; gap: 10px; margin-bottom: 6px; padding: 9px 12px; background: var(--bg-white); border: 1px solid transparent; border-radius: var(--radius-sm); cursor: pointer; transition: all .2s; }
.version-item:hover { background: var(--bg-cream); border-color: var(--border-hairline); }
.version-item.active { background: var(--primary-tint); border-color: var(--primary-color); }
.version-indicator { width: 6px; height: 6px; border-radius: 50%; background: var(--text-muted); }
.version-item.active .version-indicator { background: var(--primary-color); box-shadow: 0 0 8px var(--primary-color); }
.v-number { min-width: 45px; color: var(--primary-color); font-size: 13px; font-weight: 600; }
.v-time { flex: 1; color: var(--text-muted); font-size: 12px; }

/* Scene list */
.scene-list { min-height: 100px; }
.scene-row {
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  padding: 12px 16px; margin-bottom: 8px;
  background: var(--bg-white); border: 1px solid var(--border-hairline);
  border-radius: var(--radius-md); transition: all 0.2s ease;
}
.scene-row:hover { border-color: var(--primary-color); box-shadow: var(--shadow-soft); }
.scene-info { flex: 1; min-width: 0; }
.scene-name { color: var(--text-body); font-size: 14px; font-weight: 500; margin-bottom: 4px; }
.scene-meta { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.scene-desc { color: var(--text-muted); font-size: 12px; max-width: 300px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
</style>
