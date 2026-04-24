<script setup lang="ts">
import { ref, computed, inject, watch, type Ref } from 'vue'
import { ArrowLeft, ArrowRight, Close, Plus } from '@element-plus/icons-vue'
import { useTodoStore } from '../stores/todo'
import type { Todo } from '../utils/helpers'
import TodoForm from './TodoForm.vue'

const todoStore = useTodoStore()

// 当前显示的年月
const currentYear = ref(new Date().getFullYear())
const currentMonth = ref(new Date().getMonth()) // 0-based
const selectedDate = ref<string | null>(null) // 'YYYY-MM-DD'
const showDetail = ref(false)
const viewMode = ref<'month' | 'week'>('month')

// 周视图当前周的起始日期
const weekStart = ref(getMonday(new Date()))

function getMonday(d: Date): Date {
  const date = new Date(d)
  const day = date.getDay()
  const diff = day === 0 ? -6 : 1 - day
  date.setDate(date.getDate() + diff)
  date.setHours(0, 0, 0, 0)
  return date
}

// 新建任务
const showForm = ref(false)
const editingTodo = ref<Todo | null>(null)
const showAddForm = inject<Ref<boolean>>('showAddForm')

if (showAddForm) {
  watch(showAddForm, (val) => {
    if (val) {
      openAddForm()
      showAddForm.value = false
    }
  })
}

function openAddForm() {
  editingTodo.value = null
  showForm.value = true
}

function openEditForm(todo: Todo) {
  editingTodo.value = { ...todo }
  showForm.value = true
}

function handleFormClose() {
  showForm.value = false
  editingTodo.value = null
}

// 星期标题
const weekDays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']

// 月份显示
const monthLabel = computed(() => `${currentYear.value}年${currentMonth.value + 1}月`)

// 今天的日期字符串
const todayStr = computed(() => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
})

// 生成月历网格日期
const calendarDays = computed(() => {
  const year = currentYear.value
  const month = currentMonth.value

  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)

  // 周一起始
  let startWeekDay = firstDay.getDay()
  startWeekDay = startWeekDay === 0 ? 6 : startWeekDay - 1

  const days: { date: string; day: number; currentMonth: boolean }[] = []

  // 上月补位
  for (let i = startWeekDay - 1; i >= 0; i--) {
    const d = new Date(year, month, -i)
    days.push({ date: formatDateStr(d), day: d.getDate(), currentMonth: false })
  }

  // 本月
  for (let i = 1; i <= lastDay.getDate(); i++) {
    const d = new Date(year, month, i)
    days.push({ date: formatDateStr(d), day: i, currentMonth: true })
  }

  // 下月补位
  const remaining = 7 - (days.length % 7)
  if (remaining < 7) {
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i)
      days.push({ date: formatDateStr(d), day: i, currentMonth: false })
    }
  }

  return days
})

// 周视图日期
const weekDays7 = computed(() => {
  const days: { date: string; day: number; currentMonth: boolean }[] = []
  const start = new Date(weekStart.value)
  for (let i = 0; i < 7; i++) {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    days.push({ date: formatDateStr(d), day: d.getDate(), currentMonth: d.getMonth() === currentMonth.value })
  }
  return days
})

function formatDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// 每个日期对应的待办
const todosByDate = computed(() => {
  const map: Record<string, Todo[]> = {}
  for (const t of todoStore.todos) {
    if (t.dueDate) {
      const dateKey = t.dueDate.slice(0, 10)
      if (!map[dateKey]) map[dateKey] = []
      map[dateKey].push(t)
    }
  }
  return map
})

// 选中日期的任务
const selectedDateTodos = computed(() => {
  if (!selectedDate.value) return []
  return todosByDate.value[selectedDate.value] || []
})

// 选中日期的格式化显示
const selectedDateLabel = computed(() => {
  if (!selectedDate.value) return ''
  const d = new Date(selectedDate.value)
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
})

// 导航
function prevMonth() {
  if (viewMode.value === 'week') {
    const d = new Date(weekStart.value)
    d.setDate(d.getDate() - 7)
    weekStart.value = d
    currentYear.value = d.getFullYear()
    currentMonth.value = d.getMonth()
    return
  }
  if (currentMonth.value === 0) {
    currentMonth.value = 11
    currentYear.value--
  } else {
    currentMonth.value--
  }
}

function nextMonth() {
  if (viewMode.value === 'week') {
    const d = new Date(weekStart.value)
    d.setDate(d.getDate() + 7)
    weekStart.value = d
    currentYear.value = d.getFullYear()
    currentMonth.value = d.getMonth()
    return
  }
  if (currentMonth.value === 11) {
    currentMonth.value = 0
    currentYear.value++
  } else {
    currentMonth.value++
  }
}

function goToday() {
  const now = new Date()
  currentYear.value = now.getFullYear()
  currentMonth.value = now.getMonth()
  weekStart.value = getMonday(now)
  selectDate(todayStr.value)
}

function selectDate(date: string) {
  selectedDate.value = date
  showDetail.value = true
}

function closeDetail() {
  showDetail.value = false
}

function getPriorityClass(priority: string) {
  return `priority-${priority}`
}

// 初始选中今天
selectDate(todayStr.value)
</script>

<template>
  <div class="calendar-view">
    <div class="calendar-main">
      <!-- 头部 -->
      <div class="calendar-header">
        <div class="header-left">
          <h2 class="month-title">{{ monthLabel }}</h2>
          <div class="view-toggle">
            <button
              class="toggle-btn"
              :class="{ active: viewMode === 'month' }"
              @click="viewMode = 'month'"
            >月视图</button>
            <button
              class="toggle-btn"
              :class="{ active: viewMode === 'week' }"
              @click="viewMode = 'week'"
            >周视图</button>
          </div>
        </div>
        <div class="header-right">
          <button class="nav-btn" @click="prevMonth">
            <el-icon><ArrowLeft /></el-icon>
          </button>
          <button class="today-btn" @click="goToday">今天</button>
          <button class="nav-btn" @click="nextMonth">
            <el-icon><ArrowRight /></el-icon>
          </button>
        </div>
      </div>

      <!-- 星期标题 -->
      <div class="weekday-row">
        <div class="weekday-cell" v-for="d in weekDays" :key="d">{{ d }}</div>
      </div>

      <!-- 月视图网格 -->
      <div class="calendar-grid" v-if="viewMode === 'month'">
        <div
          v-for="(day, idx) in calendarDays"
          :key="idx"
          class="day-cell"
          :class="{
            'other-month': !day.currentMonth,
            'is-today': day.date === todayStr,
            'is-selected': day.date === selectedDate
          }"
          @click="selectDate(day.date)"
        >
          <div class="day-header">
            <span class="day-number">{{ day.day }}</span>
            <span class="today-badge" v-if="day.date === todayStr">今天</span>
          </div>
          <div class="day-tasks">
            <div
              v-for="todo in (todosByDate[day.date] || []).slice(0, 2)"
              :key="todo.id"
              class="task-tag"
              :class="getPriorityClass(todo.priority)"
            >{{ todo.title.length > 4 ? todo.title.slice(0, 4) + '...' : todo.title }}</div>
            <div
              v-if="(todosByDate[day.date] || []).length > 2"
              class="task-more"
            >+{{ (todosByDate[day.date] || []).length - 2 }}</div>
          </div>
        </div>
      </div>

      <!-- 周视图网格 -->
      <div class="calendar-grid week-grid" v-else>
        <div
          v-for="(day, idx) in weekDays7"
          :key="idx"
          class="day-cell week-cell"
          :class="{
            'other-month': !day.currentMonth,
            'is-today': day.date === todayStr,
            'is-selected': day.date === selectedDate
          }"
          @click="selectDate(day.date)"
        >
          <div class="day-header">
            <span class="day-number">{{ day.day }}</span>
            <span class="today-badge" v-if="day.date === todayStr">今天</span>
          </div>
          <div class="day-tasks">
            <div
              v-for="todo in (todosByDate[day.date] || [])"
              :key="todo.id"
              class="task-tag"
              :class="getPriorityClass(todo.priority)"
            >{{ todo.title.length > 6 ? todo.title.slice(0, 6) + '...' : todo.title }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 右侧任务详情面板 -->
    <Transition name="slide-right">
      <div class="detail-panel" v-if="showDetail">
        <div class="detail-header">
          <div>
            <div class="detail-date">{{ selectedDateLabel }}</div>
            <h3 class="detail-title">任务详情</h3>
          </div>
          <button class="close-btn" @click="closeDetail">
            <el-icon :size="18"><Close /></el-icon>
          </button>
        </div>

        <div class="detail-tasks" v-if="selectedDateTodos.length > 0">
          <div
            v-for="todo in selectedDateTodos"
            :key="todo.id"
            class="detail-task-item"
            @click="openEditForm(todo)"
          >
            <div class="task-indicator" :class="getPriorityClass(todo.priority)"></div>
            <div class="task-content">
              <div class="task-meta">
                <span class="task-time" v-if="todo.dueDate">{{ todo.dueDate.slice(0, 10) }}</span>
                <span
                  class="task-priority-badge"
                  :class="getPriorityClass(todo.priority)"
                  v-if="todo.priority === 'high'"
                >高优先级</span>
                <span
                  class="task-priority-badge pending"
                  v-if="!todo.completed && todo.priority !== 'high'"
                >待办</span>
                <span
                  class="task-priority-badge done"
                  v-if="todo.completed"
                >已完成</span>
              </div>
              <div class="task-name">{{ todo.title }}</div>
              <div class="task-desc" v-if="todo.description">{{ todo.description }}</div>
            </div>
          </div>
        </div>

        <div class="detail-empty" v-else>
          <p>当天暂无任务</p>
        </div>

        <div class="detail-footer">
          <button class="add-today-btn" @click="openAddForm">
            <el-icon><Plus /></el-icon>
            <span>添加今日项</span>
          </button>
        </div>
      </div>
    </Transition>

    <TodoForm
      :visible="showForm"
      :todo="editingTodo"
      :default-date="selectedDate"
      @close="handleFormClose"
    />
  </div>
</template>

<style scoped>
.calendar-view {
  flex: 1;
  display: flex;
  overflow: hidden;
  position: relative;
}

.calendar-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 24px 28px;
}

/* 头部 */
.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.month-title {
  font-family: 'Manrope', sans-serif;
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.5px;
}

.view-toggle {
  display: flex;
  background: var(--bg-secondary);
  border-radius: 8px;
  padding: 3px;
}

.toggle-btn {
  padding: 5px 14px;
  border: none;
  background: transparent;
  border-radius: 6px;
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.2s;
}

.toggle-btn.active {
  background: var(--surface-container-lowest);
  color: var(--text-primary);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.nav-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--text-muted);
  transition: all 0.2s;
}

.nav-btn:hover {
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.today-btn {
  padding: 5px 16px;
  border: none;
  background: transparent;
  border-radius: 8px;
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  font-weight: 600;
  color: var(--accent);
  cursor: pointer;
  transition: all 0.2s;
}

.today-btn:hover {
  background: var(--bg-secondary);
}

/* 星期标题行 */
.weekday-row {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 8px;
  margin-bottom: 4px;
}

.weekday-cell {
  text-align: center;
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-muted);
  letter-spacing: 0.5px;
}

/* 日历网格 */
.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  flex: 1;
  overflow-y: auto;
}

.day-cell {
  border: 1px solid var(--border-color);
  border-right: none;
  border-bottom: none;
  padding: 6px 8px;
  min-height: 80px;
  cursor: pointer;
  transition: background 0.15s;
}

.day-cell:nth-child(7n) {
  border-right: 1px solid var(--border-color);
}

.day-cell:nth-last-child(-n+7) {
  border-bottom: 1px solid var(--border-color);
}

.day-cell:nth-child(-n+7) {
  border-top: 1px solid var(--border-color);
}

.day-cell:hover {
  background: var(--bg-secondary);
}

.day-cell.other-month {
  opacity: 0.35;
}

.day-cell.is-today {
  background: rgba(0, 96, 148, 0.03);
}

.day-cell.is-selected {
  outline: 2px solid var(--accent);
  outline-offset: -2px;
  border-radius: 4px;
}

/* 周视图 */
.week-grid {
  grid-template-rows: 1fr;
}

.week-cell {
  min-height: 300px;
}

/* 日期头 */
.day-header {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 4px;
}

.day-number {
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
}

.is-today .day-number {
  color: var(--accent);
  font-weight: 700;
}

.today-badge {
  font-family: 'Inter', sans-serif;
  font-size: 10px;
  font-weight: 600;
  background: var(--accent);
  color: white;
  padding: 1px 6px;
  border-radius: 4px;
  line-height: 1.5;
}

/* 任务标签 */
.day-tasks {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.task-tag {
  font-family: 'Inter', sans-serif;
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.5;
}

.task-tag.priority-high {
  background: rgba(179, 27, 37, 0.08);
  color: var(--priority-high);
  border-left: 2px solid var(--priority-high);
}

.task-tag.priority-medium {
  background: rgba(230, 162, 60, 0.08);
  color: #b8861f;
  border-left: 2px solid var(--priority-medium);
}

.task-tag.priority-low {
  background: rgba(0, 100, 121, 0.08);
  color: var(--priority-low);
  border-left: 2px solid var(--priority-low);
}

.task-more {
  font-family: 'Inter', sans-serif;
  font-size: 10px;
  color: var(--text-muted);
  padding: 0 6px;
}

/* ===== 右侧详情面板 ===== */
.detail-panel {
  width: 300px;
  min-width: 300px;
  border-left: 1px solid var(--border-color);
  background: var(--surface-container-lowest);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 20px 20px 16px;
  border-bottom: 1px solid var(--border-color);
}

.detail-date {
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  color: var(--text-muted);
  margin-bottom: 2px;
}

.detail-title {
  font-family: 'Manrope', sans-serif;
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
}

.close-btn {
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--text-muted);
  transition: all 0.2s;
}

.close-btn:hover {
  background: var(--bg-secondary);
  color: var(--text-primary);
}

/* 详情任务列表 */
.detail-tasks {
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px;
}

.detail-task-item {
  display: flex;
  gap: 12px;
  padding: 14px 0;
  border-bottom: 1px solid var(--border-color);
  cursor: pointer;
  transition: background 0.15s;
}

.detail-task-item:last-child {
  border-bottom: none;
}

.detail-task-item:hover {
  background: var(--bg-secondary);
  margin: 0 -20px;
  padding-left: 20px;
  padding-right: 20px;
  border-radius: 8px;
}

.task-indicator {
  width: 4px;
  min-height: 100%;
  border-radius: 2px;
  flex-shrink: 0;
  margin-top: 2px;
}

.task-indicator.priority-high {
  background: var(--accent);
}

.task-indicator.priority-medium {
  background: var(--text-muted);
}

.task-indicator.priority-low {
  background: var(--border-color-hover);
}

.task-content {
  flex: 1;
  min-width: 0;
}

.task-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.task-time {
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  color: var(--text-muted);
}

.task-priority-badge {
  font-family: 'Inter', sans-serif;
  font-size: 11px;
  font-weight: 600;
  padding: 1px 8px;
  border-radius: 10px;
  line-height: 1.5;
}

.task-priority-badge.priority-high {
  background: var(--accent);
  color: white;
}

.task-priority-badge.pending {
  background: rgba(230, 162, 60, 0.12);
  color: #b8861f;
}

.task-priority-badge.done {
  background: rgba(0, 100, 121, 0.1);
  color: var(--priority-low);
}

.task-name {
  font-family: 'Manrope', sans-serif;
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 2px;
}

.task-desc {
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  color: var(--text-muted);
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 空状态 */
.detail-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  font-size: 14px;
}

/* 底部添加按钮 */
.detail-footer {
  padding: 16px 20px;
  border-top: 1px solid var(--border-color);
}

.add-today-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px;
  border: 1px dashed var(--border-color-hover);
  background: transparent;
  border-radius: 8px;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.2s;
}

.add-today-btn:hover {
  border-color: var(--accent);
  color: var(--accent);
  background: rgba(0, 96, 148, 0.03);
}

/* 滑入动画 */
.slide-right-enter-active, .slide-right-leave-active {
  transition: transform 0.25s ease, opacity 0.25s ease;
}

.slide-right-enter-from, .slide-right-leave-to {
  transform: translateX(20px);
  opacity: 0;
}
</style>
