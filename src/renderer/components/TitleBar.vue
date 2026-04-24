<script setup lang="ts">
import { Moon, Sunny } from '@element-plus/icons-vue'
import { useSettingsStore } from '../stores/settings'
import { getApi } from '../utils/api'

const settingsStore = useSettingsStore()

function minimize() { getApi().window.minimize() }
function maximize() { getApi().window.maximize() }
function close() { getApi().window.close() }
</script>

<template>
  <div class="title-bar">
    <div class="title-bar-drag">
      <span class="brand-name">数字静修所</span>
    </div>
    <div class="title-bar-center">
      <button
        class="nav-tab"
        :class="{ active: !settingsStore.showStats && !settingsStore.showSettings && !settingsStore.showCalendar }"
        @click="settingsStore.showStats = false; settingsStore.showSettings = false; settingsStore.showCalendar = false"
      >工作台</button>
      <button
        class="nav-tab"
        :class="{ active: settingsStore.showStats }"
        @click="settingsStore.showStats = true; settingsStore.showSettings = false; settingsStore.showCalendar = false"
      >数据统计</button>
    </div>
    <div class="title-bar-actions">
      <button class="action-btn theme-btn" @click="settingsStore.toggleDarkMode" :title="settingsStore.darkMode ? '浅色模式' : '深色模式'">
        <el-icon :size="16"><Sunny v-if="settingsStore.darkMode" /><Moon v-else /></el-icon>
      </button>
      <button class="win-btn" @click="minimize">
        <svg width="12" height="12" viewBox="0 0 12 12"><rect x="1" y="5.5" width="10" height="1" fill="currentColor"/></svg>
      </button>
      <button class="win-btn" @click="maximize">
        <svg width="12" height="12" viewBox="0 0 12 12"><rect x="1.5" y="1.5" width="9" height="9" rx="0.5" stroke="currentColor" stroke-width="1" fill="none"/></svg>
      </button>
      <button class="win-btn close-btn" @click="close">
        <svg width="12" height="12" viewBox="0 0 12 12"><path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>
      </button>
    </div>
  </div>
</template>

<style scoped>
.title-bar {
  height: var(--titlebar-height);
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--bg-sidebar);
  -webkit-app-region: drag;
  user-select: none;
  padding: 0 4px;
}

.title-bar-drag {
  display: flex;
  align-items: center;
  padding-left: 14px;
  min-width: var(--sidebar-width);
}

.brand-name {
  font-family: 'Manrope', sans-serif;
  font-size: 15px;
  font-weight: 700;
  color: var(--accent);
  letter-spacing: -0.3px;
}

.title-bar-center {
  display: flex;
  align-items: center;
  gap: 2px;
  -webkit-app-region: no-drag;
}

.nav-tab {
  padding: 6px 16px;
  border: none;
  background: transparent;
  font-family: 'Manrope', sans-serif;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-muted);
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.2s ease;
  letter-spacing: -0.2px;
}

.nav-tab:hover {
  color: var(--text-primary);
  background: var(--border-color);
}

.nav-tab.active {
  color: var(--accent);
  font-weight: 600;
}

.title-bar-actions {
  display: flex;
  align-items: center;
  -webkit-app-region: no-drag;
}

.action-btn {
  width: 36px;
  height: 36px;
  border: none;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  transition: all 0.2s ease;
  margin-right: 4px;
}

.action-btn:hover {
  background: var(--border-color);
  color: var(--text-primary);
}

.win-btn {
  width: 40px;
  height: var(--titlebar-height);
  border: none;
  background: transparent;
  color: var(--text-muted);
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.win-btn:hover {
  background: rgba(115, 119, 121, 0.1);
  color: var(--text-primary);
}

.close-btn:hover {
  background: #b31b25;
  color: white;
}
</style>
