<template>
  <div class="story-map">
    <div class="page-header">
      <h2 class="page-title">故事地图</h2>
      <div class="header-actions">
        <ProjectSwitcher />
        <el-button type="primary" @click="openAdd(null)" :disabled="!currentProjectId">新建节点</el-button>
      </div>
    </div>

    <el-empty v-if="!currentProjectId" description="请先选择项目" />

    <div v-else class="map-container">
      <el-card class="tree-card">
        <el-tree
          :data="treeData"
          :props="{ children: 'children', label: 'title' }"
          node-key="id"
          default-expand-all
          :expand-on-click-node="true"
        >
          <template #default="{ node, data }">
            <span class="tree-node">
              <span class="node-title">{{ data.title }}</span>
              <el-tag size="small" :type="nodeTypeTag(data.nodeType)" class="node-badge">
                {{ nodeTypeLabel(data.nodeType) }}
              </el-tag>
              <span class="node-actions">
                <el-button link size="small" type="primary" @click.stop="openAdd(data)">+</el-button>
                <el-button link size="small" @click.stop="openEdit(data)">编辑</el-button>
                <el-button link size="small" type="danger" @click.stop="handleDelete(data)">删除</el-button>
              </span>
            </span>
          </template>
        </el-tree>
      </el-card>
    </div>

    <el-dialog v-model="dialogVisible" :title="editingId ? '编辑节点' : '新建节点'" width="480px">
      <el-form :model="form" label-position="top">
        <el-form-item label="标题" required>
          <el-input v-model="form.title" placeholder="请输入节点标题" />
        </el-form-item>
        <el-form-item label="节点类型" required>
          <el-select v-model="form.nodeType" placeholder="请选择节点类型" style="width: 100%">
            <el-option v-for="t in nodeTypes" :key="t.value" :label="t.label" :value="t.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="父节点" v-if="!editingId">
          <el-select v-model="form.parentId" placeholder="不选则为根节点" style="width: 100%" clearable>
            <el-option v-for="n in flatNodes" :key="n.id" :label="n.title" :value="n.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sortOrder" :min="0" />
        </el-form-item>
        <el-form-item label="描述">
          <div style="margin-bottom:8px">
            <input ref="fileInput" type="file" accept=".md,.txt" style="display:none" @change="handleFileImport" />
            <el-button size="small" @click="triggerImport">导入MD文件</el-button>
          </div>
          <el-input v-model="form.description" type="textarea" :rows="5" placeholder="可选描述，支持Markdown，或导入本地 .md 文件" />
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
import { getOne, listAll, createOne, updateOne, deleteOne } from '@/api/index'
import { useAppStore } from '@/stores/app'
import ProjectSwitcher from '@/components/ProjectSwitcher.vue'

interface MapNode {
  id: number
  title: string
  nodeType: string
  parentId: number | null
  sortOrder: number
  description: string
  projectId: number
  children?: MapNode[]
}

const appStore = useAppStore()
const currentProjectId = computed(() => appStore.currentProjectId)

const treeData = ref<MapNode[]>([])
const saving = ref(false)
const dialogVisible = ref(false)
const editingId = ref<number | null>(null)
const form = ref({ title: '', nodeType: 'NODE', parentId: null as number | null, sortOrder: 0, description: '' })
const fileInput = ref<HTMLInputElement | null>(null)

function triggerImport() { fileInput.value?.click() }
function handleFileImport(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => { form.value.description = reader.result as string }
  reader.readAsText(file, 'UTF-8')
}

const nodeTypes = [
  { label: '季 (SEASON)', value: 'SEASON' },
  { label: '主线 (ARC)', value: 'ARC' },
  { label: '集 (EPISODE)', value: 'EPISODE' },
  { label: '事件 (EVENT)', value: 'EVENT' },
  { label: '节点 (NODE)', value: 'NODE' },
]

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

async function fetchTree() {
  if (!currentProjectId.value) return
  try {
    const res = await getOne('/projects/map-nodes/tree', { projectId: currentProjectId.value })
    treeData.value = (res.data.data || []) as MapNode[]
  } catch { /* handled */ }
}

function openAdd(parent: MapNode | null) {
  editingId.value = null
  form.value = { title: '', nodeType: 'NODE', parentId: parent?.id ?? null, sortOrder: 0, description: '' }
  dialogVisible.value = true
}

function openEdit(data: MapNode) {
  editingId.value = data.id
  form.value = { title: data.title, nodeType: data.nodeType, parentId: data.parentId, sortOrder: data.sortOrder, description: data.description || '' }
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
    await ElMessageBox.confirm('确定删除该节点吗？子节点也会被删除。', '删除确认', { type: 'warning' })
    await deleteOne('/projects/map-nodes', { projectId: currentProjectId.value, id: data.id })
    ElMessage.success('删除成功')
    await fetchTree()
  } catch { /* cancelled or handled */ }
}

function nodeTypeTag(type: string) {
  const map: Record<string, string> = { SEASON: 'danger', ARC: 'warning', EPISODE: 'success', EVENT: 'info', NODE: '' }
  return map[type] || 'info'
}
function nodeTypeLabel(type: string) {
  const map: Record<string, string> = { SEASON: '季', ARC: '主线', EPISODE: '集', EVENT: '事件', NODE: '节点' }
  return map[type] || type
}

onMounted(fetchTree)
</script>

<style scoped>
.story-map { height: 100%; display: flex; flex-direction: column; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.page-title { color: #e8a850; font-size: 20px; font-weight: 600; }
.header-actions { display: flex; gap: 12px; align-items: center; }

.map-container { flex: 1; }
.tree-card { background: #16162a; border: 1px solid #2a2a3e; }
.tree-card :deep(.el-card__body) { padding: 20px; }

.tree-node { display: flex; align-items: center; gap: 8px; width: 100%; padding: 4px 0; }
.node-title { color: #c0c0d0; font-size: 14px; flex: 1; }
.node-badge { font-size: 11px; }
.node-actions { display: none; gap: 4px; margin-left: auto; }
.tree-node:hover .node-actions { display: flex; }

:deep(.el-tree) { background: transparent; }
:deep(.el-tree-node__content) { height: 36px; padding-right: 8px; }
:deep(.el-tree-node__content:hover) { background: #1a1a2e; }
</style>
