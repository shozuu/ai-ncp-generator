import { ref, onMounted } from 'vue'

export function useDarkMode() {
  const isDark = ref(false)

  const toggleDark = () => {
    isDark.value = !isDark.value
    updateTheme()
  }

  const updateTheme = () => {
    document.documentElement.classList.toggle('dark', isDark.value)
    localStorage.setItem('dark-mode', isDark.value)
  }

  onMounted(() => {
    isDark.value = localStorage.getItem('dark-mode') === 'true'
    updateTheme()
  })

  return {
    isDark,
    toggleDark,
  }
}
