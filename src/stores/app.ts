import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAppStore = defineStore('app', () => {
  const currentProjectId = ref<number | null>(null)
  const sidebarCollapsed = ref(false)

  function setProject(id: number) {
    currentProjectId.value = id
    localStorage.setItem('currentProjectId', String(id))
  }

  function restoreProject() {
    const id = localStorage.getItem('currentProjectId')
    if (id) currentProjectId.value = Number(id)
  }

  function toggleSidebar() {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }

  return { currentProjectId, sidebarCollapsed, setProject, restoreProject, toggleSidebar }
})
