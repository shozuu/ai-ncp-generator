<script setup>
import NCPDisplay from '@/components/ncp/NCPDisplay.vue'
import LoadingIndicator from '@/components/ui/loading/LoadingIndicator.vue'
import SidebarLayout from '@/layouts/SidebarLayout.vue'
import { useNCPLoader, useNCPManagement } from '@/utils/ncpComponentUtils'
import { onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const { ncp, isLoading, format, loadNCP, refreshNCP } = useNCPLoader()
const { handleNCPRenamed, handleNCPUpdated } = useNCPManagement(ncp)

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
    }
  }
)

onMounted(async () => {
  const id = route.params.id
  if (id) {
    await loadNCP(id)
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
