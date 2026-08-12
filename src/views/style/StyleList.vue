<template>
  <div class="style-list">
    <!-- Header -->
    <div class="page-header">
      <div class="page-title-group">
        <el-icon class="title-icon"><Brush /></el-icon>
        <h2 class="page-title">风格参考</h2>
        <span class="title-badge">Style</span>
        <span v-if="filteredList.length" class="count-chip">{{ filteredList.length }} 项</span>
      </div>
      <div class="header-actions">
        <ProjectSwitcher />
        <el-button class="btn-create" type="primary" @click="openAdd" :disabled="!currentProjectId">
          <el-icon><Plus /></el-icon> 新建风格
        </el-button>
      </div>
    </div>

    <!-- Empty project -->
    <div v-if="!currentProjectId" class="empty-state">
      <div class="empty-icon-wrap"><el-icon size="44"><Folder /></el-icon></div>
      <p class="empty-title">请先选择项目</p>
      <p class="empty-sub">切换项目后即可管理风格参考</p>
    </div>

    <template v-else>
      <!-- Filter -->
      <div class="filter-bar">
        <el-radio-group v-model="filterType" size="default">
          <el-radio-button value="">全部</el-radio-button>
          <el-radio-button value="ART">美术风格</el-radio-button>
          <el-radio-button value="COLOR">配色方案</el-radio-button>
          <el-radio-button value="LIGHTING">灯光参考</el-radio-button>
          <el-radio-button value="COMPOSITION">构图参考</el-radio-button>
          <el-radio-button value="REFERENCE">参考图</el-radio-button>
          <el-radio-button value="OTHER">其他</el-radio-button>
        </el-radio-group>
      </div>

      <!-- Grid -->
      <div class="card-grid" v-if="filteredList.length">
        <div v-for="item in filteredList" :key="item.id" class="style-card">
          <div class="style-image" v-if="item.previewUrl">
            <el-image :src="item.previewUrl" fit="cover" :preview-src-list="[item.previewUrl]" />
            <span class="type-badge" :class="typeClass(item.styleType)">{{ typeLabel(item.styleType) }}</span>
          </div>
          <div class="style-image placeholder" v-else>
            <el-icon :size="40"><Picture /></el-icon>
            <span class="type-badge" :class="typeClass(item.styleType)">{{ typeLabel(item.styleType) }}</span>
          </div>
          <div class="style-info">
            <div class="style-name" :title="item.styleName">{{ item.styleName }}</div>
            <div class="style-desc" v-if="item.description">{{ item.description }}</div>
            <div class="style-desc muted" v-else>暂无描述</div>
          </div>
          <div class="style-actions">
            <el-button size="small" plain class="action-btn" @click="openEdit(item)">
              <el-icon><EditPen /></el-icon> 编辑
            </el-button>
            <el-button size="small" plain class="action-btn danger" @click="handleDelete(item)">
              <el-icon><Delete /></el-icon> 删除
            </el-button>
          </div>
        </div>
      </div>

      <div v-else class="empty-state">
        <div class="empty-icon-wrap"><el-icon size="44"><Picture /></el-icon></div>
        <p class="empty-title">暂无风格参考</p>
        <p class="empty-sub">点击右上角新建按钮添加第一个风格参考</p>
      </div>

      <el-dialog
        v-model="dialogVisible"
        :title="editingId ? '编辑风格' : '新建风格'"
        width="560px"
        class="style-dialog"
      >
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
                <el-button :loading="uploading" plain>
                  <el-icon><Upload /></el-icon>
                  {{ uploading ? '上传中...' : '点击上传' }}
                </el-button>
              </el-upload>
              <div v-if="uploadedUrl" class="upload-preview">
                <el-image :src="uploadedUrl" fit="cover" style="width: 140px; height: 90px; border-radius: 8px;" />
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
import { Picture, Brush, Plus, Folder, EditPen, Delete, Upload } from '@element-plus/icons-vue'
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
    const res = await listAll('/projects/styles', { projectId: currentProjectId.value, page: 1, pageSize: 200 })
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
      await updateOne('/projects/styles', payload, { projectId: currentProjectId.value, id: editingId.value })
      ElMessage.success('更新成功')
    } else {
      await createOne('/projects/styles', payload, { projectId: currentProjectId.value })
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    await fetchStyles()
  } catch { /* handled */ } finally { saving.value = false }
}

async function handleDelete(row: StyleItem) {
  try {
    await ElMessageBox.confirm('确定删除该风格参考吗？', '删除确认', { type: 'warning' })
    await deleteOne('/projects/styles', { projectId: currentProjectId.value, id: row.id })
    ElMessage.success('删除成功')
    await fetchStyles()
  } catch { /* cancelled or handled */ }
}

function typeLabel(type: string) {
  const map: Record<string, string> = { ART: '美术风格', COLOR: '配色方案', LIGHTING: '灯光参考', COMPOSITION: '构图参考', REFERENCE: '参考图', OTHER: '其他' }
  return map[type] || type
}

function typeClass(type: string) {
  const map: Record<string, string> = {
    ART: 'badge-art', COLOR: 'badge-color', LIGHTING: 'badge-lighting',
    COMPOSITION: 'badge-composition', REFERENCE: 'badge-reference', OTHER: 'badge-other',
  }
  return map[type] || 'badge-other'
}

onMounted(fetchStyles)
</script>

<style scoped>
.style-list {
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

/* ===== Filter ===== */
.filter-bar {
  background: var(--bg-white);
  padding: 12px 16px;
  border: 1px solid var(--border-hairline);
  border-radius: var(--radius-md);
  flex-shrink: 0;
}
.filter-bar :deep(.el-radio-button__inner) {
  background: var(--bg-white);
  border-color: var(--border-hairline);
  color: var(--text-body);
  font-weight: 400;
}
.filter-bar :deep(.el-radio-button__inner:hover) {
  color: var(--primary-color);
  background: var(--primary-tint);
}
.filter-bar :deep(.is-active .el-radio-button__inner) {
  background: var(--primary-color) !important;
  border-color: var(--primary-color) !important;
  color: white !important;
  box-shadow: -1px 0 0 0 var(--primary-color) !important;
}

/* ===== Card grid ===== */
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 20px;
  padding-bottom: 8px;
}
.style-card {
  background: var(--bg-white);
  border: 1px solid var(--border-hairline);
  border-radius: var(--radius-lg);
  overflow: hidden;
  transition: all 0.25s ease;
  display: flex;
  flex-direction: column;
}
.style-card:hover {
  transform: translateY(-3px);
  border-color: var(--primary-color);
  box-shadow: var(--shadow-hover);
}

.style-image {
  position: relative;
  width: 100%;
  height: 180px;
  overflow: hidden;
  background: var(--bg-cream);
}
.style-image :deep(.el-image) {
  width: 100%;
  height: 100%;
  transition: transform 0.4s ease;
}
.style-card:hover .style-image :deep(.el-image) {
  transform: scale(1.04);
}
.style-image.placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  background: linear-gradient(135deg, var(--bg-cream) 0%, var(--primary-tint) 100%);
}

/* Type badge on image */
.type-badge {
  position: absolute;
  top: 10px;
  left: 10px;
  padding: 3px 10px;
  border-radius: var(--radius-pill);
  font-size: 11px;
  font-weight: 500;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(6px);
  border: 1px solid rgba(31, 36, 33, 0.06);
  box-shadow: 0 1px 3px rgba(31, 36, 33, 0.08);
}
.badge-art        { color: #C4612F; }
.badge-color      { color: #8B4A9C; }
.badge-lighting   { color: #D4A05C; }
.badge-composition{ color: #5C8A5C; }
.badge-reference  { color: #3F7A9C; }
.badge-other      { color: #6B6762; }

.style-info {
  padding: 14px 16px 10px;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.style-name {
  color: var(--text-ink);
  font-size: 15px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.style-desc {
  color: var(--text-body);
  font-size: 12px;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.style-desc.muted {
  color: var(--text-muted);
  font-style: italic;
}

.style-actions {
  display: flex;
  gap: 8px;
  padding: 10px 16px 14px;
  border-top: 1px solid var(--border-hairline);
  background: var(--bg-cream);
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

/* ===== Dialog / Upload ===== */
.style-dialog :deep(.el-dialog__header) {
  padding: 20px 24px 12px;
  border-bottom: 1px solid var(--border-hairline);
}
.style-dialog :deep(.el-dialog__title) {
  color: var(--text-ink);
  font-weight: 600;
  font-size: 16px;
}
.style-dialog :deep(.el-dialog__body) { padding: 20px 24px; }
.style-dialog :deep(.el-dialog__footer) {
  padding: 12px 24px 20px;
  border-top: 1px solid var(--border-hairline);
}

.upload-section {
  display: flex;
  gap: 14px;
  align-items: center;
}
.upload-preview {
  border: 1px solid var(--border-hairline);
  border-radius: var(--radius-md);
  overflow: hidden;
  padding: 4px;
  background: var(--bg-white);
}
</style>
