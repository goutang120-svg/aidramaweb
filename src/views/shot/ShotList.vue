<template>
  <div class="shot-list">
    <div class="page-toolbar">
      <h3 class="page-title">镜头管理</h3>
      <div class="toolbar-right">
        <el-select
          v-model="selectedEpisodeId"
          placeholder="选择分集"
          style="width:220px"
          @change="fetchShots"
          clearable
        >
          <el-option
            v-for="ep in episodes"
            :key="ep.id"
            :label="`#${ep.episodeNo} ${ep.title}`"
            :value="ep.id"
          />
        </el-select>
        <el-button type="primary" @click="openAddDialog" :disabled="!selectedEpisodeId">
          <el-icon><Plus /></el-icon> 添加镜头
        </el-button>
      </div>
    </div>

    <el-empty v-if="!projectId" description="请先在顶部选择项目" />

    <div v-else-if="!selectedEpisodeId" class="empty-wrap">
      <el-empty description="请选择分集查看镜头" />
    </div>

    <div v-else v-loading="loading" class="shot-content">
      <div v-if="shots.length === 0 && !loading" class="empty-wrap">
        <el-empty description="暂无镜头数据" />
      </div>
      <el-table v-else :data="shots" class="dark-table" size="small" @row-click="goDetail" style="cursor:pointer">
        <el-table-column prop="sortOrder" label="排序" width="60" />
        <el-table-column prop="shotNo" label="镜头号" width="80">
          <template #default="{ row }">
            <span class="shot-no-cell">{{ row.shotNo }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="shotCode" label="编号" width="140" />
        <el-table-column prop="shotType" label="类型" width="100">
          <template #default="{ row }">{{ shotTypeLabel(row.shotType) }}</template>
        </el-table-column>
        <el-table-column prop="cameraAngle" label="角度" width="100">
          <template #default="{ row }">{{ cameraAngleLabel(row.cameraAngle) }}</template>
        </el-table-column>
        <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :color="statusColor(row.status)" effect="dark" size="small" style="border-color:transparent">
              {{ statusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button text size="small" @click.stop="openEditDialog(row)">编辑</el-button>
            <el-button text size="small" type="danger" @click.stop="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 添加/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑镜头' : '添加镜头'"
      width="600px"
      class="dark-dialog"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="镜头编号" prop="shotNo">
              <el-input-number v-model="form.shotNo" :min="1" style="width:100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="排序" prop="sortOrder">
              <el-input-number v-model="form.sortOrder" :min="0" style="width:100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="镜头类型" prop="shotType">
              <el-select v-model="form.shotType" style="width:100%">
                <el-option label="远景" value="EXTREME_LONG" />
                <el-option label="全景" value="LONG" />
                <el-option label="中景" value="MEDIUM" />
                <el-option label="近景" value="CLOSE_UP" />
                <el-option label="特写" value="EXTREME_CLOSE_UP" />
                <el-option label="空镜" value="EMPTY" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="镜头角度" prop="cameraAngle">
              <el-select v-model="form.cameraAngle" style="width:100%" clearable placeholder="选择角度">
                <el-option label="平视" value="EYE_LEVEL" />
                <el-option label="俯视" value="HIGH_ANGLE" />
                <el-option label="仰视" value="LOW_ANGLE" />
                <el-option label="鸟瞰" value="BIRDS_EYE" />
                <el-option label="荷兰角" value="DUTCH" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="运镜方式" prop="cameraMovement">
              <el-select v-model="form.cameraMovement" style="width:100%" clearable placeholder="选择运镜">
                <el-option label="固定" value="STATIC" />
                <el-option label="推镜" value="PUSH" />
                <el-option label="拉镜" value="PULL" />
                <el-option label="摇镜" value="PAN" />
                <el-option label="跟拍" value="TRACKING" />
                <el-option label="升降" value="CRANE" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="时长(秒)" prop="duration">
              <el-input-number v-model="form.duration" :min="0" :precision="1" style="width:100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="描述" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="镜头描述" />
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
const submitting = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const editingId = ref<number | null>(null)
const selectedEpisodeId = ref<number | null>(null)

const episodes = ref<any[]>([])
const shots = ref<any[]>([])

const formRef = ref()
const form = reactive({
  shotNo: 1,
  sortOrder: 0,
  shotType: 'MEDIUM',
  cameraAngle: '',
  cameraMovement: '',
  duration: 0,
  description: '',
  status: 'NOT_STARTED',
})

const rules = {
  shotNo: [{ required: true, message: '请输入镜头编号', trigger: 'blur' }],
  shotType: [{ required: true, message: '请选择类型', trigger: 'change' }],
}

function statusLabel(status: string): string {
  const map: Record<string, string> = { NOT_STARTED: '未开始', IN_PROGRESS: '进行中', COMPLETED: '已完成' }
  return map[status] || status || '未开始'
}
function statusColor(status: string): string {
  const map: Record<string, string> = { NOT_STARTED: '#909399', IN_PROGRESS: '#e8a850', COMPLETED: '#67c23a' }
  return map[status] || '#909399'
}
function shotTypeLabel(type: string): string {
  const map: Record<string, string> = {
    EXTREME_LONG: '远景', LONG: '全景', MEDIUM: '中景', CLOSE_UP: '近景',
    EXTREME_CLOSE_UP: '特写', EMPTY: '空镜',
  }
  return map[type] || type
}
function cameraAngleLabel(angle: string): string {
  const map: Record<string, string> = {
    EYE_LEVEL: '平视', HIGH_ANGLE: '俯视', LOW_ANGLE: '仰视',
    BIRDS_EYE: '鸟瞰', DUTCH: '荷兰角',
  }
  return map[angle] || angle || '-'
}

async function fetchEpisodes() {
  if (!projectId.value) return
  try {
    // Grab all episodes across seasons
    const seasonsRes = await listAll(`/projects/${projectId.value}/seasons`)
    const seasonsData = seasonsRes.data.data as any
    const sRecords = seasonsData.records || []
    const allEpisodes: any[] = []
    for (const s of sRecords) {
      const epRes = await listAll(`/seasons/${s.id}/episodes`)
      const epData = epRes.data.data as any
      if (epData.records) {
        allEpisodes.push(...epData.records.map((ep: any) => ({ ...ep, seasonId: s.id, seasonName: s.name })))
      }
    }
    episodes.value = allEpisodes

    if (!selectedEpisodeId.value && allEpisodes.length > 0) {
      selectedEpisodeId.value = allEpisodes[0].id
      await fetchShots()
    }
  } catch { /* handled */ }
}

async function fetchShots() {
  if (!selectedEpisodeId.value) return
  loading.value = true
  try {
    const res = await listAll(`/episodes/${selectedEpisodeId.value}/shots`)
    const data = res.data.data as any
    shots.value = data.records || []
  } catch { /* handled */ } finally { loading.value = false }
}

function openAddDialog() {
  isEdit.value = false
  editingId.value = null
  form.shotNo = shots.value.length + 1
  form.sortOrder = shots.value.length
  form.shotType = 'MEDIUM'
  form.cameraAngle = ''
  form.cameraMovement = ''
  form.duration = 0
  form.description = ''
  form.status = 'NOT_STARTED'
  dialogVisible.value = true
}

function openEditDialog(row: any) {
  isEdit.value = true
  editingId.value = row.id
  form.shotNo = row.shotNo
  form.sortOrder = row.sortOrder || 0
  form.shotType = row.shotType || 'MEDIUM'
  form.cameraAngle = row.cameraAngle || ''
  form.cameraMovement = row.cameraMovement || ''
  form.duration = row.duration || 0
  form.description = row.description || ''
  form.status = row.status || 'NOT_STARTED'
  dialogVisible.value = true
}

async function handleSubmit() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  submitting.value = true
  try {
    const payload = { ...form }
    if (isEdit.value && editingId.value) {
      await updateOne(`/episodes/${selectedEpisodeId.value}/shots/${editingId.value}`, payload)
      ElMessage.success('更新成功')
    } else {
      await createOne(`/episodes/${selectedEpisodeId.value}/shots`, payload)
      ElMessage.success('添加成功')
    }
    dialogVisible.value = false
    await fetchShots()
  } catch { /* handled */ } finally { submitting.value = false }
}

async function handleDelete(row: any) {
  try {
    await ElMessageBox.confirm(`确定删除镜头「${row.shotCode || row.shotNo}」吗？`, '确认删除', {
      confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning',
    })
    await deleteOne(`/episodes/${selectedEpisodeId.value}/shots/${row.id}`)
    ElMessage.success('删除成功')
    await fetchShots()
  } catch { /* cancelled */ }
}

function goDetail(row: any) {
  router.push(`/shots/${row.id}`)
}

onMounted(() => {
  fetchEpisodes()
})

watch(projectId, (newId) => {
  if (newId) {
    selectedEpisodeId.value = null
    shots.value = []
    episodes.value = []
    fetchEpisodes()
  }
})
</script>

<style scoped>
.shot-list { padding: 4px; }
.page-toolbar {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 16px;
}
.toolbar-right { display: flex; align-items: center; gap: 10px; }
.page-title {
  color: var(--text-secondary); font-size: 16px; font-weight: 600;
  padding-left: 10px; border-left: 3px solid var(--primary-color);
}
.shot-content { min-height: 120px; }
.empty-wrap { padding: 60px 0; }
.shot-no-cell { color: var(--primary-color); font-weight: 500; }
</style>
