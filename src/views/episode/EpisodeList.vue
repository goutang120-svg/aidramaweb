<template>
  <div class="episode-list">
    <div class="page-toolbar">
      <h3 class="page-title">分集管理</h3>
      <div class="toolbar-right">
        <el-select
          v-model="selectedSeasonId"
          placeholder="选择分季"
          style="width:200px"
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
        <el-button type="primary" @click="openAddDialog" :disabled="!selectedSeasonId">
          <el-icon><Plus /></el-icon> 添加分集
        </el-button>
      </div>
    </div>

    <el-empty v-if="!projectId" description="请先在顶部选择项目" />

    <div v-else-if="!selectedSeasonId" class="empty-wrap">
      <el-empty description="请选择分季查看分集" />
    </div>

    <div v-else v-loading="loading" class="episode-grid">
      <div v-if="episodes.length === 0 && !loading" class="empty-wrap">
        <el-empty description="暂无分集数据" />
      </div>
      <el-row v-else :gutter="16">
        <el-col v-for="ep in episodes" :key="ep.id" :xs="24" :sm="12" :md="8" :lg="6">
          <el-card shadow="hover" class="episode-card" @click="goDetail(ep)">
            <div class="ep-header">
              <span class="ep-no">#{{ ep.episodeNo }}</span>
              <span class="ep-title">{{ ep.title }}</span>
            </div>
            <div v-if="ep.summary" class="ep-summary">{{ ep.summary }}</div>

            <!-- 进度条 -->
            <div class="ep-progress">
              <el-progress :percentage="ep.progress || 0" :color="progressColor(ep.progress)" :stroke-width="6" />
            </div>

            <!-- 状态标签 -->
            <div class="ep-status-tags">
              <div class="status-row">
                <span class="status-label">剧本</span>
                <el-tag :color="statusColor(ep.scriptStatus)" effect="dark" size="small" style="border-color:transparent">
                  {{ statusLabel(ep.scriptStatus) }}
                </el-tag>
              </div>
              <div class="status-row">
                <span class="status-label">分镜</span>
                <el-tag :color="statusColor(ep.storyboardStatus)" effect="dark" size="small" style="border-color:transparent">
                  {{ statusLabel(ep.storyboardStatus) }}
                </el-tag>
              </div>
              <div class="status-row">
                <span class="status-label">资产</span>
                <el-tag :color="statusColor(ep.assetStatus)" effect="dark" size="small" style="border-color:transparent">
                  {{ statusLabel(ep.assetStatus) }}
                </el-tag>
              </div>
              <div class="status-row">
                <span class="status-label">视频</span>
                <el-tag :color="statusColor(ep.videoStatus)" effect="dark" size="small" style="border-color:transparent">
                  {{ statusLabel(ep.videoStatus) }}
                </el-tag>
              </div>
              <div class="status-row">
                <span class="status-label">后期</span>
                <el-tag :color="statusColor(ep.postStatus)" effect="dark" size="small" style="border-color:transparent">
                  {{ statusLabel(ep.postStatus) }}
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
import { Plus } from '@element-plus/icons-vue'
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

const seasons = ref<any[]>([])
const episodes = ref<any[]>([])

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
    const res = await listAll(`/projects/${projectId.value}/seasons`)
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
    const res = await listAll(`/seasons/${selectedSeasonId.value}/episodes`)
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
      await updateOne(`/seasons/${selectedSeasonId.value}/episodes/${editingId.value}`, payload)
      ElMessage.success('更新成功')
    } else {
      await createOne(`/seasons/${selectedSeasonId.value}/episodes`, payload)
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
    await deleteOne(`/seasons/${selectedSeasonId.value}/episodes/${ep.id}`)
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
.episode-list { padding: 4px; }
.page-toolbar {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 16px;
}
.toolbar-right { display: flex; align-items: center; gap: 10px; }
.page-title {
  color: #c0c0d0; font-size: 16px; font-weight: 600;
  padding-left: 10px; border-left: 3px solid #e8a850;
}

.episode-grid { min-height: 120px; }
.empty-wrap { padding: 60px 0; }

.episode-card {
  background: #1a1a2e; border: 1px solid #2a2a3e; border-radius: 8px;
  margin-bottom: 16px; cursor: pointer;
  transition: transform 0.2s, border-color 0.2s;
}
.episode-card:hover { border-color: #e8a850; transform: translateY(-2px); }

.ep-header { padding: 16px 16px 0; }
.ep-no { color: #e8a850; font-size: 13px; font-weight: 500; margin-right: 8px; }
.ep-title { color: #c0c0d0; font-size: 15px; font-weight: 600; }
.ep-summary { padding: 8px 16px 0; color: #808090; font-size: 13px; line-height: 1.5; min-height: 40px; }
.ep-progress { padding: 12px 16px 0; }

/* 状态标签 */
.ep-status-tags { padding: 12px 16px; display: flex; flex-direction: column; gap: 6px; }
.status-row { display: flex; align-items: center; justify-content: space-between; }
.status-label { color: #6a6a7e; font-size: 12px; }

.ep-actions {
  display: flex; gap: 4px; padding: 8px 16px; border-top: 1px solid #2a2a3e;
}
</style>
