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
          <el-radio-group v-model="form.priority">
            <el-radio-button value="high" :class="{ 'priority-active-high': form.priority === 'high' }">
              <span style="color: var(--priority-high)">高</span>
            </el-radio-button>
            <el-radio-button value="medium" :class="{ 'priority-active-medium': form.priority === 'medium' }">
              <span style="color: var(--priority-medium)">中</span>
            </el-radio-button>
            <el-radio-button value="low" :class="{ 'priority-active-low': form.priority === 'low' }">
              <span style="color: var(--priority-low)">低</span>
            </el-radio-button>
          </el-radio-group>
        </div>
      </el-form-item>
      <el-form-item label="分类">
        <el-select v-model="form.category" clearable placeholder="选择分类" style="width: 100%">
          <el-option v-for="cat in settingsStore.categories" :key="cat" :label="cat" :value="cat" />
        </el-select>
      </el-form-item>
      <el-form-item label="标签">
        <div class="tags-container">
          <el-tag
            v-for="tag in form.tags"
            :key="tag"
            closable
            size="small"
            @close="removeTag(tag)"
            style="margin-right: 4px; margin-bottom: 4px"
          >
            {{ tag }}
          </el-tag>
          <el-input
            v-model="tagInput"
            size="small"
            placeholder="输入标签后回车"
            style="width: 130px"
            @keyup.enter="addTag"
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
.tags-container {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 2px;
}

.priority-selector :deep(.el-radio-button) {
  position: relative;
}

.priority-selector :deep(.priority-active-high .el-radio-button__inner)::after,
.priority-selector :deep(.priority-active-medium .el-radio-button__inner)::after,
.priority-selector :deep(.priority-active-low .el-radio-button__inner)::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  border-radius: 0 0 4px 4px;
}

.priority-selector :deep(.priority-active-high .el-radio-button__inner)::after {
  background: var(--priority-high);
}

.priority-selector :deep(.priority-active-medium .el-radio-button__inner)::after {
  background: var(--priority-medium);
}

.priority-selector :deep(.priority-active-low .el-radio-button__inner)::after {
  background: var(--priority-low);
}
</style>
