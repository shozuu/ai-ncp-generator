<script setup>
import NCPDisplay from '@/components/ncp/NCPDisplay.vue'
import LoadingIndicator from '@/components/ui/loading/LoadingIndicator.vue'
import { ToastAction } from '@/components/ui/toast'
import { useToast } from '@/components/ui/toast/use-toast'
import SidebarLayout from '@/layouts/SidebarLayout.vue'
import {
  useStructuredNCPLoader,
  useStructuredNCPManagement,
} from '@/utils/structuredNCPComponentUtils'
import { h, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const { toast } = useToast()
const { ncp, isLoading, format, loadNCP, refreshNCP } = useStructuredNCPLoader()
const { handleNCPRenamed, handleNCPUpdated } = useStructuredNCPManagement(ncp)

const onNCPRenamed = async updatedNCP => {
  handleNCPRenamed(updatedNCP)
  await refreshNCP()
}

const onNCPUpdated = async updatedNCP => {
  handleNCPUpdated(updatedNCP)
}

watch(
  () => route.params.id,
  async newId => {
    if (newId) {
      await loadNCP(newId)
      console.log('Fetched NCP from database:', ncp.value)
    }
  }
)

const showSurveyToast = () => {
  toast({
    title: 'Help Us Improve SmartCare',
    description:
      'Your experience matters! Share your feedback through our quick 2-3 minute survey to help improve the NCP generator for nursing students.',
    duration: 20000, // 20 seconds
    class:
      'border-l-4 border-l-blue-500 bg-gradient-to-r from-blue-50 to-white dark:from-blue-950/20 dark:to-background',
    action: h(
      ToastAction,
      {
        altText: 'Take Survey',
        class:
          'bg-blue-600 text-white hover:bg-blue-700 border-blue-600 font-semibold',
        onClick: () => {
          window.open(
            'https://forms.gle/XbEt3GVrJDEJPyhB8',
            '_blank',
            'noopener,noreferrer'
          )
        },
      },
      {
        default: () => 'Take Survey',
      }
    ),
  })
}

onMounted(async () => {
  const id = route.params.id
  if (id) {
    await loadNCP(id)
    console.log('Fetched NCP from database:', ncp.value)

    // Show survey toast after user views the NCP
    setTimeout(() => {
      showSurveyToast()
    }, 3000)
  }
})
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
          @ncp-renamed="onNCPRenamed"
          @ncp-updated="onNCPUpdated"
        />
      </div>
    </div>
  </SidebarLayout>
</template>
