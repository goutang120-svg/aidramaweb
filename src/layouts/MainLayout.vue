<template>
  <el-container class="layout-container">
    <el-aside :width="sidebarCollapsed ? '64px' : '220px'" class="layout-aside">
      <div class="logo" @click="$router.push('/dashboard')">
        <span v-if="!sidebarCollapsed" class="logo-text">AI漫剧工作台</span>
        <span v-else class="logo-icon">🎬</span>
      </div>
      <el-menu
        :default-active="activeMenu"
        :collapse="sidebarCollapsed"
        background-color="#1a1a2e"
        text-color="#a0a0b0"
        active-text-color="#e8a850"
        router
      >
        <el-menu-item index="/dashboard"><el-icon><DataAnalysis /></el-icon><span>工作台</span></el-menu-item>
        <el-menu-item index="/projects"><el-icon><Folder /></el-icon><span>项目管理</span></el-menu-item>

        <el-sub-menu index="story">
          <template #title><el-icon><Reading /></el-icon><span>故事</span></template>
          <el-menu-item index="/story-bible">故事圣经</el-menu-item>
          <el-menu-item index="/story-map">故事地图</el-menu-item>
          <el-menu-item index="/story-clues">故事线索</el-menu-item>
        </el-sub-menu>

        <el-sub-menu index="visual">
          <template #title><el-icon><Picture /></el-icon><span>视觉资产</span></template>
          <el-menu-item index="/characters">人物</el-menu-item>
          <el-menu-item index="/scenes">场景</el-menu-item>
          <el-menu-item index="/props">道具</el-menu-item>
          <el-menu-item index="/styles">风格参考</el-menu-item>
        </el-sub-menu>

        <el-sub-menu index="production">
          <template #title><el-icon><VideoCamera /></el-icon><span>漫剧制作</span></template>
          <el-menu-item index="/seasons">分季</el-menu-item>
          <el-menu-item index="/episodes">分集</el-menu-item>
          <el-menu-item index="/shots">镜头</el-menu-item>
        </el-sub-menu>

        <el-menu-item index="/assets"><el-icon><Box /></el-icon><span>资源中心</span></el-menu-item>
        <el-menu-item index="/prompts"><el-icon><EditPen /></el-icon><span>Prompt</span></el-menu-item>

        <template v-if="userStore.isAdmin">
          <el-sub-menu index="admin">
            <template #title><el-icon><Setting /></el-icon><span>系统管理</span></template>
            <el-menu-item index="/users">用户管理</el-menu-item>
          </el-sub-menu>
        </template>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header class="layout-header">
        <div class="header-left">
          <el-button text @click="appStore.toggleSidebar()">
            <el-icon :size="20"><Fold v-if="!sidebarCollapsed" /><Expand v-else /></el-icon>
          </el-button>
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/dashboard' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item v-if="route.meta.title">{{ route.meta.title }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="header-right">
          <span class="username">{{ userStore.user?.nickname || userStore.user?.username }}</span>
          <el-button text type="danger" @click="handleLogout">退出</el-button>
        </div>
      </el-header>

      <el-main class="layout-main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useAppStore } from '@/stores/app'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const appStore = useAppStore()

const sidebarCollapsed = computed(() => appStore.sidebarCollapsed)
const activeMenu = computed(() => route.path)

function handleLogout() {
  userStore.clearAuth()
  router.push('/login')
}
</script>

<style scoped>
.layout-container { height: 100vh; background: #0f0f1a; }
.layout-aside { background: #1a1a2e; border-right: 1px solid #2a2a3e; overflow-y: auto; transition: width 0.3s; }
.logo { height: 56px; display: flex; align-items: center; justify-content: center; cursor: pointer; border-bottom: 1px solid #2a2a3e; }
.logo-text { color: #e8a850; font-size: 18px; font-weight: 700; letter-spacing: 2px; }
.logo-icon { font-size: 24px; }
.layout-header { background: #16162a; border-bottom: 1px solid #2a2a3e; display: flex; align-items: center; justify-content: space-between; padding: 0 20px; height: 56px; }
.header-left { display: flex; align-items: center; gap: 12px; }
.header-right { display: flex; align-items: center; gap: 12px; }
.username { color: #c0c0d0; }
.layout-main { background: #0f0f1a; padding: 20px; overflow-y: auto; }
</style>

<style>
.el-menu { border-right: none !important; }
.el-menu .el-sub-menu__title { color: #a0a0b0 !important; }
.el-menu .el-sub-menu__title:hover { color: #e8a850 !important; background: #22223a !important; }
.el-breadcrumb__inner { color: #a0a0b0 !important; }
.el-breadcrumb__inner.is-link:hover { color: #e8a850 !important; }
</style>
