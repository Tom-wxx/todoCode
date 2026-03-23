<script setup lang="ts">
import { onMounted, onUnmounted, ref, provide } from 'vue'
import { useTodoStore } from './stores/todo'
import { useSettingsStore } from './stores/settings'
import TitleBar from './components/TitleBar.vue'
import Sidebar from './components/Sidebar.vue'
import SearchBar from './components/SearchBar.vue'
import TodoList from './components/TodoList.vue'
import StatsPanel from './components/StatsPanel.vue'
import SettingsPanel from './components/SettingsPanel.vue'

const todoStore = useTodoStore()
const settingsStore = useSettingsStore()

// 提供给子组件的控制方法
const showAddForm = ref(false)
const focusSearch = ref<(() => void) | null>(null)

provide('showAddForm', showAddForm)
provide('focusSearch', focusSearch)

function handleKeydown(e: KeyboardEvent) {
  if (e.ctrlKey && e.key === 'n') {
    e.preventDefault()
    showAddForm.value = true
  } else if (e.ctrlKey && e.key === 'f') {
    e.preventDefault()
    focusSearch.value?.()
  } else if (e.ctrlKey && e.key === 'd') {
    e.preventDefault()
    settingsStore.toggleDarkMode()
  }
}

onMounted(async () => {
  await settingsStore.load()
  await todoStore.loadTodos()
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <div class="app-container">
    <TitleBar />
    <div class="app-body">
      <Sidebar />
      <div class="main-content">
        <template v-if="settingsStore.showSettings">
          <SettingsPanel />
        </template>
        <template v-else-if="settingsStore.showStats">
          <StatsPanel />
        </template>
        <template v-else>
          <SearchBar />
          <TodoList />
        </template>
      </div>
    </div>
    <div class="status-bar">
      <span style="color: var(--text-panel-muted)">共 {{ todoStore.stats.total }} 项</span>
      <span style="color: var(--border-panel)">·</span>
      <span style="color: var(--text-panel-muted)">已完成 {{ todoStore.stats.completed }} 项</span>
      <span style="color: var(--border-panel)">·</span>
      <span style="color: var(--text-panel-muted)">今日到期 {{ todoStore.stats.todayCount }} 项</span>
      <span v-if="todoStore.stats.overdueCount > 0" style="color: #fca5a5">
        · 已过期 {{ todoStore.stats.overdueCount }} 项
      </span>
    </div>
  </div>
</template>

<style scoped>
.app-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--bg-primary);
}

.app-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--bg-primary);
}

.status-bar {
  height: var(--statusbar-height);
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 20px;
  font-size: 11px;
  color: var(--text-muted);
  background: var(--bg-panel);
  border-top: 1px solid var(--border-panel);
}
</style>
