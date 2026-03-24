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
    <div class="search-input-wrapper">
      <el-icon class="search-icon" :size="16"><Search /></el-icon>
      <el-input
        ref="searchInputRef"
        v-model="localQuery"
        placeholder="搜索待办事项..."
        clearable
        size="default"
        class="search-input"
      />
    </div>
    <el-select v-model="todoStore.priorityFilter" size="default" class="filter-select">
      <el-option label="全部优先级" value="all" />
      <el-option label="高优先级" value="high" />
      <el-option label="中优先级" value="medium" />
      <el-option label="低优先级" value="low" />
    </el-select>
    <button class="filter-btn" title="筛选">
      <el-icon :size="16"><Filter /></el-icon>
      筛选
    </button>
  </div>
</template>

<style scoped>
.search-bar {
  display: flex;
  gap: 10px;
  padding: 0 28px 16px;
  align-items: center;
}

.search-input-wrapper {
  flex: 1;
  position: relative;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-muted);
  z-index: 1;
  pointer-events: none;
}

.search-input :deep(.el-input__wrapper) {
  padding-left: 36px;
  background: var(--surface-container-lowest);
  border-radius: 8px;
  box-shadow: none;
  border: 1px solid var(--border-color);
  transition: all 0.2s ease;
}

.search-input :deep(.el-input__wrapper:hover) {
  border-color: var(--border-color-hover);
}

.search-input :deep(.el-input__wrapper.is-focus) {
  border-color: var(--accent);
  box-shadow: 0 0 0 2px rgba(0, 96, 148, 0.08);
}

.filter-select {
  width: 130px;
}

.filter-select :deep(.el-input__wrapper) {
  background: var(--surface-container-lowest);
  box-shadow: none;
  border: 1px solid var(--border-color);
  border-radius: 8px;
}

.filter-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 14px;
  border: 1px solid var(--border-color);
  background: var(--surface-container-lowest);
  border-radius: 8px;
  font-family: 'Manrope', sans-serif;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.filter-btn:hover {
  border-color: var(--border-color-hover);
  background: var(--bg-secondary);
}
</style>
