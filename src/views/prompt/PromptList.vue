<template>
  <div class="prompt-list">
    <div class="page-toolbar">
      <h3 class="page-title">Prompt 管理</h3>
      <el-button type="primary" @click="openAddDialog" :disabled="!projectId">
        <el-icon><Plus /></el-icon> 添加 Prompt
      </el-button>
    </div>

    <el-empty v-if="!projectId" description="请先在顶部选择项目" />

    <div v-else v-loading="loading" class="prompt-content">
      <div v-if="prompts.length === 0 && !loading" class="empty-wrap">
        <el-empty description="暂无 Prompt 数据" />
      </div>
      <el-table v-else :data="prompts" class="dark-table" size="small">
        <el-table-column prop="name" label="名称" width="180" show-overflow-tooltip />
        <el-table-column prop="promptType" label="类型" width="120">
          <template #default="{ row }">
            <el-tag size="small" effect="dark" style="border-color:transparent">
              {{ promptTypeLabel(row.promptType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="toolName" label="工具" width="100">
          <template #default="{ row }">{{ toolNameLabel(row.toolName) }}</template>
        </el-table-column>
        <el-table-column prop="content" label="Prompt 内容" min-width="300" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="content-preview">{{ row.content }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="negativePrompt" label="负向提示词" width="160" show-overflow-tooltip>
          <template #default="{ row }">
            <span v-if="row.negativePrompt" class="negative-preview">{{ row.negativePrompt }}</span>
            <span v-else class="no-data">-</span>
          </template>
        </el-table-column>
        <el-table-column label="关联" width="140" show-overflow-tooltip>
          <template #default="{ row }">
            <div class="relation-cell">
              <span v-if="row.characterId">人物:{{ row.characterId }}</span>
              <span v-if="row.sceneId">场景:{{ row.sceneId }}</span>
              <span v-if="row.shotId">镜头:{{ row.shotId }}</span>
              <span v-if="!row.characterId && !row.sceneId && !row.shotId" class="no-data">无</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button text size="small" @click="openEditDialog(row)">编辑</el-button>
            <el-button text size="small" type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 添加/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑 Prompt' : '添加 Prompt'"
      width="680px"
      class="dark-dialog"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" placeholder="Prompt 名称" />
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="类型" prop="promptType">
              <el-select v-model="form.promptType" style="width:100%">
                <el-option label="文生图" value="TEXT_TO_IMAGE" />
                <el-option label="图生图" value="IMAGE_TO_IMAGE" />
                <el-option label="文生视频" value="TEXT_TO_VIDEO" />
                <el-option label="图生视频" value="IMAGE_TO_VIDEO" />
                <el-option label="对话" value="CHAT" />
                <el-option label="其他" value="OTHER" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="工具名称" prop="toolName">
              <el-select v-model="form.toolName" style="width:100%">
                <el-option label="即梦" value="即梦" />
                <el-option label="GPT" value="GPT" />
                <el-option label="豆包" value="豆包" />
                <el-option label="可灵" value="可灵" />
                <el-option label="其他" value="其他" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="Prompt 内容" prop="content">
          <el-input v-model="form.content" type="textarea" :rows="6" placeholder="输入 Prompt 内容..." />
        </el-form-item>
        <el-form-item label="负向提示词" prop="negativePrompt">
          <el-input v-model="form.negativePrompt" type="textarea" :rows="3" placeholder="负向提示词（可选）" />
        </el-form-item>
        <el-form-item label="关联人物">
          <el-select v-model="form.characterId" style="width:100%" clearable placeholder="选择关联人物" filterable>
            <el-option v-for="c in characters" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="关联场景">
          <el-select v-model="form.sceneId" style="width:100%" clearable placeholder="选择关联场景" filterable>
            <el-option v-for="s in scenes" :key="s.id" :label="s.name" :value="s.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="关联镜头">
          <el-select v-model="form.shotId" style="width:100%" clearable placeholder="选择关联镜头" filterable>
            <el-option v-for="sh in shots" :key="sh.id" :label="`#${sh.shotNo} ${sh.description || ''}`" :value="sh.id" />
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
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { listAll, createOne, updateOne, deleteOne } from '@/api/index'
import { useAppStore } from '@/stores/app'

const appStore = useAppStore()
const projectId = computed(() => appStore.currentProjectId)

const loading = ref(false)
const submitting = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const editingId = ref<number | null>(null)

const prompts = ref<any[]>([])
const characters = ref<any[]>([])
const scenes = ref<any[]>([])
const shots = ref<any[]>([])

const formRef = ref()
const form = reactive({
  name: '',
  promptType: 'TEXT_TO_IMAGE',
  toolName: '即梦',
  content: '',
  negativePrompt: '',
  characterId: null as number | null,
  sceneId: null as number | null,
  shotId: null as number | null,
})

const rules = {
  name: [{ required: true, message: '请输入名称', trigger: 'blur' }],
  promptType: [{ required: true, message: '请选择类型', trigger: 'change' }],
  content: [{ required: true, message: '请输入 Prompt 内容', trigger: 'blur' }],
  toolName: [{ required: true, message: '请选择工具', trigger: 'change' }],
}

function promptTypeLabel(type: string): string {
  const map: Record<string, string> = {
    TEXT_TO_IMAGE: '文生图', IMAGE_TO_IMAGE: '图生图',
    TEXT_TO_VIDEO: '文生视频', IMAGE_TO_VIDEO: '图生视频',
    CHAT: '对话', OTHER: '其他',
  }
  return map[type] || type
}

function toolNameLabel(tool: string): string {
  return tool || '-'
}

async function fetchPrompts() {
  if (!projectId.value) return
  loading.value = true
  try {
    const res = await listAll(`/projects/${projectId.value}/prompts`)
    const data = res.data.data as any
    prompts.value = data.records || []
  } catch { /* handled */ } finally { loading.value = false }
}

async function fetchRelations() {
  if (!projectId.value) return
  try {
    const [charRes, sceneRes] = await Promise.all([
      listAll(`/projects/${projectId.value}/characters`),
      listAll(`/projects/${projectId.value}/scenes`),
    ])
    characters.value = (charRes.data.data as any).records || []
    scenes.value = (sceneRes.data.data as any).records || []
    // Shots are fetched on demand (too many), but we try if needed
  } catch { /* handled */ }
}

async function fetchShotsForDialog() {
  if (!projectId.value || shots.value.length > 0) return
  try {
    const seasonsRes = await listAll(`/projects/${projectId.value}/seasons`)
    const sRecords = (seasonsRes.data.data as any).records || []
    const allShots: any[] = []
    for (const s of sRecords) {
      const epRes = await listAll(`/seasons/${s.id}/episodes`)
      const epRecords = (epRes.data.data as any).records || []
      for (const ep of epRecords) {
        const shotRes = await listAll(`/episodes/${ep.id}/shots`)
        const shotRecords = (shotRes.data.data as any).records || []
        allShots.push(...shotRecords)
      }
    }
    shots.value = allShots
  } catch { /* handled */ }
}

function openAddDialog() {
  isEdit.value = false
  editingId.value = null
  form.name = ''
  form.promptType = 'TEXT_TO_IMAGE'
  form.toolName = '即梦'
  form.content = ''
  form.negativePrompt = ''
  form.characterId = null
  form.sceneId = null
  form.shotId = null
  dialogVisible.value = true
  fetchShotsForDialog()
}

function openEditDialog(row: any) {
  isEdit.value = true
  editingId.value = row.id
  form.name = row.name || ''
  form.promptType = row.promptType || 'TEXT_TO_IMAGE'
  form.toolName = row.toolName || '即梦'
  form.content = row.content || ''
  form.negativePrompt = row.negativePrompt || ''
  form.characterId = row.characterId || null
  form.sceneId = row.sceneId || null
  form.shotId = row.shotId || null
  dialogVisible.value = true
  fetchShotsForDialog()
}

async function handleSubmit() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  submitting.value = true
  try {
    const payload: Record<string, any> = {
      name: form.name,
      promptType: form.promptType,
      toolName: form.toolName,
      content: form.content,
      negativePrompt: form.negativePrompt,
    }
    if (form.characterId) payload.characterId = form.characterId
    if (form.sceneId) payload.sceneId = form.sceneId
    if (form.shotId) payload.shotId = form.shotId

    if (isEdit.value && editingId.value) {
      await updateOne(`/projects/${projectId.value}/prompts/${editingId.value}`, payload)
      ElMessage.success('更新成功')
    } else {
      await createOne(`/projects/${projectId.value}/prompts`, payload)
      ElMessage.success('添加成功')
    }
    dialogVisible.value = false
    await fetchPrompts()
  } catch { /* handled */ } finally { submitting.value = false }
}

async function handleDelete(row: any) {
  try {
    await ElMessageBox.confirm(`确定删除 Prompt「${row.name}」吗？`, '确认删除', {
      confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning',
    })
    await deleteOne(`/projects/${projectId.value}/prompts/${row.id}`)
    ElMessage.success('删除成功')
    await fetchPrompts()
  } catch { /* cancelled */ }
}

onMounted(() => {
  fetchPrompts()
  fetchRelations()
})

watch(projectId, (newId) => {
  if (newId) {
    fetchPrompts()
    fetchRelations()
  }
})
</script>

<style scoped>
.prompt-list { padding: 4px; }
.page-toolbar {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 16px;
}
.page-title {
  color: var(--text-secondary); font-size: 16px; font-weight: 600;
  padding-left: 10px; border-left: 3px solid var(--primary-color);
}
.prompt-content { min-height: 120px; }
.empty-wrap { padding: 60px 0; }
.content-preview {
  color: var(--text-secondary); font-family: 'Courier New', monospace; font-size: 13px;
}
.negative-preview { color: var(--accent-color); font-size: 12px; }
.no-data { color: var(--text-muted); }
.relation-cell {
  display: flex; flex-wrap: wrap; gap: 4px; font-size: 12px; color: var(--text-muted);
}
</style>
