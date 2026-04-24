# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # 启动开发服务（electron-vite HMR）
npm run build    # 编译主进程/预加载/渲染进程
npm run dist     # build + electron-builder 打包 NSIS 安装包
npm run pack     # 仅生成未打包的可执行目录（调试打包用）
```

无测试框架，无 lint 脚本。

## 架构

Electron + Vue 3 桌面应用，三层分离：

**主进程** (`src/main/index.ts`)
- 管理两个 `electron-store` 实例：`config`（存储路径、日志路径等元配置）和 `todo-data`（实际待办数据）
- 所有 IPC handler 集中在 `setupIPC()`，允许的 store key 白名单：`todos`、`categories`、`settings`
- 关闭窗口 → 隐藏到托盘；退出前向 renderer 发送 `app:before-quit`，等待 `app:flush-done` 后再真正退出（防止防抖窗口内丢数据）
- `config:openPath` 有路径白名单校验，只允许打开数据目录/日志目录

**预加载** (`src/preload/index.ts` / `index.d.ts`)
- 通过 `contextBridge` 将 `window.api` 暴露给渲染进程
- `IApi` 类型定义在 `index.d.ts`，渲染侧通过 `src/renderer/utils/api.ts` 的 `getApi()` 访问

**渲染进程** (`src/renderer/`)
- `utils/api.ts` — `getApi()` 返回 `window.api` 或浏览器模式 fallback（内存存储）
- `stores/todo.ts` — 核心 Pinia store：单次遍历聚合统计、300ms 防抖写盘（`scheduleSave`）、立即写盘（`saveTodos`/`flushSave`）、renderer 侧扫描提醒（每 60s）、跨零点刷新（`dayTick`）
- `stores/settings.ts` — 主题、排序维度/方向等偏好
- 路径别名 `@` → `src/renderer`

## 关键约定

- 提醒扫描在 renderer 侧执行（`startReminderCheck`），主进程不读写 todos，避免 `reminded` 状态互相覆盖
- 批量操作（`batchDelete`、`batchToggleComplete`、`clearCompleted`、`importTodos`）调用 `saveTodos()`（立即写盘）；单项变更调用 `scheduleSave()`（防抖）
- 导入数据经 `sanitizeTodo()` 校验，缺 title 的条目丢弃，其余字段补默认值
- 自定义数据路径写入失败时自动回退默认路径（`configStore.set('dataPath', '')`）
