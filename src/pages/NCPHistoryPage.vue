<script setup>
import SidebarLayout from '@/layouts/SidebarLayout.vue'
import { ncpService } from '@/services/ncpService'
import { LayoutGrid, List } from 'lucide-vue-next'
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from '@/components/ui/toast/use-toast'

const ncps = ref([])
const router = useRouter()
const viewMode = ref('list')
const isLoading = ref(true)
const { toast } = useToast() 

onMounted(async () => {
  try {
    ncps.value = await ncpService.getUserNCPs()
  } catch {
    toast({
      title: 'Error',
      description: 'Failed to load your NCPs. Please try again.',
      variant: 'destructive',
    })
  } finally {
    isLoading.value = false
  }
})

const viewNCP = id => {
  router.push(`/ncps/${id}`)
}
</script>

<template>
  <PageHead title="- My NCPs" />
  <SidebarLayout>
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="font-poppins text-3xl font-bold mb-2">
          My Nursing Care Plans
        </h1>
        <p class="text-muted-foreground mb-0">
          Monitor your created nursing care plans
        </p>
      </div>
      <div class="flex space-x-2">
        <button
          :class="[
            'p-2 rounded transition',
            viewMode === 'list'
              ? 'bg-primary/10 text-primary'
              : 'hover:bg-muted',
          ]"
          @click="viewMode = 'list'"
          aria-label="List View"
        >
          <List class="w-5 h-5" />
        </button>
        <button
          :class="[
            'p-2 rounded transition',
            viewMode === 'grid'
              ? 'bg-primary/10 text-primary'
              : 'hover:bg-muted',
          ]"
          @click="viewMode = 'grid'"
          aria-label="Grid View"
        >
          <LayoutGrid class="w-5 h-5" />
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="flex items-center justify-center py-16">
      <span class="animate-pulse text-muted-foreground text-lg">
        Loading your nursing care plans...
      </span>
    </div>

    <!-- Empty State -->
    <div
      v-else-if="ncps.length === 0"
      class="text-muted-foreground mt-10 text-center"
    >
      No NCPs found.
    </div>

    <!-- List/Grid Views -->
    <div v-else>
      <!-- List View -->
      <div v-if="viewMode === 'list'" class="flex flex-col gap-4">
        <div
          v-for="ncp in ncps"
          :key="ncp.id"
          class="p-4 rounded-lg border bg-card cursor-pointer hover:shadow-lg hover:border-primary transition"
          @click="viewNCP(ncp.id)"
        >
          <div class="flex flex-col">
            <span class="font-semibold text-lg hover:text-primary transition">
              {{ ncp.title }}
            </span>
            <span class="text-xs text-muted-foreground mt-1">
              {{ ncp.created_at }}
            </span>
            <span class="text-sm text-muted-foreground mt-2">
              Format: {{ ncp.format_type }} Columns
            </span>
          </div>
        </div>
      </div>

      <!-- Grid View -->
      <div
        v-else
        class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      >
        <div
          v-for="ncp in ncps"
          :key="ncp.id"
          class="p-5 rounded-xl border bg-card cursor-pointer hover:shadow-xl hover:border-primary transition flex flex-col justify-between"
          @click="viewNCP(ncp.id)"
        >
          <span
            class="font-semibold text-lg mb-2 hover:text-primary transition"
          >
            {{ ncp.title }}
          </span>
          <span class="text-xs text-muted-foreground mb-2">
            {{ ncp.created_at }}
          </span>
          <span class="text-sm text-muted-foreground">
            Format: {{ ncp.format_type }} Columns
          </span>
        </div>
      </div>
    </div>
  </SidebarLayout>
</template>
