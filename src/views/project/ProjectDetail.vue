<template>
  <div class="project-detail" v-loading="loading">
    <!-- 面包屑 -->
    <div class="breadcrumb-bar">
      <el-breadcrumb separator="/">
        <el-breadcrumb-item :to="{ path: '/dashboard' }">首页</el-breadcrumb-item>
        <el-breadcrumb-item :to="{ path: '/projects' }">项目管理</el-breadcrumb-item>
        <el-breadcrumb-item>{{ project.name || '项目详情' }}</el-breadcrumb-item>
      </el-breadcrumb>
    </div>

    <!-- 项目信息卡片 -->
    <el-card v-if="project.id" class="info-card" shadow="never">
      <div class="info-header">
        <div class="info-left">
          <h2 class="project-name">{{ project.name }}</h2>
          <span class="project-code">{{ project.projectCode }}</span>
        </div>
        <el-button type="primary" @click="openEditDialog">
          <el-icon><Edit /></el-icon>
          编辑
        </el-button>
      </div>

      <el-descriptions :column="3" border class="info-descriptions">
        <el-descriptions-item label="项目类型">
          <el-tag :color="typeColor(project.type)" effect="dark" size="small" style="border-color: transparent;">
            {{ typeLabel(project.type) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="项目状态">
          <el-tag :color="statusColor(project.status)" effect="dark" size="small" style="border-color: transparent;">
            {{ statusLabel(project.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="整体进度">
          <div class="progress-with-text">
            <el-progress
              :percentage="projectProgress"
              :color="progressColor(projectProgress)"
              :stroke-width="8"
              style="flex: 1; margin-right: 8px;"
            />
            <span class="progress-text">{{ projectProgress }}%</span>
          </div>
        </el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ formatDate(project.createdAt) }}</el-descriptions-item>
        <el-descriptions-item label="更新时间" :span="2">{{ formatDate(project.updatedAt) }}</el-descriptions-item>
        <el-descriptions-item v-if="project.summary" label="项目摘要" :span="3">
          {{ project.summary }}
        </el-descriptions-item>
      </el-descriptions>
    </el-card>

    <!-- 多维度进度分解 -->
    <ProgressBreakdown
      v-if="progressData"
      :overall="progressData.overallProgress"
      overall-label="综合进度"
      title="项目综合进度"
      :subtitle="`分集 55% · 故事圣经 15% · 人物 15% · 场景 15%`"
      :dimensions="projectDimensions"
      class="project-progress"
    />

    <!-- 统计卡片行 - 可点击跳转 -->
    <el-row :gutter="16" class="stats-row" v-if="project.id">
      <el-col :xs="12" :sm="8" :md="4">
        <div class="stat-card" style="border-top-color: #e040fb" @click="$router.push('/characters')">
          <div class="stat-value">{{ stats.characters }}</div>
          <div class="stat-label">人物</div>
        </div>
      </el-col>
      <el-col :xs="12" :sm="8" :md="4">
        <div class="stat-card" style="border-top-color: #ff9800" @click="$router.push('/scenes')">
          <div class="stat-value">{{ stats.scenes }}</div>
          <div class="stat-label">场景</div>
        </div>
      </el-col>
      <el-col :xs="12" :sm="8" :md="4">
        <div class="stat-card" style="border-top-color: #00bcd4" @click="$router.push('/seasons')">
          <div class="stat-value">{{ stats.seasons }}</div>
          <div class="stat-label">分季</div>
        </div>
      </el-col>
      <el-col :xs="12" :sm="8" :md="4">
        <div class="stat-card" style="border-top-color: #3f51b5" @click="$router.push('/episodes')">
          <div class="stat-value">{{ stats.episodes }}</div>
          <div class="stat-label">分集</div>
        </div>
      </el-col>
      <el-col :xs="12" :sm="8" :md="4">
        <div class="stat-card" style="border-top-color: #ff5722" @click="$router.push('/shots')">
          <div class="stat-value">{{ stats.shots }}</div>
          <div class="stat-label">镜头</div>
        </div>
      </el-col>
      <el-col :xs="12" :sm="8" :md="4">
        <div class="stat-card" style="border-top-color: #9c27b0" @click="$router.push('/assets')">
          <div class="stat-value">{{ stats.assets }}</div>
          <div class="stat-label">资源</div>
        </div>
      </el-col>
    </el-row>

    <!-- 分集进度 -->
    <el-card v-if="project.id" class="episode-card" shadow="never">
      <template #header>
        <div class="episode-card-header">
          <span>分集进度</span>
          <div class="header-right">
            <span class="episode-subtitle">共 {{ episodes.length }} 集</span>
            <el-button size="small" type="primary" plain @click="$router.push('/seasons')">
              <el-icon><Plus /></el-icon> 管理分季
            </el-button>
          </div>
        </div>
      </template>

      <div v-if="loadingEpisodes" class="loading-wrap">
        <el-icon class="loading-spin"><Loading /></el-icon>
      </div>
      <div v-else-if="episodes.length === 0" class="empty-hint">
        <el-empty description="暂无分集数据，请先添加分季">
          <el-button type="primary" @click="$router.push('/seasons')">去添加分季</el-button>
        </el-empty>
      </div>

      <div v-else class="episode-list">
        <div v-for="ep in episodes" :key="ep.id" class="episode-item" @click="$router.push(`/episodes/${ep.id}`)">
          <div class="episode-info">
            <span class="episode-label">第{{ ep.episodeNo }}集</span>
            <span class="episode-title">{{ ep.title || '未命名' }}</span>
            <el-tag
              :color="statusColor(ep.status || ep.scriptStatus || '')"
              effect="dark"
              size="small"
              style="border-color: transparent;"
            >
              {{ statusLabel(ep.status || ep.scriptStatus || '') }}
            </el-tag>
          </div>
          <el-progress
            :percentage="ep.progress || 0"
            :color="progressColor(ep.progress || 0)"
            :stroke-width="6"
            style="flex: 1; max-width: 280px; min-width: 120px;"
          />
          <span class="episode-progress-text">{{ ep.progress || 0 }}%</span>
        </div>
      </div>
    </el-card>

    <!-- 编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      title="编辑项目"
      width="520px"
      destroy-on-close
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="formRules"
        label-position="top"
      >
        <el-form-item label="项目名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入项目名称" />
        </el-form-item>
        <el-form-item label="项目类型" prop="type">
          <el-select v-model="form.type" placeholder="请选择项目类型" style="width: 100%;">
            <el-option label="漫画" value="MANHUA" />
            <el-option label="动画" value="ANIMATION" />
            <el-option label="短剧" value="SHORT_DRAMA" />
            <el-option label="其他" value="OTHER" />
          </el-select>
        </el-form-item>
        <el-form-item label="项目状态" prop="status">
          <el-select v-model="form.status" placeholder="请选择状态" style="width: 100%;">
            <el-option label="未开始" value="NOT_STARTED" />
            <el-option label="进行中" value="IN_PROGRESS" />
            <el-option label="已完成" value="COMPLETED" />
          </el-select>
        </el-form-item>
        <el-form-item label="项目摘要" prop="summary">
          <el-input
            v-model="form.summary"
            type="textarea"
            :rows="3"
            placeholder="请输入项目摘要（可选）"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">
          保存
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Edit, Plus, Loading } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import { getProject, updateProject, listAll, listCharacters, listScenes, listProps, getAssets, getProjectProgress } from '@/api/index'
import type { Project } from '@/types'
import type { ProjectProgressVO } from '@/api/index'
import ProgressBreakdown from '@/components/ProgressBreakdown.vue'

interface EpisodeRow {
  id: number
  episodeNo: number
  title: string
  status?: string
  scriptStatus?: string
  progress: number
}

const route = useRoute()
const loading = ref(false)
const loadingEpisodes = ref(false)
const submitting = ref(false)
const dialogVisible = ref(false)
const formRef = ref<FormInstance>()

const project = ref<Project>({} as Project)

const form = reactive({
  name: '',
  type: '',
  status: '',
  summary: '',
})

const formRules: FormRules = {
  name: [{ required: true, message: '请输入项目名称', trigger: 'blur' }],
  type: [{ required: true, message: '请选择项目类型', trigger: 'change' }],
}

const stats = ref({
  characters: 0,
  scenes: 0,
  seasons: 0,
  episodes: 0,
  shots: 0,
  assets: 0,
  props: 0,
})

const episodes = ref<EpisodeRow[]>([])
const progressData = ref<ProjectProgressVO | null>(null)

const projectDimensions = computed(() => {
  const p = progressData.value
  if (!p) return []
  return [
    { key: 'episode',   label: '分集平均',   value: p.episodeProgress,   weight: 55,
      caption: `${p.completedEpisodes}/${p.totalEpisodes} 集已完成 · 镜头 ${p.completedShots}/${p.totalShots}` },
    { key: 'story',     label: '故事圣经',   value: p.storyProgress,     weight: 15,
      caption: `${p.completedStoryBibles}/${p.totalStoryBibles} 条已完成` },
    { key: 'character', label: '人物',       value: p.characterProgress, weight: 15,
      caption: `${p.completedCharacters}/${p.totalCharacters} 位人物已完成` },
    { key: 'scene',     label: '场景',       value: p.sceneProgress,     weight: 15,
      caption: `${p.totalScenes} 个场景` },
    { key: 'prop',      label: '道具',       value: p.propProgress,
      caption: `${p.totalProps} 个道具（不参与总权重）` },
    { key: 'shot-avg',  label: '镜头制作平均', value: p.shotProgress,
      caption: '来自各分集镜头完成度' },
  ]
})

const projectProgress = computed(() => {
  if (progressData.value) return progressData.value.overallProgress
  const { characters, scenes, episodes: eps, shots } = stats.value
  if (!characters && !scenes && !eps && !shots) return 0
  if (stats.value.episodes > 0 && stats.value.shots > 0) return 50
  if (stats.value.episodes > 0 || stats.value.shots > 0) return 25
  return 10
})

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    COMPLETED: '已完成',
    IN_PROGRESS: '进行中',
    NOT_STARTED: '未开始',
  }
  return map[status] || status || '未开始'
}

function statusColor(status: string): string {
  const map: Record<string, string> = {
    COMPLETED: '#67c23a',
    IN_PROGRESS: '#e8a850',
    NOT_STARTED: '#909399',
  }
  return map[status] || '#909399'
}

function typeLabel(type: string): string {
  const map: Record<string, string> = {
    MANHUA: '漫画',
    ANIMATION: '动画',
    SHORT_DRAMA: '短剧',
    OTHER: '其他',
  }
  return map[type] || type
}

function typeColor(type: string): string {
  const map: Record<string, string> = {
    MANHUA: '#e8a850',
    ANIMATION: '#409eff',
    SHORT_DRAMA: '#67c23a',
    OTHER: '#909399',
  }
  return map[type] || '#909399'
}

function progressColor(progress: number): string {
  if (progress >= 100) return '#67c23a'
  if (progress >= 50) return '#e8a850'
  return '#409eff'
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

async function fetchProject() {
  const id = Number(route.params.id)
  if (!id) return

  loading.value = true
  try {
    const res = await getProject(id)
    project.value = res.data.data as Project
  } catch {
    // handled by interceptor
  } finally {
    loading.value = false
  }
}

async function fetchProgress() {
  const id = Number(route.params.id)
  if (!id) return
  try {
    const res = await getProjectProgress(id)
    progressData.value = res.data.data as ProjectProgressVO
  } catch { /* ignore */ }
}

async function fetchStats() {
  const id = Number(route.params.id)
  if (!id) return

  try {
    // Fetch counts in parallel
    const [charRes, sceneRes, propRes, assetRes] = await Promise.allSettled([
      listCharacters(id, { page: 1, pageSize: 1 }),
      listScenes(id, { page: 1, pageSize: 1 }),
      listProps(id, { page: 1, pageSize: 1 }),
      getAssets({ projectId: id, page: 1, pageSize: 1 }),
    ])

    if (charRes.status === 'fulfilled') {
      const data = (charRes.value as any).data?.data
      stats.value.characters = data?.total || data?.records?.length || 0
    }
    if (sceneRes.status === 'fulfilled') {
      const data = (sceneRes.value as any).data?.data
      stats.value.scenes = data?.total || data?.records?.length || 0
    }
    if (propRes.status === 'fulfilled') {
      const data = (propRes.value as any).data?.data
      stats.value.props = data?.total || data?.records?.length || 0
    }
    if (assetRes.status === 'fulfilled') {
      const data = (assetRes.value as any).data?.data
      stats.value.assets = data?.total || data?.records?.length || 0
    }

    // Fetch seasons
    const seasonsRes = await listAll('/projects/seasons', { projectId: id, page: 1, pageSize: 100 })
    const seasonsData = (seasonsRes as any).data?.data?.records || []
    stats.value.seasons = seasonsData.length

    // Fetch episodes from all seasons and calculate shots
    loadingEpisodes.value = true
    let totalEpisodes = 0
    let totalShots = 0
    const allEpisodes: EpisodeRow[] = []

    for (const season of seasonsData) {
      try {
        const epRes = await listAll('/seasons/episodes', { seasonId: season.id, page: 1, pageSize: 100 })
        const epData = (epRes as any).data?.data?.records || []
        totalEpisodes += epData.length

        for (const ep of epData) {
          allEpisodes.push({
            id: ep.id,
            episodeNo: ep.episodeNo || ep.episodeNumber || 0,
            title: ep.title || '',
            status: ep.status,
            scriptStatus: ep.scriptStatus,
            progress: ep.progress || 0,
          })

          // Fetch shot count for each episode
          try {
            const shotRes = await listAll('/episodes/shots', { episodeId: ep.id, page: 1, pageSize: 1 })
            const shotData = (shotRes as any).data?.data
            totalShots += shotData?.total || (shotData?.records?.length || 0)
          } catch { /* ignore */ }
        }
      } catch { /* continue */ }
    }

    stats.value.episodes = totalEpisodes
    stats.value.shots = totalShots
    episodes.value = allEpisodes
  } catch (e) {
    console.error('Failed to fetch project stats:', e)
  } finally {
    loadingEpisodes.value = false
  }
}

function openEditDialog() {
  form.name = project.value.name
  form.type = project.value.type
  form.status = project.value.status
  form.summary = project.value.summary || ''
  dialogVisible.value = true
}

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    const data: Record<string, unknown> = {
      name: form.name,
      type: form.type,
      status: form.status,
      summary: form.summary,
    }
    await updateProject(project.value.id, data)
    ElMessage.success('项目更新成功')
    dialogVisible.value = false
    fetchProject()
  } catch {
    // handled by interceptor
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  fetchProject()
  fetchProgress()
  fetchStats()
})
</script>

<style scoped>
.project-detail {
  padding: 4px;
}

/* 面包屑 */
.breadcrumb-bar {
  margin-bottom: 16px;
}

/* 项目信息卡片 */
.info-card {
  background: var(--bg-white);
  border: 1px solid var(--border-hairline);
  border-radius: var(--radius-lg);
  margin-bottom: 20px;
}

.info-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
}

.info-left {
  display: flex;
  align-items: baseline;
  gap: 12px;
}

.project-name {
  color: var(--text-ink);
  font-size: 20px;
  font-weight: 700;
  margin: 0;
}

.project-code {
  color: var(--text-muted);
  font-size: 13px;
  font-family: monospace;
}

.info-descriptions {
  margin-top: 8px;
}

.progress-with-text {
  display: flex;
  align-items: center;
}

.progress-text {
  font-size: 13px;
  color: var(--text-secondary);
  font-weight: 600;
  min-width: 40px;
  text-align: right;
}

.project-progress {
  margin: 20px 0;
}

/* 统计卡片 */
.stats-row {
  margin-bottom: 20px;
}

.stat-card {
  background: var(--bg-white);
  border-radius: var(--radius-lg);
  padding: 18px 16px;
  margin-bottom: 14px;
  border: 1px solid var(--border-hairline);
  border-top: 3px solid transparent;
  text-align: center;
  transition: all 0.3s ease;
  cursor: pointer;
}

.stat-card:hover {
  transform: translateY(-2px);
  border-color: var(--primary-color);
  box-shadow: var(--shadow-glow);
}

.stat-value {
  font-size: 26px;
  font-weight: 700;
  color: var(--primary-color);
  line-height: 1.2;
}

.stat-label {
  font-size: 13px;
  color: var(--text-muted);
  margin-top: 4px;
}

/* 分集进度 */
.episode-card {
  background: var(--bg-white);
  border: 1px solid var(--border-hairline);
  border-radius: var(--radius-lg);
}

.episode-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: var(--text-ink);
  font-weight: 600;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.episode-subtitle {
  font-size: 13px;
  color: var(--text-muted);
  font-weight: 400;
}

.episode-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.episode-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 10px 12px;
  background: var(--bg-white);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.3s ease;
}

.episode-item:hover {
  background: var(--bg-hover);
}

.episode-info {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 220px;
}

.episode-label {
  color: var(--primary-color);
  font-weight: 600;
  font-size: 13px;
  white-space: nowrap;
}

.episode-title {
  color: var(--text-secondary);
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 120px;
}

.episode-progress-text {
  font-size: 13px;
  color: var(--text-muted);
  min-width: 36px;
  text-align: right;
}

.empty-hint {
  padding: 30px 0;
}

.loading-wrap {
  display: flex;
  justify-content: center;
  padding: 40px;
}

.loading-spin {
  font-size: 24px;
  color: var(--primary-color);
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
