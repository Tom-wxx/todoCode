export function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

function localDateStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function formatDate(date: string | null): string {
  if (!date) return ''
  return date.slice(0, 10)
}

export function isOverdue(dueDate: string | null): boolean {
  if (!dueDate) return false
  return dueDate.slice(0, 10) < localDateStr()
}

export function isToday(dueDate: string | null): boolean {
  if (!dueDate) return false
  return dueDate.slice(0, 10) === localDateStr()
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
