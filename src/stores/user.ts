import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { UserVO } from '@/types'

export const useUserStore = defineStore('user', () => {
  const user = ref<UserVO | null>(null)
  const token = ref<string | null>(null)

  const isAdmin = computed(() => user.value?.role === 'ADMIN')

  function setAuth(t: string, u: UserVO) {
    token.value = t
    user.value = u
    localStorage.setItem('token', t)
    localStorage.setItem('user', JSON.stringify(u))
  }

  function restoreAuth() {
    const t = localStorage.getItem('token')
    const u = localStorage.getItem('user')
    if (t && u) {
      token.value = t
      try { user.value = JSON.parse(u) } catch { /* ignore */ }
    }
  }

  function clearAuth() {
    token.value = null
    user.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  return { user, token, isAdmin, setAuth, restoreAuth, clearAuth }
})
