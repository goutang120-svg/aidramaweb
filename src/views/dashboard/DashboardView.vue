<template>
  <div class="dashboard">
    <!-- 统计卡片 -->
    <el-row :gutter="16" class="stats-row">
      <el-col v-for="stat in projectStats" :key="stat.label" :xs="24" :sm="12" :md="6" :lg="4">
        <div class="stat-card" :style="{ borderTopColor: stat.color }">
          <div class="stat-value">{{ stat.value }}</div>
          <div class="stat-label">{{ stat.label }}</div>
          <div class="stat-icon" :style="{ color: stat.color }">
            <el-icon :size="28"><component :is="stat.icon" /></el-icon>
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- 资源统计 -->
    <el-row :gutter="16" class="section-title-row">
      <el-col :span="24"><h3 class="section-title">资产统计</h3></el-col>
    </el-row>

    <el-row :gutter="16" class="stats-row">
      <el-col v-for="stat in assetStats" :key="stat.label" :xs="24" :sm="12" :md="6" :lg="4">
        <div class="stat-card" :style="{ borderTopColor: stat.color }">
          <div class="stat-value">{{ stat.value }}</div>
          <div class="stat-label">{{ stat.label }}</div>
          <div class="stat-icon" :style="{ color: stat.color }">
            <el-icon :size="28"><component :is="stat.icon" /></el-icon>
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- 最近项目 -->
    <el-row :gutter="16" class="section-title-row">
      <el-col :span="24">
        <h3 class="section-title">最近项目</h3>
      </el-col>
    </el-row>

    <div v-loading="loading.projects" class="recent-grid">
      <div v-if="recentProjects.length === 0 && !loading.projects" class="empty-hint">
        <el-empty description="暂无项目数据" />
      </div>
      <el-row v-else :gutter="16">
        <el-col v-for="project in recentProjects" :key="project.id" :xs="24" :sm="12" :md="8" :lg="6">
          <el-card shadow="hover" class="project-card" @click="goProject(project.id)">
            <div class="project-card-name">{{ project.name }}</div>
            <div class="project-card-meta">
              <el-tag :color="statusColor(project.status)" effect="dark" size="small" style="border-color: transparent;">
                {{ statusLabel(project.status) }}
              </el-tag>
              <span class="project-card-time">{{ formatDate(project.updatedAt) }}</span>
            </div>
            <el-progress
              :percentage="project.progress"
              :color="progressColor(project.progress)"
              :stroke-width="6"
              style="margin-top: 8px;"
            />
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 最近资源 -->
    <el-row :gutter="16" class="section-title-row">
      <el-col :span="24"><h3 class="section-title">最近资源</h3></el-col>
    </el-row>

    <div v-loading="loading.assets" class="assets-grid">
      <div v-if="recentAssets.length === 0 && !loading.assets" class="empty-hint">
        <el-empty description="暂无资源数据" />
      </div>
      <el-row v-else :gutter="16">
        <el-col v-for="asset in recentAssets" :key="asset.id" :xs="12" :sm="8" :md="6" :lg="4">
          <div class="asset-card">
            <div class="asset-thumb">
              <img v-if="asset.previewUrl" :src="asset.previewUrl" :alt="asset.assetName" class="asset-img" />
              <el-icon v-else :size="36" color="#4a4a6e"><PictureFilled /></el-icon>
            </div>
            <div class="asset-info">
              <div class="asset-name" :title="asset.assetName">{{ asset.assetName }}</div>
              <div class="asset-type-tag">
                <el-tag size="small" :type="assetTypeTagType(asset.assetType)">
                  {{ assetTypeLabel(asset.assetType) }}
                </el-tag>
              </div>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  DataAnalysis, Folder, UserFilled, VideoCameraFilled,
  Camera, PictureFilled, Headset, VideoCamera
} from '@element-plus/icons-vue'
import { getDashboardStats, getRecentProjects, getRecentAssets } from '@/api/index'
import type { Project, AssetVO } from '@/types'

const router = useRouter()

const loading = reactive({
  stats: false,
  projects: false,
  assets: false,
})

const projectStats = ref([
  { label: '项目总数', value: 0, color: '#e8a850', icon: Folder },
  { label: '进行中', value: 0, color: '#67c23a', icon: DataAnalysis },
  { label: '已完成', value: 0, color: '#409eff', icon: DataAnalysis },
  { label: '人物', value: 0, color: '#e040fb', icon: UserFilled },
  { label: '场景', value: 0, color: '#ff9800', icon: PictureFilled },
  { label: '分集', value: 0, color: '#00bcd4', icon: VideoCameraFilled },
])

const assetStats = ref([
  { label: '镜头', value: 0, color: '#ff5722', icon: Camera },
  { label: '图片', value: 0, color: '#9c27b0', icon: PictureFilled },
  { label: '视频', value: 0, color: '#3f51b5', icon: VideoCamera },
  { label: '音频', value: 0, color: '#009688', icon: Headset },
])

const recentProjects = ref<Project[]>([])
const recentAssets = ref<AssetVO[]>([])

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

function progressColor(progress: number): string {
  if (progress >= 100) return '#67c23a'
  if (progress >= 50) return '#e8a850'
  return '#409eff'
}

function assetTypeLabel(assetType: string): string {
  const map: Record<string, string> = {
    IMAGE: '图片',
    VIDEO: '视频',
    AUDIO: '音频',
    DOCUMENT: '文档',
  }
  return map[assetType] || assetType
}

function assetTypeTagType(assetType: string): 'success' | 'warning' | 'danger' | 'info' | '' {
  const map: Record<string, 'success' | 'warning' | 'danger' | 'info' | ''> = {
    IMAGE: '',
    VIDEO: 'danger',
    AUDIO: 'warning',
    DOCUMENT: 'info',
  }
  return map[assetType] || 'info'
}

function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function goProject(id: number) {
  router.push(`/projects/${id}`)
}

async function fetchStats() {
  loading.stats = true
  try {
    const res = await getDashboardStats()
    const data = res.data.data as Record<string, number>
    projectStats.value[0].value = data.totalProjects ?? 0
    projectStats.value[1].value = data.inProgressProjects ?? 0
    projectStats.value[2].value = data.completedProjects ?? 0
    projectStats.value[3].value = data.totalCharacters ?? 0
    projectStats.value[4].value = data.totalScenes ?? 0
    projectStats.value[5].value = data.totalEpisodes ?? 0
    assetStats.value[0].value = data.totalShots ?? 0
    assetStats.value[1].value = data.totalImages ?? 0
    assetStats.value[2].value = data.totalVideos ?? 0
    assetStats.value[3].value = data.totalAudios ?? 0
  } catch {
    // handled by interceptor
  } finally {
    loading.stats = false
  }
}

async function fetchRecentProjects() {
  loading.projects = true
  try {
    const res = await getRecentProjects()
    recentProjects.value = res.data.data as Project[]
  } catch {
    // handled by interceptor
  } finally {
    loading.projects = false
  }
}

async function fetchRecentAssets() {
  loading.assets = true
  try {
    const res = await getRecentAssets()
    recentAssets.value = res.data.data as AssetVO[]
  } catch {
    // handled by interceptor
  } finally {
    loading.assets = false
  }
}

onMounted(() => {
  fetchStats()
  fetchRecentProjects()
  fetchRecentAssets()
})
</script>

<style scoped>
.dashboard {
  padding: 4px;
}

.section-title-row {
  margin-top: 12px;
  margin-bottom: 12px;
}

.section-title {
  color: var(--text-secondary);
  font-size: 16px;
  font-weight: 600;
  padding-left: 4px;
  border-left: 3px solid var(--primary-color);
  padding: 2px 0 2px 10px;
}

/* 统计卡片 */
.stats-row {
  margin-bottom: 4px;
}

.stat-card {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: 18px 16px;
  margin-bottom: 14px;
  position: relative;
  border: 1px solid var(--border-color);
  border-top: 3px solid transparent;
  transition: transform 0.2s, box-shadow 0.2s, border-color 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
  border-color: var(--primary-color);
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: var(--primary-color);
  line-height: 1.2;
}

.stat-label {
  font-size: 13px;
  color: var(--text-muted);
  margin-top: 4px;
}

.stat-icon {
  position: absolute;
  top: 14px;
  right: 14px;
  opacity: 0.4;
}

/* 项目卡片 */
.recent-grid {
  min-height: 120px;
}

.project-card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  margin-bottom: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.project-card:hover {
  transform: translateY(-2px);
  border-color: var(--primary-color);
  box-shadow: var(--shadow-glow);
}

.project-card-name {
  color: var(--text-secondary);
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.project-card-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.project-card-time {
  font-size: 12px;
  color: var(--text-muted);
}

/* 资源卡片 */
.assets-grid {
  min-height: 120px;
}

.asset-card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  overflow: hidden;
  margin-bottom: 14px;
  transition: all 0.3s ease;
}

.asset-card:hover {
  transform: translateY(-2px);
  border-color: var(--primary-color);
  box-shadow: var(--shadow-glow);
}

.asset-thumb {
  width: 100%;
  height: 120px;
  background: var(--bg-input);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.asset-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.asset-info {
  padding: 10px 12px;
}

.asset-name {
  font-size: 13px;
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 6px;
}

.asset-type-tag {
  display: flex;
}

.empty-hint {
  padding: 40px 0;
}
</style>
