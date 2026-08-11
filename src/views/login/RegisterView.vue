<template>
  <div class="login-container">
    <div class="login-card">
      <h1 class="login-title">创建账号</h1>
      <p class="login-subtitle">AI漫剧制作工作台</p>
      <el-form ref="formRef" :model="form" :rules="rules" label-position="top" @submit.prevent="handleRegister">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" placeholder="3-32位字符" size="large" />
        </el-form-item>
        <el-form-item label="昵称" prop="nickname">
          <el-input v-model="form.nickname" placeholder="选填" size="large" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="form.email" placeholder="选填" size="large" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="form.password" type="password" placeholder="至少6位" size="large" show-password />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input v-model="form.confirmPassword" type="password" placeholder="再次输入密码" size="large" show-password />
        </el-form-item>
        <el-button type="primary" size="large" :loading="loading" native-type="submit" class="login-btn">
          {{ loading ? '注册中...' : '注 册' }}
        </el-button>
        <div class="register-link">
          已有账号？<el-button link type="primary" @click="$router.push('/login')">返回登录</el-button>
        </div>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { register } from '@/api/auth'

const router = useRouter()
const loading = ref(false)

const form = reactive({
  username: '',
  nickname: '',
  email: '',
  password: '',
  confirmPassword: '',
})

const validatePass = (_rule: unknown, value: string, callback: (err?: Error) => void) => {
  if (value !== form.password) {
    callback(new Error('两次密码输入不一致'))
  } else {
    callback()
  }
}

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 32, message: '用户名长度3-32位', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 32, message: '密码长度6-32位', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    { validator: validatePass, trigger: 'blur' },
  ],
}

async function handleRegister() {
  loading.value = true
  try {
    await register({
      username: form.username,
      password: form.password,
      nickname: form.nickname,
      email: form.email,
    })
    ElMessage.success('注册成功，请登录')
    router.push('/login')
  } catch {
    // handled by interceptor
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  height: 100vh; display: flex; align-items: center; justify-content: center;
  background: radial-gradient(ellipse at center, var(--bg-card) 0%, var(--bg-darkest) 70%);
}
.login-card {
  width: 420px; padding: 36px 40px; background: var(--bg-card); border-radius: var(--radius-xl);
  border: 1px solid var(--border-color); box-shadow: var(--shadow-lg);
}
.login-title { color: var(--primary-color); text-align: center; font-size: 22px; margin-bottom: 4px; letter-spacing: 2px; }
.login-subtitle { color: var(--text-muted); text-align: center; font-size: 14px; margin-bottom: 28px; }
.login-btn { width: 100%; background: var(--primary-gradient); border: none; }
.login-btn:hover { transform: translateY(-2px); box-shadow: var(--shadow-glow); }
.register-link { text-align: center; margin-top: 16px; color: var(--text-muted); font-size: 13px; }
</style>
