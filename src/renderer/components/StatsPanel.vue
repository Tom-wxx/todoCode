<script setup lang="ts">
import { useTodoStore } from '../stores/todo'
import { useSettingsStore } from '../stores/settings'
import { PRIORITY_LABELS_FULL, PRIORITY_HEX_COLORS } from '../utils/constants'

const todoStore = useTodoStore()
const settingsStore = useSettingsStore()

function getPriorityLabel(key: string) {
  return PRIORITY_LABELS_FULL[key] || key
}

function getPriorityColor(key: string) {
  return PRIORITY_HEX_COLORS[key] || '#909399'
}

function getWeekDay(dateStr: string) {
  const d = new Date(dateStr)
  const days = ['日', '一', '二', '三', '四', '五', '六']
  return days[d.getDay()]
}

function getBarHeight(count: number) {
  const max = Math.max(...todoStore.stats.weekTrend.map(d => d.count), 1)
  return Math.max((count / max) * 100, 4) + '%'
}
</script>

<template>
  <div class="stats-panel">
    <div class="stats-header">
      <h2>统计概览</h2>
      <el-button text @click="settingsStore.showStats = false">
        <el-icon><Back /></el-icon> 返回
      </el-button>
    </div>

    <!-- 总览卡片 -->
    <div class="stats-cards">
      <div class="stat-card">
        <el-icon class="stat-icon"><Document /></el-icon>
        <div class="stat-number">{{ todoStore.stats.total }}</div>
        <div class="stat-label">总计</div>
      </div>
      <div class="stat-card">
        <el-icon class="stat-icon" style="color: var(--priority-low)"><CircleCheck /></el-icon>
        <div class="stat-number" style="color: var(--priority-low)">{{ todoStore.stats.completed }}</div>
        <div class="stat-label">已完成</div>
      </div>
      <div class="stat-card">
        <el-icon class="stat-icon" style="color: var(--accent)"><Clock /></el-icon>
        <div class="stat-number" style="color: var(--accent)">{{ todoStore.stats.active }}</div>
        <div class="stat-label">进行中</div>
      </div>
      <div class="stat-card">
        <el-icon class="stat-icon" style="color: var(--priority-high)"><WarningFilled /></el-icon>
        <div class="stat-number" style="color: var(--priority-high)">{{ todoStore.stats.overdueCount }}</div>
        <div class="stat-label">已过期</div>
      </div>
    </div>

    <!-- 完成率 -->
    <div class="stats-section">
      <h3>完成率</h3>
      <el-progress
        :percentage="todoStore.stats.total > 0 ? Math.round(todoStore.stats.completed / todoStore.stats.total * 100) : 0"
        :stroke-width="20"
        :text-inside="true"
      />
    </div>

    <!-- 优先级分布 -->
    <div class="stats-section">
      <h3>未完成事项 - 优先级分布</h3>
      <div class="priority-bars">
        <div v-for="(count, key) in todoStore.stats.byPriority" :key="key" class="priority-bar-item">
          <span class="priority-label">{{ getPriorityLabel(key as string) }}</span>
          <div class="bar-track">
            <div
              class="bar-fill"
              :style="{ width: todoStore.stats.active > 0 ? (count / todoStore.stats.active * 100) + '%' : '0%', background: getPriorityColor(key as string) }"
            ></div>
          </div>
          <span class="bar-count">{{ count }}</span>
        </div>
      </div>
    </div>

    <!-- 分类分布 -->
    <div class="stats-section" v-if="Object.keys(todoStore.stats.byCategory).length > 0">
      <h3>分类分布</h3>
      <div class="category-chips">
        <div v-for="(count, cat) in todoStore.stats.byCategory" :key="cat" class="category-chip">
          <span>{{ cat }}</span>
          <span class="chip-count">{{ count }}</span>
        </div>
      </div>
    </div>

    <!-- 近7天趋势 -->
    <div class="stats-section">
      <h3>近 7 天完成趋势</h3>
      <div class="trend-chart">
        <div v-for="day in todoStore.stats.weekTrend" :key="day.date" class="trend-bar">
          <div class="trend-bar-fill" :style="{ height: getBarHeight(day.count) }"></div>
          <span class="trend-label">周{{ getWeekDay(day.date) }}</span>
          <span class="trend-count">{{ day.count }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.stats-panel {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
}

.stats-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.stats-header h2 {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 24px;
}

.stat-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 10px;
  padding: 16px;
  text-align: center;
}

.stat-number {
  font-size: 28px;
  font-weight: 700;
  color: var(--text-primary);
}

.stat-label {
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 4px;
}

.stats-section {
  margin-bottom: 24px;
}

.stats-section h3 {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 12px;
}

.priority-bars {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.priority-bar-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.priority-label {
  font-size: 13px;
  width: 70px;
  color: var(--text-secondary);
}

.bar-track {
  flex: 1;
  height: 18px;
  background: var(--bg-secondary);
  border-radius: 9px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  border-radius: 9px;
  transition: width 0.5s ease;
  min-width: 2px;
}

.bar-count {
  font-size: 13px;
  width: 24px;
  text-align: right;
  color: var(--text-secondary);
}

.category-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.category-chip {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  font-size: 13px;
  color: var(--text-secondary);
}

.chip-count {
  background: var(--accent);
  color: white;
  font-size: 11px;
  padding: 0 6px;
  border-radius: 10px;
  line-height: 18px;
}

.trend-chart {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  height: 120px;
  padding: 10px 0;
}

.trend-bar {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
  justify-content: flex-end;
}

.stat-icon {
  font-size: 24px;
  margin-bottom: 4px;
  color: var(--text-muted);
}

.trend-bar-fill {
  width: 100%;
  max-width: 40px;
  background: linear-gradient(to top, #409eff, #79bbff);
  border-radius: 4px 4px 0 0;
  transition: height 0.5s ease;
}

.trend-label {
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 6px;
}

.trend-count {
  font-size: 11px;
  color: var(--text-secondary);
  margin-bottom: 4px;
}
</style>
