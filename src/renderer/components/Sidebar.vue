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
    const msg = count > 0
      ? `分类「${name}」下还有 ${count} 条待办，确定删除？`
      : `确定删除分类「${name}」？`
    await ElMessageBox.confirm(msg, '提示', { type: 'warning' })
    await settingsStore.removeCategory(name)
    if (todoStore.currentFilter === name) todoStore.setFilter('all')
  } catch { return }
}

async function handleExport() {
  const result = await todoStore.exportTodos()
  if (result) ElMessage.success('导出成功')
}

async function handleImport() {
  const result = await todoStore.importTodos()
  if (result) ElMessage.success('导入成功')
  else if (result === false) ElMessage.error('导入失败，请检查文件格式')
}

async function handleClearCompleted() {
  try {
    await ElMessageBox.confirm(`确定清空所有 ${todoStore.stats.completed} 条已完成待办？`, '提示', { type: 'warning' })
    await todoStore.clearCompleted()
    ElMessage.success('已清空已完成待办')
  } catch { return }
}
</script>

<template>
  <div class="sidebar">
    <!-- 智能列表 -->
    <div class="sidebar-section">
      <div class="section-title">智能列表</div>
      <div class="nav-item" :class="{ active: todoStore.currentFilter === 'all' && !settingsStore.showStats && !settingsStore.showSettings }" @click="setFilter('all')">
        <el-icon><List /></el-icon>
        <span>全部</span>
        <span class="badge">{{ todoStore.stats.total }}</span>
      </div>
      <div class="nav-item" :class="{ active: todoStore.currentFilter === 'today' && !settingsStore.showStats && !settingsStore.showSettings }" @click="setFilter('today')">
        <el-icon><Calendar /></el-icon>
        <span>今天</span>
        <span class="badge" v-if="todoStore.stats.todayCount">{{ todoStore.stats.todayCount }}</span>
      </div>
      <div class="nav-item" :class="{ active: todoStore.currentFilter === 'overdue' && !settingsStore.showStats && !settingsStore.showSettings }" @click="setFilter('overdue')">
        <el-icon><WarningFilled /></el-icon>
        <span>已过期</span>
        <span class="badge danger" v-if="todoStore.stats.overdueCount">{{ todoStore.stats.overdueCount }}</span>
      </div>
      <div class="nav-item" :class="{ active: todoStore.currentFilter === 'completed' && !settingsStore.showStats && !settingsStore.showSettings }" @click="setFilter('completed')">
        <el-icon><CircleCheck /></el-icon>
        <span>已完成</span>
        <span class="badge">{{ todoStore.stats.completed }}</span>
        <el-icon v-if="todoStore.stats.completed > 0" class="clear-btn" @click.stop="handleClearCompleted" title="清空已完成"><Brush /></el-icon>
      </div>
    </div>

    <div class="divider"></div>

    <!-- 分类 -->
    <div class="sidebar-section">
      <div class="section-title">
        分类
        <el-icon class="icon-btn" @click="showCategoryInput = !showCategoryInput"><Plus /></el-icon>
      </div>
      <div v-if="showCategoryInput" class="category-input">
        <el-input v-model="newCategory" size="small" placeholder="分类名称" @keyup.enter="handleAddCategory">
          <template #append>
            <el-button @click="handleAddCategory"><el-icon><Check /></el-icon></el-button>
          </template>
        </el-input>
      </div>
      <div
        v-for="(cat, index) in settingsStore.categories"
        :key="cat"
        class="nav-item"
        :class="{ active: todoStore.currentFilter === cat && !settingsStore.showStats && !settingsStore.showSettings }"
        @click="setFilter(cat)"
        @contextmenu.prevent="handleRemoveCategory(cat)"
      >
        <span class="dot" :style="{ background: getCategoryColor(index) }"></span>
        <span>{{ cat }}</span>
        <span class="badge">{{ todoStore.stats.byCategory[cat] || 0 }}</span>
      </div>
    </div>

    <div class="divider"></div>

    <!-- 工具 -->
    <div class="sidebar-section">
      <div class="nav-item" :class="{ active: settingsStore.showStats }" @click="showStatsPanel">
        <el-icon><DataAnalysis /></el-icon><span>统计</span>
      </div>
      <div class="nav-item" @click="handleExport">
        <el-icon><Upload /></el-icon><span>导出数据</span>
      </div>
      <div class="nav-item" @click="handleImport">
        <el-icon><Download /></el-icon><span>导入数据</span>
      </div>
      <div class="nav-item" :class="{ active: settingsStore.showSettings }" @click="showSettingsPanel">
        <el-icon><Setting /></el-icon><span>设置</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.sidebar {
  width: var(--sidebar-width);
  min-width: var(--sidebar-width);
  background: var(--bg-panel);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  padding: 10px 0;
}

.sidebar-section {
  padding: 2px 10px;
}

.section-title {
  font-size: 10px;
  font-weight: 700;
  color: var(--text-panel-muted);
  text-transform: uppercase;
  letter-spacing: 0.8px;
  padding: 10px 8px 5px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.icon-btn {
  cursor: pointer;
  font-size: 13px;
  color: var(--text-panel-muted);
  transition: color 0.15s;
}
.icon-btn:hover { color: rgba(255,255,255,0.8); }

.nav-item {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 8px 10px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  color: var(--text-panel);
  transition: background 0.15s, color 0.15s;
}

.nav-item:hover {
  background: var(--bg-panel-hover);
  color: rgba(255, 255, 255, 0.95);
}

.nav-item.active {
  background: var(--bg-panel-active);
  color: #ffffff;
}

.nav-item.active .badge {
  background: rgba(255, 255, 255, 0.2);
  color: white;
}

.badge {
  margin-left: auto;
  font-size: 11px;
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-panel-muted);
  padding: 1px 7px;
  border-radius: 10px;
  min-width: 20px;
  text-align: center;
  font-weight: 500;
}

.badge.danger {
  background: rgba(239, 68, 68, 0.3);
  color: #fca5a5;
}

.divider {
  height: 1px;
  background: var(--border-panel);
  margin: 6px 16px;
}

.category-input {
  padding: 4px 4px 8px;
}

.dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}

.clear-btn {
  font-size: 12px;
  cursor: pointer;
  margin-left: 2px;
  opacity: 0;
  transition: opacity 0.15s, color 0.15s;
  color: var(--text-panel-muted);
}
.clear-btn:hover { color: #fca5a5; }
.nav-item:hover .clear-btn { opacity: 1; }
</style>
