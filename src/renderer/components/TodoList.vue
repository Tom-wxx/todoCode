<script setup lang="ts">
import { ref, inject, watch, type Ref } from 'vue'
import { useTodoStore } from '../stores/todo'
import { Plus, Delete, Select, CloseBold, CircleCheck, Document } from '@element-plus/icons-vue'
import { ElMessageBox, ElMessage } from 'element-plus'
import TodoItem from './TodoItem.vue'
import TodoForm from './TodoForm.vue'
import type { Todo } from '../utils/helpers'

const todoStore = useTodoStore()
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
      <el-icon :size="48" color="var(--text-muted)"><Document /></el-icon>
      <p>暂无待办事项</p>
      <el-button type="primary" @click="openAddForm">添加待办</el-button>
    </div>

    <div class="add-btn-container">
      <el-button type="primary" :icon="Plus" circle size="large" @click="openAddForm" class="add-btn" />
    </div>

    <TodoForm
      :visible="showForm"
      :todo="editingTodo"
      @close="handleFormClose"
    />
  </div>
</template>

<style scoped>
.todo-list-container {
  flex: 1;
  overflow-y: auto;
  position: relative;
  padding: 8px 0;
}

.batch-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
}

.batch-info {
  font-size: 13px;
  color: var(--text-secondary);
  margin-right: 4px;
}

.todo-list {
  padding: 0 16px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 12px;
  color: var(--text-muted);
  font-size: 14px;
}

.add-btn-container {
  position: absolute;
  bottom: 20px;
  right: 20px;
}

.add-btn {
  width: 48px !important;
  height: 48px !important;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.4);
}
</style>
