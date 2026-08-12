<template>
  <div class="login-container">
    <div class="login-card">
      <h1 class="login-title">AI漫剧制作工作台</h1>
      <p class="login-subtitle">资产管理平台</p>
      <el-form ref="formRef" :model="form" :rules="rules" label-position="top" @submit.prevent="handleLogin">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" placeholder="请输入用户名" size="large" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="form.password" type="password" placeholder="请输入密码" size="large" show-password />
        </el-form-item>
        <el-button type="primary" size="large" :loading="loading" native-type="submit" class="login-btn">
          {{ loading ? '登录中...' : '登 录' }}
        </el-button>
        <div class="register-link">
          还没有账号？<el-button link type="primary" @click="$router.push('/register')">立即注册</el-button>
        </div>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { login } from '@/api/auth'
import { useUserStore } from '@/stores/user'
import { getMe } from '@/api/auth'

const router = useRouter()
const userStore = useUserStore()
const loading = ref(false)

const form = reactive({ username: '', password: '' })
const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
}

async function handleLogin() {
  loading.value = true
  try {
    const res = await login(form)
    const { token, userId, username, nickname, avatar, role } = res.data.data
    userStore.setAuth(token, { id: userId, username, nickname, avatar, role, email: '', createdAt: '' })
    ElMessage.success('登录成功')
    router.push('/dashboard')
  } catch {
    // error handled by interceptor
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  height: 100vh; display: flex; align-items: center; justify-content: center;
  background: radial-gradient(ellipse at center, var(--bg-white) 0%, var(--bg-cream) 70%);
}
.login-card {
  width: 400px; padding: 40px; background: var(--bg-white); border-radius: var(--radius-xl);
  border: 1px solid var(--border-hairline); box-shadow: var(--shadow-lg);
}
.login-title { color: var(--primary-color); text-align: center; font-size: 24px; margin-bottom: 4px; letter-spacing: 2px; }
.login-subtitle { color: var(--text-muted); text-align: center; font-size: 14px; margin-bottom: 32px; }
.login-btn { width: 100%; background: var(--primary-color); border: none; }
.login-btn:hover { transform: translateY(-2px); box-shadow: var(--shadow-glow); }
.register-link { text-align: center; margin-top: 16px; color: var(--text-muted); font-size: 13px; }
</style>
