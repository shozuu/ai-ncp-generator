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
  <div class="flex flex-col min-h-screen">
    <!-- Header -->
    <header
      class="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
    >
      <div class="container">
        <div class="h-14 flex items-center py-2">
          <!-- Logo -->
          <div class="flex mr-4">
            <RouterLink to="/" class="flex items-center mr-6 space-x-2">
              <Stethoscope class="w-6 h-6" />
              <span class="font-poppins font-bold">SmartCare</span>
            </RouterLink>
          </div>

          <!-- Desktop Navigation -->
          <div
            class="md:flex md:flex-1 md:items-center md:justify-between hidden"
          >
            <nav class="flex items-center space-x-6 text-sm font-medium">
              <RouterLink
                v-for="item in navItems"
                :key="item.path"
                :to="item.path"
                class="hover:text-foreground/80 flex items-center space-x-2 transition-colors"
              >
                <component :is="item.icon" class="w-4 h-4" />
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
          <div class="md:hidden flex items-center justify-end flex-1">
            <Button
              variant="ghost"
              size="icon"
              @click="isMenuOpen = !isMenuOpen"
            >
              <span class="sr-only">Toggle menu</span>
              <Menu v-if="!isMenuOpen" class="w-5 h-5" />
              <X v-else class="w-5 h-5" />
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
              class="hover:text-foreground/80 flex items-center py-2 space-x-4 text-sm transition-colors"
            >
              <component :is="item.icon" class="w-5 h-5" />
              <div>
                <div class="text-base font-medium">{{ item.title }}</div>
                <div class="text-muted-foreground text-sm">
                  {{ item.description }}
                </div>
              </div>
            </RouterLink>
          </nav>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="container flex-1 py-8">
      <slot />
    </main>

    <!-- Footer -->
    <footer class="border-t">
      <div class="container py-4">
        <p class="text-muted-foreground text-sm text-center">
          © 2024 AI NCP Generator. All rights reserved.
        </p>
      </div>
    </footer>
  </div>
</template>
