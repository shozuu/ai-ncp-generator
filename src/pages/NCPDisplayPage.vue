<script setup>
import NCPDisplay from '@/components/ncp/NCPDisplay.vue'
import { useToast } from '@/components/ui/toast/use-toast'
import SidebarLayout from '@/layouts/SidebarLayout.vue'
import { ncpService } from '@/services/ncpService'
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const ncp = ref(null)
const isLoading = ref(true)
const format = ref('7')
const { toast } = useToast()

onMounted(async () => {
  try {
    const id = route.params.id
    const result = await ncpService.getNCPById(id)
    ncp.value = result
    format.value = result.format_type || '7'
  } catch {
    toast({
      title: 'Error',
      description: 'Failed to load NCP. Please try again.',
      variant: 'destructive',
    })
  } finally {
    isLoading.value = false
  }
})
</script>

<template>
  <SidebarLayout>
    <div class="mx-auto">
      <div v-if="isLoading" class="flex items-center justify-center py-16">
        <span class="animate-pulse text-muted-foreground text-lg">
          Loading nursing care plan...
        </span>
      </div>
      <div v-else-if="!ncp" class="text-center text-destructive py-16">
        NCP not found.
      </div>
      <div v-else>
        <NCPDisplay :ncp="ncp" :format="format" />
      </div>
    </div>
  </SidebarLayout>
</template>
