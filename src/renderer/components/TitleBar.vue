<script setup lang="ts">
import { useSettingsStore } from '../stores/settings'
import { getApi } from '../utils/api'

const settingsStore = useSettingsStore()

function minimize() { getApi().window.minimize() }
function maximize() { getApi().window.maximize() }
function close() { getApi().window.close() }
</script>

<template>
  <div class="title-bar" :style="{ background: settingsStore.darkMode ? 'var(--bg-sidebar)' : 'linear-gradient(to right, #f0f2f5, #f8f9fb)' }">
    <div class="title-bar-drag">
      <el-icon class="title-icon"><Finished /></el-icon>
      <span class="title-text">待办事项</span>
    </div>
    <div class="title-bar-actions">
      <button class="theme-btn" @click="settingsStore.toggleDarkMode" :title="settingsStore.darkMode ? '浅色模式' : '深色模式'">
        <el-icon><Sunny v-if="settingsStore.darkMode" /><Moon v-else /></el-icon>
      </button>
      <button class="win-btn" @click="minimize"><span>&#x2014;</span></button>
      <button class="win-btn" @click="maximize"><span>&#9633;</span></button>
      <button class="win-btn close-btn" @click="close"><span>&#10005;</span></button>
    </div>
  </div>
</template>

<style scoped>
.title-bar {
  height: var(--titlebar-height);
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--border-color);
  -webkit-app-region: drag;
  user-select: none;
}

.title-bar-drag {
  display: flex;
  align-items: center;
  gap: 6px;
  padding-left: 12px;
}

.title-icon {
  font-size: 16px;
  color: var(--accent);
}

.title-text {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
}

.title-bar-actions {
  display: flex;
  -webkit-app-region: no-drag;
}

.theme-btn, .win-btn {
  width: 40px;
  height: var(--titlebar-height);
  border: none;
  background: transparent;
  color: var(--text-secondary);
  font-size: 13px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
}

.theme-btn:hover, .win-btn:hover {
  background: rgba(128, 128, 128, 0.15);
}

.close-btn:hover {
  background: #e81123;
  color: white;
}
</style>
