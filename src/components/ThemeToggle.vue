<script setup>
import { Button } from '@/components/ui/button'
import { useDarkMode } from '@/composables/useDarkMode'
import { Moon, Sun } from 'lucide-vue-next'

const { isDark, toggleDark } = useDarkMode()
</script>

<template>
  <Button variant="ghost" size="icon" @click="toggleDark">
    <Sun v-if="isDark" class="h-5 w-5" />
    <Moon v-else class="h-5 w-5" />
    <span class="sr-only">Toggle theme</span>
  </Button>
</template>
