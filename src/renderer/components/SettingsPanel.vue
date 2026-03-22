<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useSettingsStore } from '../stores/settings'
import { getApi } from '../utils/api'
import { ElMessage } from 'element-plus'

const settingsStore = useSettingsStore()

const dataPath = ref('')
const logPath = ref('')
const logEnabled = ref(true)
const defaultDataPath = ref('')
const defaultLogPath = ref('')

onMounted(async () => {
  await loadConfig()
})

async function loadConfig() {
  const config = await getApi().config.get()
  dataPath.value = config.dataPath
  logPath.value = config.logPath
  logEnabled.value = config.logEnabled
  defaultDataPath.value = config.defaultDataPath
  defaultLogPath.value = config.defaultLogPath
}

async function changeDataPath() {
  const result = await getApi().config.setDataPath()
  if (result) {
    dataPath.value = result
    ElMessage.success('数据存储路径已更改，数据已迁移')
  }
}

async function resetDataPath() {
  const result = await getApi().config.resetDataPath()
  dataPath.value = result
  ElMessage.success('已恢复默认数据路径')
}

async function changeLogPath() {
  const result = await getApi().config.setLogPath()
  if (result) {
    logPath.value = result
    ElMessage.success('日志存储路径已更改')
  }
}

async function resetLogPath() {
  const result = await getApi().config.resetLogPath()
  logPath.value = result
  ElMessage.success('已恢复默认日志路径')
}

async function toggleLogEnabled() {
  await getApi().config.setLogEnabled(logEnabled.value)
  ElMessage.success(logEnabled.value ? '日志记录已启用' : '日志记录已关闭')
}

function openFolder(path: string) {
  getApi().config.openPath(path)
}
</script>

<template>
  <div class="settings-panel">
    <div class="settings-header">
      <h2>设置</h2>
      <el-button text @click="settingsStore.showStats = false; settingsStore.showSettings = false">
        <el-icon><Back /></el-icon> 返回
      </el-button>
    </div>

    <!-- 外观设置 -->
    <div class="settings-section">
      <h3>外观</h3>
      <div class="setting-item">
        <div class="setting-info">
          <div class="setting-label">深色模式</div>
          <div class="setting-desc">切换应用的明暗主题</div>
        </div>
        <el-switch :model-value="settingsStore.darkMode" @change="settingsStore.toggleDarkMode()" />
      </div>
    </div>

    <!-- 数据存储设置 -->
    <div class="settings-section">
      <h3>数据存储</h3>
      <div class="setting-item">
        <div class="setting-info">
          <div class="setting-label">数据存储路径</div>
          <div class="setting-desc setting-path" @click="openFolder(dataPath)">{{ dataPath }}</div>
        </div>
        <div class="setting-actions">
          <el-button size="small" @click="changeDataPath">
            <el-icon><FolderOpened /></el-icon> 更改
          </el-button>
          <el-button size="small" @click="resetDataPath">
            <el-icon><RefreshRight /></el-icon> 默认
          </el-button>
        </div>
      </div>
      <div class="setting-hint">
        默认路径：{{ defaultDataPath }}
      </div>
    </div>

    <!-- 日志设置 -->
    <div class="settings-section">
      <h3>日志记录</h3>
      <div class="setting-item">
        <div class="setting-info">
          <div class="setting-label">启用日志</div>
          <div class="setting-desc">记录应用操作日志（添加、删除、导入导出等）</div>
        </div>
        <el-switch v-model="logEnabled" @change="toggleLogEnabled" />
      </div>
      <div class="setting-item">
        <div class="setting-info">
          <div class="setting-label">日志存储路径</div>
          <div class="setting-desc setting-path" @click="openFolder(logPath)">{{ logPath }}</div>
        </div>
        <div class="setting-actions">
          <el-button size="small" @click="changeLogPath" :disabled="!logEnabled">
            <el-icon><FolderOpened /></el-icon> 更改
          </el-button>
          <el-button size="small" @click="resetLogPath" :disabled="!logEnabled">
            <el-icon><RefreshRight /></el-icon> 默认
          </el-button>
        </div>
      </div>
      <div class="setting-hint">
        默认路径：{{ defaultLogPath }}
      </div>
      <div class="setting-item" style="margin-top: 8px">
        <div class="setting-info">
          <div class="setting-label">打开日志目录</div>
          <div class="setting-desc">在文件资源管理器中查看日志文件</div>
        </div>
        <el-button size="small" @click="openFolder(logPath)" :disabled="!logEnabled">
          <el-icon><Folder /></el-icon> 打开
        </el-button>
      </div>
    </div>

    <!-- 关于 -->
    <div class="settings-section">
      <h3>关于</h3>
      <div class="setting-item">
        <div class="setting-info">
          <div class="setting-label">待办事项</div>
          <div class="setting-desc">版本 1.0.0 · Electron + Vue 3</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.settings-panel {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
}

.settings-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.settings-header h2 {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}

.settings-section {
  margin-bottom: 24px;
}

.settings-section h3 {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 12px;
  padding-bottom: 6px;
  border-bottom: 1px solid var(--border-color);
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  border-radius: 8px;
  transition: background 0.15s;
}

.setting-item:hover {
  background: var(--bg-secondary);
}

.setting-info {
  flex: 1;
  min-width: 0;
}

.setting-label {
  font-size: 14px;
  color: var(--text-primary);
  font-weight: 500;
}

.setting-desc {
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 2px;
}

.setting-path {
  font-family: 'Consolas', 'Monaco', monospace;
  cursor: pointer;
  word-break: break-all;
}

.setting-path:hover {
  color: var(--accent);
  text-decoration: underline;
}

.setting-actions {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
}

.setting-hint {
  font-size: 11px;
  color: var(--text-muted);
  padding: 0 12px;
  margin-top: 4px;
  font-family: 'Consolas', 'Monaco', monospace;
}
</style>
