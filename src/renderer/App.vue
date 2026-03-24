<script setup lang="ts">
import { onMounted, onUnmounted, ref, provide, computed } from 'vue'
import { useTodoStore } from './stores/todo'
import { useSettingsStore } from './stores/settings'
import TitleBar from './components/TitleBar.vue'
import Sidebar from './components/Sidebar.vue'
import SearchBar from './components/SearchBar.vue'
import TodoList from './components/TodoList.vue'
import StatsPanel from './components/StatsPanel.vue'
import SettingsPanel from './components/SettingsPanel.vue'
import CalendarView from './components/CalendarView.vue'

const todoStore = useTodoStore()
const settingsStore = useSettingsStore()

// 提供给子组件的控制方法
const showAddForm = ref(false)
const focusSearch = ref<(() => void) | null>(null)

provide('showAddForm', showAddForm)
provide('focusSearch', focusSearch)

// 问候语
const greeting = computed(() => {
  const h = new Date().getHours()
  if (h < 6) return '夜深了'
  if (h < 12) return '早上好'
  if (h < 14) return '中午好'
  if (h < 18) return '下午好'
  return '晚上好'
})

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
        <template v-else-if="settingsStore.showCalendar">
          <CalendarView />
        </template>
        <template v-else>
          <!-- 欢迎区 -->
          <div class="welcome-section">
            <div class="welcome-text">
              <h1 class="welcome-title">{{ greeting }}, 专注者</h1>
              <p class="welcome-sub">今天共有 {{ todoStore.stats.todayCount }} 项待办任务等待处理</p>
            </div>
          </div>
          <SearchBar />
          <TodoList />
        </template>
      </div>
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

/* 欢迎区 */
.welcome-section {
  padding: 28px 28px 8px;
}

.welcome-title {
  font-family: 'Manrope', sans-serif;
  font-size: 26px;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.5px;
  line-height: 1.3;
}

.welcome-sub {
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  color: var(--text-muted);
  margin-top: 4px;
  line-height: 1.6;
}
</style>
