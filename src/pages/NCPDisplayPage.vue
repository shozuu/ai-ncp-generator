<script setup>
import NCPDisplay from '@/components/ncp/NCPDisplay.vue'
import LoadingIndicator from '@/components/ui/loading/LoadingIndicator.vue'
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

// Handle NCP rename event from child component
const handleNCPRenamed = updatedNCP => {
  ncp.value = updatedNCP

  // Update the page title if you're using it
  if (typeof document !== 'undefined') {
    document.title = `${updatedNCP.title} - AI NCP Generator`
  }
}

// Handle NCP update event from child component
const handleNCPUpdated = updatedNCP => {
  ncp.value = updatedNCP

  toast({
    title: 'Success',
    description: 'NCP updated successfully',
  })
}
</script>

<template>
  <SidebarLayout>
    <div class="mx-auto">
      <div v-if="isLoading" class="flex items-center justify-center py-16">
        <LoadingIndicator
          :messages="[
            'Loading nursing care plan...',
            'Retrieving NCP details...',
            'Preparing display format...',
          ]"
        />
      </div>
      <div v-else-if="!ncp" class="text-center text-destructive py-16">
        NCP not found.
      </div>
      <div v-else>
        <NCPDisplay
          :ncp="ncp"
          :format="format"
          @ncp-renamed="handleNCPRenamed"
          @ncp-updated="handleNCPUpdated"
        />
      </div>
    </div>
  </SidebarLayout>
</template>
