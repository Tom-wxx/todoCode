<script setup lang="ts">
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
      <el-icon class="title-icon"><Finished /></el-icon>
      <span class="title-text">DailyToDo</span>
    </div>
    <div class="title-bar-actions">
      <button class="title-btn" @click="settingsStore.toggleDarkMode" :title="settingsStore.darkMode ? '浅色模式' : '深色模式'">
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
  background: var(--bg-panel);
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--border-panel);
  -webkit-app-region: drag;
  user-select: none;
  flex-shrink: 0;
}

.title-bar-drag {
  display: flex;
  align-items: center;
  gap: 7px;
  padding-left: 14px;
}

.title-icon {
  font-size: 15px;
  color: var(--accent);
}

.title-text {
  font-size: 13px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  letter-spacing: 0.2px;
}

.title-bar-actions {
  display: flex;
  -webkit-app-region: no-drag;
}

.title-btn, .win-btn {
  width: 38px;
  height: var(--titlebar-height);
  border: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.5);
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s, color 0.15s;
}

.title-btn:hover, .win-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.9);
}

.close-btn:hover {
  background: #e81123;
  color: white;
}
</style>
