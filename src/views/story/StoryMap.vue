<template>
  <div class="story-map">
    <!-- Header -->
    <div class="page-header">
      <div class="page-title-group">
        <el-icon class="title-icon"><Guide /></el-icon>
        <h2 class="page-title">故事地图</h2>
        <span class="title-badge">Story Map</span>
        <span v-if="flatNodes.length" class="node-count">{{ flatNodes.length }} 个节点</span>
      </div>
      <div class="header-actions">
        <ProjectSwitcher />
        <el-button class="btn-create" type="primary" @click="openAdd(null)" :disabled="!currentProjectId">
          <el-icon><Plus /></el-icon> 新建节点
        </el-button>
      </div>
    </div>

    <!-- No project state -->
    <div v-if="!currentProjectId" class="empty-state">
      <div class="empty-icon-wrap"><el-icon size="48"><Folder /></el-icon></div>
      <p class="empty-title">请先选择项目</p>
      <p class="empty-sub">切换项目后即可查看故事地图</p>
    </div>

    <div v-else class="map-layout">
      <!-- Tree panel -->
      <div class="tree-panel">
        <div class="tree-toolbar">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索节点..."
            size="small"
            clearable
            class="tree-search"
          >
            <template #prefix><el-icon><Search /></el-icon></template>
          </el-input>
          <el-tooltip content="展开全部" placement="top">
            <button class="icon-btn" @click="expandAll">
              <el-icon><FolderOpened /></el-icon>
            </button>
          </el-tooltip>
          <el-tooltip content="折叠全部" placement="top">
            <button class="icon-btn" @click="collapseAll">
              <el-icon><Folder /></el-icon>
            </button>
          </el-tooltip>
        </div>

        <div class="tree-body">
          <el-tree
            ref="treeRef"
            :data="treeData"
            :props="{ children: 'children', label: 'title' }"
            node-key="id"
            default-expand-all
            :expand-on-click-node="false"
            highlight-current
            :filter-node-method="filterNode"
            :current-node-key="selectedNode?.id"
            @node-click="selectNode"
          >
            <template #default="{ data }">
              <div class="tree-node" :class="{ selected: selectedNode?.id === data.id }">
                <span class="node-dot" :style="{ background: nodeTypeColor(data.nodeType) }"></span>
                <span class="node-title">{{ data.title }}</span>
                <span class="node-type-chip" :style="{ color: nodeTypeColor(data.nodeType), borderColor: nodeTypeColor(data.nodeType) + '55', background: nodeTypeColor(data.nodeType) + '15' }">
                  {{ nodeTypeLabel(data.nodeType) }}
                </span>
                <span class="node-actions">
                  <el-tooltip content="添加子节点" placement="top">
                    <button class="row-icon" @click.stop="openAdd(data)">
                      <el-icon><Plus /></el-icon>
                    </button>
                  </el-tooltip>
                  <el-tooltip content="编辑" placement="top">
                    <button class="row-icon" @click.stop="openEdit(data)">
                      <el-icon><EditPen /></el-icon>
                    </button>
                  </el-tooltip>
                  <el-tooltip content="删除" placement="top">
                    <button class="row-icon danger" @click.stop="handleDelete(data)">
                      <el-icon><Delete /></el-icon>
                    </button>
                  </el-tooltip>
                </span>
              </div>
            </template>
          </el-tree>

          <div v-if="!treeData.length" class="tree-empty">
            <el-icon size="32"><Guide /></el-icon>
            <p>还没有节点</p>
            <span>点击「新建节点」开始搭建故事结构</span>
          </div>
        </div>
      </div>

      <!-- Detail panel -->
      <div class="detail-panel" v-if="selectedNode">
        <div class="detail-toolbar">
          <div class="detail-breadcrumb">
            <span class="breadcrumb-label">故事地图</span>
            <el-icon size="12"><ArrowRight /></el-icon>
            <span class="breadcrumb-type" :style="{ color: nodeTypeColor(selectedNode.nodeType) }">
              {{ nodeTypeLabel(selectedNode.nodeType) }}
            </span>
            <el-icon size="12"><ArrowRight /></el-icon>
            <span class="breadcrumb-title">{{ selectedNode.title }}</span>
          </div>
          <div class="detail-actions">
            <el-tooltip content="添加子节点" placement="bottom">
              <button class="toolbar-icon-btn" @click="openAdd(selectedNode)">
                <el-icon><Plus /></el-icon>
              </button>
            </el-tooltip>
            <el-tooltip content="编辑" placement="bottom">
              <button class="toolbar-icon-btn" @click="openEdit(selectedNode)">
                <el-icon><EditPen /></el-icon>
              </button>
            </el-tooltip>
            <el-tooltip content="删除" placement="bottom">
              <button class="toolbar-icon-btn danger" @click="handleDelete(selectedNode)">
                <el-icon><Delete /></el-icon>
              </button>
            </el-tooltip>
          </div>
        </div>

        <div class="detail-body">
          <!-- Node header card -->
          <div class="node-hero" :style="{ borderLeftColor: nodeTypeColor(selectedNode.nodeType) }">
            <div class="hero-top">
              <h1 class="hero-title">{{ selectedNode.title }}</h1>
              <span class="hero-type-tag" :style="{ background: nodeTypeColor(selectedNode.nodeType) + '20', color: nodeTypeColor(selectedNode.nodeType), borderColor: nodeTypeColor(selectedNode.nodeType) + '55' }">
                {{ nodeTypeLabel(selectedNode.nodeType) }}
              </span>
            </div>
            <p v-if="selectedNode.summary" class="hero-summary">{{ selectedNode.summary }}</p>
            <div class="hero-meta">
              <span class="meta-item"><el-icon><Sort /></el-icon> 排序 {{ selectedNode.sortOrder }}</span>
              <span v-if="parentTitle" class="meta-item"><el-icon><Connection /></el-icon> 父节点：{{ parentTitle }}</span>
              <span v-if="childrenCount" class="meta-item"><el-icon><Menu /></el-icon> 子节点 {{ childrenCount }}</span>
            </div>
          </div>

          <!-- Content -->
          <div v-if="selectedNode.content" class="markdown-preview" v-html="renderedMarkdown"></div>
          <div v-else class="content-empty">
            <el-icon size="40"><Document /></el-icon>
            <p>暂无描述内容</p>
            <el-button size="small" plain @click="openEdit(selectedNode)">
              <el-icon><EditPen /></el-icon> 添加内容
            </el-button>
          </div>
        </div>
      </div>

      <div v-else class="no-selection">
        <div class="no-sel-inner">
          <div class="no-sel-icon"><el-icon size="56"><Guide /></el-icon></div>
          <p class="no-sel-title">选择左侧节点查看详情</p>
          <p class="no-sel-sub">用故事地图管理季 / 主线 / 集 / 事件的层级关系</p>
          <div class="legend">
            <div v-for="t in nodeTypes" :key="t.value" class="legend-item">
              <span class="legend-dot" :style="{ background: nodeTypeColor(t.value) }"></span>
              <span>{{ nodeTypeLabel(t.value) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Dialog -->
    <el-dialog
      v-model="dialogVisible"
      :title="editingId ? '编辑节点' : '新建节点'"
      width="560px"
      class="map-dialog"
    >
      <el-form :model="form" label-position="top" class="dialog-form">
        <el-form-item label="标题" required>
          <el-input v-model="form.title" placeholder="请输入节点标题" />
        </el-form-item>
        <div class="form-row">
          <el-form-item label="节点类型" required class="form-col">
            <el-select v-model="form.nodeType" placeholder="选择类型" style="width: 100%">
              <el-option v-for="t in nodeTypes" :key="t.value" :label="nodeTypeLabel(t.value)" :value="t.value">
                <span class="option-row">
                  <span class="legend-dot" :style="{ background: nodeTypeColor(t.value) }"></span>
                  {{ nodeTypeLabel(t.value) }}
                </span>
              </el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="排序" class="form-col-small">
            <el-input-number v-model="form.sortOrder" :min="0" style="width: 100%" />
          </el-form-item>
        </div>
        <el-form-item label="父节点" v-if="!editingId">
          <el-select v-model="form.parentId" placeholder="不选则为根节点" style="width: 100%" clearable>
            <el-option v-for="n in flatNodes" :key="n.id" :label="n.title" :value="n.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="描述内容">
          <div class="dialog-import-row">
            <input ref="fileInput" type="file" accept=".md,.txt" style="display:none" @change="handleFileImport" />
            <el-button size="small" plain @click="triggerImport">
              <el-icon><Upload /></el-icon> 导入 .md 文件
            </el-button>
            <span v-if="form.content" class="import-hint">已填入 {{ form.content.length }} 字</span>
          </div>
          <el-input
            v-model="form.content"
            type="textarea"
            :rows="10"
            placeholder="支持 Markdown 格式，例如：# 标题、**加粗**、- 列表"
            style="margin-top:8px"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave" :loading="saving">
          <el-icon><Check /></el-icon> {{ editingId ? '保存' : '创建' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Guide, Plus, Folder, FolderOpened, Search, ArrowRight,
  EditPen, Delete, Upload, Check, Document, Sort, Connection, Menu,
} from '@element-plus/icons-vue'
import { getOne, createOne, updateOne, deleteOne } from '@/api/index'
import { useAppStore } from '@/stores/app'
import ProjectSwitcher from '@/components/ProjectSwitcher.vue'

interface MapNode {
  id: number
  title: string
  nodeType: string
  parentId: number | null
  sortOrder: number
  content: string
  summary?: string
  projectId: number
  children?: MapNode[]
}

const appStore = useAppStore()
const currentProjectId = computed(() => appStore.currentProjectId)

const treeData = ref<MapNode[]>([])
const saving = ref(false)
const dialogVisible = ref(false)
const editingId = ref<number | null>(null)
const form = ref({ title: '', nodeType: 'NODE', parentId: null as number | null, sortOrder: 0, content: '' })
const fileInput = ref<HTMLInputElement | null>(null)
const selectedNode = ref<MapNode | null>(null)
const searchKeyword = ref('')
const treeRef = ref<any>(null)

const nodeTypes = [
  { label: '季', value: 'SEASON' },
  { label: '主线', value: 'ARC' },
  { label: '集', value: 'EPISODE' },
  { label: '事件', value: 'EVENT' },
  { label: '节点', value: 'NODE' },
]

// Node type color palette aligned with the purple theme
function nodeTypeColor(type: string) {
  const map: Record<string, string> = {
    SEASON:  '#f5576c', // pink-red — top level, most prominent
    ARC:     '#f5af19', // amber — narrative arc
    EPISODE: '#38ef7d', // green — episode
    EVENT:   'var(--primary-light)', // primary-light — event
    NODE:    'var(--text-secondary)', // neutral — generic node
  }
  return map[type] || 'var(--text-secondary)'
}

function nodeTypeTag(type: string) {
  const map: Record<string, string> = { SEASON: 'danger', ARC: 'warning', EPISODE: 'success', EVENT: 'info', NODE: '' }
  return map[type] || 'info'
}
function nodeTypeLabel(type: string) {
  const map: Record<string, string> = { SEASON: '季', ARC: '主线', EPISODE: '集', EVENT: '事件', NODE: '节点' }
  return map[type] || type
}

function selectNode(data: MapNode) { selectedNode.value = data }

function filterNode(value: string, data: MapNode) {
  if (!value) return true
  return data.title?.toLowerCase().includes(value.toLowerCase())
}

watch(searchKeyword, (v) => {
  treeRef.value?.filter(v)
})

function expandAll() {
  nextTick(() => {
    const store: any = treeRef.value?.store
    if (!store) return
    Object.values(store.nodesMap || {}).forEach((n: any) => { n.expanded = true })
  })
}
function collapseAll() {
  nextTick(() => {
    const store: any = treeRef.value?.store
    if (!store) return
    Object.values(store.nodesMap || {}).forEach((n: any) => { n.expanded = false })
  })
}

/* ===== Markdown renderer (lightweight, no deps) ===== */
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
    if (listType) { out.push(`</${listType}>`); listType = null }
  }
  const inline = (text: string) => {
    let t = escapeHtml(text)
    t = t.replace(/`([^`]+)`/g, '<code>$1</code>')
    t = t.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    t = t.replace(/(^|[^*])\*(?!\s)(.+?)(?<!\s)\*(?!\*)/g, '$1<em>$2</em>')
    t = t.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
    return t
  }

  for (const line of lines) {
    if (/^```/.test(line)) {
      if (inCode) {
        out.push(`<pre><code>${escapeHtml(codeBuf.join('\n'))}</code></pre>`)
        codeBuf = []; inCode = false
      } else { flushPara(); closeList(); inCode = true }
      continue
    }
    if (inCode) { codeBuf.push(line); continue }
    if (!line.trim()) { flushPara(); closeList(); continue }

    const h = line.match(/^(#{1,6})\s+(.*)$/)
    if (h) {
      flushPara(); closeList()
      out.push(`<h${h[1].length}>${inline(h[2])}</h${h[1].length}>`)
      continue
    }
    if (/^\s*(---|\*\*\*|___)\s*$/.test(line)) {
      flushPara(); closeList(); out.push('<hr>'); continue
    }
    if (/^\s*>\s?/.test(line)) {
      flushPara(); closeList()
      out.push(`<blockquote>${inline(line.replace(/^\s*>\s?/, ''))}</blockquote>`)
      continue
    }
    const ul = line.match(/^\s*[-*+]\s+(.*)$/)
    if (ul) {
      flushPara()
      if (listType !== 'ul') { closeList(); out.push('<ul>'); listType = 'ul' }
      out.push(`<li>${inline(ul[1])}</li>`)
      continue
    }
    const ol = line.match(/^\s*\d+\.\s+(.*)$/)
    if (ol) {
      flushPara()
      if (listType !== 'ol') { closeList(); out.push('<ol>'); listType = 'ol' }
      out.push(`<li>${inline(ol[1])}</li>`)
      continue
    }
    closeList()
    paraBuf.push(line)
  }
  flushPara(); closeList()
  if (inCode) out.push(`<pre><code>${escapeHtml(codeBuf.join('\n'))}</code></pre>`)
  return out.join('\n')
}

const renderedMarkdown = computed(() => renderMarkdown(selectedNode.value?.content || ''))

/* ===== Import ===== */
function triggerImport() { fileInput.value?.click() }
function handleFileImport(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => { form.value.content = reader.result as string }
  reader.readAsText(file, 'UTF-8')
}

/* ===== Data ===== */
const flatNodes = computed(() => {
  const result: MapNode[] = []
  function walk(nodes: MapNode[]) {
    for (const n of nodes) {
      result.push(n)
      if (n.children) walk(n.children)
    }
  }
  walk(treeData.value)
  return result
})

const parentTitle = computed(() => {
  if (!selectedNode.value?.parentId) return ''
  const parent = flatNodes.value.find(n => n.id === selectedNode.value?.parentId)
  return parent?.title || ''
})
const childrenCount = computed(() => selectedNode.value?.children?.length || 0)

async function fetchTree() {
  if (!currentProjectId.value) return
  try {
    const res = await getOne('/projects/map-nodes/tree', { projectId: currentProjectId.value })
    treeData.value = (res.data.data || []) as MapNode[]
    // Refresh currently-selected node from new tree so metadata stays in sync
    if (selectedNode.value) {
      const found = flatNodes.value.find(n => n.id === selectedNode.value!.id)
      selectedNode.value = found || null
    }
  } catch { /* handled */ }
}

function openAdd(parent: MapNode | null) {
  editingId.value = null
  form.value = { title: '', nodeType: 'NODE', parentId: parent?.id ?? null, sortOrder: 0, content: '' }
  dialogVisible.value = true
}

function openEdit(data: MapNode) {
  editingId.value = data.id
  form.value = { title: data.title, nodeType: data.nodeType, parentId: data.parentId, sortOrder: data.sortOrder, content: data.content || '' }
  dialogVisible.value = true
}

async function handleSave() {
  if (!currentProjectId.value || !form.value.title) return
  saving.value = true
  try {
    const payload = { ...form.value, projectId: currentProjectId.value }
    if (editingId.value) {
      await updateOne('/projects/map-nodes', payload, { projectId: currentProjectId.value, id: editingId.value })
      ElMessage.success('更新成功')
    } else {
      await createOne('/projects/map-nodes', payload, { projectId: currentProjectId.value })
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    await fetchTree()
  } catch { /* handled */ } finally { saving.value = false }
}

async function handleDelete(data: MapNode) {
  if (!currentProjectId.value) return
  try {
    await ElMessageBox.confirm('确定删除该节点吗？子节点也会一并删除。', '删除确认', { type: 'warning' })
    await deleteOne('/projects/map-nodes', { projectId: currentProjectId.value, id: data.id })
    ElMessage.success('删除成功')
    if (selectedNode.value?.id === data.id) selectedNode.value = null
    await fetchTree()
  } catch { /* cancelled or handled */ }
}

onMounted(fetchTree)
</script>

<style scoped>
/* ===== Layout ===== */
.story-map {
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
  border: 1px solid var(--primary-light);
  border-radius: 4px;
  padding: 2px 7px;
  text-transform: uppercase;
}
.node-count {
  font-size: 12px;
  color: var(--text-muted);
  background: var(--bg-cream);
  border-radius: 12px;
  padding: 2px 10px;
  border: 1px solid var(--border-hairline);
}
.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}
.btn-create {
  background: var(--primary-color) !important; color: white !important;
  border: none !important;
  font-weight: 600;
  gap: 4px;
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
  background: var(--bg-cream);
  border: 1px solid var(--primary-tint);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--primary-color);
}
.empty-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-secondary);
}
.empty-sub {
  font-size: 13px;
}

/* ===== Map layout ===== */
.map-layout {
  display: flex;
  gap: 16px;
  flex: 1;
  min-height: 0;
}

/* ===== Tree panel ===== */
.tree-panel {
  width: 340px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  background: var(--bg-white);
  border: 1px solid var(--border-hairline);
  border-radius: var(--radius-lg);
  overflow: hidden;
}
.tree-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  border-bottom: 1px solid var(--border-hairline);
  background: var(--bg-cream);
}
.tree-search {
  flex: 1;
}
.tree-search :deep(.el-input__wrapper) {
  background: var(--bg-white) !important;
  box-shadow: none !important;
  border: 1px solid var(--border-hairline) !important;
  border-radius: var(--radius-sm) !important;
}
.tree-search :deep(.el-input__wrapper):focus-within {
  border-color: var(--primary-color) !important;
  box-shadow: 0 0 0 2px var(--primary-tint) !important;
}
.icon-btn {
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
  background: var(--bg-white);
  border: 1px solid var(--border-hairline);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}
.icon-btn:hover {
  color: var(--primary-color);
  border-color: var(--primary-color);
  background: var(--bg-cream);
}

.tree-body {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
  position: relative;
}
.tree-empty {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  color: var(--text-muted);
  padding: 20px;
  text-align: center;
}
.tree-empty p { font-size: 14px; font-weight: 500; color: var(--text-secondary); }
.tree-empty span { font-size: 12px; }

.tree-node {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 2px 0;
  min-width: 0;
}
.node-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
  box-shadow: 0 0 6px currentColor;
}
.node-title {
  color: var(--text-secondary);
  font-size: 13px;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
}
.tree-node.selected .node-title {
  color: var(--text-ink);
  font-weight: 600;
}
.node-type-chip {
  font-size: 10px;
  font-weight: 500;
  border: 1px solid;
  border-radius: 3px;
  padding: 1px 6px;
  flex-shrink: 0;
  white-space: nowrap;
  line-height: 1.5;
}
.node-actions {
  display: none;
  gap: 2px;
  margin-left: auto;
  flex-shrink: 0;
}
.tree-node:hover .node-actions {
  display: flex;
}
.row-icon {
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.15s;
  font-size: 12px;
}
.row-icon:hover {
  background: var(--primary-tint);
  color: var(--primary-color);
}
.row-icon.danger:hover {
  background: var(--primary-tint);
  color: var(--accent-color);
}

/* Element tree overrides */
:deep(.el-tree) {
  background: transparent;
  color: var(--text-secondary);
}
:deep(.el-tree-node__content) {
  height: 34px;
  padding-right: 8px;
  border-radius: var(--radius-sm);
  margin: 2px 0;
  transition: background 0.15s;
}
:deep(.el-tree-node__content:hover) {
  background: var(--bg-cream);
}
:deep(.el-tree-node.is-current > .el-tree-node__content) {
  background: var(--primary-tint) !important;
}
:deep(.el-tree-node__expand-icon) {
  color: var(--text-muted);
}
:deep(.el-tree-node__expand-icon.is-leaf) {
  color: transparent;
}

/* ===== Detail panel ===== */
.detail-panel {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  background: var(--bg-white);
  border: 1px solid var(--border-hairline);
  border-radius: var(--radius-lg);
  overflow: hidden;
}
.detail-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  border-bottom: 1px solid var(--border-hairline);
  background: var(--bg-cream);
  flex-shrink: 0;
}
.detail-breadcrumb {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  min-width: 0;
  color: var(--text-muted);
}
.breadcrumb-label { color: var(--text-muted); }
.breadcrumb-type { font-weight: 500; }
.breadcrumb-title {
  color: var(--text-ink);
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 260px;
}
.detail-actions {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
}
.toolbar-icon-btn {
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
  background: var(--bg-white);
  border: 1px solid var(--border-hairline);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s;
}
.toolbar-icon-btn:hover {
  color: var(--primary-color);
  border-color: var(--primary-color);
  background: var(--bg-cream);
}
.toolbar-icon-btn.danger:hover {
  color: var(--accent-color);
  border-color: var(--accent-color);
  background: var(--primary-tint);
}

.detail-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 24px 32px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* ===== Node hero ===== */
.node-hero {
  background: linear-gradient(135deg, var(--bg-cream) 0%, transparent 100%);
  border: 1px solid var(--border-hairline);
  border-left: 4px solid var(--primary-color);
  border-radius: var(--radius-md);
  padding: 20px 24px;
}
.hero-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;
}
.hero-title {
  font-size: 22px;
  font-weight: 700;
  color: var(--text-ink);
  margin: 0;
  line-height: 1.3;
}
.hero-type-tag {
  font-size: 11px;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 12px;
  border: 1px solid;
  white-space: nowrap;
  flex-shrink: 0;
}
.hero-summary {
  color: var(--text-secondary);
  font-size: 14px;
  line-height: 1.7;
  margin: 8px 0 12px;
}
.hero-meta {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  margin-top: 8px;
}
.meta-item {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: var(--text-muted);
}

/* ===== Content empty ===== */
.content-empty {
  flex: 1;
  min-height: 200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: var(--text-muted);
  background: var(--bg-cream);
  border: 1px dashed var(--border-hairline);
  border-radius: var(--radius-md);
  padding: 32px;
}
.content-empty p { font-size: 14px; }

/* ===== Markdown preview ===== */
.markdown-preview {
  color: var(--text-secondary);
  font-size: 15px;
  line-height: 1.9;
}
.markdown-preview :deep(h1) {
  font-size: 22px;
  font-weight: 700;
  color: var(--text-ink);
  margin: 20px 0 14px;
  padding-bottom: 8px;
  border-bottom: 2px solid var(--primary-color);
}
.markdown-preview :deep(h1):first-child { margin-top: 0; }
.markdown-preview :deep(h2) {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-ink);
  margin: 24px 0 10px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.markdown-preview :deep(h2)::before {
  content: '';
  display: inline-block;
  width: 4px;
  height: 16px;
  background: var(--primary-color);
  border-radius: 2px;
}
.markdown-preview :deep(h3) {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-ink);
  margin: 18px 0 8px;
}
.markdown-preview :deep(h4),
.markdown-preview :deep(h5),
.markdown-preview :deep(h6) {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-secondary);
  margin: 14px 0 6px;
}
.markdown-preview :deep(p) { margin: 0 0 10px; }
.markdown-preview :deep(p.md-empty) { color: var(--text-muted); font-style: italic; }
.markdown-preview :deep(strong) { color: var(--text-ink); font-weight: 600; }
.markdown-preview :deep(em) { color: var(--primary-color); font-style: italic; }
.markdown-preview :deep(a) { color: var(--primary-light); text-decoration: none; }
.markdown-preview :deep(a):hover { text-decoration: underline; }
.markdown-preview :deep(code) {
  font-family: 'JetBrains Mono', 'Consolas', monospace;
  font-size: 13px;
  background: var(--primary-tint);
  border: 1px solid var(--primary-tint);
  border-radius: 4px;
  padding: 1px 6px;
  color: var(--primary-hover);
}
.markdown-preview :deep(pre) {
  background: var(--bg-cream);
  border: 1px solid var(--border-hairline);
  border-radius: var(--radius-sm);
  padding: 14px 18px;
  overflow-x: auto;
  margin: 10px 0;
}
.markdown-preview :deep(pre code) {
  background: none;
  border: none;
  padding: 0;
  color: var(--text-secondary);
  font-size: 13px;
}
.markdown-preview :deep(blockquote) {
  margin: 10px 0;
  padding: 8px 14px;
  border-left: 3px solid var(--primary-color);
  background: var(--bg-cream);
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
  color: var(--text-secondary);
  font-style: italic;
}
.markdown-preview :deep(ul),
.markdown-preview :deep(ol) {
  padding-left: 20px;
  margin: 8px 0 12px;
}
.markdown-preview :deep(li) { margin-bottom: 4px; }
.markdown-preview :deep(ul li)::marker,
.markdown-preview :deep(ol li)::marker { color: var(--primary-color); }
.markdown-preview :deep(hr) {
  border: none;
  border-top: 1px solid var(--border-hairline);
  margin: 20px 0;
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
.no-sel-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  text-align: center;
  padding: 40px;
  max-width: 380px;
}
.no-sel-icon {
  width: 96px;
  height: 96px;
  border-radius: 50%;
  background: var(--bg-cream);
  border: 1px dashed var(--primary-tint);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--primary-light);
}
.no-sel-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-secondary);
}
.no-sel-sub {
  font-size: 13px;
  color: var(--text-muted);
  line-height: 1.7;
}
.legend {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 16px;
  justify-content: center;
  padding-top: 12px;
  margin-top: 4px;
  border-top: 1px solid var(--border-hairline);
  width: 100%;
}
.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--text-muted);
}
.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  box-shadow: 0 0 6px currentColor;
}
.option-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* ===== Dialog ===== */
.map-dialog :deep(.el-dialog) {
  background: var(--bg-white) !important;
  border: 1px solid var(--border-hairline) !important;
  border-radius: var(--radius-lg) !important;
}
.map-dialog :deep(.el-dialog__header) {
  padding: 20px 24px 12px;
  border-bottom: 1px solid var(--border-hairline);
}
.map-dialog :deep(.el-dialog__title) {
  color: var(--text-ink);
  font-weight: 600;
  font-size: 16px;
}
.map-dialog :deep(.el-dialog__body) {
  padding: 20px 24px;
}
.map-dialog :deep(.el-dialog__footer) {
  padding: 12px 24px 20px;
  border-top: 1px solid var(--border-hairline);
}
.dialog-form :deep(.el-form-item__label) {
  color: var(--text-secondary);
  font-weight: 500;
}
.form-row {
  display: flex;
  gap: 12px;
}
.form-col { flex: 1; }
.form-col-small { width: 140px; flex-shrink: 0; }
.dialog-import-row {
  display: flex;
  align-items: center;
  gap: 10px;
}
.import-hint {
  font-size: 12px;
  color: var(--primary-color);
}
</style>