<template>
  <el-container class="layout-container">
    <el-aside :width="sidebarCollapsed ? '72px' : '240px'" class="layout-aside">
      <div class="logo" @click="$router.push('/dashboard')">
        <div class="logo-icon-wrap">
          <span class="logo-emoji">🎬</span>
        </div>
        <span v-if="!sidebarCollapsed" class="logo-text">
          <span class="logo-title">AI漫剧</span>
          <span class="logo-subtitle">工作台</span>
        </span>
      </div>
      <el-menu
        :default-active="activeMenu"
        :collapse="sidebarCollapsed"
        background-color="transparent"
        text-color="#8A867F"
        active-text-color="#FFFFFF"
        router
      >
        <el-menu-item index="/dashboard">
          <el-icon><DataAnalysis /></el-icon>
          <span>工作台</span>
        </el-menu-item>
        <el-menu-item index="/projects">
          <el-icon><Folder /></el-icon>
          <span>项目管理</span>
        </el-menu-item>

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

        <el-menu-item index="/assets">
          <el-icon><Box /></el-icon>
          <span>资源中心</span>
        </el-menu-item>
        <el-menu-item index="/prompts">
          <el-icon><EditPen /></el-icon>
          <span>Prompt</span>
        </el-menu-item>

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
          <el-button text class="collapse-btn" @click="appStore.toggleSidebar()">
            <el-icon :size="20"><Fold v-if="!sidebarCollapsed" /><Expand v-else /></el-icon>
          </el-button>
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/dashboard' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item v-if="route.meta.title">{{ route.meta.title }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="header-right">
          <div class="user-info">
            <div class="user-avatar">{{ userStore.user?.nickname?.[0] || userStore.user?.username?.[0] || 'U' }}</div>
            <span class="username">{{ userStore.user?.nickname || userStore.user?.username }}</span>
          </div>
          <el-button text class="logout-btn" @click="handleLogout">
            <el-icon><SwitchButton /></el-icon>
          </el-button>
        </div>
      </el-header>

      <el-main class="layout-main">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
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
.layout-container {
  height: 100vh;
  background: var(--bg-cream);
}

.layout-aside {
  background: var(--bg-white);
  border-right: 1px solid var(--border-hairline);
  overflow-y: auto;
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 2px 0 8px rgba(31, 36, 33, 0.04);
}

.logo {
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 0 20px;
  cursor: pointer;
  border-bottom: 1px solid var(--border-hairline);
  position: relative;
  overflow: hidden;
}

.logo::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: var(--primary-color);
}

.logo-icon-wrap {
  width: 44px;
  height: 44px;
  background: var(--primary-color);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  box-shadow: 0 4px 12px rgba(196, 97, 47, 0.25);
}

.logo-text {
  display: flex;
  flex-direction: column;
  line-height: 1.3;
}

.logo-title {
  color: var(--text-ink);
  font-size: 17px;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.logo-subtitle {
  color: var(--text-secondary);
  font-size: 11px;
  font-weight: 400;
}

.layout-header {
  background: var(--bg-white);
  border-bottom: 1px solid var(--border-hairline);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 32px;
  height: 72px;
  backdrop-filter: blur(10px);
  box-shadow: 0 1px 3px rgba(31, 36, 33, 0.04);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.collapse-btn {
  color: var(--text-secondary);
  padding: 8px;
  border-radius: var(--radius-sm);
  transition: all 0.3s ease;
}

.collapse-btn:hover {
  color: var(--primary-color);
  background: var(--primary-tint);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 16px;
  background: var(--bg-surface);
  border-radius: var(--radius-pill);
  border: 1px solid var(--border-hairline);
  transition: all 0.3s ease;
}

.user-info:hover {
  border-color: var(--primary-color);
  box-shadow: var(--shadow-soft);
}

.user-avatar {
  width: 32px;
  height: 32px;
  background: var(--primary-color);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 600;
  color: white;
}

.username {
  color: var(--text-ink);
  font-size: 14px;
  font-weight: 500;
}

.logout-btn {
  color: var(--text-muted);
  padding: 8px;
  border-radius: var(--radius-sm);
  transition: all 0.3s ease;
}

.logout-btn:hover {
  color: var(--primary-color);
  background: var(--primary-tint);
}

.layout-main {
  background: var(--bg-cream);
  padding: 28px;
  overflow-y: auto;
}

/* 页面切换动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.fade-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

.fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>

<style>
/* Element Plus 覆盖 */
.el-menu {
  border-right: none !important;
  padding: 12px 0;
}

.el-menu-item {
  color: var(--text-secondary) !important;
  margin: 3px 12px;
  border-radius: var(--radius-sm);
  font-weight: 400;
  height: 44px;
  line-height: 44px;
}

.el-menu-item:hover {
  color: var(--text-ink) !important;
  background: var(--bg-hover) !important;
}

.el-sub-menu__title {
  color: var(--text-secondary) !important;
  margin: 3px 12px;
  border-radius: var(--radius-sm);
  font-weight: 400;
  height: 44px;
  line-height: 44px;
}

.el-sub-menu__title:hover {
  color: var(--text-ink) !important;
  background: var(--bg-hover) !important;
}

.el-menu .el-sub-menu__icon-arrow {
  color: var(--text-muted);
}

.el-sub-menu .el-menu-item {
  background: transparent !important;
  min-width: auto;
}

.el-sub-menu .el-menu-item:hover {
  background: var(--bg-hover) !important;
}

.el-breadcrumb__inner {
  color: var(--text-muted) !important;
  font-weight: 400;
}

.el-breadcrumb__inner.is-link:hover {
  color: var(--primary-color) !important;
}

.el-breadcrumb__separator {
  color: var(--text-muted);
}

/* 菜单激活态 */
.el-menu-item.is-active {
  position: relative;
  background: var(--primary-color) !important;
  color: white !important;
  font-weight: 500;
}

.el-menu-item.is-active::before {
  content: '';
  position: absolute;
  left: -12px;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 60%;
  background: var(--primary-color);
  border-radius: 0 4px 4px 0;
}
</style>
