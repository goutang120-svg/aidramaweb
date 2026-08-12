<template>
  <div class="episode-list">
    <div class="page-header">
      <div class="page-title-group">
        <el-icon class="title-icon"><Film /></el-icon>
        <h2 class="page-title">分集管理</h2>
        <span class="title-badge">Episodes</span>
        <span v-if="episodes.length" class="episode-count">{{ episodes.length }} 集</span>
      </div>
      <div class="header-actions">
        <el-select
          v-model="selectedSeasonId"
          placeholder="选择分季"
          class="season-select"
          @change="handleSeasonChange"
          clearable
        >
          <el-option
            v-for="s in seasons"
            :key="s.id"
            :label="`第${s.seasonNo}季 ${s.name}`"
            :value="s.id"
          />
        </el-select>
        <el-button class="btn-create" type="primary" @click="openAddDialog" :disabled="!selectedSeasonId">
          <el-icon><Plus /></el-icon> 添加分集
        </el-button>
      </div>
    </div>

    <div v-if="!projectId" class="empty-state">
      <div class="empty-icon-wrap"><el-icon size="44"><Folder /></el-icon></div>
      <p class="empty-title">请先选择项目</p>
      <p class="empty-sub">在顶栏切换项目后即可管理分集内容</p>
    </div>

    <div v-else-if="!loading && seasons.length === 0" class="empty-state">
      <div class="empty-icon-wrap"><el-icon size="44"><Collection /></el-icon></div>
      <p class="empty-title">暂无分季</p>
      <p class="empty-sub">请先创建分季，再开始管理分集</p>
    </div>

    <div v-else-if="!selectedSeasonId" class="empty-state compact-empty">
      <div class="empty-icon-wrap"><el-icon size="44"><Collection /></el-icon></div>
      <p class="empty-title">请选择分季</p>
      <p class="empty-sub">选择一个分季后即可查看和编辑分集</p>
    </div>

    <template v-else>
      <div class="filter-bar">
        <div class="filter-heading"><el-icon><Filter /></el-icon><span>筛选分集</span></div>
        <el-input v-model="searchKeyword" clearable placeholder="搜索标题、集数或简介" class="search-input">
          <template #prefix><el-icon><Search /></el-icon></template>
        </el-input>
        <el-select v-model="statusFilter" class="status-select" placeholder="状态（任一环节）" clearable>
          <el-option v-for="status in workflowStatuses" :key="status" :label="`任一环节：${statusLabel(status)}`" :value="status" />
        </el-select>
        <span v-if="hasFilters" class="filter-hint">五个工作流环节中任一环节匹配即可</span>
      </div>

      <div v-loading="loading" class="episode-grid">
        <div v-if="episodes.length === 0 && !loading" class="empty-state panel-empty">
          <div class="empty-icon-wrap"><el-icon size="40"><Document /></el-icon></div>
          <p class="empty-title">暂无分集数据</p>
          <p class="empty-sub">点击右上角“添加分集”开始创建本季内容</p>
        </div>
        <div v-else-if="filteredEpisodes.length === 0 && !loading" class="empty-state panel-empty">
          <div class="empty-icon-wrap"><el-icon size="40"><Search /></el-icon></div>
          <p class="empty-title">没有匹配的分集</p>
          <p class="empty-sub">请尝试更换关键词或清除筛选条件</p>
          <el-button size="small" plain @click="clearFilters">清除筛选</el-button>
        </div>
        <el-row v-else :gutter="16">
          <el-col v-for="ep in filteredEpisodes" :key="ep.id" :xs="24" :sm="12" :md="8" :lg="6">
            <el-card shadow="hover" class="episode-card" @click="goDetail(ep)">
              <div class="ep-header">
                <span class="ep-no">#{{ ep.episodeNo }}</span>
                <span class="ep-title">{{ ep.title }}</span>
              </div>
              <div v-if="ep.summary" class="ep-summary">{{ ep.summary }}</div>
              <div class="ep-progress">
                <div class="progress-meta"><span>整体进度</span><strong>{{ ep.progress || 0 }}%</strong></div>
                <el-progress :percentage="ep.progress || 0" :color="progressColor(ep.progress)" :stroke-width="6" :show-text="false" />
              </div>
              <div class="ep-status-tags">
                <div v-for="item in workflowItems" :key="item.key" class="status-row">
                  <span class="status-label">{{ item.label }}</span>
                  <el-tag :color="statusColor(ep[item.key])" effect="dark" size="small" class="status-tag">
                    {{ statusLabel(ep[item.key]) }}
                  </el-tag>
                </div>
              </div>
              <div class="ep-actions" @click.stop>
                <el-button text size="small" @click="openEditDialog(ep)">编辑</el-button>
                <el-button text size="small" type="danger" @click="handleDelete(ep)">删除</el-button>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>
    </template>

    <!-- 添加/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑分集' : '添加分集'"
      width="560px"
      class="dark-dialog"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="集数" prop="episodeNo">
          <el-input-number v-model="form.episodeNo" :min="1" style="width:100%" />
        </el-form-item>
        <el-form-item label="标题" prop="title">
          <el-input v-model="form.title" placeholder="分集标题" />
        </el-form-item>
        <el-form-item label="简介" prop="summary">
          <el-input v-model="form.summary" type="textarea" :rows="3" placeholder="分集简介" />
        </el-form-item>
        <el-form-item label="所属分季" prop="seasonId">
          <el-input-number v-model="form.seasonId" :min="1" style="width:100%" disabled />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Film, Plus, Folder, Collection, Search, Filter, Document } from '@element-plus/icons-vue'
import { listAll, createOne, updateOne, deleteOne } from '@/api/index'
import { useAppStore } from '@/stores/app'

const router = useRouter()
const route = useRoute()
const appStore = useAppStore()
const projectId = computed(() => appStore.currentProjectId)

const loading = ref(false)
const submitting = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const editingId = ref<number | null>(null)
const selectedSeasonId = ref<number | null>(null)
const searchKeyword = ref('')
const statusFilter = ref('')

const seasons = ref<any[]>([])
const episodes = ref<any[]>([])

const workflowItems = [
  { key: 'scriptStatus', label: '剧本' },
  { key: 'storyboardStatus', label: '分镜' },
  { key: 'assetStatus', label: '资产' },
  { key: 'videoStatus', label: '视频' },
  { key: 'postStatus', label: '后期' },
]
const workflowStatuses = ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED']

const filteredEpisodes = computed(() => {
  const keyword = searchKeyword.value.trim().toLowerCase()
  return episodes.value.filter((ep: any) => {
    const matchesKeyword = !keyword || [ep.title, ep.episodeNo, ep.summary]
      .some(value => String(value ?? '').toLowerCase().includes(keyword))
    const matchesStatus = !statusFilter.value || workflowItems.some(item => ep[item.key] === statusFilter.value)
    return matchesKeyword && matchesStatus
  })
})
const hasFilters = computed(() => Boolean(searchKeyword.value.trim() || statusFilter.value))

function clearFilters() {
  searchKeyword.value = ''
  statusFilter.value = ''
}

const formRef = ref()
const form = reactive({
  episodeNo: 1,
  title: '',
  summary: '',
  seasonId: null as number | null,
})

const rules = {
  episodeNo: [{ required: true, message: '请输入集数', trigger: 'blur' }],
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
}

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    NOT_STARTED: '未开始',
    IN_PROGRESS: '进行中',
    COMPLETED: '已完成',
  }
  return map[status] || status || '未开始'
}

function statusColor(status: string): string {
  const map: Record<string, string> = {
    NOT_STARTED: '#909399',
    IN_PROGRESS: '#e8a850',
    COMPLETED: '#67c23a',
  }
  return map[status] || '#909399'
}

function progressColor(progress: number): string {
  if (!progress) return '#409eff'
  if (progress >= 100) return '#67c23a'
  if (progress >= 50) return '#e8a850'
  return '#409eff'
}

async function fetchSeasons() {
  if (!projectId.value) return
  try {
    const res = await listAll('/projects/seasons', { projectId: projectId.value })
    const data = res.data.data as any
    seasons.value = data.records || []

    // 尝试从路由参数获取seasonId
    const qSeasonId = route.query.seasonId
    if (qSeasonId && !selectedSeasonId.value) {
      selectedSeasonId.value = Number(qSeasonId)
    }
    // 默认选择第一个
    if (!selectedSeasonId.value && seasons.value.length > 0) {
      selectedSeasonId.value = seasons.value[0].id
    }
    if (selectedSeasonId.value) {
      await fetchEpisodes()
    }
  } catch {
    // handled
  }
}

async function fetchEpisodes() {
  if (!selectedSeasonId.value) return
  loading.value = true
  try {
    const res = await listAll('/seasons/episodes', { seasonId: selectedSeasonId.value })
    const data = res.data.data as any
    episodes.value = data.records || []
  } catch {
    // handled
  } finally {
    loading.value = false
  }
}

function handleSeasonChange() {
  fetchEpisodes()
}

function openAddDialog() {
  isEdit.value = false
  editingId.value = null
  form.episodeNo = episodes.value.length + 1
  form.title = ''
  form.summary = ''
  form.seasonId = selectedSeasonId.value
  dialogVisible.value = true
}

function openEditDialog(ep: any) {
  isEdit.value = true
  editingId.value = ep.id
  form.episodeNo = ep.episodeNo
  form.title = ep.title
  form.summary = ep.summary || ''
  form.seasonId = ep.seasonId
  dialogVisible.value = true
}

async function handleSubmit() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  submitting.value = true
  try {
    const payload = { episodeNo: form.episodeNo, title: form.title, summary: form.summary }
    if (isEdit.value && editingId.value) {
      await updateOne('/seasons/episodes', payload, { seasonId: selectedSeasonId.value, id: editingId.value })
      ElMessage.success('更新成功')
    } else {
      await createOne('/seasons/episodes', payload, { seasonId: selectedSeasonId.value })
      ElMessage.success('添加成功')
    }
    dialogVisible.value = false
    await fetchEpisodes()
  } catch {
    // handled
  } finally {
    submitting.value = false
  }
}

async function handleDelete(ep: any) {
  try {
    await ElMessageBox.confirm(`确定删除「#${ep.episodeNo} ${ep.title}」吗？`, '确认删除', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning',
    })
    await deleteOne('/seasons/episodes', { seasonId: selectedSeasonId.value, id: ep.id })
    ElMessage.success('删除成功')
    await fetchEpisodes()
  } catch {
    // cancelled or error
  }
}

function goDetail(ep: any) {
  router.push(`/episodes/${ep.id}`)
}

onMounted(() => {
  fetchSeasons()
})

watch(projectId, (newId) => {
  if (newId) {
    selectedSeasonId.value = null
    episodes.value = []
    fetchSeasons()
  }
})
</script>

<style scoped>
.episode-list { min-height: 100%; display: flex; flex-direction: column; gap: 18px; }
.page-header { display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-shrink: 0; }
.page-title-group, .header-actions { display: flex; align-items: center; gap: 10px; }
.title-icon { font-size: 22px; color: var(--primary-color); }
.page-title { margin: 0; font-size: 20px; font-weight: 600; line-height: 1; color: var(--text-ink); }
.title-badge { color: var(--primary-color); background: var(--primary-tint); border: 1px solid var(--primary-light); border-radius: 4px; padding: 2px 7px; font-size: 10px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase; }
.episode-count { color: var(--text-muted); background: var(--bg-cream); border: 1px solid var(--border-hairline); border-radius: 12px; padding: 3px 9px; font-size: 11px; }
.season-select { width: 200px; }
.btn-create { background: var(--primary-color) !important; color: white !important; border: none !important; font-weight: 600; }
.filter-bar { display: flex; align-items: center; gap: 10px; padding: 12px 14px; background: var(--bg-white); border: 1px solid var(--border-hairline); border-radius: var(--radius-lg); }
.filter-heading { display: flex; align-items: center; gap: 6px; color: var(--text-secondary); font-size: 13px; font-weight: 600; white-space: nowrap; }
.search-input { width: 260px; }
.status-select { width: 220px; }
.search-input :deep(.el-input__wrapper), .status-select :deep(.el-select__wrapper), .season-select :deep(.el-select__wrapper) { background: var(--bg-white) !important; box-shadow: none !important; border: 1px solid var(--border-hairline); }
.search-input :deep(.el-input__wrapper):focus-within, .status-select :deep(.el-select__wrapper):focus-within { border-color: var(--primary-color); box-shadow: 0 0 0 2px var(--primary-tint) !important; }
.filter-hint { color: var(--text-muted); font-size: 11px; margin-left: auto; }
.episode-grid { min-height: 220px; }
.empty-state { flex: 1; min-height: 300px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; color: var(--text-muted); text-align: center; }
.compact-empty { min-height: 280px; }
.panel-empty { background: var(--bg-white); border: 1px dashed var(--border-hairline); border-radius: var(--radius-lg); }
.empty-icon-wrap { width: 78px; height: 78px; display: flex; align-items: center; justify-content: center; border-radius: 50%; color: var(--primary-color); background: var(--bg-cream); border: 1px solid var(--primary-tint); }
.empty-title { margin: 0; color: var(--text-secondary); font-size: 16px; font-weight: 600; }
.empty-sub { margin: 0; font-size: 13px; }
.episode-card { margin-bottom: 16px; overflow: hidden; cursor: pointer; background: var(--bg-white); border: 1px solid var(--border-hairline); border-radius: var(--radius-lg); transition: all .25s ease; }
.episode-card:hover { border-color: var(--primary-color); transform: translateY(-3px); box-shadow: var(--shadow-glow); }
.ep-header { display: flex; align-items: baseline; gap: 8px; padding: 16px 16px 0; }
.ep-no { color: var(--primary-color); font-size: 13px; font-weight: 600; white-space: nowrap; }
.ep-title { min-width: 0; overflow: hidden; color: var(--text-ink); font-size: 15px; font-weight: 600; text-overflow: ellipsis; white-space: nowrap; }
.ep-summary { display: -webkit-box; min-height: 40px; padding: 8px 16px 0; overflow: hidden; color: var(--text-muted); font-size: 13px; line-height: 1.5; -webkit-box-orient: vertical; -webkit-line-clamp: 2; }
.ep-progress { padding: 14px 16px 0; }
.progress-meta { display: flex; justify-content: space-between; margin-bottom: 6px; color: var(--text-muted); font-size: 11px; }
.progress-meta strong { color: var(--text-secondary); font-weight: 600; }
.ep-status-tags { display: flex; flex-direction: column; gap: 6px; padding: 14px 16px; }
.status-row { display: flex; align-items: center; justify-content: space-between; }
.status-label { color: var(--text-muted); font-size: 12px; }
.status-tag { border-color: transparent !important; }
.ep-actions { display: flex; gap: 4px; padding: 8px 16px; border-top: 1px solid var(--border-hairline); }
.ep-actions .el-button { color: var(--text-secondary); }
@media (max-width: 760px) { .page-header, .filter-bar { align-items: stretch; flex-direction: column; } .header-actions { flex-wrap: wrap; } .season-select, .search-input, .status-select { width: 100%; } .filter-hint { margin-left: 0; } }
</style>
