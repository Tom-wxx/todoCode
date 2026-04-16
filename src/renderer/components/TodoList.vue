<script setup lang="ts">
import { ref, inject, watch, computed, type Ref } from 'vue'
import { useTodoStore } from '../stores/todo'
import { useSettingsStore } from '../stores/settings'
import { Plus, Delete, Select, CloseBold, CircleCheck, Document, Sort, Top, Bottom } from '@element-plus/icons-vue'
import { ElMessageBox, ElMessage } from 'element-plus'
import TodoItem from './TodoItem.vue'
import TodoForm from './TodoForm.vue'
import type { Todo, SortBy } from '../utils/helpers'

const todoStore = useTodoStore()
const settingsStore = useSettingsStore()

const SORT_OPTIONS: { value: SortBy; label: string }[] = [
  { value: 'createdAt', label: '创建时间' },
  { value: 'dueDate', label: '到期日' },
  { value: 'priority', label: '优先级' },
  { value: 'title', label: '标题' }
]

function handleSortByChange(val: SortBy) {
  settingsStore.setSort(val, settingsStore.sortOrder)
}

function toggleSortOrder() {
  settingsStore.setSort(settingsStore.sortBy, settingsStore.sortOrder === 'asc' ? 'desc' : 'asc')
}
const showForm = ref(false)
const editingTodo = ref<Todo | null>(null)

// 从 App.vue 注入的新建表单控制
const showAddForm = inject<Ref<boolean>>('showAddForm')

if (showAddForm) {
  watch(showAddForm, (val) => {
    if (val) {
      openAddForm()
      showAddForm.value = false
    }
  })
}

const FIXED_FILTERS = new Set(['all', 'today', 'overdue', 'completed'])
const defaultCategory = computed(() =>
  FIXED_FILTERS.has(todoStore.currentFilter) ? '' : todoStore.currentFilter
)

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

async function handleBatchDelete() {
  try {
    await ElMessageBox.confirm(`确定删除选中的 ${todoStore.selectedIds.size} 条待办事项？`, '提示', { type: 'warning' })
    await todoStore.batchDelete()
    ElMessage.success('已批量删除')
  } catch {
    return
  }
}
</script>

<template>
  <div class="todo-list-container">
    <!-- 排序工具栏 -->
    <div class="sort-toolbar">
      <el-icon class="sort-icon"><Sort /></el-icon>
      <span class="sort-label">排序</span>
      <el-select
        :model-value="settingsStore.sortBy"
        size="small"
        class="sort-select"
        @update:model-value="handleSortByChange"
      >
        <el-option
          v-for="opt in SORT_OPTIONS"
          :key="opt.value"
          :label="opt.label"
          :value="opt.value"
        />
      </el-select>
      <button
        class="sort-order-btn"
        :title="settingsStore.sortOrder === 'asc' ? '升序' : '降序'"
        @click="toggleSortOrder"
      >
        <el-icon><Top v-if="settingsStore.sortOrder === 'asc'" /><Bottom v-else /></el-icon>
      </button>
    </div>

    <!-- 批量操作工具栏 -->
    <div class="batch-toolbar" v-if="todoStore.selectedIds.size > 0">
      <span class="batch-info">已选 {{ todoStore.selectedIds.size }} 项</span>
      <el-button size="small" @click="todoStore.selectAll()">
        <el-icon><Select /></el-icon>全选
      </el-button>
      <el-button size="small" type="success" @click="todoStore.batchToggleComplete(true)">
        <el-icon><CircleCheck /></el-icon>批量完成
      </el-button>
      <el-button size="small" type="danger" @click="handleBatchDelete">
        <el-icon><Delete /></el-icon>批量删除
      </el-button>
      <el-button size="small" @click="todoStore.clearSelection()">
        <el-icon><CloseBold /></el-icon>取消选择
      </el-button>
    </div>

    <div class="todo-list" v-if="todoStore.filteredTodos.length > 0">
      <TransitionGroup name="slide">
        <TodoItem
          v-for="todo in todoStore.filteredTodos"
          :key="todo.id"
          :todo="todo"
          :selected="todoStore.selectedIds.has(todo.id)"
          @edit="openEditForm"
          @toggle-select="todoStore.toggleSelect(todo.id)"
        />
      </TransitionGroup>
    </div>

    <div class="empty-state" v-else>
      <div class="empty-icon">
        <el-icon :size="56" color="var(--text-muted)"><Document /></el-icon>
      </div>
      <h3 class="empty-title">暂无待办事项</h3>
      <p class="empty-desc">点击下方按钮开始添加你的第一个任务</p>
      <button class="empty-add-btn" @click="openAddForm">
        <el-icon><Plus /></el-icon>
        添加待办
      </button>
    </div>

    <div class="add-btn-container">
      <button class="add-fab" @click="openAddForm">
        <el-icon :size="22"><Plus /></el-icon>
      </button>
    </div>

    <TodoForm
      :visible="showForm"
      :todo="editingTodo"
      :default-category="defaultCategory"
      @close="handleFormClose"
    />
  </div>
</template>

<style scoped>
.todo-list-container {
  flex: 1;
  overflow-y: auto;
  position: relative;
}

.sort-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 28px 4px;
}

.sort-icon {
  color: var(--text-muted);
  font-size: 14px;
}

.sort-label {
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  color: var(--text-muted);
  letter-spacing: 0.3px;
}

.sort-select {
  width: 120px;
}

.sort-order-btn {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--surface-container-lowest);
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
}

.sort-order-btn:hover {
  background: var(--bg-secondary);
  color: var(--accent);
  border-color: var(--accent);
}

.batch-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 28px;
  background: var(--bg-secondary);
}

.batch-info {
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  color: var(--text-secondary);
  margin-right: 4px;
}

.todo-list {
  padding: 0 28px 120px;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 8px;
  padding-bottom: 60px;
}

.empty-icon {
  opacity: 0.3;
  margin-bottom: 8px;
}

.empty-title {
  font-family: 'Manrope', sans-serif;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-secondary);
}

.empty-desc {
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  color: var(--text-muted);
}

.empty-add-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 16px;
  padding: 10px 24px;
  background: var(--accent);
  color: var(--on-accent);
  border: none;
  border-radius: 8px;
  font-family: 'Manrope', sans-serif;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.empty-add-btn:hover {
  background: var(--accent-dim);
  box-shadow: 0 4px 20px rgba(0, 96, 148, 0.2);
}

/* 底部迷你统计卡片 */
.mini-stats {
  position: fixed;
  bottom: 16px;
  left: calc(var(--sidebar-width) + 28px);
  right: 80px;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  z-index: 10;
}

.mini-stat-card {
  background: var(--surface-container-lowest);
  border-radius: 12px;
  padding: 16px 18px;
  box-shadow: 0 4px 24px rgba(43, 47, 49, 0.06);
}

.mini-stat-label {
  font-family: 'Inter', sans-serif;
  font-size: 11px;
  font-weight: 500;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 6px;
}

.mini-stat-value {
  font-family: 'Manrope', sans-serif;
  font-size: 28px;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.2;
}

.mini-stat-unit {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-muted);
}

.mini-progress {
  height: 4px;
  background: var(--bg-secondary);
  border-radius: 2px;
  margin-top: 10px;
  overflow: hidden;
}

.mini-progress-fill {
  height: 100%;
  background: var(--accent);
  border-radius: 2px;
  transition: width 0.5s ease;
}

.mini-stat-avatars {
  display: flex;
  align-items: center;
  margin-top: 6px;
}

.avatar-circle {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2px solid var(--surface-container-lowest);
}

/* FAB 添加按钮 */
.add-btn-container {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 20;
}

.add-fab {
  width: 52px;
  height: 52px;
  border-radius: 16px;
  border: none;
  background: var(--accent);
  color: var(--on-accent);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 28px rgba(0, 96, 148, 0.3);
  transition: all 0.2s ease;
}

.add-fab:hover {
  background: var(--accent-dim);
  box-shadow: 0 12px 36px rgba(0, 96, 148, 0.4);
  transform: translateY(-2px);
}
</style>
