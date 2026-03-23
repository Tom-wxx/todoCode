<script setup lang="ts">
import { ref, watch } from 'vue'
import { useTodoStore } from '../stores/todo'
import { useSettingsStore } from '../stores/settings'
import { ElMessage } from 'element-plus'
import type { Todo } from '../utils/helpers'

const props = defineProps<{ visible: boolean; todo: Todo | null }>()
const emit = defineEmits<{ (e: 'close'): void }>()

const todoStore = useTodoStore()
const settingsStore = useSettingsStore()

const form = ref({
  title: '',
  description: '',
  priority: 'medium' as 'low' | 'medium' | 'high',
  category: '',
  tags: [] as string[],
  dueDate: null as string | null,
  reminder: null as string | null
})

const tagInput = ref('')

const priorityOptions = [
  { value: 'high' as const, label: '高优先级' },
  { value: 'medium' as const, label: '中优先级' },
  { value: 'low' as const, label: '低优先级' },
]

watch(() => props.visible, (val) => {
  if (val && props.todo) {
    form.value = {
      title: props.todo.title,
      description: props.todo.description,
      priority: props.todo.priority,
      category: props.todo.category,
      tags: [...props.todo.tags],
      dueDate: props.todo.dueDate,
      reminder: props.todo.reminder
    }
  } else if (val) {
    form.value = { title: '', description: '', priority: 'medium', category: '', tags: [], dueDate: null, reminder: null }
  }
})

function addTag() {
  const tag = tagInput.value.trim()
  if (tag && !form.value.tags.includes(tag)) {
    form.value.tags.push(tag)
  }
  tagInput.value = ''
}

function removeTag(tag: string) {
  form.value.tags = form.value.tags.filter(t => t !== tag)
}

async function handleSubmit() {
  if (!form.value.title.trim()) {
    ElMessage.warning('请输入标题')
    return
  }
  try {
    if (props.todo) {
      await todoStore.updateTodo(props.todo.id, { ...form.value })
      ElMessage.success('已更新')
    } else {
      await todoStore.addTodo({ ...form.value })
      ElMessage.success('已添加')
    }
  } catch (e) {
    console.error('保存失败', e)
    ElMessage.error('保存失败，请重试')
  }
  emit('close')
}
</script>

<template>
  <el-dialog
    :model-value="visible"
    :title="todo ? '编辑待办' : '添加待办'"
    width="500px"
    @close="emit('close')"
    :close-on-click-modal="false"
  >
    <el-form :model="form" label-width="70px" label-position="left">
      <el-form-item label="标题">
        <el-input v-model="form.title" placeholder="输入待办事项标题" autofocus />
      </el-form-item>
      <el-form-item label="描述">
        <el-input v-model="form.description" type="textarea" :rows="3" placeholder="详细描述（可选）" />
      </el-form-item>
      <el-form-item label="优先级">
        <div class="priority-selector">
          <button
            v-for="item in priorityOptions"
            :key="item.value"
            type="button"
            class="priority-btn"
            :class="[`priority-btn--${item.value}`, { active: form.priority === item.value }]"
            @click="form.priority = item.value"
          >
            <span class="priority-dot" />
            {{ item.label }}
          </button>
        </div>
      </el-form-item>
      <el-form-item label="分类">
        <el-select v-model="form.category" clearable placeholder="选择分类" style="width: 100%">
          <el-option v-for="cat in settingsStore.categories" :key="cat" :label="cat" :value="cat" />
        </el-select>
      </el-form-item>
      <el-form-item label="标签">
        <div class="tag-input-box">
          <span
            v-for="tag in form.tags"
            :key="tag"
            class="tag-chip"
          >
            {{ tag }}
            <span class="tag-remove" @click="removeTag(tag)">×</span>
          </span>
          <input
            v-model="tagInput"
            class="tag-input"
            placeholder="输入后回车添加"
            @keyup.enter="addTag"
            @keyup.delete="tagInput === '' && form.tags.pop()"
          />
        </div>
      </el-form-item>
      <el-form-item label="到期日期">
        <el-date-picker
          v-model="form.dueDate"
          type="date"
          placeholder="选择到期日期"
          value-format="YYYY-MM-DD"
          style="width: 100%"
        />
      </el-form-item>
      <el-form-item label="提醒时间">
        <el-date-picker
          v-model="form.reminder"
          type="datetime"
          placeholder="选择提醒时间"
          value-format="YYYY-MM-DDTHH:mm:ss"
          style="width: 100%"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="emit('close')">取消</el-button>
      <el-button type="primary" @click="handleSubmit">{{ todo ? '保存' : '添加' }}</el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
/* ===== 优先级选择器 ===== */
.priority-selector {
  display: flex;
  gap: 8px;
}

.priority-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 20px;
  border: 1.5px solid var(--border-color);
  background: transparent;
  font-size: 13px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.18s;
  outline: none;
}

.priority-btn:hover {
  border-color: currentColor;
}

.priority-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}

/* 高 */
.priority-btn--high .priority-dot { background: var(--priority-high); }
.priority-btn--high:hover,
.priority-btn--high.active {
  color: var(--priority-high);
  border-color: var(--priority-high);
  background: rgba(245, 108, 108, 0.08);
}

/* 中 */
.priority-btn--medium .priority-dot { background: var(--priority-medium); }
.priority-btn--medium:hover,
.priority-btn--medium.active {
  color: var(--priority-medium);
  border-color: var(--priority-medium);
  background: rgba(230, 162, 60, 0.08);
}

/* 低 */
.priority-btn--low .priority-dot { background: var(--priority-low); }
.priority-btn--low:hover,
.priority-btn--low.active {
  color: var(--priority-low);
  border-color: var(--priority-low);
  background: rgba(103, 194, 58, 0.08);
}

/* ===== 标签输入区 ===== */
.tag-input-box {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  width: 100%;
  min-height: 36px;
  padding: 5px 10px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: var(--bg-primary);
  transition: border-color 0.2s;
  cursor: text;
}

.tag-input-box:focus-within {
  border-color: var(--accent);
}

.tag-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  font-size: 12px;
  color: var(--text-secondary);
  line-height: 1.6;
}

.tag-remove {
  font-size: 14px;
  line-height: 1;
  color: var(--text-muted);
  cursor: pointer;
  transition: color 0.15s;
}

.tag-remove:hover {
  color: var(--priority-high);
}

.tag-input {
  flex: 1;
  min-width: 100px;
  border: none;
  outline: none;
  background: transparent;
  font-size: 13px;
  color: var(--text-primary);
  padding: 0;
}

.tag-input::placeholder {
  color: var(--text-muted);
}
</style>
