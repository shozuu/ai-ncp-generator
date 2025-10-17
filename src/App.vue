<script setup>
import BackgroundOperationsNotifier from '@/components/ui/BackgroundOperationsNotifier.vue'
import { Toaster, ToastProvider } from '@/components/ui/toast'
</script>

<template>
  <div class="min-h-screen bg-background text-foreground">
    <ToastProvider>
      <router-view />
      <Toaster />
      <BackgroundOperationsNotifier />
    </ToastProvider>
  </div>
</template>
