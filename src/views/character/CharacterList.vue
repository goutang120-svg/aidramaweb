<template>
  <div class="character-list">
    <div class="page-header">
      <h2 class="page-title">人物管理</h2>
      <div class="header-actions">
        <ProjectSwitcher />
        <el-input
          v-model="search"
          placeholder="搜索人物名称..."
          clearable
          style="width: 220px"
          :prefix-icon="Search"
        />
        <el-button type="primary" @click="openAdd" :disabled="!currentProjectId">新建人物</el-button>
      </div>
    </div>

    <el-empty v-if="!currentProjectId" description="请先选择项目" />

    <template v-else>
      <div class="card-grid" v-if="filteredList.length">
        <el-card
          v-for="char in filteredList"
          :key="char.id"
          class="char-card"
          shadow="hover"
          @click="$router.push(`/characters/${char.id}`)"
        >
          <div class="card-avatar">
            <div class="avatar-placeholder">{{ char.name?.charAt(0) || '?' }}</div>
          </div>
          <div class="card-info">
            <div class="char-name">{{ char.name }}</div>
            <div class="char-identity">{{ char.identity || '未设定' }}</div>
            <el-tag :type="char.status === 'MAIN' ? 'danger' : char.status === 'SECONDARY' ? 'warning' : 'info'" size="small">
              {{ statusLabel(char.status) }}
            </el-tag>
          </div>
        </el-card>
      </div>
      <el-empty v-else description="暂无人物数据" />

      <el-dialog v-model="dialogVisible" title="新建人物" width="500px">
        <el-form :model="form" label-position="top">
          <el-form-item label="姓名" required>
            <el-input v-model="form.name" placeholder="请输入人物姓名" />
          </el-form-item>
          <el-form-item label="身份">
            <el-input v-model="form.identity" placeholder="如：主角、反派" />
          </el-form-item>
          <el-form-item label="地位">
            <el-select v-model="form.status" style="width: 100%">
              <el-option label="主角 (MAIN)" value="MAIN" />
              <el-option label="配角 (SECONDARY)" value="SECONDARY" />
              <el-option label="客串 (GUEST)" value="GUEST" />
            </el-select>
          </el-form-item>
          <el-form-item label="性别">
            <el-select v-model="form.gender" style="width: 100%">
              <el-option label="男" value="MALE" />
              <el-option label="女" value="FEMALE" />
              <el-option label="其他" value="OTHER" />
            </el-select>
          </el-form-item>
          <el-form-item label="简介">
            <el-input v-model="form.description" type="textarea" :rows="3" />
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleCreate" :loading="saving">确定</el-button>
        </template>
      </el-dialog>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Search } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { listAll, createOne } from '@/api/index'
import { useAppStore } from '@/stores/app'
import ProjectSwitcher from '@/components/ProjectSwitcher.vue'

interface Character {
  id: number
  name: string
  identity: string
  status: string
  gender: string
  description: string
  projectId: number
}

const router = useRouter()
const appStore = useAppStore()
const currentProjectId = computed(() => appStore.currentProjectId)

const search = ref('')
const characterList = ref<Character[]>([])
const saving = ref(false)
const dialogVisible = ref(false)
const form = ref({ name: '', identity: '', status: 'SECONDARY', gender: 'MALE', description: '' })

const filteredList = computed(() => {
  if (!search.value) return characterList.value
  const keyword = search.value.toLowerCase()
  return characterList.value.filter(c => c.name?.toLowerCase().includes(keyword))
})

async function fetchCharacters() {
  if (!currentProjectId.value) return
  try {
    const res = await listAll(`/projects/${currentProjectId.value}/characters`, { page: 1, pageSize: 200 })
    characterList.value = (res.data.data.records || []) as Character[]
  } catch { /* handled */ }
}

function openAdd() {
  form.value = { name: '', identity: '', status: 'SECONDARY', gender: 'MALE', description: '' }
  dialogVisible.value = true
}

async function handleCreate() {
  if (!currentProjectId.value || !form.value.name) return
  saving.value = true
  try {
    await createOne(`/projects/${currentProjectId.value}/characters`, { ...form.value, projectId: currentProjectId.value })
    ElMessage.success('创建成功')
    dialogVisible.value = false
    await fetchCharacters()
  } catch { /* handled */ } finally { saving.value = false }
}

function statusLabel(status: string) {
  const map: Record<string, string> = { MAIN: '主角', SECONDARY: '配角', GUEST: '客串' }
  return map[status] || status
}

onMounted(fetchCharacters)
</script>

<style scoped>
.character-list { height: 100%; display: flex; flex-direction: column; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 8px; }
.page-title { color: var(--primary-color); font-size: 20px; font-weight: 600; }
.header-actions { display: flex; gap: 12px; align-items: center; }

.card-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 16px; }
.char-card { background: var(--bg-card); border: 1px solid var(--border-color); cursor: pointer; transition: all 0.3s ease; }
.char-card:hover { transform: translateY(-2px); border-color: var(--primary-color); box-shadow: var(--shadow-glow); }
.card-avatar { display: flex; justify-content: center; margin-bottom: 12px; }
.avatar-placeholder { width: 64px; height: 64px; border-radius: 50%; background: var(--primary-gradient); display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: 700; color: #fff; }
.card-info { text-align: center; }
.char-name { color: var(--text-secondary); font-size: 16px; font-weight: 600; margin-bottom: 4px; }
.char-identity { color: var(--text-muted); font-size: 13px; margin-bottom: 8px; }
</style>
