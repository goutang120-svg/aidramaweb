<template>
  <div class="prop-list">
    <div class="page-header">
      <h2 class="page-title">道具管理</h2>
      <div class="header-actions">
        <ProjectSwitcher />
        <el-button type="primary" @click="openAdd" :disabled="!currentProjectId">新建道具</el-button>
      </div>
    </div>

    <el-empty v-if="!currentProjectId" description="请先选择项目" />

    <template v-else>
      <el-card class="table-card" v-if="propList.length">
        <el-table :data="propList" style="width: 100%" row-key="id">
          <el-table-column prop="propName" label="道具名称" width="180" />
          <el-table-column prop="propCode" label="编号" width="140" />
          <el-table-column prop="category" label="分类" width="120">
            <template #default="{ row }">
              <el-tag size="small" effect="plain">{{ row.category || '未分类' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
          <el-table-column prop="location" label="位置" width="120" />
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="row.status === 'READY' ? 'success' : row.status === 'NEED' ? 'warning' : 'info'" size="small">
                {{ statusLabel(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="200" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" size="small" @click="router.push(`/props/${row.id}`)">查看</el-button>
              <el-button link type="primary" size="small" @click="openEdit(row)">编辑</el-button>
              <el-button link type="danger" size="small" @click="handleDelete(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
      <el-empty v-else description="暂无道具数据" />

      <el-dialog v-model="dialogVisible" :title="editingId ? '编辑道具' : '新建道具'" width="520px">
        <el-form :model="form" label-position="top">
          <el-form-item label="道具名称" required>
            <el-input v-model="form.propName" placeholder="请输入道具名称" />
          </el-form-item>
          <el-form-item label="编号">
            <el-input v-model="form.propCode" placeholder="请输入编号" />
          </el-form-item>
          <el-form-item label="分类">
            <el-select v-model="form.category" style="width: 100%" clearable>
              <el-option label="武器" value="WEAPON" />
              <el-option label="服饰" value="CLOTHING" />
              <el-option label="家具" value="FURNITURE" />
              <el-option label="道具" value="PROP" />
              <el-option label="饰品" value="ACCESSORY" />
              <el-option label="其他" value="OTHER" />
            </el-select>
          </el-form-item>
          <el-form-item label="描述">
            <el-input v-model="form.description" type="textarea" :rows="3" placeholder="请输入描述" />
          </el-form-item>
          <el-form-item label="位置/场景">
            <el-input v-model="form.location" placeholder="道具位置或关联场景" />
          </el-form-item>
          <el-form-item label="状态">
            <el-select v-model="form.status" style="width: 100%">
              <el-option label="待准备" value="NEED" />
              <el-option label="已就绪" value="READY" />
              <el-option label="制作中" value="MAKING" />
            </el-select>
          </el-form-item>
          <el-form-item label="参考图片">
            <div class="upload-section">
              <el-upload
                :http-request="customUpload"
                :show-file-list="false"
                accept="image/*"
              >
                <el-button :loading="uploading">
                  {{ uploading ? '上传中...' : '点击上传' }}
                </el-button>
              </el-upload>
              <div v-if="uploadedUrl" class="upload-preview">
                <el-image :src="uploadedUrl" fit="cover" style="width: 120px; height: 80px; border-radius: 4px;" />
              </div>
            </div>
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSave" :loading="saving">确定</el-button>
        </template>
      </el-dialog>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox, type UploadRequestOptions } from 'element-plus'
import { listAll, createOne, updateOne, deleteOne, getUploadUrl, createAsset } from '@/api/index'
import { useAppStore } from '@/stores/app'
import ProjectSwitcher from '@/components/ProjectSwitcher.vue'

const router = useRouter()

interface Prop {
  id: number
  propName: string
  propCode: string
  category: string
  description: string
  location: string
  status: string
  projectId: number
}

const appStore = useAppStore()
const currentProjectId = computed(() => appStore.currentProjectId)

const propList = ref<Prop[]>([])
const saving = ref(false)
const dialogVisible = ref(false)
const editingId = ref<number | null>(null)
const form = ref({ propName: '', propCode: '', category: '', description: '', location: '', status: 'NEED' })
const uploading = ref(false)
const uploadedUrl = ref('')
const uploadedAssetId = ref<number | null>(null)

async function fetchProps() {
  if (!currentProjectId.value) return
  try {
    const res = await listAll(`/projects/${currentProjectId.value}/props`, { page: 1, pageSize: 200 })
    propList.value = (res.data.data.records || []) as Prop[]
  } catch { /* handled */ }
}

function openAdd() {
  editingId.value = null
  uploadedUrl.value = ''
  uploadedAssetId.value = null
  form.value = { propName: '', propCode: '', category: '', description: '', location: '', status: 'NEED' }
  dialogVisible.value = true
}

function openEdit(row: Prop) {
  editingId.value = row.id
  uploadedUrl.value = ''
  uploadedAssetId.value = null
  form.value = { propName: row.propName, propCode: row.propCode || '', category: row.category || '', description: row.description || '', location: row.location || '', status: row.status }
  dialogVisible.value = true
}

async function customUpload(options: UploadRequestOptions) {
  if (!currentProjectId.value) return
  uploading.value = true
  try {
    const file = options.file as File
    const contentType = file.type || 'image/png'

    const urlRes = await getUploadUrl({
      fileName: file.name,
      contentType,
      fileSize: file.size,
      assetType: 'IMAGE',
    })
    const { uploadUrl, objectKey } = urlRes.data.data as { uploadUrl: string; objectKey: string; bucketName: string }

    await fetch(uploadUrl, {
      method: 'PUT',
      body: file,
      headers: { 'Content-Type': contentType },
    })

    const assetData: Record<string, unknown> = {
      objectKey,
      fileName: file.name,
      contentType,
      fileSize: file.size,
      assetType: 'IMAGE',
      assetName: file.name,
      projectId: currentProjectId.value,
    }
    if (editingId.value) assetData.propId = editingId.value

    const assetRes = await createAsset(assetData)
    const asset = assetRes.data.data as { id: number; previewUrl: string }
    uploadedAssetId.value = asset.id
    uploadedUrl.value = asset.previewUrl || ''
    ElMessage.success('上传成功')
  } catch { ElMessage.error('上传失败') } finally { uploading.value = false }
}

async function handleSave() {
  if (!currentProjectId.value || !form.value.propName) return
  saving.value = true
  try {
    const payload = { ...form.value, projectId: currentProjectId.value }
    if (editingId.value) {
      await updateOne(`/projects/${currentProjectId.value}/props/${editingId.value}`, payload)
      ElMessage.success('更新成功')
    } else {
      await createOne(`/projects/${currentProjectId.value}/props`, payload)
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    await fetchProps()
  } catch { /* handled */ } finally { saving.value = false }
}

async function handleDelete(row: Prop) {
  try {
    await ElMessageBox.confirm('确定删除该道具吗？', '删除确认', { type: 'warning' })
    await deleteOne(`/projects/${currentProjectId.value}/props/${row.id}`)
    ElMessage.success('删除成功')
    await fetchProps()
  } catch { /* cancelled or handled */ }
}

function statusLabel(status: string) {
  const map: Record<string, string> = { NEED: '待准备', READY: '已就绪', MAKING: '制作中' }
  return map[status] || status
}

onMounted(fetchProps)
</script>

<style scoped>
.prop-list { height: 100%; display: flex; flex-direction: column; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.page-title { color: #e8a850; font-size: 20px; font-weight: 600; }
.header-actions { display: flex; gap: 12px; align-items: center; }
.table-card { background: #16162a; border: 1px solid #2a2a3e; }
.upload-section { display: flex; align-items: center; gap: 12px; }
.upload-preview { flex-shrink: 0; }
</style>
