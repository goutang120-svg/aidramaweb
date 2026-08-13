import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/views/login/LoginView.vue'),
      meta: { noAuth: true },
    },
    {
      path: '/register',
      name: 'Register',
      component: () => import('@/views/login/RegisterView.vue'),
      meta: { noAuth: true },
    },
    {
      path: '/',
      component: () => import('@/layouts/MainLayout.vue'),
      redirect: '/dashboard',
      children: [
        { path: 'dashboard', name: 'Dashboard', component: () => import('@/views/dashboard/DashboardView.vue'), meta: { title: '工作台' } },
        { path: 'projects', name: 'Projects', component: () => import('@/views/project/ProjectList.vue'), meta: { title: '项目管理' } },
        { path: 'projects/:id', name: 'ProjectDetail', component: () => import('@/views/project/ProjectDetail.vue'), meta: { title: '项目详情' } },
        { path: 'story-bible', name: 'StoryBible', component: () => import('@/views/story/StoryBible.vue'), meta: { title: '故事圣经' } },
        { path: 'story-map', name: 'StoryMap', component: () => import('@/views/story/StoryMap.vue'), meta: { title: '故事地图' } },
        { path: 'story-clues', name: 'StoryClues', component: () => import('@/views/story/StoryClues.vue'), meta: { title: '故事线索' } },
        { path: 'characters', name: 'Characters', component: () => import('@/views/character/CharacterList.vue'), meta: { title: '人物' } },
        { path: 'characters/:id', name: 'CharacterDetail', component: () => import('@/views/character/CharacterDetail.vue'), meta: { title: '人物详情' } },
        { path: 'scenes', name: 'Scenes', component: () => import('@/views/scene/SceneList.vue'), meta: { title: '场景' } },
        { path: 'scenes/:id', name: 'SceneDetail', component: () => import('@/views/scene/SceneDetail.vue'), meta: { title: '场景详情' } },
        { path: 'props', name: 'Props', component: () => import('@/views/prop/PropList.vue'), meta: { title: '道具' } },
        { path: 'props/:id', name: 'PropDetail', component: () => import('@/views/prop/PropDetail.vue'), meta: { title: '道具详情' } },
        { path: 'styles', name: 'Styles', component: () => import('@/views/style/StyleList.vue'), meta: { title: '风格参考' } },
        { path: 'seasons', name: 'Seasons', component: () => import('@/views/season/SeasonList.vue'), meta: { title: '分季' } },
        { path: 'seasons/:id', name: 'SeasonDetail', component: () => import('@/views/season/SeasonDetail.vue'), meta: { title: '分季详情' } },
        { path: 'episodes', name: 'Episodes', component: () => import('@/views/episode/EpisodeList.vue'), meta: { title: '分集' } },
        { path: 'episodes/:id', name: 'EpisodeDetail', component: () => import('@/views/episode/EpisodeDetail.vue'), meta: { title: '分集详情' } },
        { path: 'shots', name: 'Shots', component: () => import('@/views/shot/ShotList.vue'), meta: { title: '镜头' } },
        { path: 'shots/:id', name: 'ShotDetail', component: () => import('@/views/shot/ShotDetail.vue'), meta: { title: '镜头详情' } },
        { path: 'assets', name: 'Assets', component: () => import('@/views/asset/AssetCenter.vue'), meta: { title: '资源中心' } },
        { path: 'prompts', name: 'Prompts', component: () => import('@/views/prompt/PromptList.vue'), meta: { title: 'Prompt' } },
        { path: 'users', name: 'Users', component: () => import('@/views/admin/UserManagement.vue'), meta: { title: '用户管理' } },
      ],
    },
  ],
})

router.beforeEach((to, _from, next) => {
  const token = localStorage.getItem('token')
  if (!to.meta.noAuth && !token) {
    next('/login')
  } else if (to.path === '/login' && token) {
    next('/dashboard')
  } else {
    next()
  }
})

export default router
