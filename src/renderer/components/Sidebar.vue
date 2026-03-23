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
    <div class="sidebar-section">
      <div class="sidebar-title">智能列表</div>
      <div
        class="sidebar-item"
        :class="{ active: todoStore.currentFilter === 'all' && !settingsStore.showStats && !settingsStore.showSettings }"
        @click="setFilter('all')"
      >
        <el-icon><List /></el-icon>
        <span>全部</span>
        <span class="badge">{{ todoStore.stats.total }}</span>
      </div>
      <div
        class="sidebar-item"
        :class="{ active: todoStore.currentFilter === 'today' && !settingsStore.showStats && !settingsStore.showSettings }"
        @click="setFilter('today')"
      >
        <el-icon><Calendar /></el-icon>
        <span>今天</span>
        <span class="badge" v-if="todoStore.stats.todayCount">{{ todoStore.stats.todayCount }}</span>
      </div>
      <div
        class="sidebar-item"
        :class="{ active: todoStore.currentFilter === 'overdue' && !settingsStore.showStats && !settingsStore.showSettings }"
        @click="setFilter('overdue')"
      >
        <el-icon><WarningFilled /></el-icon>
        <span>已过期</span>
        <span class="badge overdue" v-if="todoStore.stats.overdueCount">{{ todoStore.stats.overdueCount }}</span>
      </div>
      <div
        class="sidebar-item"
        :class="{ active: todoStore.currentFilter === 'completed' && !settingsStore.showStats && !settingsStore.showSettings }"
        @click="setFilter('completed')"
      >
        <el-icon><CircleCheck /></el-icon>
        <span>已完成</span>
        <span class="badge">{{ todoStore.stats.completed }}</span>
        <el-icon
          v-if="todoStore.stats.completed > 0"
          class="clear-icon"
          @click.stop="handleClearCompleted"
          title="清空已完成"
        ><Brush /></el-icon>
      </div>
    </div>

    <div class="sidebar-divider"></div>

    <div class="sidebar-section">
      <div class="sidebar-title">
        分类
        <el-icon class="add-icon" @click="showCategoryInput = !showCategoryInput"><Plus /></el-icon>
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
        <span class="dot" :style="{ background: getCategoryColor(index) }"></span>
        <span>{{ cat }}</span>
        <span class="badge">{{ todoStore.stats.byCategory[cat] || 0 }}</span>
      </div>
    </div>

    <div class="sidebar-divider"></div>

    <div class="sidebar-section">
      <div
        class="sidebar-item"
        :class="{ active: settingsStore.showStats }"
        @click="showStatsPanel"
      >
        <el-icon><DataAnalysis /></el-icon>
        <span>统计</span>
      </div>
      <div class="sidebar-item" @click="handleExport">
        <el-icon><Upload /></el-icon>
        <span>导出数据</span>
      </div>
      <div class="sidebar-item" @click="handleImport">
        <el-icon><Download /></el-icon>
        <span>导入数据</span>
      </div>
      <div
        class="sidebar-item"
        :class="{ active: settingsStore.showSettings }"
        @click="showSettingsPanel"
      >
        <el-icon><Setting /></el-icon>
        <span>设置</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.sidebar {
  width: var(--sidebar-width);
  min-width: var(--sidebar-width);
  background: var(--bg-sidebar);
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  padding: 8px 0;
}

.sidebar-section {
  padding: 4px 8px;
}

.sidebar-title {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 8px 10px 4px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.add-icon {
  cursor: pointer;
  font-size: 14px;
  transition: color 0.15s;
}
.add-icon:hover {
  color: var(--accent);
}

.sidebar-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  color: var(--text-secondary);
  transition: all 0.15s;
}

.sidebar-item:hover {
  background: rgba(128, 128, 128, 0.1);
}

.sidebar-item.active {
  background: linear-gradient(135deg, #409eff, #53a8ff);
  color: white;
}

.sidebar-item.active .badge {
  background: rgba(255, 255, 255, 0.25);
  color: white;
}

.badge {
  margin-left: auto;
  font-size: 11px;
  background: rgba(128, 128, 128, 0.15);
  padding: 1px 6px;
  border-radius: 10px;
  min-width: 20px;
  text-align: center;
}

.badge.overdue {
  background: var(--priority-high);
  color: white;
}

.sidebar-divider {
  height: 1px;
  background: var(--border-color);
  margin: 6px 16px;
}

.category-input {
  padding: 4px 4px 8px;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.clear-icon {
  font-size: 12px;
  cursor: pointer;
  margin-left: 4px;
  opacity: 0;
  transition: opacity 0.15s, color 0.15s;
  color: var(--text-muted);
}

.clear-icon:hover {
  color: var(--priority-high);
}

.sidebar-item:hover .clear-icon {
  opacity: 1;
}
</style>
