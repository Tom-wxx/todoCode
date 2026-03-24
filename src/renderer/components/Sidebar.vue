<script setup lang="ts">
import { ref } from 'vue'
import { useTodoStore } from '../stores/todo'
import { useSettingsStore } from '../stores/settings'
import { CATEGORY_COLORS } from '../utils/constants'
import { ElMessage, ElMessageBox } from 'element-plus'

const todoStore = useTodoStore()
const settingsStore = useSettingsStore()
const newCategory = ref('')
const showCategoryInput = ref(false)

function getCategoryColor(index: number) {
  return CATEGORY_COLORS[index % CATEGORY_COLORS.length]
}

function setFilter(filter: string) {
  settingsStore.showStats = false
  settingsStore.showSettings = false
  todoStore.setFilter(filter)
}

function showStatsPanel() {
  settingsStore.showStats = true
  settingsStore.showSettings = false
}

function showSettingsPanel() {
  settingsStore.showSettings = true
  settingsStore.showStats = false
}

async function handleAddCategory() {
  const name = newCategory.value.trim()
  if (name) {
    await settingsStore.addCategory(name)
    newCategory.value = ''
    showCategoryInput.value = false
  }
}

async function handleRemoveCategory(name: string) {
  try {
    const count = todoStore.todos.filter(t => t.category === name).length
    if (count > 0) {
      await ElMessageBox.confirm(`分类「${name}」下还有 ${count} 条待办，确定删除？`, '提示', { type: 'warning' })
    } else {
      await ElMessageBox.confirm(`确定删除分类「${name}」？`, '提示', { type: 'warning' })
    }
    await settingsStore.removeCategory(name)
    if (todoStore.currentFilter === name) {
      todoStore.setFilter('all')
    }
  } catch {
    return
  }
}

async function handleExport() {
  const result = await todoStore.exportTodos()
  if (result) ElMessage.success('导出成功')
}

async function handleImport() {
  const result = await todoStore.importTodos()
  if (result) {
    ElMessage.success('导入成功')
  } else if (result === false) {
    ElMessage.error('导入失败，请检查文件格式')
  }
}

async function handleClearCompleted() {
  try {
    await ElMessageBox.confirm(`确定清空所有 ${todoStore.stats.completed} 条已完成待办？`, '提示', { type: 'warning' })
    await todoStore.clearCompleted()
    ElMessage.success('已清空已完成待办')
  } catch {
    return
  }
}
</script>

<template>
  <div class="sidebar">
    <!-- 头部 -->
    <div class="sidebar-header">
      <div class="sidebar-header-title">任务空间</div>
      <div class="sidebar-header-sub">专注每一天</div>
    </div>

    <!-- 智能列表 -->
    <div class="sidebar-section">
      <div
        class="sidebar-item"
        :class="{ active: todoStore.currentFilter === 'all' && !settingsStore.showStats && !settingsStore.showSettings }"
        @click="setFilter('all')"
      >
        <span class="sidebar-icon">
          <el-icon><List /></el-icon>
        </span>
        <span class="sidebar-label">全部任务</span>
        <span class="badge">{{ todoStore.stats.total }}</span>
      </div>
      <div
        class="sidebar-item"
        :class="{ active: todoStore.currentFilter === 'today' && !settingsStore.showStats && !settingsStore.showSettings }"
        @click="setFilter('today')"
      >
        <span class="sidebar-icon">
          <el-icon><Calendar /></el-icon>
        </span>
        <span class="sidebar-label">今天</span>
        <span class="badge" v-if="todoStore.stats.todayCount">{{ todoStore.stats.todayCount }}</span>
      </div>
      <div
        class="sidebar-item"
        :class="{ active: todoStore.currentFilter === 'overdue' && !settingsStore.showStats && !settingsStore.showSettings }"
        @click="setFilter('overdue')"
      >
        <span class="sidebar-icon">
          <el-icon><WarningFilled /></el-icon>
        </span>
        <span class="sidebar-label">已逾期</span>
        <span class="badge overdue" v-if="todoStore.stats.overdueCount">{{ todoStore.stats.overdueCount }}</span>
      </div>
      <div
        class="sidebar-item"
        :class="{ active: todoStore.currentFilter === 'completed' && !settingsStore.showStats && !settingsStore.showSettings }"
        @click="setFilter('completed')"
      >
        <span class="sidebar-icon">
          <el-icon><CircleCheck /></el-icon>
        </span>
        <span class="sidebar-label">已完成</span>
        <span class="badge">{{ todoStore.stats.completed }}</span>
        <span
          v-if="todoStore.stats.completed > 0"
          class="clear-action"
          @click.stop="handleClearCompleted"
          title="清空已完成"
        >
          <el-icon :size="13"><Brush /></el-icon>
        </span>
      </div>
    </div>

    <!-- 分类 -->
    <div class="sidebar-section">
      <div class="section-header">
        <span class="section-title">分类</span>
        <span class="section-action" @click="showCategoryInput = !showCategoryInput">
          <el-icon :size="14"><Plus /></el-icon>
        </span>
      </div>
      <div v-if="showCategoryInput" class="category-input">
        <el-input
          v-model="newCategory"
          size="small"
          placeholder="分类名称"
          @keyup.enter="handleAddCategory"
        >
          <template #append>
            <el-button @click="handleAddCategory"><el-icon><Check /></el-icon></el-button>
          </template>
        </el-input>
      </div>
      <div
        v-for="(cat, index) in settingsStore.categories"
        :key="cat"
        class="sidebar-item"
        :class="{ active: todoStore.currentFilter === cat && !settingsStore.showStats && !settingsStore.showSettings }"
        @click="setFilter(cat)"
        @contextmenu.prevent="handleRemoveCategory(cat)"
      >
        <span class="cat-dot" :style="{ background: getCategoryColor(index) }"></span>
        <span class="sidebar-label">{{ cat }}</span>
        <span class="badge">{{ todoStore.stats.byCategory[cat] || 0 }}</span>
      </div>
    </div>

    <!-- 底部 -->
    <div class="sidebar-footer">
      <div
        class="sidebar-item"
        :class="{ active: settingsStore.showStats }"
        @click="showStatsPanel"
      >
        <span class="sidebar-icon"><el-icon><DataAnalysis /></el-icon></span>
        <span class="sidebar-label">统计分析</span>
      </div>
      <div class="sidebar-item" @click="handleExport">
        <span class="sidebar-icon"><el-icon><Upload /></el-icon></span>
        <span class="sidebar-label">数据导出</span>
      </div>
      <div class="sidebar-item" @click="handleImport">
        <span class="sidebar-icon"><el-icon><Download /></el-icon></span>
        <span class="sidebar-label">导入数据</span>
      </div>
      <div
        class="sidebar-item"
        :class="{ active: settingsStore.showSettings }"
        @click="showSettingsPanel"
      >
        <span class="sidebar-icon"><el-icon><Setting /></el-icon></span>
        <span class="sidebar-label">设置</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.sidebar {
  width: var(--sidebar-width);
  min-width: var(--sidebar-width);
  background: var(--bg-sidebar);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  padding: 0 12px 12px;
}

/* 头部 */
.sidebar-header {
  padding: 16px 12px 20px;
}

.sidebar-header-title {
  font-family: 'Manrope', sans-serif;
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.3px;
}

.sidebar-header-sub {
  font-family: 'Inter', sans-serif;
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 2px;
  letter-spacing: 0.2px;
}

/* 区块 */
.sidebar-section {
  margin-bottom: 20px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 12px 8px;
}

.section-title {
  font-family: 'Inter', sans-serif;
  font-size: 11px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.8px;
}

.section-action {
  cursor: pointer;
  color: var(--text-muted);
  transition: color 0.2s;
  display: flex;
  align-items: center;
}

.section-action:hover {
  color: var(--accent);
}

/* 列表项 */
.sidebar-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
  transition: all 0.2s ease;
  margin-bottom: 2px;
}

.sidebar-item:hover {
  background: var(--bg-primary);
  color: var(--text-primary);
}

.sidebar-item.active {
  background: var(--accent);
  color: white;
}

.sidebar-item.active .badge {
  background: rgba(255, 255, 255, 0.2);
  color: white;
}

.sidebar-item.active .sidebar-icon {
  color: white;
}

.sidebar-icon {
  display: flex;
  align-items: center;
  font-size: 16px;
  color: var(--text-muted);
  transition: color 0.2s;
}

.sidebar-item:hover .sidebar-icon {
  color: var(--text-primary);
}

.sidebar-label {
  flex: 1;
}

.badge {
  font-family: 'Inter', sans-serif;
  font-size: 11px;
  font-weight: 600;
  background: rgba(115, 119, 121, 0.1);
  padding: 2px 8px;
  border-radius: 10px;
  min-width: 22px;
  text-align: center;
  line-height: 1.4;
}

.badge.overdue {
  background: var(--priority-high);
  color: white;
}

/* 分类圆点 */
.cat-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

/* 分类输入 */
.category-input {
  padding: 4px 8px 8px;
}

/* 清空按钮 */
.clear-action {
  display: flex;
  align-items: center;
  color: var(--text-muted);
  opacity: 0;
  transition: all 0.2s;
  cursor: pointer;
}

.clear-action:hover {
  color: var(--priority-high);
}

.sidebar-item:hover .clear-action {
  opacity: 1;
}

/* 底部 */
.sidebar-footer {
  margin-top: auto;
  padding-top: 12px;
}
</style>
