<script setup lang="ts">
import { ref, watch, inject, onMounted, type Ref } from 'vue'
import { useTodoStore } from '../stores/todo'
import { Search } from '@element-plus/icons-vue'

const todoStore = useTodoStore()
const localQuery = ref(todoStore.searchQuery)
const searchInputRef = ref<{ focus: () => void } | null>(null)
const focusSearch = inject<Ref<(() => void) | null>>('focusSearch')

let debounceTimer: ReturnType<typeof setTimeout> | null = null
watch(localQuery, (val) => {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    todoStore.searchQuery = val
  }, 200)
})

onMounted(() => {
  if (focusSearch) {
    focusSearch.value = () => {
      searchInputRef.value?.focus()
    }
  }
})
</script>

<template>
  <div class="search-bar">
    <el-input
      ref="searchInputRef"
      v-model="localQuery"
      placeholder="搜索待办事项..."
      clearable
      size="default"
    >
      <template #prefix><el-icon><Search /></el-icon></template>
    </el-input>
    <el-select v-model="todoStore.priorityFilter" size="default" style="width: 120px">
      <el-option label="全部优先级" value="all" />
      <el-option label="高优先级" value="high" />
      <el-option label="中优先级" value="medium" />
      <el-option label="低优先级" value="low" />
    </el-select>
  </div>
</template>

<style scoped>
.search-bar {
  display: flex;
  gap: 10px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-color);
}
</style>
