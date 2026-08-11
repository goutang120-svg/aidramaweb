<template>
  <div class="story-clues">
    <div class="page-header">
      <h2 class="page-title">故事线索</h2>
      <div class="header-actions">
        <ProjectSwitcher />
        <el-button type="primary" @click="openAdd" :disabled="!currentProjectId">新建线索</el-button>
      </div>
    </div>

    <el-empty v-if="!currentProjectId" description="请先选择项目" />

    <template v-else>
      <el-card class="table-card">
        <el-table :data="clueList" style="width: 100%" row-key="id">
          <el-table-column prop="clueCode" label="线索编号" width="140" />
          <el-table-column prop="clueName" label="线索名称" width="180" />
          <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
          <el-table-column label="状态" width="120">
            <template #default="{ row }">
              <el-tag :type="statusTagType(row.status)">{{ statusLabel(row.status) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="firstEpisodeId" label="首次出场集" width="120" />
          <el-table-column label="操作" width="160" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" size="small" @click="openEdit(row)">编辑</el-button>
              <el-button link type="danger" size="small" @click="handleDelete(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </template>

    <el-dialog v-model="dialogVisible" :title="editingId ? '编辑线索' : '新建线索'" width="520px">
      <el-form :model="form" label-position="top">
        <el-form-item label="线索编号" required>
          <el-input v-model="form.clueCode" placeholder="请输入线索编号" />
        </el-form-item>
        <el-form-item label="线索名称" required>
          <el-input v-model="form.clueName" placeholder="请输入线索名称" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="请输入描述" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="form.status" style="width: 100%">
            <el-option label="未揭晓" value="UNRESOLVED" />
            <el-option label="已揭示" value="REVEALED" />
            <el-option label="已放弃" value="ABANDONED" />
          </el-select>
        </el-form-item>
        <el-form-item label="首次出场集">
          <el-input-number v-model="form.firstEpisodeId" :min="0" />
        </el-form-item>
        <el-form-item label="关联人物">
          <el-input v-model="form.keyCharacterIds" placeholder="多个ID用逗号分隔" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave" :loading="saving">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { listAll, createOne, updateOne, deleteOne } from '@/api/index'
import { useAppStore } from '@/stores/app'
import ProjectSwitcher from '@/components/ProjectSwitcher.vue'

interface Clue {
  id: number
  clueCode: string
  clueName: string
  description: string
  status: string
  firstEpisodeId: number
  keyCharacterIds: string
  projectId: number
}

const appStore = useAppStore()
const currentProjectId = computed(() => appStore.currentProjectId)

const clueList = ref<Clue[]>([])
const saving = ref(false)
const dialogVisible = ref(false)
const editingId = ref<number | null>(null)
const form = ref({ clueCode: '', clueName: '', description: '', status: 'UNRESOLVED', firstEpisodeId: 0, keyCharacterIds: '' })

async function fetchClues() {
  if (!currentProjectId.value) return
  try {
    const res = await listAll(`/projects/${currentProjectId.value}/clues`, { page: 1, pageSize: 200 })
    clueList.value = (res.data.data.records || []) as Clue[]
  } catch { /* handled */ }
}

function openAdd() {
  editingId.value = null
  form.value = { clueCode: '', clueName: '', description: '', status: 'UNRESOLVED', firstEpisodeId: 0, keyCharacterIds: '' }
  dialogVisible.value = true
}

function openEdit(row: Clue) {
  editingId.value = row.id
  form.value = { clueCode: row.clueCode, clueName: row.clueName, description: row.description || '', status: row.status, firstEpisodeId: row.firstEpisodeId, keyCharacterIds: row.keyCharacterIds || '' }
  dialogVisible.value = true
}

async function handleSave() {
  if (!currentProjectId.value || !form.value.clueCode || !form.value.clueName) return
  saving.value = true
  try {
    const payload = { ...form.value, projectId: currentProjectId.value }
    if (editingId.value) {
      await updateOne(`/projects/${currentProjectId.value}/clues/${editingId.value}`, payload)
      ElMessage.success('更新成功')
    } else {
      await createOne(`/projects/${currentProjectId.value}/clues`, payload)
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    await fetchClues()
  } catch { /* handled */ } finally { saving.value = false }
}

async function handleDelete(row: Clue) {
  try {
    await ElMessageBox.confirm('确定删除该线索吗？', '删除确认', { type: 'warning' })
    await deleteOne(`/projects/${currentProjectId.value}/clues/${row.id}`)
    ElMessage.success('删除成功')
    await fetchClues()
  } catch { /* cancelled or handled */ }
}

function statusTagType(status: string) {
  const map: Record<string, string> = { UNRESOLVED: 'warning', REVEALED: 'success', ABANDONED: 'info' }
  return map[status] || 'info'
}
function statusLabel(status: string) {
  const map: Record<string, string> = { UNRESOLVED: '未揭晓', REVEALED: '已揭示', ABANDONED: '已放弃' }
  return map[status] || status
}

onMounted(fetchClues)
</script>

<style scoped>
.story-clues { height: 100%; display: flex; flex-direction: column; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.page-title { color: #e8a850; font-size: 20px; font-weight: 600; }
.header-actions { display: flex; gap: 12px; align-items: center; }
.table-card { background: #16162a; border: 1px solid #2a2a3e; }
</style>
