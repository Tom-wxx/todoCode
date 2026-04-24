<script setup lang="ts">
import { computed } from 'vue'
import { Back, CircleCheck, Clock, Document } from '@element-plus/icons-vue'
import { useTodoStore } from '../stores/todo'
import { useSettingsStore } from '../stores/settings'
import { PRIORITY_LABELS_FULL, PRIORITY_HEX_COLORS } from '../utils/constants'
import { toLocalDateStr } from '../utils/helpers'

const todoStore = useTodoStore()
const settingsStore = useSettingsStore()

function getPriorityLabel(key: string) {
  return PRIORITY_LABELS_FULL[key] || key
}

function getPriorityColor(key: string) {
  return PRIORITY_HEX_COLORS[key] || '#737779'
}

function getWeekDay(dateStr: string) {
  const d = new Date(`${dateStr}T00:00:00`)
  const days = ['日', '一', '二', '三', '四', '五', '六']
  return days[d.getDay()]
}

function formatChangeLabel(current: number, previous: number) {
  if (previous === 0) {
    return current === 0 ? '与上周持平' : `较上周新增 ${current}`
  }
  const delta = current - previous
  if (delta === 0) return '与上周持平'
  return `${delta > 0 ? '+' : ''}${delta} vs 上周`
}

const thisWeekCompleted = computed(() =>
  todoStore.stats.weekTrend.reduce((sum, day) => sum + day.count, 0)
)

const previousWeekCompleted = computed(() => {
  const bucket = new Map<string, number>()
  for (const todo of todoStore.todos) {
    if (!todo.completed || !todo.updatedAt) continue
    const day = toLocalDateStr(todo.updatedAt)
    bucket.set(day, (bucket.get(day) || 0) + 1)
  }

  let total = 0
  for (let i = 13; i >= 7; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    total += bucket.get(toLocalDateStr(d.toISOString())) || 0
  }
  return total
})

const completionRate = computed(() => {
  return todoStore.stats.total > 0
    ? Math.round((todoStore.stats.completed / todoStore.stats.total) * 100)
    : 0
})

const highPriorityRatio = computed(() => {
  if (todoStore.stats.active === 0) return 0
  return Math.round((todoStore.stats.byPriority.high / todoStore.stats.active) * 100)
})

const activeSummaryLabel = computed(() => {
  if (todoStore.stats.active === 0) return '当前没有未完成任务'
  return `高优先级占比 ${highPriorityRatio.value}%`
})

const weekDeltaLabel = computed(() =>
  formatChangeLabel(thisWeekCompleted.value, previousWeekCompleted.value)
)

const trendLinePath = computed(() => {
  const data = todoStore.stats.weekTrend
  if (data.length === 0) return ''
  const max = Math.max(...data.map(d => d.count), 1)
  const width = 600
  const height = 160
  const stepX = width / (data.length - 1 || 1)

  return data.map((d, i) => {
    const x = i * stepX
    const y = height - (d.count / max) * (height - 20)
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
  }).join(' ')
})

const trendAreaPath = computed(() => {
  const data = todoStore.stats.weekTrend
  if (data.length === 0) return ''
  const max = Math.max(...data.map(d => d.count), 1)
  const width = 600
  const height = 160
  const stepX = width / (data.length - 1 || 1)

  let path = data.map((d, i) => {
    const x = i * stepX
    const y = height - (d.count / max) * (height - 20)
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
  }).join(' ')
  path += ` L ${width} ${height} L 0 ${height} Z`
  return path
})

const heatmapData = computed(() => {
  const bucket = new Map<string, number>()
  for (const todo of todoStore.todos) {
    if (!todo.completed || !todo.updatedAt) continue
    const day = toLocalDateStr(todo.updatedAt)
    bucket.set(day, (bucket.get(day) || 0) + 1)
  }

  const days: { date: string; level: number; count: number }[] = []
  const today = new Date()
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const dateStr = toLocalDateStr(d.toISOString())
    const count = bucket.get(dateStr) || 0
    const level = count === 0 ? 0 : count <= 1 ? 1 : count <= 3 ? 2 : count <= 5 ? 3 : 4
    days.push({ date: dateStr, level, count })
  }
  return days
})

const heatmapInsight = computed(() => {
  const weekdayCounts = new Array<number>(7).fill(0)
  for (const day of heatmapData.value) {
    if (day.count === 0) continue
    weekdayCounts[new Date(`${day.date}T00:00:00`).getDay()] += day.count
  }

  const max = Math.max(...weekdayCounts)
  if (max === 0) return '过去 30 天还没有完成记录。'

  const index = weekdayCounts.findIndex(count => count === max)
  const weekdayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return `过去 30 天完成高峰出现在 ${weekdayNames[index]}，累计 ${max} 项。`
})

const donutSegments = computed(() => {
  const categories = todoStore.stats.byCategory
  const total = Object.values(categories).reduce((sum, count) => sum + count, 0)
  if (total === 0) return []

  const colors = ['#006094', '#006479', '#e6a23c', '#b31b25', '#495f69', '#67bafd']
  let offset = 0

  return Object.entries(categories).map(([name, count], index) => {
    const pct = Math.round((count / total) * 100)
    const segment = { name, count, pct, offset, color: colors[index % colors.length] }
    offset += pct
    return segment
  })
})
</script>

<template>
  <div class="stats-panel">
    <div class="stats-header">
      <div>
        <h2 class="stats-title">生产力仪表盘</h2>
        <p class="stats-sub">所有指标都基于当前本地任务数据实时计算。</p>
      </div>
      <div class="stats-actions">
        <button class="stats-btn active">最近 30 天</button>
        <button class="stats-btn" @click="settingsStore.showStats = false; settingsStore.showCalendar = false">
          <el-icon><Back /></el-icon>
          返回
        </button>
      </div>
    </div>

    <div class="metric-cards">
      <div class="metric-card">
        <div class="metric-icon">
          <el-icon :size="20"><CircleCheck /></el-icon>
        </div>
        <div class="metric-trend neutral">完成率 {{ completionRate }}%</div>
        <div class="metric-value">{{ todoStore.stats.completed.toLocaleString() }}</div>
        <div class="metric-label">已完成任务总数</div>
      </div>

      <div class="metric-card">
        <div class="metric-icon">
          <el-icon :size="20"><Document /></el-icon>
        </div>
        <div class="metric-trend" :class="thisWeekCompleted >= previousWeekCompleted ? 'up' : 'down'">{{ weekDeltaLabel }}</div>
        <div class="metric-value">{{ thisWeekCompleted }}</div>
        <div class="metric-label">本周完成数</div>
      </div>

      <div class="metric-card">
        <div class="metric-icon tertiary">
          <el-icon :size="20"><Clock /></el-icon>
        </div>
        <div class="metric-trend neutral">{{ activeSummaryLabel }}</div>
        <div class="metric-value">{{ todoStore.stats.active }}</div>
        <div class="metric-label">未完成任务总数</div>
      </div>
    </div>

    <div class="chart-section">
      <div class="chart-header">
        <h3>任务完成趋势</h3>
        <div class="chart-legend">
          <span class="legend-item">
            <span class="legend-dot" style="background: var(--accent)"></span>
            已完成
          </span>
        </div>
      </div>
      <div class="trend-chart">
        <svg viewBox="0 0 600 160" preserveAspectRatio="none" class="trend-svg">
          <defs>
            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="var(--accent)" stop-opacity="0.15" />
              <stop offset="100%" stop-color="var(--accent)" stop-opacity="0" />
            </linearGradient>
          </defs>
          <path :d="trendAreaPath" fill="url(#areaGrad)" />
          <path :d="trendLinePath" fill="none" stroke="var(--accent)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
        <div class="trend-labels">
          <span v-for="day in todoStore.stats.weekTrend" :key="day.date" class="trend-day">
            周{{ getWeekDay(day.date) }}
          </span>
        </div>
      </div>
    </div>

    <div class="chart-grid">
      <div class="chart-section">
        <h3>分类占比</h3>
        <div class="donut-container">
          <svg viewBox="0 0 160 160" class="donut-svg">
            <circle
              v-for="(seg, i) in donutSegments"
              :key="i"
              cx="80"
              cy="80"
              r="60"
              fill="none"
              :stroke="seg.color"
              stroke-width="24"
              :stroke-dasharray="`${seg.pct * 3.77} ${377 - seg.pct * 3.77}`"
              :stroke-dashoffset="`${-seg.offset * 3.77}`"
              stroke-linecap="round"
            />
            <text x="80" y="76" text-anchor="middle" class="donut-number">{{ Object.keys(todoStore.stats.byCategory).length }}</text>
            <text x="80" y="96" text-anchor="middle" class="donut-label-text">个活跃分类</text>
          </svg>

          <div class="donut-legend">
            <div v-for="(seg, i) in donutSegments" :key="i" class="donut-legend-item">
              <span class="donut-legend-dot" :style="{ background: seg.color }"></span>
              <span class="donut-legend-name">{{ seg.name }}</span>
              <span class="donut-legend-pct">{{ seg.pct }}%</span>
            </div>
          </div>
        </div>
      </div>

      <div class="chart-section">
        <h3>近 30 天热力图</h3>
        <div class="heatmap-container">
          <div class="heatmap-grid">
            <div
              v-for="day in heatmapData"
              :key="day.date"
              class="heatmap-cell"
              :class="`heat-${day.level}`"
              :title="`${day.date}: ${day.count} 项`"
            ></div>
          </div>
          <div class="heatmap-legend">
            <span class="heatmap-legend-label">少</span>
            <div class="heatmap-cell heat-0 small"></div>
            <div class="heatmap-cell heat-1 small"></div>
            <div class="heatmap-cell heat-2 small"></div>
            <div class="heatmap-cell heat-3 small"></div>
            <div class="heatmap-cell heat-4 small"></div>
            <span class="heatmap-legend-label">多</span>
          </div>
        </div>
        <p class="heatmap-insight">{{ heatmapInsight }}</p>
      </div>
    </div>

    <div class="chart-section">
      <h3>未完成任务优先级分布</h3>
      <div class="priority-bars">
        <div v-for="(count, key) in todoStore.stats.byPriority" :key="key" class="priority-bar-item">
          <span class="priority-label">{{ getPriorityLabel(key as string) }}</span>
          <div class="bar-track">
            <div
              class="bar-fill"
              :style="{ width: todoStore.stats.active > 0 ? `${(count / todoStore.stats.active) * 100}%` : '0%', background: getPriorityColor(key as string) }"
            ></div>
          </div>
          <span class="bar-count">{{ count }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.stats-panel {
  flex: 1;
  overflow-y: auto;
  padding: 28px 32px 40px;
}

.stats-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 28px;
}

.stats-title {
  font-family: 'Manrope', sans-serif;
  font-size: 26px;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.5px;
}

.stats-sub {
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  color: var(--text-muted);
  margin-top: 4px;
}

.stats-actions {
  display: flex;
  gap: 8px;
}

.stats-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 16px;
  border: 1px solid var(--border-color);
  background: var(--surface-container-lowest);
  border-radius: 8px;
  font-family: 'Manrope', sans-serif;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s;
}

.stats-btn:hover {
  border-color: var(--border-color-hover);
  background: var(--bg-secondary);
}

.stats-btn.active {
  background: var(--accent);
  color: var(--on-accent);
  border-color: var(--accent);
}

.metric-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 28px;
}

.metric-card {
  background: var(--surface-container-lowest);
  border-radius: 12px;
  padding: 20px;
  position: relative;
  box-shadow: 0 2px 12px rgba(43, 47, 49, 0.04);
}

.metric-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: rgba(0, 96, 148, 0.08);
  color: var(--accent);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
}

.metric-icon.tertiary {
  background: rgba(0, 100, 121, 0.08);
  color: var(--tertiary);
}

.metric-trend {
  font-family: 'Inter', sans-serif;
  font-size: 11px;
  font-weight: 500;
  position: absolute;
  top: 20px;
  right: 20px;
}

.metric-trend.up {
  color: #006479;
}

.metric-trend.down {
  color: var(--priority-high);
}

.metric-trend.neutral {
  color: var(--text-muted);
}

.metric-value {
  font-family: 'Manrope', sans-serif;
  font-size: 36px;
  font-weight: 800;
  color: var(--text-primary);
  line-height: 1.1;
}

.metric-label {
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 4px;
}

.chart-section {
  background: var(--surface-container-lowest);
  border-radius: 12px;
  padding: 22px;
  margin-bottom: 16px;
  box-shadow: 0 2px 12px rgba(43, 47, 49, 0.04);
}

.chart-section h3 {
  font-family: 'Manrope', sans-serif;
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 16px;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.chart-header h3 {
  margin-bottom: 0;
}

.chart-legend {
  display: flex;
  gap: 16px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  color: var(--text-muted);
}

.legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.trend-chart {
  position: relative;
}

.trend-svg {
  width: 100%;
  height: 160px;
}

.trend-labels {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
}

.trend-day {
  font-family: 'Inter', sans-serif;
  font-size: 11px;
  color: var(--text-muted);
}

.chart-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.donut-container {
  display: flex;
  align-items: center;
  gap: 24px;
}

.donut-svg {
  width: 160px;
  height: 160px;
  flex-shrink: 0;
}

.donut-number {
  font-family: 'Manrope', sans-serif;
  font-size: 28px;
  font-weight: 700;
  fill: var(--text-primary);
}

.donut-label-text {
  font-family: 'Inter', sans-serif;
  font-size: 11px;
  fill: var(--text-muted);
}

.donut-legend {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.donut-legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: 'Inter', sans-serif;
  font-size: 13px;
}

.donut-legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.donut-legend-name {
  color: var(--text-secondary);
  flex: 1;
}

.donut-legend-pct {
  color: var(--text-muted);
  font-weight: 600;
}

.heatmap-container {
  margin-bottom: 12px;
}

.heatmap-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 4px;
}

.heatmap-cell {
  aspect-ratio: 1;
  border-radius: 4px;
  transition: all 0.2s;
}

.heatmap-cell.small {
  width: 14px;
  height: 14px;
}

.heat-0 {
  background: var(--bg-secondary);
}

.heat-1 {
  background: rgba(0, 96, 148, 0.15);
}

.heat-2 {
  background: rgba(0, 96, 148, 0.35);
}

.heat-3 {
  background: rgba(0, 96, 148, 0.6);
}

.heat-4 {
  background: var(--accent);
}

.heatmap-legend {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 8px;
  justify-content: flex-end;
}

.heatmap-legend-label {
  font-family: 'Inter', sans-serif;
  font-size: 10px;
  color: var(--text-muted);
  margin: 0 4px;
}

.heatmap-insight {
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  color: var(--text-muted);
  line-height: 1.6;
}

.priority-bars {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.priority-bar-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.priority-label {
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  width: 70px;
  color: var(--text-secondary);
}

.bar-track {
  flex: 1;
  height: 20px;
  background: var(--bg-secondary);
  border-radius: 10px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  border-radius: 10px;
  transition: width 0.5s ease;
  min-width: 2px;
}

.bar-count {
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  width: 28px;
  text-align: right;
  color: var(--text-secondary);
  font-weight: 600;
}
</style>
