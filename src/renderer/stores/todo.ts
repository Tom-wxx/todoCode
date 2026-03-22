import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { generateId, isOverdue, isToday, type Todo, type FilterType, type PriorityFilter } from '../utils/helpers'
import { getApi } from '../utils/api'

export const useTodoStore = defineStore('todo', () => {
  const todos = ref<Todo[]>([])
  const currentFilter = ref<FilterType>('all')
  const searchQuery = ref('')
  const priorityFilter = ref<PriorityFilter>('all')
  const loaded = ref(false)
  const selectedIds = ref<Set<string>>(new Set())

  // 从 electron-store 加载
  async function loadTodos() {
    const data = await getApi().store.get('todos')
    todos.value = data || []
    loaded.value = true
  }

  // 保存到 electron-store
  async function saveTodos() {
    await getApi().store.set('todos', todos.value)
  }

  // 筛选后的待办列表
  const filteredTodos = computed(() => {
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

    // 排序: 未完成优先，高优先级优先，有到期日优先
    const priorityOrder = { high: 0, medium: 1, low: 2 }
    result.sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1
      if (a.priority !== b.priority) return priorityOrder[a.priority] - priorityOrder[b.priority]
      if (a.dueDate && b.dueDate) return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      if (a.dueDate) return -1
      if (b.dueDate) return 1
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

    return result
  })

  // 统计数据
  const stats = computed(() => {
    const total = todos.value.length
    const completed = todos.value.filter(t => t.completed).length
    const todayCount = todos.value.filter(t => isToday(t.dueDate) && !t.completed).length
    const overdueCount = todos.value.filter(t => isOverdue(t.dueDate) && !t.completed).length
    const active = total - completed

    // 按分类统计
    const byCategory: Record<string, number> = {}
    todos.value.forEach(t => {
      if (t.category) {
        byCategory[t.category] = (byCategory[t.category] || 0) + 1
      }
    })

    // 按优先级统计
    const byPriority = { high: 0, medium: 0, low: 0 }
    todos.value.filter(t => !t.completed).forEach(t => {
      byPriority[t.priority]++
    })

    // 近7天完成趋势
    const weekTrend: { date: string; count: number }[] = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      const count = todos.value.filter(t =>
        t.completed && t.updatedAt.startsWith(dateStr)
      ).length
      weekTrend.push({ date: dateStr, count })
    }

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
      todos.value[index] = { ...todos.value[index], ...updates, updatedAt: new Date().toISOString() }
      await saveTodos()
    }
  }

  async function deleteTodo(id: string) {
    todos.value = todos.value.filter(t => t.id !== id)
    await saveTodos()
  }

  async function toggleTodo(id: string) {
    const todo = todos.value.find(t => t.id === id)
    if (todo) {
      todo.completed = !todo.completed
      todo.updatedAt = new Date().toISOString()
      await saveTodos()
    }
  }

  // 批量操作
  function toggleSelect(id: string) {
    if (selectedIds.value.has(id)) selectedIds.value.delete(id)
    else selectedIds.value.add(id)
  }

  function selectAll() {
    filteredTodos.value.forEach(t => selectedIds.value.add(t.id))
  }

  function clearSelection() {
    selectedIds.value.clear()
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
    await saveTodos()
  }

  // 导入导出
  async function exportTodos() {
    const data = JSON.stringify({ todos: todos.value, exportedAt: new Date().toISOString() }, null, 2)
    return getApi().dialog.exportData(data)
  }

  async function importTodos() {
    const content = await getApi().dialog.importData()
    if (content) {
      try {
        const data = JSON.parse(content)
        if (data.todos && Array.isArray(data.todos)) {
          todos.value = data.todos
          await saveTodos()
          return true
        }
      } catch {
        return false
      }
    }
    return false
  }

  function setFilter(filter: FilterType) {
    currentFilter.value = filter
  }

  return {
    todos, currentFilter, searchQuery, priorityFilter, loaded, selectedIds,
    filteredTodos, stats,
    loadTodos, addTodo, updateTodo, deleteTodo, toggleTodo,
    toggleSelect, selectAll, clearSelection, batchDelete, batchToggleComplete, clearCompleted,
    exportTodos, importTodos, setFilter
  }
})
