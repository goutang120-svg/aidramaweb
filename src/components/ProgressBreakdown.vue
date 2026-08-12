<template>
  <div class="progress-breakdown">
    <!-- Overall ring -->
    <div class="overall-card">
      <div class="ring-wrap">
        <svg :width="ringSize" :height="ringSize" class="ring">
          <circle
            :cx="ringSize / 2" :cy="ringSize / 2" :r="radius"
            fill="none"
            stroke="var(--border-hairline)"
            :stroke-width="ringStroke"
          />
          <circle
            :cx="ringSize / 2" :cy="ringSize / 2" :r="radius"
            fill="none"
            :stroke="progressColor(overall)"
            :stroke-width="ringStroke"
            stroke-linecap="round"
            :stroke-dasharray="circumference"
            :stroke-dashoffset="dashOffset"
            :transform="`rotate(-90 ${ringSize / 2} ${ringSize / 2})`"
            class="ring-progress"
          />
        </svg>
        <div class="ring-inner">
          <div class="ring-value">{{ overall }}<span class="ring-unit">%</span></div>
          <div class="ring-label">{{ overallLabel }}</div>
        </div>
      </div>
      <div class="overall-desc">
        <div class="desc-title">{{ title }}</div>
        <div class="desc-sub">{{ subtitle }}</div>
      </div>
    </div>

    <!-- Dimension bars -->
    <div class="dim-grid">
      <div v-for="d in dimensions" :key="d.key" class="dim-item">
        <div class="dim-head">
          <span class="dim-dot" :style="{ background: progressColor(d.value) }"></span>
          <span class="dim-label">{{ d.label }}</span>
          <span class="dim-weight" v-if="d.weight">{{ d.weight }}%</span>
          <span class="dim-value">{{ d.value }}<span class="dim-unit">%</span></span>
        </div>
        <div class="dim-bar">
          <div
            class="dim-bar-fill"
            :style="{ width: d.value + '%', background: progressColor(d.value) }"
          />
        </div>
        <div class="dim-caption" v-if="d.caption">{{ d.caption }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Dimension {
  key: string
  label: string
  value: number
  weight?: number
  caption?: string
}

const props = withDefaults(defineProps<{
  overall: number
  overallLabel?: string
  title?: string
  subtitle?: string
  dimensions: Dimension[]
  ringSize?: number
}>(), {
  overallLabel: '综合进度',
  title: '进度概览',
  subtitle: '根据各维度加权动态计算',
  ringSize: 120,
})

const ringStroke = 10
const radius = computed(() => (props.ringSize - ringStroke) / 2)
const circumference = computed(() => 2 * Math.PI * radius.value)
const dashOffset = computed(() =>
  circumference.value * (1 - Math.min(100, Math.max(0, props.overall)) / 100)
)

function progressColor(v: number): string {
  if (v >= 100) return '#5C8A5C'
  if (v >= 70) return '#C4612F'
  if (v >= 30) return '#D4A05C'
  if (v > 0) return '#8AA3C4'
  return '#B0AAA0'
}
</script>

<style scoped>
.progress-breakdown {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* ===== Overall ===== */
.overall-card {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 20px 24px;
  background: var(--bg-white);
  border: 1px solid var(--border-hairline);
  border-radius: var(--radius-lg);
}
.ring-wrap {
  position: relative;
  flex-shrink: 0;
}
.ring-progress {
  transition: stroke-dashoffset 0.6s ease, stroke 0.3s ease;
}
.ring-inner {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.ring-value {
  font-size: 26px;
  font-weight: 600;
  color: var(--text-ink);
  line-height: 1;
}
.ring-unit {
  font-size: 14px;
  color: var(--text-secondary);
  margin-left: 1px;
  font-weight: 500;
}
.ring-label {
  font-size: 11px;
  color: var(--text-secondary);
  margin-top: 4px;
}
.overall-desc {
  flex: 1;
  min-width: 0;
}
.desc-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-ink);
  margin-bottom: 4px;
}
.desc-sub {
  font-size: 12px;
  color: var(--text-secondary);
  line-height: 1.6;
}

/* ===== Dimension grid ===== */
.dim-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 14px;
  padding: 18px 20px;
  background: var(--bg-white);
  border: 1px solid var(--border-hairline);
  border-radius: var(--radius-lg);
}
.dim-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.dim-head {
  display: flex;
  align-items: center;
  gap: 6px;
}
.dim-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
.dim-label {
  color: var(--text-ink);
  font-size: 13px;
  font-weight: 500;
  flex-shrink: 0;
}
.dim-weight {
  color: var(--text-secondary);
  font-size: 11px;
  background: var(--bg-cream);
  border-radius: var(--radius-sm);
  padding: 0 6px;
  line-height: 1.6;
}
.dim-value {
  margin-left: auto;
  color: var(--text-ink);
  font-size: 14px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}
.dim-unit {
  font-size: 11px;
  color: var(--text-secondary);
  margin-left: 1px;
  font-weight: 500;
}
.dim-bar {
  height: 6px;
  background: var(--bg-cream);
  border-radius: var(--radius-pill);
  overflow: hidden;
}
.dim-bar-fill {
  height: 100%;
  border-radius: var(--radius-pill);
  transition: width 0.5s ease, background 0.3s ease;
}
.dim-caption {
  color: var(--text-secondary);
  font-size: 11px;
  margin-top: 2px;
}
</style>
