import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getApi } from '../utils/api'
import type { SortBy, SortOrder } from '../utils/helpers'

export const useSettingsStore = defineStore('settings', () => {
  const darkMode = ref(false)
  const categories = ref<string[]>(['工作', '学习', '生活'])
  const showStats = ref(false)
  const showSettings = ref(false)
  const showCalendar = ref(false)
  const sortBy = ref<SortBy>('createdAt')
  const sortOrder = ref<SortOrder>('desc')

  async function saveSettings() {
    await getApi().store.set('settings', {
      darkMode: darkMode.value,
      sortBy: sortBy.value,
      sortOrder: sortOrder.value
    })
  }

  async function load() {
    const api = getApi()
    const settings = await api.store.get('settings')
    if (settings) {
      darkMode.value = settings.darkMode ?? false
      sortBy.value = settings.sortBy ?? 'createdAt'
      sortOrder.value = settings.sortOrder ?? 'desc'
    }
    const cats = await api.store.get('categories')
    if (cats) {
      categories.value = cats
    }
    applyTheme()
  }

  async function setSort(by: SortBy, order: SortOrder) {
    sortBy.value = by
    sortOrder.value = order
    await saveSettings()
  }

  function applyTheme() {
    if (darkMode.value) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  async function toggleDarkMode() {
    darkMode.value = !darkMode.value
    applyTheme()
    await saveSettings()
  }

  async function addCategory(name: string) {
    if (!categories.value.includes(name)) {
      categories.value.push(name)
      await getApi().store.set('categories', [...categories.value])
    }
  }

  async function removeCategory(name: string) {
    categories.value = categories.value.filter(c => c !== name)
    await getApi().store.set('categories', [...categories.value])
  }

  return { darkMode, categories, showStats, showSettings, showCalendar, sortBy, sortOrder, load, toggleDarkMode, setSort, addCategory, removeCategory }
})
