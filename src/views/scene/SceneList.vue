<template>
  <div class="scene-list">
    <div class="page-header">
      <h2 class="page-title">场景管理</h2>
      <div class="header-actions">
        <ProjectSwitcher />
        <el-input
          v-model="search"
          placeholder="搜索场景名称..."
          clearable
          style="width: 220px"
          :prefix-icon="Search"
        />
        <el-button type="primary" @click="openAdd" :disabled="!currentProjectId">新建场景</el-button>
      </div>
    </div>

    <el-empty v-if="!currentProjectId" description="请先选择项目" />

    <template v-else>
      <div class="card-grid" v-if="filteredList.length">
        <el-card
          v-for="scene in filteredList"
          :key="scene.id"
          class="scene-card"
          shadow="hover"
          @click="$router.push(`/scenes/${scene.id}`)"
        >
          <div class="card-header">
            <span class="scene-name">{{ scene.sceneName }}</span>
            <el-tag size="small" :type="scene.status === 'ACTIVE' ? 'success' : 'info'">
              {{ scene.status === 'ACTIVE' ? '启用' : '停用' }}
            </el-tag>
          </div>
          <div class="card-detail" v-if="scene.location">
            <el-icon><Location /></el-icon>
            <span>{{ scene.location }}</span>
          </div>
          <div class="card-tags">
            <el-tag size="small" effect="plain" v-if="scene.timeOfDay">{{ scene.timeOfDay }}</el-tag>
            <el-tag size="small" effect="plain" type="warning" v-if="scene.weather">{{ scene.weather }}</el-tag>
            <el-tag size="small" effect="plain" type="info" v-if="scene.atmosphere">{{ scene.atmosphere }}</el-tag>
          </div>
        </el-card>
      </div>
      <el-empty v-else description="暂无场景数据" />

      <el-dialog v-model="dialogVisible" title="新建场景" width="520px">
        <el-form :model="form" label-position="top">
          <el-form-item label="场景名称" required>
            <el-input v-model="form.sceneName" placeholder="请输入场景名称" />
          </el-form-item>
          <el-form-item label="地点">
            <el-input v-model="form.location" placeholder="如：教室、咖啡厅" />
          </el-form-item>
          <el-form-item label="时间">
            <el-select v-model="form.timeOfDay" style="width: 100%" clearable>
              <el-option label="早晨" value="MORNING" />
              <el-option label="白天" value="DAY" />
              <el-option label="黄昏" value="DUSK" />
              <el-option label="夜晚" value="NIGHT" />
              <el-option label="深夜" value="MIDNIGHT" />
            </el-select>
          </el-form-item>
          <el-form-item label="天气">
            <el-select v-model="form.weather" style="width: 100%" clearable>
              <el-option label="晴天" value="SUNNY" />
              <el-option label="多云" value="CLOUDY" />
              <el-option label="雨天" value="RAINY" />
              <el-option label="雪天" value="SNOWY" />
              <el-option label="大风" value="WINDY" />
            </el-select>
          </el-form-item>
          <el-form-item label="氛围">
            <el-input v-model="form.atmosphere" placeholder="如：紧张、温馨" />
          </el-form-item>
          <el-form-item label="描述">
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
import { Search, Location } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { listAll, createOne } from '@/api/index'
import { useAppStore } from '@/stores/app'
import ProjectSwitcher from '@/components/ProjectSwitcher.vue'

interface Scene {
  id: number
  sceneName: string
  location: string
  timeOfDay: string
  weather: string
  atmosphere: string
  description: string
  status: string
  projectId: number
}

const router = useRouter()
const appStore = useAppStore()
const currentProjectId = computed(() => appStore.currentProjectId)

const search = ref('')
const sceneList = ref<Scene[]>([])
const saving = ref(false)
const dialogVisible = ref(false)
const form = ref({ sceneName: '', location: '', timeOfDay: '', weather: '', atmosphere: '', description: '' })

const filteredList = computed(() => {
  if (!search.value) return sceneList.value
  const keyword = search.value.toLowerCase()
  return sceneList.value.filter(s => s.sceneName?.toLowerCase().includes(keyword))
})

async function fetchScenes() {
  if (!currentProjectId.value) return
  try {
    const res = await listAll(`/projects/${currentProjectId.value}/scenes`, { page: 1, pageSize: 200 })
    sceneList.value = (res.data.data.records || []) as Scene[]
  } catch { /* handled */ }
}

function openAdd() {
  form.value = { sceneName: '', location: '', timeOfDay: '', weather: '', atmosphere: '', description: '' }
  dialogVisible.value = true
}

async function handleCreate() {
  if (!currentProjectId.value || !form.value.sceneName) return
  saving.value = true
  try {
    await createOne(`/projects/${currentProjectId.value}/scenes`, {
      ...form.value,
      status: 'ACTIVE',
      projectId: currentProjectId.value,
    })
    ElMessage.success('创建成功')
    dialogVisible.value = false
    await fetchScenes()
  } catch { /* handled */ } finally { saving.value = false }
}

onMounted(fetchScenes)
</script>

<style scoped>
.scene-list { height: 100%; display: flex; flex-direction: column; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 8px; }
.page-title { color: #e8a850; font-size: 20px; font-weight: 600; }
.header-actions { display: flex; gap: 12px; align-items: center; }

.card-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 16px; }
.scene-card { background: #16162a; border: 1px solid #2a2a3e; cursor: pointer; transition: transform 0.2s, border-color 0.2s; }
.scene-card:hover { transform: translateY(-2px); border-color: #e8a850; }
.card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.scene-name { color: #c0c0d0; font-size: 15px; font-weight: 600; }
.card-detail { display: flex; align-items: center; gap: 6px; color: #808090; font-size: 13px; margin-bottom: 10px; }
.card-tags { display: flex; gap: 6px; flex-wrap: wrap; }
</style>
