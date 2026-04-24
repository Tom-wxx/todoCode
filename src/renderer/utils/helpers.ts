export function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

function formatLocalYMD(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// 把任意日期字符串统一转成本地日期 YYYY-MM-DD。
// - "YYYY-MM-DD"：直接原样返回（el-date-picker 的格式）
// - ISO（带 Z）：按本地时区换算到当天
export function toLocalDateStr(value: string | null | undefined): string {
  if (!value) return ''
  // 纯日期格式直接返回，避免被 new Date() 当成 UTC 解析
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return formatLocalYMD(d)
}

export function todayLocalStr(): string {
  return formatLocalYMD(new Date())
}

export function formatDate(date: string | null): string {
  return toLocalDateStr(date)
}

export function isOverdue(dueDate: string | null): boolean {
  if (!dueDate) return false
  return toLocalDateStr(dueDate) < todayLocalStr()
}

export function isToday(dueDate: string | null): boolean {
  if (!dueDate) return false
  return toLocalDateStr(dueDate) === todayLocalStr()
}

export interface Todo {
  id: string
  title: string
  description: string
  completed: boolean
  priority: 'low' | 'medium' | 'high'
  category: string
  tags: string[]
  dueDate: string | null
  reminder: string | null
  reminded?: boolean
  createdAt: string
  updatedAt: string
}

export type FilterType = 'all' | 'today' | 'overdue' | 'completed' | string
export type PriorityFilter = 'all' | 'high' | 'medium' | 'low'
export type SortBy = 'createdAt' | 'dueDate' | 'priority' | 'title'
export type SortOrder = 'asc' | 'desc'
