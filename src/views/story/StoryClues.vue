<template>
  <div class="story-clues">
    <!-- Header -->
    <div class="page-header">
      <div class="page-title-group">
        <el-icon class="title-icon"><Compass /></el-icon>
        <h2 class="page-title">故事线索</h2>
        <span class="title-badge">Clues</span>
        <span v-if="filteredList.length" class="count-chip">{{ filteredList.length }} 条线索</span>
      </div>
      <div class="header-actions">
        <ProjectSwitcher />
        <el-button class="btn-create" type="primary" @click="openAdd" :disabled="!currentProjectId">
          <el-icon><Plus /></el-icon> 新建线索
        </el-button>
      </div>
    </div>

    <!-- Empty project -->
    <div v-if="!currentProjectId" class="empty-state">
      <div class="empty-icon-wrap"><el-icon size="44"><Folder /></el-icon></div>
      <p class="empty-title">请先选择项目</p>
      <p class="empty-sub">切换项目后即可管理故事线索</p>
    </div>

    <template v-else>
      <!-- Stats strip -->
      <div class="stats-strip">
        <div
          v-for="stat in statusStats"
          :key="stat.key"
          :class="['stat-chip', { active: filterStatus === stat.key }]"
          @click="filterStatus = stat.key"
        >
          <span class="chip-dot" :style="{ background: stat.color }"></span>
          <span class="chip-label">{{ stat.label }}</span>
          <span class="chip-count">{{ stat.count }}</span>
        </div>
      </div>

      <!-- Search -->
      <div class="toolbar">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索线索编号、名称或描述..."
          size="default"
          clearable
          class="search-input"
        >
          <template #prefix><el-icon><Search /></el-icon></template>
        </el-input>
      </div>

      <!-- Grid -->
      <div v-if="filteredList.length" class="clue-grid">
        <div
          v-for="clue in filteredList"
          :key="clue.id"
          class="clue-card"
          :class="'status-' + (clue.status || 'UNRESOLVED').toLowerCase()"
        >
          <div class="card-top">
            <div class="clue-code">
              <el-icon><Key /></el-icon>
              <span>{{ clue.clueCode }}</span>
            </div>
            <span class="status-pill" :class="'pill-' + (clue.status || 'UNRESOLVED').toLowerCase()">
              {{ statusLabel(clue.status) }}
            </span>
          </div>
          <div class="clue-name" :title="clue.clueName">{{ clue.clueName }}</div>
          <div class="clue-desc" v-if="clue.description">{{ clue.description }}</div>
          <div class="clue-desc muted" v-else>暂无描述</div>
          <div class="clue-meta">
            <span class="meta-item" v-if="clue.firstEpisodeId">
              <el-icon><VideoPlay /></el-icon> 首次出场: 第 {{ clue.firstEpisodeId }} 集
            </span>
            <span class="meta-item muted" v-else>
              <el-icon><VideoPlay /></el-icon> 未指定出场集
            </span>
            <span class="meta-item" v-if="clue.keyCharacterIds">
              <el-icon><UserFilled /></el-icon> {{ characterCount(clue.keyCharacterIds) }} 个关联
            </span>
          </div>
          <div class="clue-actions">
            <el-button size="small" plain class="action-btn" @click="openEdit(clue)">
              <el-icon><EditPen /></el-icon> 编辑
            </el-button>
            <el-button size="small" plain class="action-btn danger" @click="handleDelete(clue)">
              <el-icon><Delete /></el-icon> 删除
            </el-button>
          </div>
        </div>
      </div>

      <div v-else class="empty-state">
        <div class="empty-icon-wrap"><el-icon size="44"><Compass /></el-icon></div>
        <p class="empty-title">{{ searchKeyword || filterStatus ? '没有匹配的线索' : '暂无线索' }}</p>
        <p class="empty-sub">
          {{ searchKeyword || filterStatus ? '试试换个筛选条件' : '点击右上角新建按钮添加第一条线索' }}
        </p>
      </div>
    </template>

    <!-- Dialog -->
    <el-dialog
      v-model="dialogVisible"
      :title="editingId ? '编辑线索' : '新建线索'"
      width="560px"
      class="clue-dialog"
    >
      <el-form :model="form" label-position="top" class="dialog-form">
        <div class="form-row">
          <el-form-item label="线索编号" required class="form-col-small">
            <el-input v-model="form.clueCode" placeholder="如 C001" />
          </el-form-item>
          <el-form-item label="线索名称" required class="form-col">
            <el-input v-model="form.clueName" placeholder="请输入线索名称" />
          </el-form-item>
        </div>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="描述线索的内容、发现方式或悬念" />
        </el-form-item>
        <div class="form-row">
          <el-form-item label="状态" class="form-col">
            <el-select v-model="form.status" style="width: 100%">
              <el-option label="未揭晓" value="UNRESOLVED" />
              <el-option label="已揭示" value="REVEALED" />
              <el-option label="已放弃" value="ABANDONED" />
            </el-select>
          </el-form-item>
          <el-form-item label="首次出场集" class="form-col">
            <el-input-number v-model="form.firstEpisodeId" :min="0" style="width: 100%" />
          </el-form-item>
        </div>
        <el-form-item label="关联人物">
          <el-input v-model="form.keyCharacterIds" placeholder="多个人物 ID 用逗号分隔，例如 1,2,3" />
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
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Compass, Plus, Folder, Search, Key, VideoPlay,
  UserFilled, EditPen, Delete, Check,
} from '@element-plus/icons-vue'
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
const searchKeyword = ref('')
const filterStatus = ref('')
const saving = ref(false)
const dialogVisible = ref(false)
const editingId = ref<number | null>(null)
const form = ref({ clueCode: '', clueName: '', description: '', status: 'UNRESOLVED', firstEpisodeId: 0, keyCharacterIds: '' })

const filteredList = computed(() => {
  let list = clueList.value
  if (filterStatus.value) {
    list = list.filter(c => c.status === filterStatus.value)
  }
  const kw = searchKeyword.value.trim().toLowerCase()
  if (kw) {
    list = list.filter(c =>
      c.clueCode?.toLowerCase().includes(kw) ||
      c.clueName?.toLowerCase().includes(kw) ||
      c.description?.toLowerCase().includes(kw)
    )
  }
  return list
})

const statusStats = computed(() => {
  const total = clueList.value.length
  const unresolved = clueList.value.filter(c => c.status === 'UNRESOLVED').length
  const revealed = clueList.value.filter(c => c.status === 'REVEALED').length
  const abandoned = clueList.value.filter(c => c.status === 'ABANDONED').length
  return [
    { key: '',           label: '全部',   count: total,      color: '#8A867F' },
    { key: 'UNRESOLVED', label: '未揭晓', count: unresolved, color: '#D4A05C' },
    { key: 'REVEALED',   label: '已揭示', count: revealed,   color: '#5C8A5C' },
    { key: 'ABANDONED',  label: '已放弃', count: abandoned,  color: '#B0AAA0' },
  ]
})

function characterCount(ids: string): number {
  return ids.split(',').map(s => s.trim()).filter(Boolean).length
}

async function fetchClues() {
  if (!currentProjectId.value) return
  try {
    const res = await listAll('/projects/clues', { projectId: currentProjectId.value, page: 1, pageSize: 200 })
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
  form.value = {
    clueCode: row.clueCode,
    clueName: row.clueName,
    description: row.description || '',
    status: row.status,
    firstEpisodeId: row.firstEpisodeId,
    keyCharacterIds: row.keyCharacterIds || '',
  }
  dialogVisible.value = true
}

async function handleSave() {
  if (!currentProjectId.value || !form.value.clueCode || !form.value.clueName) return
  saving.value = true
  try {
    const payload = { ...form.value, projectId: currentProjectId.value }
    if (editingId.value) {
      await updateOne('/projects/clues', payload, { projectId: currentProjectId.value, id: editingId.value })
      ElMessage.success('更新成功')
    } else {
      await createOne('/projects/clues', payload, { projectId: currentProjectId.value })
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    await fetchClues()
  } catch { /* handled */ } finally { saving.value = false }
}

async function handleDelete(row: Clue) {
  try {
    await ElMessageBox.confirm(`确定删除线索「${row.clueName}」吗？`, '删除确认', { type: 'warning' })
    await deleteOne('/projects/clues', { projectId: currentProjectId.value, id: row.id })
    ElMessage.success('删除成功')
    await fetchClues()
  } catch { /* cancelled or handled */ }
}

function statusLabel(status: string) {
  const map: Record<string, string> = { UNRESOLVED: '未揭晓', REVEALED: '已揭示', ABANDONED: '已放弃' }
  return map[status] || status
}

onMounted(fetchClues)
</script>

<style scoped>
.story-clues {
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
  margin: 0;
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
.count-chip {
  font-size: 12px;
  color: var(--text-secondary);
  background: var(--bg-white);
  border: 1px solid var(--border-hairline);
  border-radius: var(--radius-pill);
  padding: 2px 10px;
}
.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}
.btn-create {
  background: var(--primary-color) !important;
  color: white !important;
  border: none !important;
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
  padding: 60px 20px;
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
  color: var(--primary-color);
}
.empty-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-ink);
  margin: 0;
}
.empty-sub {
  font-size: 13px;
  color: var(--text-secondary);
  margin: 0;
}

/* ===== Stats strip ===== */
.stats-strip {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
.stat-chip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: var(--bg-white);
  border: 1px solid var(--border-hairline);
  border-radius: var(--radius-pill);
  cursor: pointer;
  transition: all 0.2s ease;
}
.stat-chip:hover {
  border-color: var(--primary-color);
  transform: translateY(-1px);
  box-shadow: var(--shadow-soft);
}
.stat-chip.active {
  border-color: var(--primary-color);
  background: var(--primary-tint);
  box-shadow: var(--shadow-soft);
}
.chip-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
.chip-label {
  color: var(--text-body);
  font-size: 13px;
  font-weight: 500;
}
.stat-chip.active .chip-label {
  color: var(--primary-color);
}
.chip-count {
  color: var(--text-secondary);
  font-size: 12px;
  background: var(--bg-cream);
  border-radius: var(--radius-pill);
  padding: 1px 8px;
  min-width: 24px;
  text-align: center;
}
.stat-chip.active .chip-count {
  color: var(--primary-color);
  background: var(--bg-white);
}

/* ===== Toolbar ===== */
.toolbar {
  display: flex;
  gap: 12px;
  align-items: center;
}
.search-input {
  max-width: 360px;
}

/* ===== Clue grid ===== */
.clue-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
  padding-bottom: 8px;
}
.clue-card {
  position: relative;
  background: var(--bg-white);
  border: 1px solid var(--border-hairline);
  border-radius: var(--radius-lg);
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  transition: all 0.25s ease;
  overflow: hidden;
}
.clue-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
  background: var(--border-hairline);
  transition: background 0.25s ease;
}
.clue-card.status-unresolved::before { background: #D4A05C; }
.clue-card.status-revealed::before   { background: #5C8A5C; }
.clue-card.status-abandoned::before  { background: #B0AAA0; }

.clue-card:hover {
  transform: translateY(-2px);
  border-color: var(--primary-color);
  box-shadow: var(--shadow-hover);
}

.card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.clue-code {
  display: flex;
  align-items: center;
  gap: 5px;
  font-family: 'JetBrains Mono', 'Consolas', monospace;
  font-size: 12px;
  color: var(--primary-color);
  background: var(--primary-tint);
  border-radius: var(--radius-sm);
  padding: 3px 8px;
  font-weight: 500;
}
.status-pill {
  font-size: 11px;
  font-weight: 500;
  padding: 3px 10px;
  border-radius: var(--radius-pill);
  white-space: nowrap;
}
.pill-unresolved {
  color: #8B5E1F;
  background: #FBEEDA;
  border: 1px solid #F0D9AF;
}
.pill-revealed {
  color: #3D5F3D;
  background: #E1EEE1;
  border: 1px solid #C3DDC3;
}
.pill-abandoned {
  color: #5C5A55;
  background: #EEECE6;
  border: 1px solid #DED9CE;
}

.clue-name {
  color: var(--text-ink);
  font-size: 16px;
  font-weight: 600;
  line-height: 1.4;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.clue-desc {
  color: var(--text-body);
  font-size: 13px;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: 42px;
}
.clue-desc.muted {
  color: var(--text-muted);
  font-style: italic;
}

.clue-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 14px;
  padding-top: 8px;
  border-top: 1px dashed var(--border-hairline);
}
.meta-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--text-secondary);
  font-size: 12px;
}
.meta-item.muted {
  color: var(--text-muted);
}

.clue-actions {
  display: flex;
  gap: 8px;
  margin-top: 4px;
}
.action-btn {
  flex: 1;
  background: var(--bg-white) !important;
  border: 1px solid var(--border-hairline) !important;
  color: var(--text-body) !important;
  font-weight: 400;
  gap: 4px;
}
.action-btn:hover {
  border-color: var(--primary-color) !important;
  color: var(--primary-color) !important;
  background: var(--primary-tint) !important;
}
.action-btn.danger:hover {
  border-color: var(--accent-color) !important;
  color: var(--accent-color) !important;
  background: var(--primary-tint) !important;
}

/* ===== Dialog ===== */
.clue-dialog :deep(.el-dialog__header) {
  padding: 20px 24px 12px;
  border-bottom: 1px solid var(--border-hairline);
}
.clue-dialog :deep(.el-dialog__title) {
  color: var(--text-ink);
  font-weight: 600;
  font-size: 16px;
}
.clue-dialog :deep(.el-dialog__body) { padding: 20px 24px; }
.clue-dialog :deep(.el-dialog__footer) {
  padding: 12px 24px 20px;
  border-top: 1px solid var(--border-hairline);
}
.dialog-form :deep(.el-form-item__label) {
  color: var(--text-ink);
  font-weight: 500;
}
.form-row {
  display: flex;
  gap: 12px;
}
.form-col { flex: 1; }
.form-col-small { width: 140px; flex-shrink: 0; }
</style>
