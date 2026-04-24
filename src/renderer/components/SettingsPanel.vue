<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Back, Folder, FolderOpened, RefreshRight } from '@element-plus/icons-vue'
import { useSettingsStore } from '../stores/settings'
import { getApi } from '../utils/api'
import { ElMessage } from 'element-plus'

const settingsStore = useSettingsStore()

const dataPath = ref('')
const logPath = ref('')
const logEnabled = ref(true)
const defaultDataPath = ref('')
const defaultLogPath = ref('')
const appVersion = ref('')

onMounted(async () => {
  await loadConfig()
  appVersion.value = await getApi().app.getVersion()
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
      <div>
        <h2 class="settings-title">设置</h2>
        <p class="settings-sub">管理你的应用偏好</p>
      </div>
      <button class="back-btn" @click="settingsStore.showStats = false; settingsStore.showSettings = false; settingsStore.showCalendar = false">
        <el-icon><Back /></el-icon> 返回
      </button>
    </div>

    <!-- 外观设置 -->
    <div class="settings-section">
      <h3>外观</h3>
      <div class="setting-card">
        <div class="setting-item">
          <div class="setting-info">
            <div class="setting-label">深色模式</div>
            <div class="setting-desc">切换应用的明暗主题</div>
          </div>
          <el-switch :model-value="settingsStore.darkMode" @change="settingsStore.toggleDarkMode()" />
        </div>
      </div>
    </div>

    <!-- 数据存储设置 -->
    <div class="settings-section">
      <h3>数据存储</h3>
      <div class="setting-card">
        <div class="setting-item">
          <div class="setting-info">
            <div class="setting-label">数据存储路径</div>
            <div class="setting-path" @click="openFolder(dataPath)">{{ dataPath }}</div>
          </div>
          <div class="setting-actions">
            <button class="setting-btn" @click="changeDataPath">
              <el-icon><FolderOpened /></el-icon> 更改
            </button>
            <button class="setting-btn" @click="resetDataPath">
              <el-icon><RefreshRight /></el-icon> 默认
            </button>
          </div>
        </div>
        <div class="setting-hint">默认路径：{{ defaultDataPath }}</div>
      </div>
    </div>

    <!-- 日志设置 -->
    <div class="settings-section">
      <h3>日志记录</h3>
      <div class="setting-card">
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
            <div class="setting-path" @click="openFolder(logPath)">{{ logPath }}</div>
          </div>
          <div class="setting-actions">
            <button class="setting-btn" @click="changeLogPath" :disabled="!logEnabled">
              <el-icon><FolderOpened /></el-icon> 更改
            </button>
            <button class="setting-btn" @click="resetLogPath" :disabled="!logEnabled">
              <el-icon><RefreshRight /></el-icon> 默认
            </button>
          </div>
        </div>
        <div class="setting-hint">默认路径：{{ defaultLogPath }}</div>
        <div class="setting-item">
          <div class="setting-info">
            <div class="setting-label">打开日志目录</div>
            <div class="setting-desc">在文件资源管理器中查看日志文件</div>
          </div>
          <button class="setting-btn" @click="openFolder(logPath)" :disabled="!logEnabled">
            <el-icon><Folder /></el-icon> 打开
          </button>
        </div>
      </div>
    </div>

    <!-- 关于 -->
    <div class="settings-section">
      <h3>关于</h3>
      <div class="setting-card">
        <div class="setting-item">
          <div class="setting-info">
            <div class="setting-label">数字静修所</div>
            <div class="setting-desc">版本 {{ appVersion }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.settings-panel {
  flex: 1;
  overflow-y: auto;
  padding: 28px 32px 40px;
}

.settings-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 28px;
}

.settings-title {
  font-family: 'Manrope', sans-serif;
  font-size: 26px;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.5px;
}

.settings-sub {
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  color: var(--text-muted);
  margin-top: 4px;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 16px;
  border: 1px solid var(--border-color);
  background: var(--surface-container-lowest);
  border-radius: 8px;
  font-family: 'Manrope', sans-serif;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s;
}

.back-btn:hover {
  border-color: var(--border-color-hover);
  background: var(--bg-secondary);
}

.settings-section {
  margin-bottom: 24px;
}

.settings-section h3 {
  font-family: 'Manrope', sans-serif;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-muted);
  margin-bottom: 12px;
  letter-spacing: 0.3px;
}

.setting-card {
  background: var(--surface-container-lowest);
  border-radius: 12px;
  padding: 4px 0;
  box-shadow: 0 2px 12px rgba(43, 47, 49, 0.04);
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 20px;
  transition: background 0.2s;
}

.setting-item:hover {
  background: var(--bg-secondary);
}

.setting-info {
  flex: 1;
  min-width: 0;
}

.setting-label {
  font-family: 'Manrope', sans-serif;
  font-size: 14px;
  color: var(--text-primary);
  font-weight: 600;
}

.setting-desc {
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 2px;
}

.setting-path {
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 2px;
  cursor: pointer;
  word-break: break-all;
  transition: color 0.2s;
}

.setting-path:hover {
  color: var(--accent);
}

.setting-actions {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
}

.setting-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 14px;
  border: 1px solid var(--border-color);
  background: var(--bg-primary);
  border-radius: 8px;
  font-family: 'Manrope', sans-serif;
  font-size: 12px;
  font-weight: 500;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s;
}

.setting-btn:hover {
  border-color: var(--border-color-hover);
  background: var(--bg-secondary);
}

.setting-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.setting-hint {
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 11px;
  color: var(--text-muted);
  padding: 0 20px 8px;
}
</style>
