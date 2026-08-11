<template>
  <div class="project-switcher">
    <el-select
      v-model="selectedId"
      placeholder="选择项目"
      size="default"
      style="width: 200px"
      @change="handleChange"
      clearable
    >
      <el-option
        v-for="p in projectList"
        :key="p.id"
        :label="p.name"
        :value="p.id"
      />
    </el-select>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { getProjects } from '@/api/index'
import { useAppStore } from '@/stores/app'
import type { Project } from '@/types'

const appStore = useAppStore()

const projectList = ref<Project[]>([])
const selectedId = ref<number | null>(appStore.currentProjectId)

watch(() => appStore.currentProjectId, (val) => {
  selectedId.value = val
})

async function fetchProjects() {
  try {
    const res = await getProjects({ page: 1, pageSize: 100 })
    projectList.value = res.data.data.records
  } catch { /* handled */ }
}

function handleChange(val: number | null) {
  if (val) {
    appStore.setProject(val)
  }
}

onMounted(fetchProjects)
</script>

<style scoped>
.project-switcher { display: inline-flex; align-items: center; }
</style>
