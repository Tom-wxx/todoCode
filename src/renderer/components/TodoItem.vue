<script setup lang="ts">
import { computed } from 'vue'
import { useTodoStore } from '../stores/todo'
import { formatDate, isOverdue, isToday, type Todo } from '../utils/helpers'
import { ElMessageBox, ElMessage } from 'element-plus'

const props = defineProps<{ todo: Todo; selected?: boolean }>()
const emit = defineEmits<{
  (e: 'edit', todo: Todo): void
  (e: 'toggle-select'): void
}>()
const todoStore = useTodoStore()

// 右侧胶囊标签：过期 > 今日时间 > 分类 > 优先级
const badge = computed(() => {
  const t = props.todo
  if (isOverdue(t.dueDate) && !t.completed) {
    return { text: '已过期', type: 'danger' }
  }
  if (isToday(t.dueDate) && !t.completed) {
    // 格式化为"上午/下午 H:mm"，若无时间则显示"今天"
    const d = new Date(t.dueDate!)
    const h = d.getHours(), m = d.getMinutes()
    if (h === 0 && m === 0) return { text: '今天', type: 'today' }
    const period = h < 12 ? '上午' : '下午'
    const hh = h % 12 || 12
    const mm = String(m).padStart(2, '0')
    return { text: `${period} ${hh}:${mm}`, type: 'today' }
  }
  if (t.dueDate && !t.completed) {
    return { text: formatDate(t.dueDate), type: 'default' }
  }
  if (t.category) {
    return { text: t.category, type: 'default' }
  }
  const labels: Record<string, string> = { high: '高优先级', medium: '中优先级', low: '低优先级' }
  return { text: labels[t.priority] || '', type: t.priority === 'high' ? 'high' : 'default' }
})

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
    :class="{ completed: todo.completed, selected }"
    @click.middle="emit('toggle-select')"
  >
    <!-- 圆形 checkbox -->
    <div
      class="circle-check"
      :class="{ checked: todo.completed }"
      @click.stop="todoStore.toggleTodo(todo.id)"
    >
      <svg v-if="todo.completed" viewBox="0 0 16 16" fill="none">
        <polyline points="3,8 7,12 13,4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </div>

    <!-- 内容区 -->
    <div class="todo-body" @click="emit('edit', todo)">
      <div class="todo-title">{{ todo.title }}</div>
      <div v-if="todo.description" class="todo-desc">{{ todo.description }}</div>
    </div>

    <!-- 右侧胶囊标签 -->
    <div class="todo-right">
      <span class="badge" :class="`badge-${badge.type}`">{{ badge.text }}</span>
      <div class="todo-actions">
        <el-button text size="small" @click.stop="emit('toggle-select')" :type="selected ? 'primary' : ''">
          <el-icon><Select /></el-icon>
        </el-button>
        <el-button text size="small" @click.stop="emit('edit', todo)">
          <el-icon><Edit /></el-icon>
        </el-button>
        <el-button text size="small" type="danger" @click.stop="handleDelete">
          <el-icon><Delete /></el-icon>
        </el-button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.todo-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  margin-bottom: 8px;
  transition: box-shadow 0.2s, border-color 0.2s;
  cursor: default;
}

.todo-item:hover {
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.06);
  border-color: #d0d5dd;
}

.todo-item.selected {
  border-color: var(--accent);
  background: rgba(64, 158, 255, 0.04);
}

.todo-item.completed {
  opacity: 0.55;
}

/* 圆形 checkbox */
.circle-check {
  flex-shrink: 0;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 2px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s;
  color: white;
}

.circle-check:hover {
  border-color: var(--accent);
}

.circle-check.checked {
  background: var(--accent);
  border-color: var(--accent);
}

.circle-check svg {
  width: 12px;
  height: 12px;
}

/* 内容 */
.todo-body {
  flex: 1;
  min-width: 0;
  cursor: pointer;
}

.todo-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  line-height: 1.5;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.todo-item.completed .todo-title {
  text-decoration: line-through;
  color: var(--text-muted);
}

.todo-desc {
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 3px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 右侧区域 */
.todo-right {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 胶囊标签 */
.badge {
  font-size: 12px;
  padding: 3px 10px;
  border-radius: 20px;
  white-space: nowrap;
  line-height: 1.5;
}

.badge-default {
  background: var(--bg-secondary);
  color: var(--text-secondary);
}

.badge-high {
  background: rgba(245, 108, 108, 0.1);
  color: var(--priority-high);
}

.badge-danger {
  background: rgba(245, 108, 108, 0.12);
  color: var(--priority-high);
}

.badge-today {
  background: rgba(64, 158, 255, 0.1);
  color: var(--accent);
}

/* 操作按钮 hover 显示 */
.todo-actions {
  display: flex;
  opacity: 0;
  transition: opacity 0.15s;
}

.todo-item:hover .todo-actions {
  opacity: 1;
}
</style>
