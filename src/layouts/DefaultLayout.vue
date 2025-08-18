<script setup>
import ThemeToggle from '@/components/ThemeToggle.vue'
import { Stethoscope, Github  } from 'lucide-vue-next'
import { RouterLink } from 'vue-router'
</script>

<template>
  <div class="flex flex-col min-h-screen">
    <!-- Simplified Header for Auth Pages -->
    <header
      class="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
    >
      <div class="container">
        <div class="h-14 flex items-center justify-between py-2">
          <!-- Logo -->
          <RouterLink to="/" class="flex items-center space-x-2">
            <Stethoscope class="w-6 h-6" />
            <span class="font-poppins font-bold">SmartCare</span>
          </RouterLink>

          <!-- Right side - Theme Toggle and Navigation -->
          <div class="flex items-center space-x-4">
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="flex-1 flex items-center justify-center py-8">
      <div class="container max-w-lg">
        <slot />
      </div>
    </main>

    <!-- Simplified Footer -->
    <footer class="border-t">
      <div class="container py-4">
        <p class="text-muted-foreground text-sm text-center">
          <a
            href="https://github.com/shozuu/ai-ncp-generator"
            target="_blank"
            rel="noopener"
            class="inline-flex items-center gap-1 underline hover:text-primary transition-colors"
          >
            <Github  class="w-4 h-4" />
            <span>shozuu/ai-ncp-generator</span>
          </a>
        </p>
      </div>
    </footer>
  </div>
</template>
