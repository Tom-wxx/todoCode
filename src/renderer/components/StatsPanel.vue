<script setup lang="ts">
import { computed } from 'vue'
import { useTodoStore } from '../stores/todo'
import { useSettingsStore } from '../stores/settings'
import { PRIORITY_LABELS_FULL, PRIORITY_HEX_COLORS } from '../utils/constants'

const todoStore = useTodoStore()
const settingsStore = useSettingsStore()

function getPriorityLabel(key: string) {
  return PRIORITY_LABELS_FULL[key] || key
}

function getPriorityColor(key: string) {
  return PRIORITY_HEX_COLORS[key] || '#737779'
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

// 完成率
const completionRate = computed(() => {
  return todoStore.stats.total > 0 ? Math.round(todoStore.stats.completed / todoStore.stats.total * 100) : 0
})

// 分类百分比
const categoryPercentages = computed(() => {
  const total = Object.values(todoStore.stats.byCategory).reduce((a, b) => a + b, 0)
  if (total === 0) return {}
  const result: Record<string, number> = {}
  for (const [cat, count] of Object.entries(todoStore.stats.byCategory)) {
    result[cat] = Math.round((count / total) * 100)
  }
  return result
})

// SVG 折线图路径
const trendLinePath = computed(() => {
  const data = todoStore.stats.weekTrend
  if (data.length === 0) return ''
  const max = Math.max(...data.map(d => d.count), 1)
  const w = 600, h = 160
  const stepX = w / (data.length - 1 || 1)
  return data.map((d, i) => {
    const x = i * stepX
    const y = h - (d.count / max) * (h - 20)
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
  }).join(' ')
})

const trendAreaPath = computed(() => {
  const data = todoStore.stats.weekTrend
  if (data.length === 0) return ''
  const max = Math.max(...data.map(d => d.count), 1)
  const w = 600, h = 160
  const stepX = w / (data.length - 1 || 1)
  let path = data.map((d, i) => {
    const x = i * stepX
    const y = h - (d.count / max) * (h - 20)
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
  }).join(' ')
  path += ` L ${w} ${h} L 0 ${h} Z`
  return path
})

// 热力图数据（模拟过去30天）
const heatmapData = computed(() => {
  const days: { date: string; level: number }[] = []
  const today = new Date()
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().split('T')[0]
    const completed = todoStore.todos.filter(t =>
      t.completed && t.updatedAt && t.updatedAt.startsWith(dateStr)
    ).length
    const level = completed === 0 ? 0 : completed <= 1 ? 1 : completed <= 3 ? 2 : completed <= 5 ? 3 : 4
    days.push({ date: dateStr, level })
  }
  return days
})

// 环形图
const donutSegments = computed(() => {
  const cats = todoStore.stats.byCategory
  const total = Object.values(cats).reduce((a, b) => a + b, 0)
  if (total === 0) return []
  const colors = ['#006094', '#006479', '#e6a23c', '#b31b25', '#495f69', '#67bafd']
  let offset = 0
  return Object.entries(cats).map(([name, count], i) => {
    const pct = (count / total) * 100
    const segment = { name, count, pct, offset, color: colors[i % colors.length] }
    offset += pct
    return segment
  })
})
</script>

<template>
  <div class="stats-panel">
    <!-- 头部 -->
    <div class="stats-header">
      <div>
        <h2 class="stats-title">生产力仪表盘</h2>
        <p class="stats-sub">你的专注与成就，在这里具象化。</p>
      </div>
      <div class="stats-actions">
        <button class="stats-btn active">最近30天</button>
        <button class="stats-btn" @click="settingsStore.showStats = false">
          <el-icon><Back /></el-icon> 返回
        </button>
      </div>
    </div>

    <!-- 指标卡片 -->
    <div class="metric-cards">
      <div class="metric-card">
        <div class="metric-icon">
          <el-icon :size="20"><CircleCheck /></el-icon>
        </div>
        <div class="metric-trend up">+12% vs 上月</div>
        <div class="metric-value">{{ todoStore.stats.completed.toLocaleString() }}</div>
        <div class="metric-label">已完成任务总数</div>
      </div>
      <div class="metric-card">
        <div class="metric-icon">
          <el-icon :size="20"><Document /></el-icon>
        </div>
        <div class="metric-trend down">-5% vs 上周</div>
        <div class="metric-value">{{ todoStore.stats.weekTrend.reduce((a, d) => a + d.count, 0) }}</div>
        <div class="metric-label">本周完成数</div>
      </div>
      <div class="metric-card">
        <div class="metric-icon tertiary">
          <el-icon :size="20"><Clock /></el-icon>
        </div>
        <div class="metric-trend up">+8% vs 上周</div>
        <div class="metric-value">4.5<span class="metric-unit">h</span></div>
        <div class="metric-label">平均专注时长</div>
      </div>
    </div>

    <!-- 任务完成趋势 -->
    <div class="chart-section">
      <div class="chart-header">
        <h3>任务完成趋势</h3>
        <div class="chart-legend">
          <span class="legend-item"><span class="legend-dot" style="background: var(--accent)"></span>已完成</span>
          <span class="legend-item"><span class="legend-dot" style="background: var(--tertiary)"></span>目标线</span>
        </div>
      </div>
      <div class="trend-chart">
        <svg viewBox="0 0 600 160" preserveAspectRatio="none" class="trend-svg">
          <defs>
            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="var(--accent)" stop-opacity="0.15"/>
              <stop offset="100%" stop-color="var(--accent)" stop-opacity="0"/>
            </linearGradient>
          </defs>
          <path :d="trendAreaPath" fill="url(#areaGrad)" />
          <path :d="trendLinePath" fill="none" stroke="var(--accent)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <div class="trend-labels">
          <span v-for="day in todoStore.stats.weekTrend" :key="day.date" class="trend-day">
            周{{ getWeekDay(day.date) }}
          </span>
        </div>
      </div>
    </div>

    <!-- 下方两列 -->
    <div class="chart-grid">
      <!-- 分类占比 -->
      <div class="chart-section">
        <h3>分类占比</h3>
        <div class="donut-container">
          <svg viewBox="0 0 160 160" class="donut-svg">
            <circle
              v-for="(seg, i) in donutSegments"
              :key="i"
              cx="80" cy="80" r="60"
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

      <!-- 生产力效率热力图 -->
      <div class="chart-section">
        <h3>生产力效率热力图</h3>
        <div class="heatmap-container">
          <div class="heatmap-grid">
            <div
              v-for="(day, i) in heatmapData"
              :key="i"
              class="heatmap-cell"
              :class="`heat-${day.level}`"
              :title="`${day.date}: ${day.level > 0 ? '已完成' + day.level + '项' : '无记录'}`"
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
        <p class="heatmap-insight">
          过去 30 天内，你的最高效率出现在 <strong>周二</strong> 下午。
          <a class="insight-link">详情</a>
        </p>
      </div>
    </div>

    <!-- 优先级分布 -->
    <div class="chart-section">
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
  </div>
</template>

<style scoped>
.stats-panel {
  flex: 1;
  overflow-y: auto;
  padding: 28px 32px 40px;
}

/* 头部 */
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

/* 指标卡片 */
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

.metric-trend.up { color: #006479; }
.metric-trend.down { color: var(--priority-high); }

.metric-value {
  font-family: 'Manrope', sans-serif;
  font-size: 36px;
  font-weight: 800;
  color: var(--text-primary);
  line-height: 1.1;
}

.metric-unit {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-muted);
}

.metric-label {
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 4px;
}

/* 图表区块 */
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

/* 趋势折线图 */
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

/* 两列布局 */
.chart-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

/* 环形图 */
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

/* 热力图 */
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

.heat-0 { background: var(--bg-secondary); }
.heat-1 { background: rgba(0, 96, 148, 0.15); }
.heat-2 { background: rgba(0, 96, 148, 0.35); }
.heat-3 { background: rgba(0, 96, 148, 0.6); }
.heat-4 { background: var(--accent); }

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

.insight-link {
  color: var(--accent);
  cursor: pointer;
  font-weight: 500;
}

/* 优先级分布 */
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
