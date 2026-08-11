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
              :percentage="project.progress"
              :color="progressColor(project.progress)"
              :stroke-width="8"
              style="flex: 1; margin-right: 8px;"
            />
            <span class="progress-text">{{ project.progress }}%</span>
          </div>
        </el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ formatDate(project.createdAt) }}</el-descriptions-item>
        <el-descriptions-item label="更新时间" :span="2">{{ formatDate(project.updatedAt) }}</el-descriptions-item>
        <el-descriptions-item v-if="project.summary" label="项目摘要" :span="3">
          {{ project.summary }}
        </el-descriptions-item>
      </el-descriptions>
    </el-card>

    <!-- 统计卡片行 -->
    <el-row :gutter="16" class="stats-row" v-if="project.id">
      <el-col v-for="stat in detailStats" :key="stat.label" :xs="12" :sm="8" :md="4">
        <div class="stat-card" :style="{ borderTopColor: stat.color }">
          <div class="stat-value">{{ stat.value }}</div>
          <div class="stat-label">{{ stat.label }}</div>
        </div>
      </el-col>
    </el-row>

    <!-- 分集进度 -->
    <el-card v-if="project.id" class="episode-card" shadow="never">
      <template #header>
        <div class="episode-card-header">
          <span>分集进度</span>
          <span class="episode-subtitle">共 {{ episodes.length }} 集</span>
        </div>
      </template>

      <div v-if="episodes.length === 0" class="empty-hint">
        <el-empty description="暂无分集数据" />
      </div>

      <div v-else class="episode-list">
        <div v-for="ep in episodes" :key="ep.id" class="episode-item">
          <div class="episode-info">
            <span class="episode-label">第{{ ep.episodeNumber }}集</span>
            <span class="episode-title">{{ ep.title }}</span>
            <el-tag
              :color="statusColor(ep.status)"
              effect="dark"
              size="small"
              style="border-color: transparent;"
            >
              {{ statusLabel(ep.status) }}
            </el-tag>
          </div>
          <el-progress
            :percentage="ep.progress"
            :color="progressColor(ep.progress)"
            :stroke-width="6"
            style="flex: 1; max-width: 280px; min-width: 120px;"
          />
          <span class="episode-progress-text">{{ ep.progress }}%</span>
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
import { ref, reactive, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Edit } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import { getProject, updateProject } from '@/api/index'
import type { Project } from '@/types'

interface EpisodeRow {
  id: number
  episodeNumber: number
  title: string
  status: string
  progress: number
}

const route = useRoute()
const loading = ref(false)
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

const detailStats = ref([
  { label: '人物', value: 0, color: '#e040fb' },
  { label: '场景', value: 0, color: '#ff9800' },
  { label: '分季', value: 0, color: '#00bcd4' },
  { label: '分集', value: 0, color: '#00bcd4' },
  { label: '镜头', value: 0, color: '#ff5722' },
  { label: '资源', value: 0, color: '#9c27b0' },
])

// Simulated episodes data — in production this would come from an API
const episodes = ref<EpisodeRow[]>([
  { id: 1, episodeNumber: 1, title: '序章', status: 'COMPLETED', progress: 100 },
  { id: 2, episodeNumber: 2, title: '相遇', status: 'IN_PROGRESS', progress: 65 },
  { id: 3, episodeNumber: 3, title: '冲突', status: 'IN_PROGRESS', progress: 30 },
  { id: 4, episodeNumber: 4, title: '转折', status: 'NOT_STARTED', progress: 0 },
  { id: 5, episodeNumber: 5, title: '高潮', status: 'NOT_STARTED', progress: 0 },
])

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    COMPLETED: '已完成',
    IN_PROGRESS: '进行中',
    NOT_STARTED: '未开始',
  }
  return map[status] || status
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

    // Set simulated stats based on project progress
    detailStats.value[0].value = Math.floor(Math.random() * 20) + 2
    detailStats.value[1].value = Math.floor(Math.random() * 15) + 1
    detailStats.value[2].value = 1
    detailStats.value[3].value = episodes.value.length
    detailStats.value[4].value = episodes.value.length * 4 + Math.floor(Math.random() * 10)
    detailStats.value[5].value = Math.floor(Math.random() * 50) + 10
  } catch {
    // handled by interceptor
  } finally {
    loading.value = false
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
  background: #1a1a2e;
  border: 1px solid #2a2a3e;
  border-radius: 8px;
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
  color: #c0c0d0;
  font-size: 20px;
  font-weight: 700;
  margin: 0;
}

.project-code {
  color: #5a5a7e;
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
  color: #c0c0d0;
  font-weight: 600;
  min-width: 40px;
  text-align: right;
}

/* 统计卡片 */
.stats-row {
  margin-bottom: 20px;
}

.stat-card {
  background: #1a1a2e;
  border-radius: 8px;
  padding: 18px 16px;
  margin-bottom: 14px;
  border: 1px solid #2a2a3e;
  border-top: 3px solid transparent;
  text-align: center;
  transition: transform 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
}

.stat-value {
  font-size: 26px;
  font-weight: 700;
  color: #e8a850;
  line-height: 1.2;
}

.stat-label {
  font-size: 13px;
  color: #808090;
  margin-top: 4px;
}

/* 分集进度 */
.episode-card {
  background: #1a1a2e;
  border: 1px solid #2a2a3e;
  border-radius: 8px;
}

.episode-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #c0c0d0;
  font-weight: 600;
}

.episode-subtitle {
  font-size: 13px;
  color: #808090;
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
  padding: 10px 0;
  border-bottom: 1px solid #22223a;
}

.episode-item:last-child {
  border-bottom: none;
}

.episode-info {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 220px;
}

.episode-label {
  color: #e8a850;
  font-weight: 600;
  font-size: 13px;
  white-space: nowrap;
}

.episode-title {
  color: #c0c0d0;
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 120px;
}

.episode-progress-text {
  font-size: 13px;
  color: #808090;
  min-width: 36px;
  text-align: right;
}

.empty-hint {
  padding: 30px 0;
}
</style>
