<template>
  <div class="project-list">
    <!-- 顶部工具栏 -->
    <div class="toolbar">
      <el-input
        v-model="searchKeyword"
        placeholder="搜索项目名称..."
        :prefix-icon="Search"
        clearable
        class="search-input"
        @input="onSearch"
      />
      <el-button type="primary" @click="openCreateDialog">
        <el-icon><Plus /></el-icon>
        新建项目
      </el-button>
    </div>

    <!-- 项目卡片网格 -->
    <div v-loading="loading">
      <div v-if="projects.length === 0 && !loading" class="empty-hint">
        <el-empty description="暂无项目，点击上方按钮创建" />
      </div>

      <el-row v-else :gutter="16">
        <el-col
          v-for="item in projects"
          :key="item.id"
          :xs="24"
          :sm="12"
          :md="8"
          :lg="6"
        >
          <el-card shadow="hover" class="project-card" @click="goToDetail(item.id)">
            <div class="card-header">
              <span class="card-title">{{ item.name }}</span>
              <el-dropdown trigger="click" @command="(cmd: string) => handleCommand(cmd, item)">
                <el-button text :icon="MoreFilled" class="more-btn" @click.stop />
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="edit">编辑</el-dropdown-item>
                    <el-dropdown-item command="delete" divided>删除</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>

            <div class="card-meta">
              <el-tag :color="statusColor(item.status)" effect="dark" size="small" style="border-color: transparent;">
                {{ statusLabel(item.status) }}
              </el-tag>
              <el-tag v-if="item.type" size="small" effect="plain" style="border-color: #2a2a3e; color: #a0a0b0;">
                {{ typeLabel(item.type) }}
              </el-tag>
            </div>

            <el-progress
              :percentage="item.progress"
              :color="progressColor(item.progress)"
              :stroke-width="6"
              style="margin: 10px 0;"
            />

            <div class="card-footer">
              <span class="card-code">{{ item.projectCode }}</span>
              <span class="card-time">{{ formatDate(item.updatedAt) }}</span>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 分页 -->
    <div v-if="total > 0" class="pagination-wrap">
      <el-pagination
        v-model:current-page="pageNum"
        v-model:page-size="pageSize"
        :total="total"
        :page-sizes="[8, 16, 24]"
        layout="total, sizes, prev, pager, next"
        background
        @size-change="fetchProjects"
        @current-change="fetchProjects"
      />
    </div>

    <!-- 创建/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑项目' : '新建项目'"
      width="520px"
      destroy-on-close
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="formRules"
        label-position="top"
      >
        <el-form-item label="项目名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入项目名称" />
        </el-form-item>
        <el-form-item label="项目类型" prop="type">
          <el-select v-model="form.type" placeholder="请选择项目类型" style="width: 100%;">
            <el-option label="漫画" value="MANHUA" />
            <el-option label="动画" value="ANIMATION" />
            <el-option label="短剧" value="SHORT_DRAMA" />
            <el-option label="其他" value="OTHER" />
          </el-select>
        </el-form-item>
        <el-form-item label="项目状态" prop="status">
          <el-select v-model="form.status" placeholder="请选择状态" style="width: 100%;">
            <el-option label="未开始" value="NOT_STARTED" />
            <el-option label="进行中" value="IN_PROGRESS" />
            <el-option label="已完成" value="COMPLETED" />
          </el-select>
        </el-form-item>
        <el-form-item label="项目摘要" prop="summary">
          <el-input
            v-model="form.summary"
            type="textarea"
            :rows="3"
            placeholder="请输入项目摘要（可选）"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">
          {{ isEdit ? '保存' : '创建' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Plus, MoreFilled } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import { getProjects, createProject, updateProject, deleteProject } from '@/api/index'
import type { Project } from '@/types'

const router = useRouter()
const loading = ref(false)
const submitting = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const editingId = ref<number | null>(null)
const formRef = ref<FormInstance>()

const searchKeyword = ref('')
const projects = ref<Project[]>([])
const total = ref(0)
const pageNum = ref(1)
const pageSize = ref(8)

let searchTimer: ReturnType<typeof setTimeout> | null = null

const form = reactive({
  name: '',
  type: '',
  status: 'NOT_STARTED',
  summary: '',
})

const formRules: FormRules = {
  name: [{ required: true, message: '请输入项目名称', trigger: 'blur' }],
  type: [{ required: true, message: '请选择项目类型', trigger: 'change' }],
}

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    COMPLETED: '已完成',
    IN_PROGRESS: '进行中',
    NOT_STARTED: '未开始',
  }
  return map[status] || status
}

function statusColor(status: string): string {
  const map: Record<string, string> = {
    COMPLETED: '#67c23a',
    IN_PROGRESS: '#e8a850',
    NOT_STARTED: '#909399',
  }
  return map[status] || '#909399'
}

function typeLabel(type: string): string {
  const map: Record<string, string> = {
    MANHUA: '漫画',
    ANIMATION: '动画',
    SHORT_DRAMA: '短剧',
    OTHER: '其他',
  }
  return map[type] || type
}

function progressColor(progress: number): string {
  if (progress >= 100) return '#67c23a'
  if (progress >= 50) return '#e8a850'
  return '#409eff'
}

function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function goToDetail(id: number) {
  router.push(`/projects/${id}`)
}

function onSearch() {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    pageNum.value = 1
    fetchProjects()
  }, 300)
}

async function fetchProjects() {
  loading.value = true
  try {
    const params: Record<string, unknown> = {
      page: pageNum.value,
      pageSize: pageSize.value,
    }
    if (searchKeyword.value) {
      params.name = searchKeyword.value
    }
    const res = await getProjects(params)
    const pageResult = res.data.data
    if (pageResult && typeof pageResult === 'object' && 'records' in pageResult) {
      projects.value = (pageResult as { records: Project[] }).records
      total.value = (pageResult as { total: number }).total
    }
  } catch {
    // handled by interceptor
  } finally {
    loading.value = false
  }
}

function openCreateDialog() {
  isEdit.value = false
  editingId.value = null
  form.name = ''
  form.type = ''
  form.status = 'NOT_STARTED'
  form.summary = ''
  dialogVisible.value = true
}

function openEditDialog(item: Project) {
  isEdit.value = true
  editingId.value = item.id
  form.name = item.name
  form.type = item.type
  form.status = item.status
  form.summary = item.summary || ''
  dialogVisible.value = true
}

function handleCommand(cmd: string, item: Project) {
  if (cmd === 'edit') {
    openEditDialog(item)
  } else if (cmd === 'delete') {
    handleDelete(item)
  }
}

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    const data: Record<string, unknown> = {
      name: form.name,
      type: form.type,
      status: form.status,
      summary: form.summary,
    }

    if (isEdit.value && editingId.value) {
      await updateProject(editingId.value, data)
      ElMessage.success('项目更新成功')
    } else {
      await createProject(data)
      ElMessage.success('项目创建成功')
    }
    dialogVisible.value = false
    fetchProjects()
  } catch {
    // handled by interceptor
  } finally {
    submitting.value = false
  }
}

async function handleDelete(item: Project) {
  try {
    await ElMessageBox.confirm(
      `确定要删除项目「${item.name}」吗？删除后无法恢复。`,
      '删除确认',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning',
        confirmButtonClass: 'el-button--danger',
      },
    )
    await deleteProject(item.id)
    ElMessage.success('项目已删除')
    fetchProjects()
  } catch {
    // cancelled or error
  }
}

onMounted(() => {
  fetchProjects()
})
</script>

<style scoped>
.project-list {
  padding: 4px;
}

/* 工具栏 */
.toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.search-input {
  width: 320px;
}

/* 项目卡片 */
.project-card {
  background: var(--bg-white);
  border: 1px solid var(--border-hairline);
  border-radius: var(--radius-lg);
  margin-bottom: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.project-card:hover {
  transform: translateY(-2px);
  border-color: var(--primary-color);
  box-shadow: var(--shadow-glow);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.card-title {
  color: var(--text-secondary);
  font-size: 15px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  margin-right: 8px;
}

.more-btn {
  color: var(--text-muted);
  flex-shrink: 0;
}

.more-btn:hover {
  color: var(--primary-color);
}

.card-meta {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 4px;
}

.card-code {
  font-size: 12px;
  color: var(--text-muted);
  font-family: monospace;
}

.card-time {
  font-size: 12px;
  color: var(--text-muted);
}

/* 分页 */
.pagination-wrap {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.empty-hint {
  padding: 80px 0;
}
</style>
