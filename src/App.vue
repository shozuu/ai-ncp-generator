<script setup>
import { Toaster, ToastProvider } from '@/components/ui/toast'
import BackgroundOperationsNotifier from '@/components/ui/BackgroundOperationsNotifier.vue'
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
