<template>
  <div class="story-bible">
    <div class="page-header">
      <h2 class="page-title">故事圣经</h2>
      <div class="header-actions">
        <ProjectSwitcher />
        <el-button type="primary" @click="openCreate" :disabled="!currentProjectId">新建</el-button>
      </div>
    </div>

    <el-empty v-if="!currentProjectId" description="请先选择项目" />

    <template v-else>
      <div class="bible-layout">
        <div class="bible-list">
          <div
            v-for="item in bibleList"
            :key="item.id"
            :class="['bible-item', { active: selectedId === item.id }]"
            @click="selectBible(item)"
          >
            <div class="item-title">{{ item.title }}</div>
            <div class="item-meta">
              <el-tag size="small" :type="statusTagType(item.status)">{{ statusLabel(item.status) }}</el-tag>
              <span class="item-version">v{{ item.version }}</span>
            </div>
          </div>
        </div>

        <div class="bible-editor" v-if="selectedBible">
          <div class="editor-toolbar">
            <span class="editor-title">{{ selectedBible.title }}</span>
            <div>
              <input ref="fileInput" type="file" accept=".md,.txt" style="display:none" @change="handleFileImport" />
              <el-button size="small" @click="triggerImport">导入MD</el-button>
              <el-button :type="previewMode ? 'default' : 'primary'" size="small" @click="previewMode = false">编辑</el-button>
              <el-button :type="previewMode ? 'primary' : 'default'" size="small" @click="previewMode = true">预览</el-button>
              <el-button type="primary" size="small" @click="saveBible" :loading="saving">保存</el-button>
            </div>
          </div>
          <div v-if="previewMode" class="markdown-preview" v-html="renderedContent"></div>
          <el-input
            v-else
            v-model="editContent"
            type="textarea"
            class="editor-textarea"
            :rows="20"
            placeholder="请输入 Markdown 内容..."
          />
        </div>
        <el-empty v-else class="no-selection" description="选择左侧条目开始编辑" />
      </div>
    </template>

    <el-dialog v-model="dialogVisible" title="新建圣经条目" width="500px">
      <el-form :model="form" label-position="top">
        <el-form-item label="标题" required>
          <el-input v-model="form.title" placeholder="请输入标题" />
        </el-form-item>
        <el-form-item label="内容">
          <div style="margin-bottom:8px">
            <input ref="dialogFileInput" type="file" accept=".md,.txt" style="display:none" @change="handleDialogFileImport" />
            <el-button size="small" @click="triggerDialogImport">导入MD文件</el-button>
          </div>
          <el-input v-model="form.content" type="textarea" :rows="10" placeholder="请输入 Markdown 内容，或导入本地 .md 文件" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="createBible" :loading="saving">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { listAll, createOne, updateOne } from '@/api/index'
import { useAppStore } from '@/stores/app'
import ProjectSwitcher from '@/components/ProjectSwitcher.vue'

interface BibleEntry {
  id: number
  title: string
  content: string
  version: number
  status: string
  projectId: number
}

const appStore = useAppStore()
const currentProjectId = computed(() => appStore.currentProjectId)

const bibleList = ref<BibleEntry[]>([])
const selectedId = ref<number | null>(null)
const selectedBible = ref<BibleEntry | null>(null)
const editContent = ref('')
const previewMode = ref(false)
const saving = ref(false)
const dialogVisible = ref(false)
const form = ref({ title: '', content: '' })
const fileInput = ref<HTMLInputElement | null>(null)
const dialogFileInput = ref<HTMLInputElement | null>(null)

function triggerImport() { fileInput.value?.click() }
function triggerDialogImport() { dialogFileInput.value?.click() }

function handleFileImport(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => { editContent.value = reader.result as string }
  reader.readAsText(file, 'UTF-8')
}
function handleDialogFileImport(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => { form.value.content = reader.result as string }
  reader.readAsText(file, 'UTF-8')
}

async function fetchBibles() {
  if (!currentProjectId.value) return
  try {
    const res = await listAll(`/projects/${currentProjectId.value}/bibles`, { page: 1, pageSize: 200 })
    bibleList.value = (res.data.data.records || []) as BibleEntry[]
  } catch { /* handled */ }
}

function selectBible(item: BibleEntry) {
  selectedId.value = item.id
  selectedBible.value = item
  editContent.value = item.content || ''
  previewMode.value = false
}

function openCreate() {
  form.value = { title: '', content: '' }
  dialogVisible.value = true
}

async function createBible() {
  if (!currentProjectId.value || !form.value.title) return
  saving.value = true
  try {
    await createOne(`/projects/${currentProjectId.value}/bibles`, {
      ...form.value,
      projectId: currentProjectId.value,
      version: 1,
      status: 'DRAFT',
    })
    ElMessage.success('创建成功')
    dialogVisible.value = false
    await fetchBibles()
  } catch { /* handled */ } finally { saving.value = false }
}

async function saveBible() {
  if (!currentProjectId.value || !selectedBible.value) return
  saving.value = true
  try {
    await updateOne(`/projects/${currentProjectId.value}/bibles/${selectedBible.value.id}`, {
      title: selectedBible.value.title,
      content: editContent.value,
      version: (selectedBible.value.version || 0) + 1,
      status: selectedBible.value.status,
      projectId: currentProjectId.value,
    })
    ElMessage.success('保存成功')
    selectedBible.value.content = editContent.value
    selectedBible.value.version += 1
  } catch { /* handled */ } finally { saving.value = false }
}

const renderedContent = computed(() => {
  const text = editContent.value || ''
  return text
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br>')
})

function statusTagType(status: string) {
  const map: Record<string, string> = { DRAFT: 'info', REVIEW: 'warning', PUBLISHED: 'success' }
  return map[status] || 'info'
}
function statusLabel(status: string) {
  const map: Record<string, string> = { DRAFT: '草稿', REVIEW: '审核中', PUBLISHED: '已发布' }
  return map[status] || status
}

onMounted(fetchBibles)
</script>

<style scoped>
.story-bible { height: 100%; display: flex; flex-direction: column; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.page-title { color: #e8a850; font-size: 20px; font-weight: 600; }
.header-actions { display: flex; gap: 12px; align-items: center; }

.bible-layout { display: flex; gap: 16px; flex: 1; min-height: 0; }
.bible-list { width: 260px; background: #16162a; border-radius: 8px; border: 1px solid #2a2a3e; overflow-y: auto; flex-shrink: 0; }
.bible-item { padding: 14px 16px; cursor: pointer; border-bottom: 1px solid #2a2a3e; transition: background 0.2s; }
.bible-item:hover { background: #1a1a2e; }
.bible-item.active { background: #1a1a2e; border-left: 3px solid #e8a850; }
.item-title { color: #c0c0d0; font-size: 14px; font-weight: 500; margin-bottom: 6px; }
.item-meta { display: flex; gap: 8px; align-items: center; }
.item-version { color: #808090; font-size: 12px; }

.bible-editor { flex: 1; background: #16162a; border-radius: 8px; border: 1px solid #2a2a3e; display: flex; flex-direction: column; min-width: 0; }
.editor-toolbar { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; border-bottom: 1px solid #2a2a3e; }
.editor-title { color: #e8a850; font-weight: 500; font-size: 15px; }
.editor-textarea { flex: 1; }
.editor-textarea :deep(.el-textarea__inner) { background: #0f0f1a; border: none; color: #c0c0d0; height: 100% !important; resize: none; border-radius: 0 0 8px 8px; }
.markdown-preview { flex: 1; padding: 20px; overflow-y: auto; line-height: 1.8; }
.markdown-preview :deep(h1) { color: #e8a850; font-size: 22px; margin-bottom: 12px; }
.markdown-preview :deep(h2) { color: #d4a040; font-size: 18px; margin: 16px 0 8px; }
.markdown-preview :deep(h3) { color: #c0c0d0; font-size: 15px; margin: 12px 0 6px; }
.markdown-preview :deep(strong) { color: #fff; }
.no-selection { flex: 1; background: #16162a; border-radius: 8px; border: 1px solid #2a2a3e; display: flex; align-items: center; justify-content: center; }
</style>
