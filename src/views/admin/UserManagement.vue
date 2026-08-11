<template>
  <div class="user-management">
    <div class="page-header">
      <h2 class="page-title">用户管理</h2>
      <el-button type="primary" @click="openAdd">新建用户</el-button>
    </div>

    <el-card class="table-card">
      <div class="search-bar">
        <el-input v-model="keyword" placeholder="搜索用户名/昵称/邮箱" clearable @clear="fetchUsers" @keyup.enter="fetchUsers" style="width: 300px">
          <template #prefix><el-icon><Search /></el-icon></template>
        </el-input>
        <el-button @click="fetchUsers">搜索</el-button>
      </div>

      <el-table :data="userList" style="width: 100%" v-loading="loading">
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="username" label="用户名" width="160" />
        <el-table-column prop="nickname" label="昵称" width="140" />
        <el-table-column prop="email" label="邮箱" min-width="200" show-overflow-tooltip />
        <el-table-column label="角色" width="100">
          <template #default="{ row }">
            <el-tag :type="row.role === 'ADMIN' ? 'danger' : 'info'" size="small">{{ row.role === 'ADMIN' ? '管理员' : '普通用户' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-switch
              :model-value="row.enabled"
              :loading="togglingIds.has(row.id)"
              @change="handleToggle(row)"
              :disabled="row.id === currentUserId"
            />
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="170" />
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="openEdit(row)" :disabled="row.id === currentUserId && row.role === 'ADMIN'">编辑</el-button>
            <el-button link type="danger" size="small" @click="handleDelete(row)" :disabled="row.id === currentUserId">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrap">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          @change="fetchUsers"
        />
      </div>
    </el-card>

    <!-- Add/Edit Dialog -->
    <el-dialog v-model="dialogVisible" :title="editingId ? '编辑用户' : '新建用户'" width="480px" class="dark-dialog">
      <el-form :model="form" label-position="top">
        <el-form-item label="用户名" required>
          <el-input v-model="form.username" placeholder="3-32位字符" :disabled="!!editingId" />
        </el-form-item>
        <el-form-item label="昵称">
          <el-input v-model="form.nickname" placeholder="选填" />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="form.email" placeholder="选填" />
        </el-form-item>
        <el-form-item label="角色" required>
          <el-select v-model="form.role" style="width: 100%">
            <el-option label="普通用户" value="USER" />
            <el-option label="管理员" value="ADMIN" />
          </el-select>
        </el-form-item>
        <el-form-item :label="editingId ? '新密码（留空不修改）' : '密码'" :required="!editingId">
          <el-input v-model="form.password" type="password" placeholder="至少6位" show-password />
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
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import { listUsers, createUser, updateUser, deleteUser, toggleUserEnabled } from '@/api/index'
import { useUserStore } from '@/stores/user'

interface User {
  id: number
  username: string
  nickname: string
  email: string
  role: string
  enabled: boolean
  createdAt: string
}

const userStore = useUserStore()
const currentUserId = ref(userStore.user?.id ?? 0)

const userList = ref<User[]>([])
const loading = ref(false)
const keyword = ref('')
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)

const dialogVisible = ref(false)
const editingId = ref<number | null>(null)
const saving = ref(false)
const togglingIds = ref(new Set<number>())

const form = reactive({
  username: '',
  nickname: '',
  email: '',
  role: 'USER',
  password: '',
})

async function fetchUsers() {
  loading.value = true
  try {
    const res = await listUsers({ keyword: keyword.value, page: page.value, pageSize: pageSize.value })
    const data = res.data.data as any
    userList.value = data.records || []
    total.value = data.total || 0
  } catch { /* handled */ } finally { loading.value = false }
}

function openAdd() {
  editingId.value = null
  form.username = ''
  form.nickname = ''
  form.email = ''
  form.role = 'USER'
  form.password = ''
  dialogVisible.value = true
}

function openEdit(row: User) {
  editingId.value = row.id
  form.username = row.username
  form.nickname = row.nickname || ''
  form.email = row.email || ''
  form.role = row.role
  form.password = ''
  dialogVisible.value = true
}

async function handleSave() {
  if (!editingId.value && !form.username) return
  if (!editingId.value && !form.password) {
    ElMessage.warning('请输入密码')
    return
  }
  saving.value = true
  try {
    if (editingId.value) {
      await updateUser(editingId.value, {
        nickname: form.nickname,
        email: form.email,
        role: form.role,
        password: form.password || undefined,
      })
      ElMessage.success('更新成功')
    } else {
      await createUser({
        username: form.username,
        nickname: form.nickname,
        email: form.email,
        role: form.role,
        password: form.password,
      })
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    await fetchUsers()
  } catch { /* handled */ } finally { saving.value = false }
}

async function handleDelete(row: User) {
  try {
    await ElMessageBox.confirm(`确定删除用户「${row.username}」吗？`, '删除确认', { type: 'warning' })
    await deleteUser(row.id)
    ElMessage.success('删除成功')
    await fetchUsers()
  } catch { /* cancelled or handled */ }
}

async function handleToggle(row: User) {
  togglingIds.value.add(row.id)
  try {
    await toggleUserEnabled(row.id)
    row.enabled = !row.enabled
    ElMessage.success(row.enabled ? '已启用' : '已禁用')
  } catch { /* handled */ } finally {
    togglingIds.value.delete(row.id)
  }
}

onMounted(fetchUsers)
</script>

<style scoped>
.user-management { height: 100%; display: flex; flex-direction: column; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.page-title { color: #e8a850; font-size: 20px; font-weight: 600; }

.table-card { background: #16162a; border: 1px solid #2a2a3e; flex: 1; display: flex; flex-direction: column; }
.search-bar { display: flex; gap: 12px; margin-bottom: 16px; }
.pagination-wrap { margin-top: 16px; display: flex; justify-content: flex-end; }

:deep(.el-table) { background: transparent; }
:deep(.el-table th) { background: #1a1a2e; color: #808090; border-color: #2a2a3e; }
:deep(.el-table td) { border-color: #2a2a3e; color: #c0c0d0; }
:deep(.el-table__body tr) { background: #16162a; }
:deep(.el-table__body tr:hover > td) { background: #1e1e34 !important; }
</style>
