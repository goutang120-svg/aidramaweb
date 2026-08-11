<template>
  <div class="style-list">
    <div class="page-header">
      <h2 class="page-title">风格参考</h2>
      <div class="header-actions">
        <ProjectSwitcher />
        <el-button type="primary" @click="openAdd" :disabled="!currentProjectId">新建风格</el-button>
      </div>
    </div>

    <el-empty v-if="!currentProjectId" description="请先选择项目" />

    <template v-else>
      <div class="filter-tabs">
        <el-radio-group v-model="filterType" size="small">
          <el-radio-button value="">全部</el-radio-button>
          <el-radio-button value="ART">美术风格</el-radio-button>
          <el-radio-button value="COLOR">配色方案</el-radio-button>
          <el-radio-button value="LIGHTING">灯光参考</el-radio-button>
          <el-radio-button value="COMPOSITION">构图参考</el-radio-button>
          <el-radio-button value="REFERENCE">参考图</el-radio-button>
          <el-radio-button value="OTHER">其他</el-radio-button>
        </el-radio-group>
      </div>

      <div class="card-grid" v-if="filteredList.length">
        <el-card v-for="item in filteredList" :key="item.id" class="style-card" shadow="hover">
          <div class="style-image" v-if="item.previewUrl">
            <el-image :src="item.previewUrl" fit="cover" :preview-src-list="[item.previewUrl]" />
          </div>
          <div class="style-image placeholder" v-else>
            <el-icon :size="36"><Picture /></el-icon>
          </div>
          <div class="style-info">
            <div class="style-name">{{ item.styleName }}</div>
            <div class="style-meta">
              <el-tag size="small" effect="plain">{{ typeLabel(item.styleType) }}</el-tag>
            </div>
            <div class="style-desc" v-if="item.description">{{ item.description }}</div>
          </div>
          <div class="style-actions">
            <el-button size="small" @click="openEdit(item)">编辑</el-button>
            <el-button size="small" type="danger" @click="handleDelete(item)">删除</el-button>
          </div>
        </el-card>
      </div>
      <el-empty v-else description="暂无风格参考数据" />

      <el-dialog v-model="dialogVisible" :title="editingId ? '编辑风格' : '新建风格'" width="540px">
        <el-form :model="form" label-position="top">
          <el-form-item label="风格名称" required>
            <el-input v-model="form.styleName" placeholder="请输入风格名称" />
          </el-form-item>
          <el-form-item label="风格类型">
            <el-select v-model="form.styleType" style="width: 100%">
              <el-option label="美术风格" value="ART" />
              <el-option label="配色方案" value="COLOR" />
              <el-option label="灯光参考" value="LIGHTING" />
              <el-option label="构图参考" value="COMPOSITION" />
              <el-option label="参考图" value="REFERENCE" />
              <el-option label="其他" value="OTHER" />
            </el-select>
          </el-form-item>
          <el-form-item label="描述">
            <el-input v-model="form.description" type="textarea" :rows="3" />
          </el-form-item>
          <el-form-item label="参考图">
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
import { ElMessage, ElMessageBox, type UploadRequestOptions } from 'element-plus'
import { Picture } from '@element-plus/icons-vue'
import { listAll, createOne, updateOne, deleteOne, getUploadUrl, createAsset } from '@/api/index'
import { useAppStore } from '@/stores/app'
import ProjectSwitcher from '@/components/ProjectSwitcher.vue'

interface StyleItem {
  id: number
  styleName: string
  styleType: string
  description: string
  previewUrl: string
  assetId: number
  projectId: number
}

const appStore = useAppStore()
const currentProjectId = computed(() => appStore.currentProjectId)

const filterType = ref('')
const styleList = ref<StyleItem[]>([])
const saving = ref(false)
const uploading = ref(false)
const dialogVisible = ref(false)
const editingId = ref<number | null>(null)
const uploadedUrl = ref('')
const uploadedAssetId = ref<number | null>(null)
const form = ref({ styleName: '', styleType: 'ART', description: '' })

const filteredList = computed(() => {
  if (!filterType.value) return styleList.value
  return styleList.value.filter(s => s.styleType === filterType.value)
})

async function fetchStyles() {
  if (!currentProjectId.value) return
  try {
    const res = await listAll(`/projects/${currentProjectId.value}/styles`, { page: 1, pageSize: 200 })
    styleList.value = (res.data.data.records || []) as StyleItem[]
  } catch { /* handled */ }
}

function openAdd() {
  editingId.value = null
  uploadedUrl.value = ''
  uploadedAssetId.value = null
  form.value = { styleName: '', styleType: 'ART', description: '' }
  dialogVisible.value = true
}

function openEdit(row: StyleItem) {
  editingId.value = row.id
  uploadedUrl.value = row.previewUrl || ''
  uploadedAssetId.value = row.assetId || null
  form.value = { styleName: row.styleName, styleType: row.styleType, description: row.description || '' }
  dialogVisible.value = true
}

async function customUpload(options: UploadRequestOptions) {
  if (!currentProjectId.value) return
  uploading.value = true
  try {
    const file = options.file as File
    const ext = file.name.split('.').pop() || 'png'
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

    const assetRes = await createAsset({
      objectKey,
      fileName: file.name,
      contentType,
      fileSize: file.size,
      assetType: 'IMAGE',
      assetName: file.name,
      projectId: currentProjectId.value,
    })
    const asset = assetRes.data.data as { id: number; previewUrl: string }
    uploadedAssetId.value = asset.id
    uploadedUrl.value = asset.previewUrl || ''
    ElMessage.success('上传成功')
  } catch { ElMessage.error('上传失败') } finally { uploading.value = false }
}

async function handleSave() {
  if (!currentProjectId.value || !form.value.styleName) return
  saving.value = true
  try {
    const payload = {
      ...form.value,
      projectId: currentProjectId.value,
      assetId: uploadedAssetId.value || null,
      previewUrl: uploadedUrl.value || '',
    }
    if (editingId.value) {
      await updateOne(`/projects/${currentProjectId.value}/styles/${editingId.value}`, payload)
      ElMessage.success('更新成功')
    } else {
      await createOne(`/projects/${currentProjectId.value}/styles`, payload)
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    await fetchStyles()
  } catch { /* handled */ } finally { saving.value = false }
}

async function handleDelete(row: StyleItem) {
  try {
    await ElMessageBox.confirm('确定删除该风格参考吗？', '删除确认', { type: 'warning' })
    await deleteOne(`/projects/${currentProjectId.value}/styles/${row.id}`)
    ElMessage.success('删除成功')
    await fetchStyles()
  } catch { /* cancelled or handled */ }
}

function typeLabel(type: string) {
  const map: Record<string, string> = { ART: '美术风格', COLOR: '配色方案', LIGHTING: '灯光参考', COMPOSITION: '构图参考', REFERENCE: '参考图', OTHER: '其他' }
  return map[type] || type
}

onMounted(fetchStyles)
</script>

<style scoped>
.style-list { height: 100%; display: flex; flex-direction: column; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.page-title { color: #e8a850; font-size: 20px; font-weight: 600; }
.header-actions { display: flex; gap: 12px; align-items: center; }

.filter-tabs { margin-bottom: 16px; }
.filter-tabs :deep(.el-radio-button__inner) { background: #16162a; border-color: #2a2a3e; color: #808090; }
.filter-tabs :deep(.el-radio-button__inner:hover) { color: #e8a850; }
.filter-tabs :deep(.is-active .el-radio-button__inner) { background: #e8a850; border-color: #e8a850; color: #1a1a2e; }

.card-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 16px; }
.style-card { background: #16162a; border: 1px solid #2a2a3e; transition: border-color 0.2s; }
.style-card:hover { border-color: #e8a850; }
.style-image { width: 100%; height: 160px; overflow: hidden; border-radius: 4px 4px 0 0; }
.style-image :deep(.el-image) { width: 100%; height: 100%; }
.style-image.placeholder { display: flex; align-items: center; justify-content: center; background: #1a1a2e; color: #808090; }
.style-info { padding: 12px 0; }
.style-name { color: #c0c0d0; font-size: 14px; font-weight: 600; margin-bottom: 8px; }
.style-meta { margin-bottom: 6px; }
.style-desc { color: #808090; font-size: 12px; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.style-actions { display: flex; gap: 8px; }

.upload-section { display: flex; gap: 12px; align-items: center; }
.upload-preview { border: 1px solid #2a2a3e; border-radius: 4px; overflow: hidden; }
</style>
