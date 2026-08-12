<template>
  <div class="shot-detail">
    <div v-loading="loading.shot" class="detail-container">
      <!-- 返回 -->
      <el-button text @click="goBack" class="back-btn">
        <el-icon><ArrowLeft /></el-icon> 返回
      </el-button>

      <!-- 镜头信息卡片 -->
      <div class="shot-info-card">
        <div class="shot-header">
          <div class="shot-no">{{ shot.shotNo ? '#' + shot.shotNo : '' }}</div>
          <div class="shot-code">{{ shot.shotCode }}</div>
          <el-tag :color="statusColor(shot.status)" effect="dark" size="small" style="border-color:transparent">
            {{ statusLabel(shot.status) }}
          </el-tag>
        </div>
        <div class="shot-meta">
          <div class="meta-item">
            <span class="meta-label">类型</span>
            <span class="meta-value">{{ shotTypeLabel(shot.shotType) }}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">角度</span>
            <span class="meta-value">{{ cameraAngleLabel(shot.cameraAngle) }}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">运镜</span>
            <span class="meta-value">{{ cameraMovementLabel(shot.cameraMovement) }}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">时长</span>
            <span class="meta-value">{{ shot.duration ? shot.duration + 's' : '-' }}</span>
          </div>
        </div>
        <div v-if="shot.description" class="shot-desc">{{ shot.description }}</div>
      </div>

      <!-- Tabs -->
      <el-tabs v-model="activeTab" class="detail-tabs">
        <!-- 画面描述 -->
        <el-tab-pane label="画面描述" name="description">
          <div class="tab-content">
            <el-form label-width="80px" label-position="top" class="desc-form">
              <el-form-item label="动作描述 (Action)">
                <el-input
                  v-model="detailForm.action"
                  type="textarea"
                  :rows="6"
                  placeholder="描述镜头中发生的动作..."
                  class="dark-textarea"
                />
              </el-form-item>
              <el-form-item label="对话 (Dialogue)">
                <el-input
                  v-model="detailForm.dialogue"
                  type="textarea"
                  :rows="4"
                  placeholder="镜头中的对话内容..."
                  class="dark-textarea"
                />
              </el-form-item>
              <el-form-item label="画外音 (Voice Over)">
                <el-input
                  v-model="detailForm.voiceOver"
                  type="textarea"
                  :rows="3"
                  placeholder="画外音内容..."
                  class="dark-textarea"
                />
              </el-form-item>
              <el-button type="primary" :loading="saving.detail" @click="saveDetail">保存描述</el-button>
            </el-form>
          </div>
        </el-tab-pane>

        <!-- 声音 -->
        <el-tab-pane label="声音" name="sound">
          <div class="tab-content">
            <el-form label-width="80px" label-position="top" class="desc-form">
              <el-form-item label="音效 (Sound Effect)">
                <el-input
                  v-model="detailForm.soundEffect"
                  type="textarea"
                  :rows="4"
                  placeholder="描述音效需求..."
                  class="dark-textarea"
                />
              </el-form-item>
              <el-form-item label="背景音乐 (BGM)">
                <el-input
                  v-model="detailForm.bgm"
                  type="textarea"
                  :rows="4"
                  placeholder="背景音乐描述..."
                  class="dark-textarea"
                />
              </el-form-item>
              <el-button type="primary" :loading="saving.detail" @click="saveDetail">保存音效</el-button>
            </el-form>
          </div>
        </el-tab-pane>

        <!-- Prompt -->
        <el-tab-pane label="Prompt" name="prompt">
          <div class="tab-content">
            <el-form label-width="100px" label-position="top" class="desc-form">
              <el-form-item label="视觉 Prompt">
                <el-input
                  v-model="detailForm.visualPrompt"
                  type="textarea"
                  :rows="6"
                  placeholder="图片生成提示词..."
                  class="dark-textarea prompt-textarea"
                />
              </el-form-item>
              <el-form-item label="视频 Prompt">
                <el-input
                  v-model="detailForm.videoPrompt"
                  type="textarea"
                  :rows="6"
                  placeholder="视频生成提示词..."
                  class="dark-textarea prompt-textarea"
                />
              </el-form-item>
              <el-button type="primary" :loading="saving.detail" @click="saveDetail">保存 Prompt</el-button>
            </el-form>
          </div>
        </el-tab-pane>

        <!-- 版本记录 -->
        <el-tab-pane label="版本记录" name="versions">
          <div class="tab-content">
            <div v-loading="loadingVersions" class="version-section">
              <div v-if="versionHistory.length === 0 && !loadingVersions" class="no-data">暂无版本记录</div>
              <el-timeline v-else>
                <el-timeline-item
                  v-for="v in versionHistory"
                  :key="v.id"
                  :color="v.isCurrent === 1 ? '#e8a850' : '#4a4a6e'"
                  :hollow="v.isCurrent !== 1"
                >
                  <div class="version-item">
                    <div class="version-header">
                      <span class="version-no">V{{ v.version }}</span>
                      <el-tag v-if="v.isCurrent === 1" size="small" color="#e8a850" effect="dark">当前</el-tag>
                      <span class="version-time">{{ formatTime(v.createdAt) }}</span>
                    </div>
                    <div v-if="v.content" class="version-content">{{ v.content.substring(0, 100) }}...</div>
                  </div>
                </el-timeline-item>
              </el-timeline>
            </div>
          </div>
        </el-tab-pane>

        <!-- 资产 -->
        <el-tab-pane label="资产" name="assets">
          <div class="tab-content">
            <!-- 上传区域 -->
            <div class="upload-section">
              <span class="section-label">上传资产</span>
              <el-upload
                class="asset-upload"
                :auto-upload="false"
                :show-file-list="false"
                :on-change="handleUploadChange"
                accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.psd"
                drag
              >
                <div class="upload-trigger">
                  <el-icon :size="32" color="#4a4a6e"><UploadFilled /></el-icon>
                  <div class="upload-text">拖拽文件到此处或<em>点击选择</em></div>
                  <div class="upload-hint">支持图片、视频、音频、文档</div>
                </div>
              </el-upload>
              <div v-if="uploading" class="upload-progress">
                <el-progress :percentage="uploadProgress" :color="'#e8a850'" />
                <span class="progress-text">{{ uploadStatus }}</span>
              </div>
            </div>

            <!-- 图片网格 -->
            <div class="asset-section">
              <span class="section-label">图片</span>
              <div v-loading="loading.assets" class="image-grid">
                <div v-if="imageAssets.length === 0 && !loading.assets" class="no-data">暂无图片</div>
                <div
                  v-for="asset in imageAssets"
                  :key="asset.id"
                  class="image-item"
                  @click="openImagePreview(asset)"
                >
                  <div class="img-wrap">
                    <img v-if="asset.previewUrl" :src="asset.previewUrl" :alt="asset.assetName" loading="lazy" />
                    <el-icon v-else :size="32" color="#4a4a6e"><PictureFilled /></el-icon>
                    <el-button class="asset-delete-btn" size="small" type="danger" circle
                      @click.stop="handleAssetDelete(asset)">
                      <el-icon :size="12"><Delete /></el-icon>
                    </el-button>
                  </div>
                  <div class="img-name" :title="asset.assetName">{{ asset.assetName }}</div>
                </div>
              </div>
            </div>

            <!-- 视频 -->
            <div class="asset-section">
              <span class="section-label">视频</span>
              <div v-loading="loading.assets" class="video-grid">
                <div v-if="videoAssets.length === 0 && !loading.assets" class="no-data">暂无视频</div>
                <div
                  v-for="asset in videoAssets"
                  :key="asset.id"
                  class="video-item"
                  @click="openVideoPreview(asset)"
                >
                  <div class="vid-thumb">
                    <img v-if="asset.previewUrl" :src="asset.previewUrl" :alt="asset.assetName" />
                    <el-icon v-else :size="28" color="#4a4a6e"><VideoCamera /></el-icon>
                    <div class="play-overlay">
                      <el-icon :size="28" color="#fff"><VideoPlay /></el-icon>
                    </div>
                    <el-button class="asset-delete-btn" size="small" type="danger" circle
                      @click.stop="handleAssetDelete(asset)">
                      <el-icon :size="12"><Delete /></el-icon>
                    </el-button>
                  </div>
                  <div class="vid-name" :title="asset.assetName">{{ asset.assetName }}</div>
                </div>
              </div>
            </div>

            <!-- 音频 -->
            <div class="asset-section">
              <span class="section-label">音频</span>
              <div v-loading="loading.assets" class="audio-list">
                <div v-if="audioAssets.length === 0 && !loading.assets" class="no-data">暂无音频</div>
                <div v-for="asset in audioAssets" :key="asset.id" class="audio-item">
                  <el-icon :size="20" color="#e8a850"><Headset /></el-icon>
                  <span class="audio-name" :title="asset.assetName">{{ asset.assetName }}</span>
                  <audio v-if="asset.previewUrl" :src="asset.previewUrl" controls class="audio-player" preload="none" />
                  <span v-else class="no-preview">无预览</span>
                  <el-button class="asset-delete-btn" size="small" type="danger" plain circle
                    @click="handleAssetDelete(asset)">
                    <el-icon :size="12"><Delete /></el-icon>
                  </el-button>
                </div>
              </div>
            </div>
          </div>
        </el-tab-pane>

        <!-- 关联 -->
        <el-tab-pane label="关联" name="relations">
          <div class="tab-content" v-loading="loadingRelations">
            <!-- 关联人物 -->
            <div class="relation-section">
              <div class="section-header">
                <span class="section-label">关联人物</span>
                <el-button size="small" type="primary" plain @click="charPickerVisible = true" :disabled="!projectId">
                  <el-icon :size="14"><Plus /></el-icon> 添加
                </el-button>
              </div>
              <div v-if="relatedCharacters.length === 0" class="no-data">暂无关联人物</div>
              <div v-else class="relation-grid">
                <div v-for="ch in relatedCharacters" :key="ch.id" class="relation-card">
                  <div class="rel-avatar">
                    <img v-if="ch.avatarUrl" :src="ch.avatarUrl" :alt="ch.name" />
                    <el-icon v-else :size="24" color="#4a4a6e"><User /></el-icon>
                  </div>
                  <span class="rel-name">{{ ch.name }}</span>
                  <el-button class="rel-remove-btn" size="small" type="danger" plain circle
                    @click="handleRemoveCharacter(ch.id)">
                    <el-icon :size="12"><Delete /></el-icon>
                  </el-button>
                </div>
              </div>
            </div>

            <!-- 关联场景 -->
            <div class="relation-section">
              <div class="section-header">
                <span class="section-label">关联场景</span>
                <el-button size="small" type="primary" plain @click="scenePickerVisible = true" :disabled="!projectId">
                  <el-icon :size="14"><Plus /></el-icon> 添加
                </el-button>
              </div>
              <div v-if="relatedScenes.length === 0" class="no-data">暂无关联场景</div>
              <div v-else class="relation-grid">
                <div v-for="sc in relatedScenes" :key="sc.id" class="relation-card">
                  <div class="rel-avatar">
                    <img v-if="sc.imageUrl" :src="sc.imageUrl" :alt="sc.name" />
                    <el-icon v-else :size="24" color="#4a4a6e"><PictureFilled /></el-icon>
                  </div>
                  <span class="rel-name">{{ sc.name }}</span>
                  <el-button class="rel-remove-btn" size="small" type="danger" plain circle
                    @click="handleRemoveScene(sc.id)">
                    <el-icon :size="12"><Delete /></el-icon>
                  </el-button>
                </div>
              </div>
            </div>

            <!-- 关联道具 -->
            <div class="relation-section">
              <div class="section-header">
                <span class="section-label">关联道具</span>
                <el-button size="small" type="primary" plain @click="propPickerVisible = true" :disabled="!projectId">
                  <el-icon :size="14"><Plus /></el-icon> 添加
                </el-button>
              </div>
              <div v-if="relatedProps.length === 0" class="no-data">暂无关联道具</div>
              <div v-else class="relation-grid">
                <div v-for="pr in relatedProps" :key="pr.id" class="relation-card">
                  <div class="rel-avatar">
                    <img v-if="pr.imageUrl" :src="pr.imageUrl" :alt="pr.name" />
                    <el-icon v-else :size="24" color="#4a4a6e"><Goods /></el-icon>
                  </div>
                  <span class="rel-name">{{ pr.name }}</span>
                  <el-button class="rel-remove-btn" size="small" type="danger" plain circle
                    @click="handleRemoveProp(pr.id)">
                    <el-icon :size="12"><Delete /></el-icon>
                  </el-button>
                </div>
              </div>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- 图片预览对话框 -->
    <el-dialog v-model="imageDialogVisible" width="80%" class="dark-dialog image-preview-dialog">
      <div class="image-preview-wrap">
        <img :src="previewImageUrl" class="preview-image" />
        <div class="preview-toolbar">
          <el-button-group>
            <el-button @click="zoomIn"><el-icon><ZoomIn /></el-icon></el-button>
            <el-button @click="zoomOut"><el-icon><ZoomOut /></el-icon></el-button>
            <el-button @click="resetZoom"><el-icon><FullScreen /></el-icon></el-button>
          </el-button-group>
          <div class="preview-right">
            <el-select
              v-model="selectedVersionId"
              size="small"
              style="width:120px"
              @change="handleVersionSwitch"
              placeholder="切换版本"
            >
              <el-option
                v-for="v in currentVersions"
                :key="v.id"
                :label="'v' + v.version"
                :value="v.id"
              />
            </el-select>
            <el-button size="small" @click="downloadAsset">下载</el-button>
          </div>
        </div>
      </div>
    </el-dialog>

    <!-- 视频预览对话框 -->
    <el-dialog v-model="videoDialogVisible" width="70%" class="dark-dialog">
      <video v-if="previewVideoUrl" :src="previewVideoUrl" controls class="preview-video" />
      <div v-else class="no-data">无法加载视频</div>
    </el-dialog>

    <!-- 人物选择对话框 -->
    <el-dialog v-model="charPickerVisible" title="添加关联人物" width="500px" class="dark-dialog">
      <el-input v-model="charSearch" placeholder="搜索人物..." clearable :prefix-icon="Search" class="picker-search" />
      <div class="picker-list">
        <div v-if="availableChars.length === 0" class="no-data">没有可添加的人物</div>
        <div v-for="item in availableChars" :key="item.id" class="picker-item" @click="handleAddCharacter(item.id); charPickerVisible = false">
          <div class="picker-avatar">
            <img v-if="item.avatarUrl" :src="item.avatarUrl" :alt="item.name" />
            <el-icon v-else :size="20" color="#4a4a6e"><User /></el-icon>
          </div>
          <span class="picker-name">{{ item.name }}</span>
          <el-icon color="#67c23a"><Plus /></el-icon>
        </div>
      </div>
    </el-dialog>

    <!-- 场景选择对话框 -->
    <el-dialog v-model="scenePickerVisible" title="添加关联场景" width="500px" class="dark-dialog">
      <el-input v-model="sceneSearch" placeholder="搜索场景..." clearable :prefix-icon="Search" class="picker-search" />
      <div class="picker-list">
        <div v-if="availableScenes.length === 0" class="no-data">没有可添加的场景</div>
        <div v-for="item in availableScenes" :key="item.id" class="picker-item" @click="handleAddScene(item.id); scenePickerVisible = false">
          <div class="picker-avatar">
            <img v-if="item.imageUrl" :src="item.imageUrl" :alt="item.name" />
            <el-icon v-else :size="20" color="#4a4a6e"><PictureFilled /></el-icon>
          </div>
          <span class="picker-name">{{ item.name }}</span>
          <el-icon color="#67c23a"><Plus /></el-icon>
        </div>
      </div>
    </el-dialog>

    <!-- 道具选择对话框 -->
    <el-dialog v-model="propPickerVisible" title="添加关联道具" width="500px" class="dark-dialog">
      <el-input v-model="propSearch" placeholder="搜索道具..." clearable :prefix-icon="Search" class="picker-search" />
      <div class="picker-list">
        <div v-if="availableProps.length === 0" class="no-data">没有可添加的道具</div>
        <div v-for="item in availableProps" :key="item.id" class="picker-item" @click="handleAddProp(item.id); propPickerVisible = false">
          <div class="picker-avatar">
            <img v-if="item.imageUrl" :src="item.imageUrl" :alt="item.name" />
            <el-icon v-else :size="20" color="#4a4a6e"><Goods /></el-icon>
          </div>
          <span class="picker-name">{{ item.name }}</span>
          <el-icon color="#67c23a"><Plus /></el-icon>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  ArrowLeft, UploadFilled, PictureFilled, VideoCamera, VideoPlay,
  Headset, User, Goods, ZoomIn, ZoomOut, FullScreen,
  Plus, Delete, Search,
} from '@element-plus/icons-vue'
import {
  getOne, listAll, updateOne, deleteOne,
  getAssets, getUploadUrl, createAsset, getAssetVersions, setCurrentVersion,
  listCharacters, listScenes, listProps,
  listShotCharacters, addShotCharacter, removeShotCharacter,
  listShotScenes, addShotScene, removeShotScene,
  listShotProps, addShotProp, removeShotProp,
} from '@/api/index'
import request from '@/utils/request'
import { useAppStore } from '@/stores/app'
import type { AssetVO } from '@/types'

const router = useRouter()
const route = useRoute()
const shotId = Number(route.params.id)
const appStore = useAppStore()
const projectId = computed(() => appStore.currentProjectId)

const activeTab = ref('description')
const shot = ref<Record<string, any>>({})

const loading = reactive({
  shot: false,
  assets: false,
})

const saving = reactive({
  detail: false,
})

// --- Detail forms ---
const detailForm = reactive({
  action: '',
  dialogue: '',
  voiceOver: '',
  soundEffect: '',
  bgm: '',
  visualPrompt: '',
  videoPrompt: '',
})

// --- Assets ---
const imageAssets = ref<AssetVO[]>([])
const videoAssets = ref<AssetVO[]>([])
const audioAssets = ref<AssetVO[]>([])

// Upload
const uploading = ref(false)
const uploadProgress = ref(0)
const uploadStatus = ref('')

// Preview
const imageDialogVisible = ref(false)
const videoDialogVisible = ref(false)
const previewImageUrl = ref('')
const previewVideoUrl = ref('')
const previewingAsset = ref<AssetVO | null>(null)
const currentVersions = ref<any[]>([])
const selectedVersionId = ref<number | null>(null)
const zoomLevel = ref(1)

// Relations
const relatedCharacters = ref<{ id: number; name: string; avatarUrl?: string }[]>([])
const relatedScenes = ref<{ id: number; name: string; imageUrl?: string }[]>([])
const relatedProps = ref<{ id: number; name: string; imageUrl?: string }[]>([])

// Available items for picker
const allCharacters = ref<{ id: number; name: string; avatarUrl?: string }[]>([])
const allScenes = ref<{ id: number; name: string; imageUrl?: string }[]>([])
const allProps = ref<{ id: number; name: string; imageUrl?: string }[]>([])

// Picker dialogs
const charPickerVisible = ref(false)
const scenePickerVisible = ref(false)
const propPickerVisible = ref(false)

// Search in picker
const charSearch = ref('')
const sceneSearch = ref('')
const propSearch = ref('')

// Loading
const loadingRelations = ref(false)
const loadingAllItems = ref(false)
const loadingVersions = ref(false)
const versionHistory = ref<any[]>([])

// Computed: filter available items (exclude already related, search filter)
const relatedCharIds = computed(() => new Set(relatedCharacters.value.map((c: any) => c.id)))
const relatedSceneIds = computed(() => new Set(relatedScenes.value.map((s: any) => s.id)))
const relatedPropIds = computed(() => new Set(relatedProps.value.map((p: any) => p.id)))

const availableChars = computed(() =>
  allCharacters.value.filter((c: any) => !relatedCharIds.value.has(c.id) && (!charSearch.value || c.name?.includes(charSearch.value)))
)
const availableScenes = computed(() =>
  allScenes.value.filter((s: any) => !relatedSceneIds.value.has(s.id) && (!sceneSearch.value || s.name?.includes(sceneSearch.value)))
)
const availableProps = computed(() =>
  allProps.value.filter((p: any) => !relatedPropIds.value.has(p.id) && (!propSearch.value || p.name?.includes(propSearch.value)))
)

// --- Helpers ---
function statusLabel(s: string): string {
  const map: Record<string, string> = { NOT_STARTED: '未开始', IN_PROGRESS: '进行中', COMPLETED: '已完成' }
  return map[s] || s || '未开始'
}
function statusColor(s: string): string {
  const map: Record<string, string> = { NOT_STARTED: '#909399', IN_PROGRESS: '#e8a850', COMPLETED: '#67c23a' }
  return map[s] || '#909399'
}
function shotTypeLabel(t: string): string {
  const map: Record<string, string> = {
    EXTREME_LONG: '远景', LONG: '全景', MEDIUM: '中景', CLOSE_UP: '近景',
    EXTREME_CLOSE_UP: '特写', EMPTY: '空镜',
  }
  return map[t] || t || '-'
}
function cameraAngleLabel(a: string): string {
  const map: Record<string, string> = {
    EYE_LEVEL: '平视', HIGH_ANGLE: '俯视', LOW_ANGLE: '仰视',
    BIRDS_EYE: '鸟瞰', DUTCH: '荷兰角',
  }
  return map[a] || a || '-'
}
function cameraMovementLabel(m: string): string {
  const map: Record<string, string> = {
    STATIC: '固定', PUSH: '推镜', PULL: '拉镜', PAN: '摇镜',
    TRACKING: '跟拍', CRANE: '升降',
  }
  return map[m] || m || '-'
}

function formatTime(time: string): string {
  if (!time) return ''
  return new Date(time).toLocaleString('zh-CN', { hour12: false })
}

async function fetchVersionHistory() {
  if (!projectId.value) return
  loadingVersions.value = true
  try {
    const res = await request.get('/projects/prompts', {
      params: { shotId, page: 1, pageSize: 50 }
    })
    versionHistory.value = (res.data.data?.records || []).filter((p: any) =>
      p.shotId === shotId
    ).sort((a: any, b: any) => b.version - a.version)
  } catch { versionHistory.value = [] } finally { loadingVersions.value = false }
}

function goBack() { router.back() }

// --- Fetch shot ---
async function fetchShot() {
  loading.shot = true
  try {
    const res = await getOne('/shots', { id: shotId })
    shot.value = res.data.data as any

    // Populate detail form
    detailForm.action = shot.value.action || ''
    detailForm.dialogue = shot.value.dialogue || ''
    detailForm.voiceOver = shot.value.voiceOver || ''
    detailForm.soundEffect = shot.value.soundEffect || ''
    detailForm.bgm = shot.value.bgm || ''
    detailForm.visualPrompt = shot.value.visualPrompt || ''
    detailForm.videoPrompt = shot.value.videoPrompt || ''

    // Fetch relations
    await fetchRelations()
  } catch { /* handled */ } finally { loading.shot = false }
}

// --- Fetch relations ---
async function fetchRelations() {
  const episodeId = shot.value.episodeId
  if (!episodeId || !projectId.value) return

  loadingRelations.value = true
  try {
    // Fetch relation IDs
    const [charRes, sceneRes, propRes] = await Promise.all([
      listShotCharacters(episodeId, shotId).catch(() => ({ data: { data: [] as number[] } })),
      listShotScenes(episodeId, shotId).catch(() => ({ data: { data: [] as number[] } })),
      listShotProps(episodeId, shotId).catch(() => ({ data: { data: [] as number[] } })),
    ])

    const charIds: number[] = (charRes.data as any).data || []
    const sceneIds: number[] = (sceneRes.data as any).data || []
    const propIds: number[] = (propRes.data as any).data || []

    // Fetch full item lists and map
    const [allC, allS, allP] = await Promise.all([
      listCharacters(projectId.value!, { page: 1, pageSize: 500 }).catch(() => ({ data: { data: { records: [] } } })),
      listScenes(projectId.value!, { page: 1, pageSize: 500 }).catch(() => ({ data: { data: { records: [] } } })),
      listProps(projectId.value!, { page: 1, pageSize: 500 }).catch(() => ({ data: { data: { records: [] } } })),
    ])

    allCharacters.value = ((allC.data as any).data?.records || []) as any[]
    allScenes.value = ((allS.data as any).data?.records || []) as any[]
    allProps.value = ((allP.data as any).data?.records || []) as any[]

    relatedCharacters.value = allCharacters.value.filter((c: any) => charIds.includes(c.id))
    relatedScenes.value = allScenes.value.filter((s: any) => sceneIds.includes(s.id))
    relatedProps.value = allProps.value.filter((p: any) => propIds.includes(p.id))
  } catch { /* handled */ } finally { loadingRelations.value = false }
}

// --- Add / Remove relations ---
async function handleAddCharacter(charId: number) {
  const episodeId = shot.value.episodeId
  if (!episodeId) return
  try {
    await addShotCharacter(episodeId, shotId, charId)
    const found = allCharacters.value.find((c: any) => c.id === charId)
    if (found && !relatedCharacters.value.some((c: any) => c.id === charId)) {
      relatedCharacters.value.push(found)
    }
  } catch { /* handled */ }
}

async function handleRemoveCharacter(charId: number) {
  const episodeId = shot.value.episodeId
  if (!episodeId) return
  try {
    await removeShotCharacter(episodeId, shotId, charId)
    relatedCharacters.value = relatedCharacters.value.filter((c: any) => c.id !== charId)
  } catch { /* handled */ }
}

async function handleAddScene(sceneId: number) {
  const episodeId = shot.value.episodeId
  if (!episodeId) return
  try {
    await addShotScene(episodeId, shotId, sceneId)
    const found = allScenes.value.find((s: any) => s.id === sceneId)
    if (found && !relatedScenes.value.some((s: any) => s.id === sceneId)) {
      relatedScenes.value.push(found)
    }
  } catch { /* handled */ }
}

async function handleRemoveScene(sceneId: number) {
  const episodeId = shot.value.episodeId
  if (!episodeId) return
  try {
    await removeShotScene(episodeId, shotId, sceneId)
    relatedScenes.value = relatedScenes.value.filter((s: any) => s.id !== sceneId)
  } catch { /* handled */ }
}

async function handleAddProp(propId: number) {
  const episodeId = shot.value.episodeId
  if (!episodeId) return
  try {
    await addShotProp(episodeId, shotId, propId)
    const found = allProps.value.find((p: any) => p.id === propId)
    if (found && !relatedProps.value.some((p: any) => p.id === propId)) {
      relatedProps.value.push(found)
    }
  } catch { /* handled */ }
}

async function handleRemoveProp(propId: number) {
  const episodeId = shot.value.episodeId
  if (!episodeId) return
  try {
    await removeShotProp(episodeId, shotId, propId)
    relatedProps.value = relatedProps.value.filter((p: any) => p.id !== propId)
  } catch { /* handled */ }
}

// --- Save detail ---
async function saveDetail() {
  saving.detail = true
  try {
    await updateOne('/shots', { ...detailForm }, { id: shotId })
    ElMessage.success('保存成功')
  } catch { /* handled */ } finally { saving.detail = false }
}

// --- Assets ---
async function fetchShotAssets() {
  loading.assets = true
  try {
    const res = await getAssets({ shotId, page: 1, pageSize: 100 })
    const data = res.data.data as any
    const records: AssetVO[] = data.records || []
    imageAssets.value = records.filter((a: AssetVO) => a.assetType === 'IMAGE' || a.contentType?.startsWith('image/'))
    videoAssets.value = records.filter((a: AssetVO) => a.assetType === 'VIDEO' || a.contentType?.startsWith('video/'))
    audioAssets.value = records.filter((a: AssetVO) => a.assetType === 'AUDIO' || a.contentType?.startsWith('audio/'))
  } catch { /* handled */ } finally { loading.assets = false }
}

async function handleAssetDelete(asset: AssetVO) {
  try {
    await ElMessageBox.confirm(`确定删除「${asset.assetName}」吗？删除后不可恢复。`, '确认删除', {
      confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning',
    })
    await deleteOne('/assets', { id: asset.id })
    ElMessage.success('已删除')
    await fetchShotAssets()
  } catch { /* cancelled */ }
}

async function uploadFile(file: File, assetType: string, extraMeta: Record<string, any> = {}) {
  uploading.value = true
  uploadProgress.value = 10
  uploadStatus.value = '正在获取上传地址...'

  try {
    // Step 1: Get presigned upload URL
    const urlRes = await getUploadUrl({
      fileName: file.name,
      contentType: file.type,
      fileSize: file.size,
      assetType,
    })
    const { uploadUrl, objectKey, bucketName } = urlRes.data.data
    uploadProgress.value = 30
    uploadStatus.value = '正在上传文件...'

    // Step 2: PUT file to presigned URL
    await fetch(uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': file.type || 'application/octet-stream' },
      body: file,
    })
    uploadProgress.value = 80
    uploadStatus.value = '正在创建资产记录...'

    // Step 3: Create asset record
    const assetRes = await createAsset({
      assetName: file.name,
      assetType,
      fileName: file.name,
      objectKey,
      bucketName,
      fileSize: file.size,
      contentType: file.type,
      shotId,
      ...extraMeta,
    })

    uploadProgress.value = 100
    uploadStatus.value = '上传完成'
    ElMessage.success('上传成功')
    return assetRes.data.data as AssetVO
  } catch (e: any) {
    ElMessage.error('上传失败: ' + (e.message || '未知错误'))
    throw e
  } finally {
    uploading.value = false
    uploadProgress.value = 0
    uploadStatus.value = ''
  }
}

function handleUploadChange(file: any) {
  const raw = file.raw as File
  if (!raw) return

  let assetType = 'IMAGE'
  if (raw.type.startsWith('video/')) assetType = 'VIDEO'
  else if (raw.type.startsWith('audio/')) assetType = 'AUDIO'
  else if (raw.type.startsWith('image/')) assetType = 'IMAGE'
  else assetType = 'DOCUMENT'

  uploadFile(raw, assetType).then(() => {
    fetchShotAssets()
  }).catch(() => { /* handled in uploadFile */ })
}

// --- Preview ---
async function openImagePreview(asset: AssetVO) {
  previewingAsset.value = asset
  previewImageUrl.value = asset.previewUrl || ''
  selectedVersionId.value = asset.currentVersion
  zoomLevel.value = 1

  // Fetch versions
  try {
    const res = await getAssetVersions(asset.id)
    currentVersions.value = (res.data.data as any[]) || []
  } catch { currentVersions.value = [] }

  imageDialogVisible.value = true
}

function openVideoPreview(asset: AssetVO) {
  previewVideoUrl.value = asset.previewUrl || ''
  videoDialogVisible.value = true
}

async function handleVersionSwitch(versionId: number) {
  if (!previewingAsset.value) return
  try {
    await setCurrentVersion(previewingAsset.value.id, versionId)
    // Refresh asset to get new previewUrl
    const res = await getAssets({ id: previewingAsset.value.id, page: 1, pageSize: 1 })
    const data = res.data.data as any
    if (data.records?.[0]) {
      previewImageUrl.value = data.records[0].previewUrl || ''
    }
    ElMessage.success('版本已切换')
  } catch { /* handled */ }
}

function downloadAsset() {
  if (previewImageUrl.value) {
    window.open(previewImageUrl.value, '_blank')
  }
}

function zoomIn() { zoomLevel.value = Math.min(zoomLevel.value + 0.25, 3) }
function zoomOut() { zoomLevel.value = Math.max(zoomLevel.value - 0.25, 0.25) }
function resetZoom() { zoomLevel.value = 1 }

onMounted(() => {
  fetchShot()
  fetchShotAssets()
})

watch(activeTab, (tab) => {
  if (tab === 'versions' && versionHistory.value.length === 0) {
    fetchVersionHistory()
  }
})
</script>

<style scoped>
.shot-detail { padding: 4px; }
.detail-container { max-width: 1200px; }
.back-btn { margin-bottom: 12px; color: var(--text-muted); }

/* 信息卡片 */
.shot-info-card {
  background: var(--bg-white); border: 1px solid var(--border-hairline); border-radius: var(--radius-lg);
  padding: 20px; margin-bottom: 16px;
}
.shot-header { display: flex; align-items: center; gap: 12px; margin-bottom: 14px; }
.shot-no { color: var(--primary-color); font-size: 18px; font-weight: 700; }
.shot-code { color: var(--text-secondary); font-size: 14px; font-family: monospace; }
.shot-meta { display: flex; gap: 32px; margin-bottom: 12px; }
.meta-item { text-align: center; }
.meta-label { color: var(--text-muted); font-size: 12px; display: block; margin-bottom: 2px; }
.meta-value { color: var(--text-secondary); font-size: 14px; font-weight: 500; }
.shot-desc { color: var(--text-muted); font-size: 13px; line-height: 1.6; }

/* Tabs */
.detail-tabs { margin-top: 8px; }
.tab-content { padding: 4px 0; }

/* 描述表单 */
.desc-form { max-width: 800px; }
.dark-textarea :deep(textarea) {
  background: var(--bg-white); color: var(--text-secondary); border-color: var(--border-hairline);
  font-size: 14px; line-height: 1.6;
}
.dark-textarea :deep(textarea):focus { border-color: var(--primary-color); }
.prompt-textarea :deep(textarea) { font-family: 'Courier New', monospace; }

/* 资产上传 */
.upload-section {
  background: var(--bg-white); border: 1px solid var(--border-hairline); border-radius: var(--radius-lg);
  padding: 16px; margin-bottom: 20px;
}
.upload-section :deep(.el-upload-dragger) {
  background: var(--bg-white); border-color: var(--border-hairline); border-radius: var(--radius-lg);
}
.upload-section :deep(.el-upload-dragger:hover) { border-color: var(--primary-color); }
.upload-trigger { padding: 24px; text-align: center; }
.upload-text { color: var(--text-muted); font-size: 14px; margin-top: 8px; }
.upload-text em { color: var(--primary-color); font-style: normal; }
.upload-hint { color: var(--text-muted); font-size: 12px; margin-top: 4px; }
.upload-progress { margin-top: 12px; display: flex; align-items: center; gap: 12px; }
.upload-progress :deep(.el-progress) { flex: 1; }
.progress-text { color: var(--text-muted); font-size: 12px; white-space: nowrap; }

.section-label { color: var(--text-secondary); font-size: 14px; font-weight: 500; display: block; margin-bottom: 12px; }
.section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.section-header .section-label { margin-bottom: 0; }

/* 图片网格 */
.image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 12px; margin-bottom: 20px;
}
.image-item {
  background: var(--bg-white); border: 1px solid var(--border-hairline); border-radius: var(--radius-md);
  overflow: hidden; cursor: pointer; transition: all 0.3s ease;
}
.image-item:hover { border-color: var(--primary-color); box-shadow: var(--shadow-glow); }
.img-wrap {
  width: 100%; height: 140px; background: var(--bg-white);
  display: flex; align-items: center; justify-content: center; overflow: hidden;
  position: relative;
}
.img-wrap img { width: 100%; height: 100%; object-fit: cover; }
.img-name {
  padding: 6px 10px; font-size: 12px; color: var(--text-secondary);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}

/* 视频网格 */
.video-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px; margin-bottom: 20px;
}
.video-item {
  background: var(--bg-white); border: 1px solid var(--border-hairline); border-radius: var(--radius-md);
  overflow: hidden; cursor: pointer; transition: all 0.3s ease;
}
.video-item:hover { border-color: var(--primary-color); box-shadow: var(--shadow-glow); }
.vid-thumb {
  width: 100%; height: 120px; background: var(--bg-white);
  display: flex; align-items: center; justify-content: center; overflow: hidden;
  position: relative;
}
.vid-thumb img { width: 100%; height: 100%; object-fit: cover; }
.play-overlay {
  position: absolute; inset: 0; background: var(--bg-cream);
  display: flex; align-items: center; justify-content: center;
  opacity: 0; transition: opacity 0.2s;
}
.video-item:hover .play-overlay { opacity: 1; }
.vid-name {
  padding: 6px 10px; font-size: 12px; color: var(--text-secondary);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}

/* 音频列表 */
.audio-list { margin-bottom: 20px; }
.audio-item {
  display: flex; align-items: center; gap: 12px;
  padding: 10px 14px; background: var(--bg-white); border: 1px solid var(--border-hairline);
  border-radius: var(--radius-md); margin-bottom: 8px;
}
.audio-name { color: var(--text-secondary); font-size: 13px; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.audio-player { height: 32px; width: 200px; }
.audio-player::-webkit-media-controls-panel { background: var(--border-hairline); }
.no-preview { color: var(--text-muted); font-size: 12px; }

/* 关联 */
.relation-grid { display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 20px; }
.relation-card {
  display: flex; flex-direction: column; align-items: center; gap: 6px;
  padding: 12px 16px; background: var(--bg-white); border: 1px solid var(--border-hairline);
  border-radius: var(--radius-md); min-width: 80px; position: relative;
}
.rel-avatar {
  width: 48px; height: 48px; border-radius: 50%; background: var(--bg-white);
  display: flex; align-items: center; justify-content: center; overflow: hidden;
}
.rel-avatar img { width: 100%; height: 100%; object-fit: cover; }
.rel-name { color: var(--text-secondary); font-size: 13px; }
.rel-remove-btn { position: absolute; top: -6px; right: -6px; width: 20px; height: 20px; }

/* Relation Picker */
.picker-search { margin-bottom: 16px; }
.picker-search :deep(input) { background: var(--bg-white); color: var(--text-secondary); border-color: var(--border-hairline); }
.picker-list { max-height: 360px; overflow-y: auto; }
.picker-item {
  display: flex; align-items: center; gap: 12px;
  padding: 10px 14px; margin-bottom: 4px;
  background: var(--bg-white); border: 1px solid var(--border-hairline); border-radius: var(--radius-md);
  cursor: pointer; transition: all 0.3s ease;
}
.picker-item:hover { border-color: var(--primary-color); }
.picker-avatar {
  width: 36px; height: 36px; border-radius: 50%; background: var(--bg-white);
  display: flex; align-items: center; justify-content: center; overflow: hidden;
}
.picker-avatar img { width: 100%; height: 100%; object-fit: cover; }
.picker-name { color: var(--text-secondary); font-size: 14px; flex: 1; }

.no-data { color: var(--text-muted); font-size: 13px; padding: 20px 0; text-align: center; }

/* 资产删除按钮 */
.asset-delete-btn {
  position: absolute; top: 4px; right: 4px; opacity: 0; transition: opacity 0.2s;
}
.image-item:hover .asset-delete-btn,
.video-item:hover .asset-delete-btn,
.img-wrap:hover .asset-delete-btn,
.vid-thumb:hover .asset-delete-btn { opacity: 1; }
.audio-item { position: relative; }
.audio-item .asset-delete-btn { position: relative; top: auto; right: auto; opacity: 1; }

/* 预览对话框 */
.preview-image-wrap { text-align: center; max-height: 70vh; overflow: hidden; display: flex; flex-direction: column; }
.preview-image {
  max-height: 60vh; object-fit: contain;
  transform: scale(v-bind(zoomLevel)); transition: transform 0.2s;
}
.image-preview-dialog :deep(.el-dialog__body) { max-height: 80vh; }
.preview-toolbar { display: flex; align-items: center; justify-content: space-between; margin-top: 16px; }
.preview-right { display: flex; gap: 8px; }
.preview-video { width: 100%; max-height: 60vh; }

/* 版本记录 */
.version-section { max-width: 800px; }
.version-item { padding: 4px 0; }
.version-header { display: flex; align-items: center; gap: 10px; margin-bottom: 4px; }
.version-no { color: var(--primary-color); font-weight: 600; font-size: 14px; }
.version-time { color: var(--text-muted); font-size: 12px; }
.version-content { color: var(--text-muted); font-size: 13px; }
</style>
