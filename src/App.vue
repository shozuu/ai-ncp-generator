<script setup>
import { Toaster, ToastProvider } from '@/components/ui/toast'
</script>

<template>
  <div class="min-h-screen bg-background text-foreground">
    <ToastProvider>
      <router-view />
      <Toaster />
    </ToastProvider>
  </div>
</template>
