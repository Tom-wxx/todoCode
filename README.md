# 待办事项 - 桌面待办管理工具

一款基于 Electron + Vue 3 的桌面待办事项管理应用，支持分类管理、优先级设置、数据统计等功能。

## 功能特性

- **待办管理** - 增删改查、标记完成、批量操作
- **分类与标签** - 自定义分类、多标签支持
- **优先级** - 高/中/低三级优先级，颜色区分
- **到期日期** - 设置截止时间，过期提醒
- **搜索筛选** - 关键词搜索、按状态/优先级/分类筛选
- **智能列表** - 全部、今天、已过期、已完成
- **统计面板** - 完成率、优先级分布、分类统计、7天趋势
- **暗色模式** - 亮色/暗色主题切换
- **数据导入导出** - JSON 格式，数据不丢失
- **自定义设置** - 可配置数据存储路径、日志记录路径
- **快捷键** - `Ctrl+N` 新建、`Ctrl+F` 搜索、`Ctrl+D` 切换主题

## 下载安装

前往 [Releases](https://github.com/Tom-wxx/todoCode/releases) 页面下载最新版安装包，运行即可安装。

## 技术栈

- **前端**: Vue 3 (Composition API + `<script setup>`) + Element Plus
- **桌面框架**: Electron 28
- **构建工具**: electron-vite + Vite 5
- **状态管理**: Pinia
- **数据存储**: electron-store (本地 JSON)
- **打包**: electron-builder (NSIS 安装包)

## 开发

```bash
# 安装依赖
npm install

# 启动开发服务
npm run dev

# 编译
npm run build

# 打包安装程序
npm run dist
```

## 项目结构

```
src/
├── main/              # Electron 主进程
│   └── index.ts
├── preload/           # 预加载脚本
│   ├── index.ts
│   └── index.d.ts
└── renderer/          # Vue 渲染进程
    ├── App.vue
    ├── main.ts
    ├── components/    # 组件
    │   ├── TitleBar.vue
    │   ├── Sidebar.vue
    │   ├── SearchBar.vue
    │   ├── TodoList.vue
    │   ├── TodoItem.vue
    │   ├── TodoForm.vue
    │   ├── StatsPanel.vue
    │   └── SettingsPanel.vue
    ├── stores/        # Pinia 状态管理
    │   ├── todo.ts
    │   └── settings.ts
    └── utils/         # 工具函数
        ├── api.ts
        └── helpers.ts
```

## 截图

> 欢迎提交截图 PR

## License

MIT
