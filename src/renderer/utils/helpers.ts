import { v4 as uuidv4 } from 'uuid'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'

dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

export function generateId(): string {
  return uuidv4()
}

export function formatDate(date: string | null): string {
  if (!date) return ''
  return dayjs(date).format('YYYY-MM-DD')
}

export function formatDateTime(date: string | null): string {
  if (!date) return ''
  return dayjs(date).format('YYYY-MM-DD HH:mm')
}

export function getRelativeTime(date: string): string {
  return dayjs(date).fromNow()
}

export function isOverdue(dueDate: string | null): boolean {
  if (!dueDate) return false
  return dayjs(dueDate).isBefore(dayjs(), 'day')
}

export function isToday(dueDate: string | null): boolean {
  if (!dueDate) return false
  return dayjs(dueDate).isSame(dayjs(), 'day')
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
