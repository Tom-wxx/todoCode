import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { generateId, isOverdue, isToday, toLocalDateStr, todayLocalStr, type Todo, type FilterType, type PriorityFilter } from '../utils/helpers'
import { getApi } from '../utils/api'
import { useSettingsStore } from './settings'

const SAVE_DEBOUNCE_MS = 300
const REMINDER_CHECK_MS = 60_000
const DAY_CHECK_MS = 30_000

const VALID_PRIORITIES = ['low', 'medium', 'high'] as const
type Priority = typeof VALID_PRIORITIES[number]

// 导入数据兜底校验：缺失/类型错误的字段补默认值，缺 title 的条目丢弃
function sanitizeTodo(raw: any): Todo | null {
  if (!raw || typeof raw !== 'object') return null
  const title = typeof raw.title === 'string' ? raw.title.trim() : ''
  if (!title) return null
  const priority: Priority = VALID_PRIORITIES.includes(raw.priority) ? raw.priority : 'medium'
  const now = new Date().toISOString()
  return {
    id: typeof raw.id === 'string' && raw.id ? raw.id : generateId(),
    title,
    description: typeof raw.description === 'string' ? raw.description : '',
    completed: Boolean(raw.completed),
    priority,
    category: typeof raw.category === 'string' ? raw.category : '',
    tags: Array.isArray(raw.tags) ? raw.tags.filter((x: any) => typeof x === 'string') : [],
    dueDate: typeof raw.dueDate === 'string' ? raw.dueDate : null,
    reminder: typeof raw.reminder === 'string' ? raw.reminder : null,
    reminded: Boolean(raw.reminded),
    createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : now,
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : now
  }
}

export const useTodoStore = defineStore('todo', () => {
  const todos = ref<Todo[]>([])
  const currentFilter = ref<FilterType>('all')
  const searchQuery = ref('')
  const priorityFilter = ref<PriorityFilter>('all')
  const loaded = ref(false)
  const selectedIds = ref<Set<string>>(new Set())

  // 跨零点刷新信号：每 30s 比对当天日期，仅跨天才递增，filteredTodos/stats 依赖它重算
  const dayTick = ref(0)
  let lastDay = todayLocalStr()
  let dayTimer: ReturnType<typeof setInterval> | null = null
  let reminderTimer: ReturnType<typeof setInterval> | null = null

  function clearSelection() {
    selectedIds.value.clear()
  }

  function pruneSelection(validIds?: Set<string>) {
    const allowed = validIds ?? new Set(todos.value.map(t => t.id))
    for (const id of selectedIds.value) {
      if (!allowed.has(id)) {
        selectedIds.value.delete(id)
      }
    }
  }

  function syncSelectionWithVisibleTodos() {
    pruneSelection(new Set(filteredTodos.value.map(t => t.id)))
  }

  function startDayTick() {
    if (dayTimer) return
    dayTimer = setInterval(() => {
      const cur = todayLocalStr()
      if (cur !== lastDay) {
        lastDay = cur
        dayTick.value++
      }
    }, DAY_CHECK_MS)
  }

  // renderer 侧扫描提醒：main 进程不再读写 todos，避免与 renderer 的 reminded 状态互相覆盖
  function startReminderCheck() {
    if (reminderTimer) return
    const scan = () => {
      const now = Date.now()
      let changed = false
      for (const t of todos.value) {
        if (t.reminder && !t.completed && !t.reminded) {
          const rt = new Date(t.reminder).getTime()
          if (!Number.isNaN(rt) && rt <= now) {
            void getApi().notify.show('待办提醒', t.title)
            t.reminded = true
            changed = true
          }
        }
      }
      if (changed) scheduleSave()
    }
    reminderTimer = setInterval(scan, REMINDER_CHECK_MS)
    scan()
  }

  // 从 electron-store 加载
  async function loadTodos() {
    const data = await getApi().store.get('todos')
    const rawTodos = Array.isArray(data) ? data : []
    todos.value = rawTodos
      .map(sanitizeTodo)
      .filter((todo): todo is Todo => Boolean(todo))
    clearSelection()
    loaded.value = true
    startDayTick()
    startReminderCheck()
  }

  // 底层写盘：取原始对象，避免 JSON 深拷贝开销
  async function writeToStore() {
    // IPC 发送参数时要求可结构化克隆；这里做一次深拷贝，避免把 Vue 代理对象传进主进程
    await getApi().store.set('todos', JSON.parse(JSON.stringify(todos.value)))
  }

  // 防抖调度：高频单项变更用这个，避免每次按键/勾选都写盘
  let saveTimer: ReturnType<typeof setTimeout> | null = null
  let pendingSave = false

  function scheduleSave() {
    pendingSave = true
    if (saveTimer) clearTimeout(saveTimer)
    saveTimer = setTimeout(() => {
      saveTimer = null
      pendingSave = false
      void writeToStore()
    }, SAVE_DEBOUNCE_MS)
  }

  // 立即保存并清除待定防抖：批量/导入/退出前用
  async function saveTodos() {
    if (saveTimer) {
      clearTimeout(saveTimer)
      saveTimer = null
    }
    pendingSave = false
    await writeToStore()
  }

  // 仅当存在待写数据时才落盘：窗口隐藏/退出时使用
  async function flushSave() {
    if (!saveTimer && !pendingSave) return
    await saveTodos()
  }

  const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 } as const
  const titleCollator = new Intl.Collator('zh-Hans-CN', { sensitivity: 'base' })

  // 筛选后的待办列表
  const filteredTodos = computed(() => {
    // 显式依赖 dayTick，使跨零点后 today/overdue 分类自动刷新
    void dayTick.value
    let result = [...todos.value]

    // 按筛选类型
    switch (currentFilter.value) {
      case 'today':
        result = result.filter(t => isToday(t.dueDate) && !t.completed)
        break
      case 'overdue':
        result = result.filter(t => isOverdue(t.dueDate) && !t.completed)
        break
      case 'completed':
        result = result.filter(t => t.completed)
        break
      case 'all':
        result = result.filter(t => !t.completed)
        break
      default:
        // 按分类筛选
        result = result.filter(t => t.category === currentFilter.value)
    }

    // 按优先级筛选
    if (priorityFilter.value !== 'all') {
      result = result.filter(t => t.priority === priorityFilter.value)
    }

    // 按搜索关键词
    if (searchQuery.value.trim()) {
      const q = searchQuery.value.toLowerCase()
      result = result.filter(t =>
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.tags.some(tag => tag.toLowerCase().includes(q))
      )
    }

    // 排序: 未完成优先（固定规则），再按用户选择的维度排序
    const settings = useSettingsStore()
    const dir = settings.sortOrder === 'asc' ? 1 : -1

    function compareBy(a: Todo, b: Todo): number {
      switch (settings.sortBy) {
        case 'dueDate': {
          // 无到期日的始终排到最后（不受升降序影响）
          if (!a.dueDate && !b.dueDate) return 0
          if (!a.dueDate) return 1
          if (!b.dueDate) return -1
          return (new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()) * dir
        }
        case 'priority':
          return (PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]) * dir
        case 'title':
          return titleCollator.compare(a.title, b.title) * dir
        case 'createdAt':
        default:
          return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * dir
      }
    }

    result.sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1
      return compareBy(a, b)
    })

    return result
  })

  // 统计数据：单次遍历完成所有聚合（含近 7 天趋势）
  const stats = computed(() => {
    // 显式依赖 dayTick，使跨零点后 todayCount/overdueCount/weekTrend 自动刷新
    void dayTick.value
    let completed = 0
    let todayCount = 0
    let overdueCount = 0
    const byCategory: Record<string, number> = {}
    const byPriority = { high: 0, medium: 0, low: 0 }

    // 预先算好近 7 天的日期窗口 + 累加桶（按本地日期）
    const weekCounts = new Map<string, number>()
    const weekDates: string[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const key = toLocalDateStr(d.toISOString())
      weekDates.push(key)
      weekCounts.set(key, 0)
    }

    for (const t of todos.value) {
      if (t.completed) {
        completed++
        const day = toLocalDateStr(t.updatedAt)
        const prev = weekCounts.get(day)
        if (prev !== undefined) weekCounts.set(day, prev + 1)
      } else {
        if (isToday(t.dueDate)) todayCount++
        if (isOverdue(t.dueDate)) overdueCount++
        byPriority[t.priority]++
      }
      if (t.category) {
        byCategory[t.category] = (byCategory[t.category] || 0) + 1
      }
    }

    const total = todos.value.length
    const active = total - completed
    const weekTrend = weekDates.map(date => ({ date, count: weekCounts.get(date)! }))

    return { total, completed, active, todayCount, overdueCount, byCategory, byPriority, weekTrend }
  })

  // CRUD
  async function addTodo(todo: Omit<Todo, 'id' | 'createdAt' | 'updatedAt' | 'completed'>) {
    const now = new Date().toISOString()
    const newTodo: Todo = {
      ...todo,
      id: generateId(),
      completed: false,
      createdAt: now,
      updatedAt: now
    }
    todos.value.push(newTodo)
    await saveTodos()
  }

  async function updateTodo(id: string, updates: Partial<Todo>) {
    const index = todos.value.findIndex(t => t.id === id)
    if (index !== -1) {
      const current = todos.value[index]
      const next: Todo = { ...current, ...updates, updatedAt: new Date().toISOString() }
      // 提醒时间变了就重置 reminded 标记，否则调到更晚的时间永远不会再触发通知
      if ('reminder' in updates && updates.reminder !== current.reminder) {
        next.reminded = false
      }
      todos.value[index] = next
      syncSelectionWithVisibleTodos()
      await saveTodos()
    }
  }

  async function deleteTodo(id: string) {
    todos.value = todos.value.filter(t => t.id !== id)
    selectedIds.value.delete(id)
    syncSelectionWithVisibleTodos()
    await saveTodos()
  }

  async function toggleTodo(id: string) {
    const todo = todos.value.find(t => t.id === id)
    if (todo) {
      todo.completed = !todo.completed
      todo.updatedAt = new Date().toISOString()
      syncSelectionWithVisibleTodos()
      await saveTodos()
    }
  }

  async function clearCategory(category: string) {
    let changed = false
    const now = new Date().toISOString()
    for (const todo of todos.value) {
      if (todo.category === category) {
        todo.category = ''
        todo.updatedAt = now
        changed = true
      }
    }
    if (!changed) return
    syncSelectionWithVisibleTodos()
    await saveTodos()
  }

  // 批量操作
  function toggleSelect(id: string) {
    if (selectedIds.value.has(id)) selectedIds.value.delete(id)
    else selectedIds.value.add(id)
  }

  function selectAll() {
    filteredTodos.value.forEach(t => selectedIds.value.add(t.id))
  }

  async function batchDelete() {
    todos.value = todos.value.filter(t => !selectedIds.value.has(t.id))
    selectedIds.value.clear()
    await saveTodos()
  }

  async function batchToggleComplete(completed: boolean) {
    const now = new Date().toISOString()
    todos.value.forEach(t => {
      if (selectedIds.value.has(t.id)) {
        t.completed = completed
        t.updatedAt = now
      }
    })
    selectedIds.value.clear()
    await saveTodos()
  }

  // 清空已完成
  async function clearCompleted() {
    todos.value = todos.value.filter(t => !t.completed)
    syncSelectionWithVisibleTodos()
    await saveTodos()
  }

  // 导入导出
  async function exportTodos() {
    const data = JSON.stringify({ todos: todos.value, exportedAt: new Date().toISOString() }, null, 2)
    return getApi().dialog.exportData(data)
  }

  async function importTodos() {
    const content = await getApi().dialog.importData()
    if (!content) return false
    try {
      const data = JSON.parse(content)
      if (!data.todos || !Array.isArray(data.todos)) return false
      const cleaned: Todo[] = []
      for (const raw of data.todos) {
        const t = sanitizeTodo(raw)
        if (t) cleaned.push(t)
      }
      todos.value = cleaned
      clearSelection()
      await saveTodos()
      return true
    } catch {
      return false
    }
  }

  function setFilter(filter: FilterType) {
    currentFilter.value = filter
  }

  watch([currentFilter, priorityFilter, searchQuery], clearSelection)
  watch(todos, () => pruneSelection(), { deep: false })

  return {
    todos, currentFilter, searchQuery, priorityFilter, loaded, selectedIds,
    filteredTodos, stats,
    loadTodos, addTodo, updateTodo, deleteTodo, toggleTodo,
    toggleSelect, selectAll, clearSelection, clearCategory, batchDelete, batchToggleComplete, clearCompleted,
    exportTodos, importTodos, setFilter, flushSave
  }
})
