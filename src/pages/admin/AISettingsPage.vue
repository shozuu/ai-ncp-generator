<template>
  <AdminLayout>
    <div class="space-y-6">
      <div>
        <h1 class="text-3xl font-bold tracking-tight">AI Settings</h1>
        <p class="text-muted-foreground mt-2">
          Configure AI provider settings for NCP generation
        </p>
      </div>

      <!-- AI Provider Settings -->
      <AIProviderSettings />

      <!-- Info Alert -->
      <div class="flex items-start gap-3 rounded-lg border bg-muted/50 p-4">
        <Info class="h-5 w-5 text-muted-foreground mt-0.5" />
        <div class="space-y-1">
          <p class="text-sm font-medium">About Provider Switching</p>
          <p class="text-sm text-muted-foreground">
            Switching providers affects all NCP generation, diagnosis matching,
            and explanation features system-wide. Changes take effect
            immediately for all users and persist across server restarts.
          </p>
        </div>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup>
import AIProviderSettings from '@/components/admin/AIProviderSettings.vue'
import AdminLayout from '@/layouts/AdminLayout.vue'
import { Info } from 'lucide-vue-next'
</script>
