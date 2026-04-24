<script setup lang="ts">
import { computed } from 'vue'
import { Delete, Edit, Select } from '@element-plus/icons-vue'
import { useTodoStore } from '../stores/todo'
import { formatDate, isOverdue, isToday, type Todo } from '../utils/helpers'
import { ElMessageBox, ElMessage } from 'element-plus'

const props = defineProps<{ todo: Todo; selected?: boolean }>()
const emit = defineEmits<{
  (e: 'edit', todo: Todo): void
  (e: 'toggle-select'): void
}>()
const todoStore = useTodoStore()

// 优先级对应的 checkbox 颜色
const checkColor = computed(() => {
  if (props.todo.completed) return 'var(--accent)'
  const map: Record<string, string> = {
    high: 'var(--priority-high)',
    medium: 'var(--priority-medium)',
    low: 'var(--tertiary)'
  }
  return map[props.todo.priority] || 'var(--text-muted)'
})

// 右侧胶囊标签
const badges = computed(() => {
  const t = props.todo
  const result: { text: string; type: string }[] = []

  if (isOverdue(t.dueDate) && !t.completed) {
    result.push({ text: '已过期', type: 'danger' })
  } else if (isToday(t.dueDate) && !t.completed) {
    // dueDate 为 YYYY-MM-DD，无时间分量，直接显示"今天"
    result.push({ text: '今天', type: 'today' })
  } else if (t.dueDate && !t.completed) {
    result.push({ text: formatDate(t.dueDate), type: 'default' })
  }

  if (t.category) {
    result.push({ text: t.category, type: 'category' })
  }

  if (t.tags && t.tags.length > 0) {
    t.tags.forEach(tag => {
      result.push({ text: tag, type: 'tag' })
    })
  }

  return result
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
      :style="{ borderColor: checkColor, '--check-color': checkColor }"
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
      <div class="todo-badges" v-if="badges.length > 0">
        <span
          v-for="(b, i) in badges"
          :key="i"
          class="pill"
          :class="`pill-${b.type}`"
        >{{ b.text }}</span>
      </div>
    </div>

    <!-- 操作按钮 -->
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
</template>

<style scoped>
.todo-item {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 16px 18px;
  background: var(--surface-container-lowest);
  border-radius: 8px;
  margin-bottom: 8px;
  transition: all 0.2s ease;
  cursor: default;
}

.todo-item:hover {
  box-shadow: 0 4px 24px rgba(43, 47, 49, 0.05);
}

.todo-item.selected {
  background: rgba(0, 96, 148, 0.04);
  box-shadow: 0 0 0 1px rgba(0, 96, 148, 0.15);
}

.todo-item.completed {
  opacity: 0.5;
}

/* 圆形 checkbox */
.circle-check {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 2.5px solid var(--check-color, var(--text-muted));
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  color: white;
  margin-top: 1px;
}

.circle-check:hover {
  transform: scale(1.1);
}

.circle-check.checked {
  background: var(--check-color, var(--accent));
  border-color: var(--check-color, var(--accent));
}

.circle-check svg {
  width: 13px;
  height: 13px;
}

/* 内容 */
.todo-body {
  flex: 1;
  min-width: 0;
  cursor: pointer;
}

.todo-title {
  font-family: 'Manrope', sans-serif;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  line-height: 1.5;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.todo-item.completed .todo-title {
  text-decoration: line-through;
  color: var(--text-muted);
  font-weight: 500;
}

.todo-desc {
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.5;
}

/* 标签 */
.todo-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
}

.pill {
  font-family: 'Inter', sans-serif;
  font-size: 11px;
  font-weight: 500;
  padding: 2px 10px;
  border-radius: 12px;
  white-space: nowrap;
  line-height: 1.5;
}

.pill-default {
  background: var(--bg-secondary);
  color: var(--text-secondary);
}

.pill-category {
  background: rgba(0, 96, 148, 0.08);
  color: var(--accent);
}

.pill-tag {
  background: rgba(0, 100, 121, 0.08);
  color: var(--tertiary);
}

.pill-danger {
  background: rgba(179, 27, 37, 0.08);
  color: var(--priority-high);
  font-weight: 600;
}

.pill-today {
  background: rgba(0, 96, 148, 0.08);
  color: var(--accent);
}

/* 操作按钮 hover 显示 */
.todo-actions {
  flex-shrink: 0;
  display: flex;
  opacity: 0;
  transition: opacity 0.2s;
  margin-top: 1px;
}

.todo-item:hover .todo-actions {
  opacity: 1;
}
</style>
