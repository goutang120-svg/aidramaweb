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
        text-color="#a0a0c0"
        active-text-color="#fff"
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
  background: var(--bg-darkest);
}

.layout-aside {
  background: var(--bg-card);
  border-right: 1px solid var(--border-color);
  overflow-y: auto;
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.logo {
  height: 72px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 0 16px;
  cursor: pointer;
  border-bottom: 1px solid var(--border-color);
  position: relative;
  overflow: hidden;
}

.logo::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--primary-gradient);
}

.logo-icon-wrap {
  width: 40px;
  height: 40px;
  background: var(--primary-gradient);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.logo-text {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}

.logo-title {
  color: var(--text-primary);
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 1px;
}

.logo-subtitle {
  color: var(--primary-light);
  font-size: 11px;
  font-weight: 500;
}

.layout-header {
  background: var(--bg-card);
  border-bottom: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  height: 64px;
  backdrop-filter: blur(10px);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.collapse-btn {
  color: var(--text-secondary);
  padding: 8px;
  border-radius: var(--radius-sm);
  transition: all 0.3s ease;
}

.collapse-btn:hover {
  color: var(--primary-light);
  background: var(--bg-card-hover);
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
  padding: 6px 12px;
  background: var(--bg-dark);
  border-radius: var(--radius-xl);
  border: 1px solid var(--border-color);
}

.user-avatar {
  width: 28px;
  height: 28px;
  background: var(--primary-gradient);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  color: #fff;
}

.username {
  color: var(--text-primary);
  font-size: 13px;
  font-weight: 500;
}

.logout-btn {
  color: var(--text-muted);
  padding: 8px;
  border-radius: var(--radius-sm);
  transition: all 0.3s ease;
}

.logout-btn:hover {
  color: var(--accent-color);
  background: rgba(245, 87, 108, 0.1);
}

.layout-main {
  background: var(--bg-darkest);
  padding: 24px;
  overflow-y: auto;
}

/* 页面切换动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.fade-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>

<style>
/* Element Plus 覆盖 */
.el-menu {
  border-right: none !important;
  padding: 8px 0;
}

.el-sub-menu__title {
  color: #a0a0c0 !important;
  margin: 2px 8px;
  border-radius: var(--radius-sm);
}

.el-sub-menu__title:hover {
  color: var(--primary-light) !important;
  background: var(--bg-card-hover) !important;
}

.el-breadcrumb__inner {
  color: var(--text-muted) !important;
}

.el-breadcrumb__inner.is-link:hover {
  color: var(--primary-light) !important;
}

.el-breadcrumb__separator {
  color: var(--text-muted);
}

/* 菜单激活态 */
.el-menu-item.is-active {
  position: relative;
}

.el-menu-item.is-active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 60%;
  background: var(--primary-gradient);
  border-radius: 0 3px 3px 0;
}
</style>
