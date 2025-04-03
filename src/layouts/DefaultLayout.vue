<script setup>
import ThemeToggle from '@/components/ThemeToggle.vue'
import { Button } from '@/components/ui/button'
import {
  Brain,
  CheckCircle,
  HelpCircle,
  Menu,
  Stethoscope,
  X,
} from 'lucide-vue-next'
import { ref } from 'vue'
import { RouterLink } from 'vue-router'

const isMenuOpen = ref(false)

const navItems = [
  {
    title: 'Generate NCP',
    description: 'Create AI-generated nursing care plans',
    path: '/generate',
    icon: Brain,
  },
  {
    title: 'Validate NCP',
    description: 'Validate your nursing care plans',
    path: '/validate',
    icon: CheckCircle,
  },
  {
    title: 'Explanations',
    description: 'Learn about NCP components',
    path: '/explain',
    icon: HelpCircle,
  },
]
</script>

<template>
  <div class="min-h-screen">
    <header
      class="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
    >
      <!-- Header container -->
      <div class="container">
        <div class="flex h-14 items-center py-2">
          <!-- Logo -->
          <div class="mr-4 flex">
            <RouterLink to="/" class="mr-6 flex items-center space-x-2">
              <Stethoscope class="h-6 w-6" />
              <span class="font-bold font-poppins">SmartCare</span>
            </RouterLink>
          </div>

          <!-- Desktop Navigation -->
          <div
            class="hidden md:flex md:flex-1 md:items-center md:justify-between"
          >
            <nav class="flex items-center space-x-6 text-sm font-medium">
              <RouterLink
                v-for="item in navItems"
                :key="item.path"
                :to="item.path"
                class="flex items-center space-x-2 transition-colors hover:text-foreground/80"
              >
                <component :is="item.icon" class="h-4 w-4" />
                <span>{{ item.title }}</span>
              </RouterLink>
            </nav>

            <!-- Right side buttons -->
            <div class="flex items-center space-x-4">
              <ThemeToggle />
              <Button variant="outline" size="sm">Sign in</Button>
            </div>
          </div>

          <!-- Mobile menu button -->
          <div class="flex flex-1 items-center justify-end md:hidden">
            <Button
              variant="ghost"
              size="icon"
              class="mr-2"
              @click="isMenuOpen = !isMenuOpen"
            >
              <span class="sr-only">Toggle menu</span>
              <Menu v-if="!isMenuOpen" class="h-5 w-5" />
              <X v-else class="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      <!-- Mobile menu container -->
      <div v-show="isMenuOpen" class="md:hidden border-t">
        <div class="container py-4">
          <nav class="flex flex-col space-y-4">
            <RouterLink
              v-for="item in navItems"
              :key="item.path"
              :to="item.path"
              class="flex items-center space-x-4 py-2 text-sm transition-colors hover:text-foreground/80"
            >
              <component :is="item.icon" class="h-5 w-5" />
              <div>
                <div class="text-base font-medium">{{ item.title }}</div>
                <div class="text-sm text-muted-foreground">
                  {{ item.description }}
                </div>
              </div>
            </RouterLink>
          </nav>
        </div>
      </div>
    </header>

    <!-- Main container -->
    <main class="container py-8">
      <slot />
    </main>

    <footer class="border-t">
      <!-- Footer container -->
      <div class="container py-4">
        <p class="text-center text-sm text-muted-foreground">
          © 2024 AI NCP Generator. All rights reserved.
        </p>
      </div>
    </footer>
  </div>
</template>
