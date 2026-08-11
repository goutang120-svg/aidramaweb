<template>
  <div class="season-list">
    <div class="page-toolbar">
      <h3 class="page-title">分季管理</h3>
      <el-button type="primary" @click="openAddDialog" :disabled="!projectId">
        <el-icon><Plus /></el-icon> 添加分季
      </el-button>
    </div>

    <el-empty v-if="!projectId" description="请先在顶部选择项目" />

    <div v-else v-loading="loading" class="season-grid">
      <div v-if="seasons.length === 0 && !loading" class="empty-wrap">
        <el-empty description="暂无分季数据" />
      </div>
      <el-row v-else :gutter="16">
        <el-col v-for="season in seasons" :key="season.id" :xs="24" :sm="12" :md="8" :lg="6">
          <el-card shadow="hover" class="season-card" :class="{ expanded: expandedId === season.id }">
            <div class="season-header" @click="toggleExpand(season)">
              <div class="season-no">第 {{ season.seasonNo }} 季</div>
              <div class="season-name">{{ season.name }}</div>
              <div class="season-meta">
                <el-tag :color="statusColor(season.status)" effect="dark" size="small" style="border-color:transparent">
                  {{ statusLabel(season.status) }}
                </el-tag>
                <span class="season-episodes">{{ season.totalEpisodes || 0 }} 集</span>
              </div>
              <div v-if="season.description" class="season-desc">{{ season.description }}</div>
              <div class="season-actions" @click.stop>
                <el-button text size="small" @click="openEditDialog(season)">编辑</el-button>
                <el-button text size="small" type="danger" @click="handleDelete(season)">删除</el-button>
              </div>
            </div>

            <!-- 展开显示分集 -->
            <div v-if="expandedId === season.id" class="episode-list">
              <div class="episode-list-header">
                <span>关联分集</span>
                <el-button text size="small" type="primary" @click="goEpisodes(season)">查看全部</el-button>
              </div>
              <div v-loading="episodeLoading" class="episode-items">
                <div v-if="seasonEpisodes.length === 0 && !episodeLoading" class="episode-empty">暂无分集</div>
                <div v-for="ep in seasonEpisodes" :key="ep.id" class="episode-item" @click="goEpisode(ep)">
                  <span class="ep-no">#{{ ep.episodeNo }}</span>
                  <span class="ep-title">{{ ep.title }}</span>
                  <el-tag :color="statusColor(ep.scriptStatus)" effect="dark" size="small" style="border-color:transparent">
                    {{ statusLabel(ep.scriptStatus) }}
                  </el-tag>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 添加/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑分季' : '添加分季'"
      width="520px"
      class="dark-dialog"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="季度编号" prop="seasonNo">
          <el-input-number v-model="form.seasonNo" :min="1" style="width:100%" />
        </el-form-item>
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" placeholder="如：第一季" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="季度描述" />
        </el-form-item>
        <el-form-item label="总集数" prop="totalEpisodes">
          <el-input-number v-model="form.totalEpisodes" :min="0" style="width:100%" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="form.status" style="width:100%">
            <el-option label="未开始" value="NOT_STARTED" />
            <el-option label="进行中" value="IN_PROGRESS" />
            <el-option label="已完成" value="COMPLETED" />
          </el-select>
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
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { listAll, createOne, updateOne, deleteOne } from '@/api/index'
import { useAppStore } from '@/stores/app'

const router = useRouter()
const appStore = useAppStore()
const projectId = computed(() => appStore.currentProjectId)

const loading = ref(false)
const episodeLoading = ref(false)
const submitting = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const expandedId = ref<number | null>(null)
const editingId = ref<number | null>(null)

const seasons = ref<any[]>([])
const seasonEpisodes = ref<any[]>([])

const formRef = ref()
const form = reactive({
  seasonNo: 1,
  name: '',
  description: '',
  totalEpisodes: 12,
  status: 'IN_PROGRESS',
})

const rules = {
  seasonNo: [{ required: true, message: '请输入季度编号', trigger: 'blur' }],
  name: [{ required: true, message: '请输入名称', trigger: 'blur' }],
}

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    NOT_STARTED: '未开始',
    IN_PROGRESS: '进行中',
    COMPLETED: '已完成',
  }
  return map[status] || status
}

function statusColor(status: string): string {
  const map: Record<string, string> = {
    NOT_STARTED: '#909399',
    IN_PROGRESS: '#e8a850',
    COMPLETED: '#67c23a',
  }
  return map[status] || '#909399'
}

async function fetchSeasons() {
  if (!projectId.value) return
  loading.value = true
  try {
    const res = await listAll(`/projects/${projectId.value}/seasons`)
    const data = res.data.data as any
    seasons.value = data.records || []
  } catch {
    // handled by interceptor
  } finally {
    loading.value = false
  }
}

async function toggleExpand(season: any) {
  if (expandedId.value === season.id) {
    expandedId.value = null
    return
  }
  expandedId.value = season.id
  episodeLoading.value = true
  try {
    const res = await listAll(`/seasons/${season.id}/episodes`)
    const data = res.data.data as any
    seasonEpisodes.value = data.records || []
  } catch {
    // handled by interceptor
  } finally {
    episodeLoading.value = false
  }
}

function openAddDialog() {
  isEdit.value = false
  editingId.value = null
  form.seasonNo = seasons.value.length + 1
  form.name = ''
  form.description = ''
  form.totalEpisodes = 12
  form.status = 'IN_PROGRESS'
  dialogVisible.value = true
}

function openEditDialog(season: any) {
  isEdit.value = true
  editingId.value = season.id
  form.seasonNo = season.seasonNo
  form.name = season.name
  form.description = season.description || ''
  form.totalEpisodes = season.totalEpisodes || 0
  form.status = season.status
  dialogVisible.value = true
}

async function handleSubmit() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  submitting.value = true
  try {
    const payload = { ...form }
    if (isEdit.value && editingId.value) {
      await updateOne(`/projects/${projectId.value}/seasons/${editingId.value}`, payload)
      ElMessage.success('更新成功')
    } else {
      await createOne(`/projects/${projectId.value}/seasons`, payload)
      ElMessage.success('添加成功')
    }
    dialogVisible.value = false
    await fetchSeasons()
  } catch {
    // handled by interceptor
  } finally {
    submitting.value = false
  }
}

async function handleDelete(season: any) {
  try {
    await ElMessageBox.confirm(`确定删除「第${season.seasonNo}季 ${season.name}」吗？`, '确认删除', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning',
    })
    await deleteOne(`/projects/${projectId.value}/seasons/${season.id}`)
    ElMessage.success('删除成功')
    if (expandedId.value === season.id) expandedId.value = null
    await fetchSeasons()
  } catch {
    // cancelled or error
  }
}

function goEpisodes(season: any) {
  router.push({ path: '/episodes', query: { seasonId: season.id } })
}

function goEpisode(ep: any) {
  router.push(`/episodes/${ep.id}`)
}

onMounted(() => {
  fetchSeasons()
})

watch(projectId, (newId) => {
  if (newId) {
    expandedId.value = null
    fetchSeasons()
  }
})
</script>

<style scoped>
.season-list { padding: 4px; }
.page-toolbar {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 16px;
}
.page-title {
  color: #c0c0d0; font-size: 16px; font-weight: 600;
  padding-left: 10px; border-left: 3px solid #e8a850;
}

/* 卡片 */
.season-grid { min-height: 120px; }
.empty-wrap { padding: 60px 0; }

.season-card {
  background: #1a1a2e; border: 1px solid #2a2a3e; border-radius: 8px;
  margin-bottom: 16px; cursor: pointer;
  transition: transform 0.2s, border-color 0.2s;
}
.season-card:hover { border-color: #e8a850; transform: translateY(-2px); }
.season-card.expanded { border-color: #e8a850; }

.season-header { padding: 16px; }
.season-no { color: #e8a850; font-size: 13px; font-weight: 500; margin-bottom: 4px; }
.season-name { color: #c0c0d0; font-size: 16px; font-weight: 600; margin-bottom: 10px; }
.season-meta { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
.season-episodes { color: #6a6a7e; font-size: 13px; }
.season-desc { color: #808090; font-size: 13px; margin-top: 8px; line-height: 1.5; }
.season-actions { display: flex; gap: 4px; margin-top: 12px; padding-top: 12px; border-top: 1px solid #2a2a3e; }

/* 展开集数 */
.episode-list { border-top: 1px solid #2a2a3e; padding: 12px 16px 16px; }
.episode-list-header {
  display: flex; align-items: center; justify-content: space-between;
  color: #808090; font-size: 13px; margin-bottom: 10px;
}
.episode-items { min-height: 40px; }
.episode-empty { color: #6a6a7e; font-size: 13px; padding: 20px 0; text-align: center; }
.episode-item {
  display: flex; align-items: center; gap: 10px;
  padding: 8px 10px; border-radius: 6px; background: #16162a;
  margin-bottom: 6px; cursor: pointer; transition: background 0.2s;
}
.episode-item:hover { background: #2a2a3e; }
.ep-no { color: #e8a850; font-size: 13px; font-weight: 500; min-width: 36px; }
.ep-title { color: #c0c0d0; font-size: 13px; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
</style>
