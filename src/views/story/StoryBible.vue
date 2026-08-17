<template>
  <div class="story-bible">
    <!-- Header -->
    <div class="page-header">
      <div class="page-title-group">
        <el-icon class="title-icon"><Document /></el-icon>
        <h2 class="page-title">故事圣经</h2>
        <span class="title-badge">Bible</span>
      </div>
      <div class="header-actions">
        <ProjectSwitcher />
        <el-button class="btn-create" type="primary" @click="openCreate" :disabled="!currentProjectId">
          <el-icon><Plus /></el-icon>新建条目
        </el-button>
      </div>
    </div>

    <!-- No project -->
    <div v-if="!currentProjectId" class="empty-state">
      <div class="empty-icon-wrap"><el-icon size="48"><Folder /></el-icon></div>
      <p class="empty-title">请先选择项目</p>
      <p class="empty-sub">在顶栏切换项目后即可管理故事圣经</p>
    </div>

    <template v-else>
      <div class="bible-layout">
        <!-- Sidebar list -->
        <div class="bible-sidebar">
          <div class="sidebar-header">
            <el-input
              v-model="searchKeyword"
              placeholder="搜索条目..."
              size="small"
              clearable
              class="sidebar-search"
            >
              <template #prefix><el-icon><Search /></el-icon></template>
            </el-input>
          </div>

          <div class="sidebar-list" v-if="filteredList.length">
            <div
              v-for="item in filteredList"
              :key="item.id"
              :class="['bible-item', { active: selectedId === item.id }]"
              @click="selectBible(item)"
            >
              <div class="item-header">
                <span class="item-title">{{ item.title }}</span>
                <el-tag class="item-tag" size="small" :type="statusTagType(item.status)" effect="dark">
                  {{ statusLabel(item.status) }}
                </el-tag>
              </div>
              <div class="item-footer">
                <span class="item-version">
                  <el-icon size="11"><Clock /></el-icon> v{{ item.version }}
                </span>
              </div>
            </div>
          </div>

          <div v-else class="sidebar-empty">
            <el-icon size="32"><Document /></el-icon>
            <p>暂无条目</p>
          </div>
        </div>

        <!-- Editor area -->
        <div class="editor-panel" v-if="selectedBible">
          <!-- Editor toolbar -->
          <div class="editor-toolbar">
            <div class="toolbar-left">
              <div class="editor-breadcrumb">
                <span class="breadcrumb-label">故事圣经</span>
                <el-icon size="12"><ArrowRight /></el-icon>
                <span class="breadcrumb-title">{{ selectedBible.title }}</span>
              </div>
              <el-tag size="small" :type="statusTagType(selectedBible.status)" effect="dark">
                {{ statusLabel(selectedBible.status) }}
              </el-tag>
              <span class="version-chip">v{{ selectedBible.version }}</span>
            </div>
            <div class="toolbar-right">
              <input ref="fileInput" type="file" accept=".md,.txt" style="display:none" @change="handleFileImport" />
              <el-tooltip content="导入 Markdown 文件" placement="bottom">
                <el-button size="small" plain class="toolbar-btn" @click="triggerImport">
                  <el-icon><Upload /></el-icon>
                </el-button>
              </el-tooltip>
              <div class="mode-toggle">
                <button :class="['mode-btn', { active: !previewMode }]" @click="previewMode = false">
                  <el-icon><EditPen /></el-icon> 编辑
                </button>
                <button :class="['mode-btn', { active: previewMode }]" @click="previewMode = true">
                  <el-icon><View /></el-icon> 预览
                </button>
              </div>
              <el-button type="primary" size="small" class="btn-save" @click="saveBible" :loading="saving">
                <el-icon><Check /></el-icon> 保存
              </el-button>
            </div>
          </div>

          <!-- Editor body -->
          <div class="editor-body">
            <div v-if="previewMode" class="markdown-preview" v-html="renderedContent"></div>
            <el-input
              v-else
              v-model="editContent"
              type="textarea"
              class="editor-textarea"
              :rows="20"
              placeholder="支持 Markdown 格式，例如：# 标题、**加粗**、- 列表、> 引用"
            />
          </div>

          <!-- Editor footer -->
          <div class="editor-footer">
            <span class="char-count">{{ editContent.length }} 字符 / {{ wordCount }} 词</span>
            <span class="save-hint" v-if="!saving">Ctrl + S 快速保存</span>
          </div>
        </div>

        <!-- No selection -->
        <div v-else class="no-selection">
          <div class="no-selection-inner">
            <div class="no-sel-icon"><el-icon size="56"><Document /></el-icon></div>
            <p class="no-sel-title">选择左侧条目开始编辑</p>
            <p class="no-sel-sub">故事圣经是剧本的核心参考文档，支持 Markdown 富文本格式</p>
          </div>
        </div>
      </div>
    </template>

    <!-- Create dialog -->
    <el-dialog v-model="dialogVisible" title="新建故事圣经条目" width="560px" class="bible-dialog">
      <el-form :model="form" label-position="top" class="dialog-form">
        <el-form-item label="条目标题" required>
          <el-input v-model="form.title" placeholder="例如：世界观设定、主要人物弧线" />
        </el-form-item>
        <el-form-item label="内容">
          <div class="dialog-import-row">
            <input ref="dialogFileInput" type="file" accept=".md,.txt" style="display:none" @change="handleDialogFileImport" />
            <el-button size="small" plain @click="triggerDialogImport">
              <el-icon><Upload /></el-icon> 导入 .md 文件
            </el-button>
            <span class="import-hint" v-if="form.content">已填入 {{ form.content.length }} 字</span>
          </div>
          <el-input
            v-model="form.content"
            type="textarea"
            :rows="12"
            placeholder="支持 Markdown 格式，或导入本地 .md 文件"
            style="margin-top:8px"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="createBible" :loading="saving">
          <el-icon><Check /></el-icon> 创建
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Document, Plus, Folder, Search, Clock, ArrowRight,
  Upload, EditPen, View, Check,
} from '@element-plus/icons-vue'
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
const searchKeyword = ref('')
const fileInput = ref<HTMLInputElement | null>(null)
const dialogFileInput = ref<HTMLInputElement | null>(null)

const filteredList = computed(() => {
  const kw = searchKeyword.value.trim().toLowerCase()
  if (!kw) return bibleList.value
  return bibleList.value.filter(x =>
    x.title?.toLowerCase().includes(kw) || x.content?.toLowerCase().includes(kw)
  )
})

const wordCount = computed(() => {
  const text = editContent.value || ''
  // Split by whitespace + treat each CJK character as a word
  const cjk = (text.match(/[一-龥]/g) || []).length
  const words = text
    .replace(/[一-龥]/g, ' ')
    .split(/\s+/)
    .filter(Boolean).length
  return cjk + words
})

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
    const res = await listAll('/projects/bibles', { projectId: currentProjectId.value, page: 1, pageSize: 200 })
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
    await createOne('/projects/bibles', {
      ...form.value,
      status: 'DRAFT',
    }, { projectId: currentProjectId.value })
    ElMessage.success('创建成功')
    dialogVisible.value = false
    await fetchBibles()
  } catch { /* handled */ } finally { saving.value = false }
}

async function saveBible() {
  if (!currentProjectId.value || !selectedBible.value) return
  saving.value = true
  try {
    await updateOne('/projects/bibles', {
      title: selectedBible.value.title,
      content: editContent.value,
      version: (selectedBible.value.version || 0) + 1,
      status: selectedBible.value.status,
      projectId: currentProjectId.value,
    }, { projectId: currentProjectId.value, id: selectedBible.value.id })
    ElMessage.success('保存成功')
    selectedBible.value.content = editContent.value
    selectedBible.value.version += 1
  } catch { /* handled */ } finally { saving.value = false }
}

// Markdown → HTML (lightweight, no deps). Handles headings, bold/italic,
// inline code, code blocks, lists, blockquotes, hr, links, paragraphs.
function escapeHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function renderMarkdown(src: string): string {
  if (!src) return '<p class="md-empty">暂无内容</p>'
  const lines = src.split(/\r?\n/)
  const out: string[] = []
  let inCode = false
  let codeBuf: string[] = []
  let listType: 'ul' | 'ol' | null = null
  let paraBuf: string[] = []

  const flushPara = () => {
    if (paraBuf.length) {
      out.push(`<p>${inline(paraBuf.join(' '))}</p>`)
      paraBuf = []
    }
  }
  const closeList = () => {
    if (listType) {
      out.push(`</${listType}>`)
      listType = null
    }
  }

  const inline = (text: string) => {
    let t = escapeHtml(text)
    t = t.replace(/`([^`]+)`/g, '<code>$1</code>')
    t = t.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    t = t.replace(/(^|[^*])\*(?!\s)(.+?)(?<!\s)\*(?!\*)/g, '$1<em>$2</em>')
    t = t.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
    return t
  }

  for (const raw of lines) {
    const line = raw

    // Fenced code block
    if (/^```/.test(line)) {
      if (inCode) {
        out.push(`<pre><code>${escapeHtml(codeBuf.join('\n'))}</code></pre>`)
        codeBuf = []
        inCode = false
      } else {
        flushPara(); closeList()
        inCode = true
      }
      continue
    }
    if (inCode) { codeBuf.push(line); continue }

    // Blank line separates blocks
    if (!line.trim()) { flushPara(); closeList(); continue }

    // Headings
    const h = line.match(/^(#{1,6})\s+(.*)$/)
    if (h) {
      flushPara(); closeList()
      const level = h[1].length
      out.push(`<h${level}>${inline(h[2])}</h${level}>`)
      continue
    }

    // Horizontal rule
    if (/^\s*(---|\*\*\*|___)\s*$/.test(line)) {
      flushPara(); closeList()
      out.push('<hr>')
      continue
    }

    // Blockquote
    if (/^\s*>\s?/.test(line)) {
      flushPara(); closeList()
      out.push(`<blockquote>${inline(line.replace(/^\s*>\s?/, ''))}</blockquote>`)
      continue
    }

    // Unordered list
    const ul = line.match(/^\s*[-*+]\s+(.*)$/)
    if (ul) {
      flushPara()
      if (listType !== 'ul') { closeList(); out.push('<ul>'); listType = 'ul' }
      out.push(`<li>${inline(ul[1])}</li>`)
      continue
    }
    // Ordered list
    const ol = line.match(/^\s*\d+\.\s+(.*)$/)
    if (ol) {
      flushPara()
      if (listType !== 'ol') { closeList(); out.push('<ol>'); listType = 'ol' }
      out.push(`<li>${inline(ol[1])}</li>`)
      continue
    }

    // Regular paragraph line
    closeList()
    paraBuf.push(line)
  }

  flushPara(); closeList()
  if (inCode) out.push(`<pre><code>${escapeHtml(codeBuf.join('\n'))}</code></pre>`)
  return out.join('\n')
}

const renderedContent = computed(() => renderMarkdown(editContent.value))

function statusTagType(status: string) {
  const map: Record<string, string> = { DRAFT: 'info', REVIEW: 'warning', PUBLISHED: 'success' }
  return map[status] || 'info'
}
function statusLabel(status: string) {
  const map: Record<string, string> = { DRAFT: '草稿', REVIEW: '审核中', PUBLISHED: '已发布' }
  return map[status] || status
}

function onKeydown(e: KeyboardEvent) {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
    if (selectedBible.value) {
      e.preventDefault()
      saveBible()
    }
  }
}

onMounted(() => {
  fetchBibles()
  window.addEventListener('keydown', onKeydown)
})
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<style scoped>
/* ===== Layout ===== */
.story-bible {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* ===== Header ===== */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
}
.page-title-group {
  display: flex;
  align-items: center;
  gap: 10px;
}
.title-icon {
  font-size: 22px;
  color: var(--primary-color);
}
.page-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-ink);
  line-height: 1;
}
.title-badge {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 1px;
  color: var(--primary-color);
  background: var(--primary-tint);
  border: 1px solid var(--border-hairline);
  border-radius: 4px;
  padding: 2px 7px;
  text-transform: uppercase;
}
.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}
.btn-create {
  background: var(--primary-color) !important;
  border: none !important;
  color: white !important;
  font-weight: 500;
  gap: 4px;
}
.btn-create:hover {
  background: var(--primary-hover) !important;
}

/* ===== Empty state ===== */
.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: var(--text-muted);
}
.empty-icon-wrap {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: var(--primary-tint);
  border: 1px solid var(--border-hairline);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36px;
  color: var(--primary-color);
}
.empty-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-ink);
}
.empty-sub {
  font-size: 13px;
  color: var(--text-secondary);
}

/* ===== Bible layout ===== */
.bible-layout {
  display: flex;
  gap: 16px;
  flex: 1;
  min-height: 0;
}

/* ===== Sidebar ===== */
.bible-sidebar {
  width: 260px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  background: var(--bg-white);
  border: 1px solid var(--border-hairline);
  border-radius: var(--radius-lg);
  overflow: hidden;
}
.sidebar-header {
  padding: 12px;
  border-bottom: 1px solid var(--border-hairline);
  background: var(--bg-cream);
}
.sidebar-search :deep(.el-input__wrapper) {
  background: var(--bg-white) !important;
  box-shadow: none !important;
  border: 1px solid var(--border-hairline) !important;
  border-radius: var(--radius-sm) !important;
}
.sidebar-search :deep(.el-input__wrapper):focus-within {
  border-color: var(--primary-color) !important;
  box-shadow: 0 0 0 3px var(--primary-tint) !important;
}
.sidebar-list {
  flex: 1;
  overflow-y: auto;
}
.bible-item {
  padding: 12px 14px;
  cursor: pointer;
  border-bottom: 1px solid var(--border-hairline);
  transition: all 0.2s;
  position: relative;
}
.bible-item::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: transparent;
  border-radius: 0 2px 2px 0;
  transition: background 0.2s;
}
.bible-item:hover {
  background: var(--bg-hover);
}
.bible-item.active {
  background: var(--primary-tint);
}
.bible-item.active::before {
  background: var(--primary-color);
}
.item-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 6px;
  margin-bottom: 6px;
}
.item-title {
  color: var(--text-ink);
  font-size: 13px;
  font-weight: 500;
  line-height: 1.4;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.bible-item.active .item-title {
  color: var(--primary-color);
  font-weight: 600;
}
.item-tag {
  flex-shrink: 0;
  font-size: 10px;
}
.item-footer {
  display: flex;
  align-items: center;
  gap: 6px;
}
.item-version {
  display: flex;
  align-items: center;
  gap: 3px;
  color: var(--text-muted);
  font-size: 11px;
}
.sidebar-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 40px 20px;
  color: var(--text-secondary);
  font-size: 13px;
}

/* ===== Editor panel ===== */
.editor-panel {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  background: var(--bg-white);
  border: 1px solid var(--border-hairline);
  border-radius: var(--radius-lg);
  overflow: hidden;
}
.editor-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 16px;
  border-bottom: 1px solid var(--border-hairline);
  background: var(--bg-cream);
  flex-shrink: 0;
  gap: 12px;
  flex-wrap: wrap;
}
.toolbar-left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}
.editor-breadcrumb {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  min-width: 0;
}
.breadcrumb-label {
  color: var(--text-secondary);
  white-space: nowrap;
}
.breadcrumb-title {
  color: var(--text-ink);
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 180px;
}
.version-chip {
  font-size: 11px;
  color: var(--text-secondary);
  background: var(--bg-white);
  border: 1px solid var(--border-hairline);
  border-radius: 4px;
  padding: 1px 6px;
  white-space: nowrap;
}
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}
.toolbar-btn {
  background: var(--bg-white) !important;
  border-color: var(--border-hairline) !important;
  color: var(--text-body) !important;
}
.toolbar-btn:hover {
  border-color: var(--primary-color) !important;
  color: var(--primary-color) !important;
}
.mode-toggle {
  display: flex;
  background: var(--bg-white);
  border: 1px solid var(--border-hairline);
  border-radius: var(--radius-sm);
  overflow: hidden;
}
.mode-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 5px 10px;
  font-size: 12px;
  color: var(--text-body);
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}
.mode-btn:hover {
  color: var(--primary-color);
  background: var(--bg-hover);
}
.mode-btn.active {
  background: var(--primary-color);
  color: white;
  font-weight: 500;
}
.btn-save {
  background: var(--primary-color) !important;
  border: none !important;
  color: white !important;
  font-weight: 500;
  gap: 4px;
}
.btn-save:hover {
  background: var(--primary-hover) !important;
}

/* ===== Editor body ===== */
.editor-body {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.editor-textarea {
  flex: 1;
  height: 100%;
}
.editor-textarea :deep(.el-textarea__inner) {
  height: 100% !important;
  background: var(--bg-white);
  border: none;
  border-radius: 0;
  color: var(--text-ink);
  font-size: 14px;
  line-height: 1.8;
  resize: none;
  font-family: 'JetBrains Mono', 'Consolas', 'Courier New', monospace;
  padding: 20px 24px;
}
.editor-textarea :deep(.el-textarea__inner)::placeholder {
  color: var(--text-muted);
}
.editor-textarea :deep(.el-textarea__inner):focus {
  box-shadow: none;
}

/* ===== Markdown preview ===== */
.markdown-preview {
  flex: 1;
  padding: 24px 32px;
  overflow-y: auto;
  color: var(--text-body);
  font-size: 15px;
  line-height: 1.9;
  background: var(--bg-white);
}
.markdown-preview :deep(h1) {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-ink);
  margin: 0 0 16px;
  padding-bottom: 10px;
  border-bottom: 2px solid var(--primary-color);
}
.markdown-preview :deep(h2) {
  font-size: 19px;
  font-weight: 600;
  color: var(--text-ink);
  margin: 28px 0 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.markdown-preview :deep(h2)::before {
  content: '';
  display: inline-block;
  width: 4px;
  height: 18px;
  background: var(--primary-color);
  border-radius: 2px;
  flex-shrink: 0;
}
.markdown-preview :deep(h3) {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-ink);
  margin: 20px 0 8px;
}
.markdown-preview :deep(h4),
.markdown-preview :deep(h5),
.markdown-preview :deep(h6) {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-body);
  margin: 16px 0 6px;
}
.markdown-preview :deep(p) {
  margin: 0 0 12px;
  color: var(--text-body);
}
.markdown-preview :deep(p.md-empty) {
  color: var(--text-muted);
  font-style: italic;
}
.markdown-preview :deep(strong) {
  color: var(--text-ink);
  font-weight: 600;
}
.markdown-preview :deep(em) {
  color: var(--primary-color);
  font-style: italic;
}
.markdown-preview :deep(a) {
  color: var(--primary-color);
  text-decoration: none;
  border-bottom: 1px solid var(--primary-light);
}
.markdown-preview :deep(a):hover {
  color: var(--primary-hover);
}
.markdown-preview :deep(code) {
  font-family: 'JetBrains Mono', 'Consolas', monospace;
  font-size: 13px;
  background: var(--primary-tint);
  border: 1px solid var(--border-hairline);
  border-radius: 4px;
  padding: 1px 6px;
  color: var(--primary-hover);
}
.markdown-preview :deep(pre) {
  background: var(--bg-cream);
  border: 1px solid var(--border-hairline);
  border-radius: var(--radius-sm);
  padding: 16px 20px;
  overflow-x: auto;
  margin: 12px 0;
}
.markdown-preview :deep(pre code) {
  background: none;
  border: none;
  padding: 0;
  color: var(--text-body);
  font-size: 13px;
}
.markdown-preview :deep(blockquote) {
  margin: 12px 0;
  padding: 10px 16px;
  border-left: 4px solid var(--primary-color);
  background: var(--bg-cream);
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
  color: var(--text-body);
  font-style: italic;
}
.markdown-preview :deep(ul),
.markdown-preview :deep(ol) {
  padding-left: 20px;
  margin: 8px 0 12px;
}
.markdown-preview :deep(li) {
  margin-bottom: 4px;
  color: var(--text-body);
}
.markdown-preview :deep(ul li)::marker {
  color: var(--primary-color);
}
.markdown-preview :deep(ol li)::marker {
  color: var(--primary-color);
}
.markdown-preview :deep(hr) {
  border: none;
  border-top: 1px solid var(--border-hairline);
  margin: 24px 0;
}

/* ===== Editor footer ===== */
.editor-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 16px;
  border-top: 1px solid var(--border-hairline);
  background: var(--bg-cream);
  flex-shrink: 0;
}
.char-count {
  font-size: 11px;
  color: var(--text-secondary);
}
.save-hint {
  font-size: 11px;
  color: var(--text-muted);
}

/* ===== No selection ===== */
.no-selection {
  flex: 1;
  background: var(--bg-white);
  border: 1px solid var(--border-hairline);
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
}
.no-selection-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  text-align: center;
  padding: 40px;
}
.no-sel-icon {
  width: 96px;
  height: 96px;
  border-radius: 50%;
  background: var(--primary-tint);
  border: 1px dashed var(--primary-light);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--primary-color);
}
.no-sel-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-ink);
}
.no-sel-sub {
  font-size: 13px;
  color: var(--text-secondary);
  max-width: 260px;
  line-height: 1.6;
}

/* ===== Dialog ===== */
.bible-dialog :deep(.el-dialog) {
  background: var(--bg-white) !important;
  border: 1px solid var(--border-hairline) !important;
  border-radius: var(--radius-lg) !important;
}
.bible-dialog :deep(.el-dialog__header) {
  padding: 20px 24px 12px;
  border-bottom: 1px solid var(--border-hairline);
}
.bible-dialog :deep(.el-dialog__title) {
  color: var(--text-ink);
  font-weight: 600;
  font-size: 16px;
}
.bible-dialog :deep(.el-dialog__body) {
  padding: 20px 24px;
}
.bible-dialog :deep(.el-dialog__footer) {
  padding: 12px 24px 20px;
  border-top: 1px solid var(--border-hairline);
}
.dialog-form :deep(.el-form-item__label) {
  color: var(--text-ink);
  font-weight: 500;
}
.dialog-import-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 0;
}
.import-hint {
  font-size: 12px;
  color: var(--primary-color);
}
</style>
