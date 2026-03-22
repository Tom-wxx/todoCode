<script setup lang="ts">
import { useTodoStore } from '../stores/todo'
import { formatDate, isOverdue, isToday, type Todo } from '../utils/helpers'
import { ElMessageBox, ElMessage } from 'element-plus'

const props = defineProps<{ todo: Todo; selected?: boolean }>()
const emit = defineEmits<{
  (e: 'edit', todo: Todo): void
  (e: 'toggle-select'): void
}>()
const todoStore = useTodoStore()

function getPriorityColor(priority: string) {
  const map: Record<string, string> = { high: 'var(--priority-high)', medium: 'var(--priority-medium)', low: 'var(--priority-low)' }
  return map[priority] || 'var(--text-muted)'
}

function getPriorityLabel(priority: string) {
  const map: Record<string, string> = { high: '高', medium: '中', low: '低' }
  return map[priority] || ''
}

function getDueDateClass() {
  if (isOverdue(props.todo.dueDate)) return 'overdue'
  if (isToday(props.todo.dueDate)) return 'today'
  return ''
}

async function handleDelete() {
  try {
    await ElMessageBox.confirm('确定删除该待办事项？', '提示', { type: 'warning' })
    await todoStore.deleteTodo(props.todo.id)
    ElMessage.success('已删除')
  } catch {
    return
  }
}
</script>

<template>
  <div
    class="todo-item"
    :class="{ completed: todo.completed, selected: selected }"
    :style="{ borderLeftColor: getPriorityColor(todo.priority) }"
    @click.middle="emit('toggle-select')"
  >
    <el-checkbox
      :model-value="todo.completed"
      @change="todoStore.toggleTodo(todo.id)"
      class="todo-checkbox"
    />
    <el-tooltip
      v-if="todo.description"
      :content="todo.description"
      placement="top"
      :show-after="500"
    >
      <div class="todo-info" @click="emit('edit', todo)">
        <div class="todo-title">{{ todo.title }}</div>
        <div class="todo-description">{{ todo.description }}</div>
        <div class="todo-meta">
          <span class="priority-tag" :style="{ color: getPriorityColor(todo.priority), borderColor: getPriorityColor(todo.priority) }">
            {{ getPriorityLabel(todo.priority) }}
          </span>
          <span v-if="todo.category" class="category-tag">{{ todo.category }}</span>
          <span v-for="tag in todo.tags" :key="tag" class="tag">{{ tag }}</span>
          <span v-if="todo.dueDate" class="due-date" :class="getDueDateClass()">
            <el-icon><Calendar /></el-icon>
            {{ formatDate(todo.dueDate) }}
          </span>
        </div>
      </div>
    </el-tooltip>
    <div v-else class="todo-info" @click="emit('edit', todo)">
      <div class="todo-title">{{ todo.title }}</div>
      <div class="todo-meta">
        <span class="priority-tag" :style="{ color: getPriorityColor(todo.priority), borderColor: getPriorityColor(todo.priority) }">
          {{ getPriorityLabel(todo.priority) }}
        </span>
        <span v-if="todo.category" class="category-tag">{{ todo.category }}</span>
        <span v-for="tag in todo.tags" :key="tag" class="tag">{{ tag }}</span>
        <span v-if="todo.dueDate" class="due-date" :class="getDueDateClass()">
          <el-icon><Calendar /></el-icon>
          {{ formatDate(todo.dueDate) }}
        </span>
      </div>
    </div>
    <div class="todo-actions">
      <el-button text size="small" @click="emit('toggle-select')" :type="selected ? 'primary' : ''">
        <el-icon><Select /></el-icon>
      </el-button>
      <el-button text size="small" @click="emit('edit', todo)">
        <el-icon><Edit /></el-icon>
      </el-button>
      <el-button text size="small" type="danger" @click="handleDelete">
        <el-icon><Delete /></el-icon>
      </el-button>
    </div>
  </div>
</template>

<style scoped>
.todo-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 8px;
  margin-bottom: 4px;
  transition: all 0.2s;
  border: 1px solid transparent;
  border-left: 3px solid;
}

.todo-item.completed {
  opacity: 0.6;
}

.todo-item.selected {
  background: rgba(64, 158, 255, 0.08);
  border-color: rgba(64, 158, 255, 0.3);
}

.todo-item:hover {
  background: var(--bg-secondary);
  border-color: var(--border-color);
}

.todo-item.completed .todo-title {
  text-decoration: line-through;
  color: var(--text-muted);
}

.todo-checkbox {
  flex-shrink: 0;
}

.todo-info {
  flex: 1;
  min-width: 0;
  cursor: pointer;
}

.todo-title {
  font-size: 14px;
  color: var(--text-primary);
  line-height: 1.4;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.todo-description {
  font-size: 12px;
  color: var(--text-muted);
  line-height: 1.4;
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.todo-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 4px;
  flex-wrap: wrap;
}

.priority-tag {
  font-size: 11px;
  padding: 0 5px;
  border: 1px solid;
  border-radius: 3px;
  line-height: 18px;
}

.category-tag {
  font-size: 11px;
  padding: 0 5px;
  background: var(--accent);
  color: white;
  border-radius: 3px;
  line-height: 18px;
}

.tag {
  font-size: 11px;
  padding: 0 5px;
  background: rgba(128, 128, 128, 0.15);
  border-radius: 3px;
  line-height: 18px;
  color: var(--text-secondary);
}

.due-date {
  font-size: 11px;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  gap: 2px;
}

.due-date.overdue {
  color: var(--priority-high);
}

.due-date.today {
  color: var(--accent);
  font-weight: 500;
}

.todo-actions {
  display: flex;
  opacity: 0;
  transition: opacity 0.15s;
}

.todo-item:hover .todo-actions {
  opacity: 1;
}
</style>
