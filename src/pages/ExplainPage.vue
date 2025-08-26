<script setup>
import PageHead from '@/components/PageHead.vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import LoadingIndicator from '@/components/ui/loading/LoadingIndicator.vue'
import { useToast } from '@/components/ui/toast/use-toast'
import SidebarLayout from '@/layouts/SidebarLayout.vue'
import { explanationService } from '@/services/explanationService'
import { ncpService } from '@/services/ncpService'
import {
  BookOpen,
  Clock,
  FileText,
  GraduationCap,
  PencilLine,
} from 'lucide-vue-next'
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const { toast } = useToast()

const ncps = ref([])
const isLoading = ref(false)
const explanationStatuses = ref(new Map())

onMounted(async () => {
  await fetchNCPs()
})

const fetchNCPs = async () => {
  isLoading.value = true
  try {
    ncps.value = await ncpService.getUserNCPs()
    await checkExplanationStatuses()
  } catch {
    toast({
      title: 'Error',
      description: 'Failed to load your NCPs. Please try again.',
      variant: 'destructive',
    })
  } finally {
    isLoading.value = false
  }
}

const checkExplanationStatuses = async () => {
  const statusMap = new Map()

  for (const ncp of ncps.value) {
    try {
      const hasExplanation = await explanationService.hasExplanation(ncp.id)
      statusMap.set(ncp.id, hasExplanation)
    } catch (error) {
      console.warn(
        `Failed to check explanation status for NCP ${ncp.id}:`,
        error
      )
      statusMap.set(ncp.id, false)
    }
  }

  explanationStatuses.value = statusMap
}

const hasExplanation = ncpId => {
  return explanationStatuses.value.get(ncpId) || false
}

const viewNCPExplanation = ncpId => {
  router.push(`/explain/${ncpId}`)
}

const formatDate = dateString => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}
</script>

<template>
  <PageHead title="- NCP Explanations" />
  <SidebarLayout>
    <div class="space-y-8">
      <!-- Header -->
      <div class="flex justify-between items-center">
        <div>
          <h1 class="text-3xl font-bold font-poppins">
            NCP Component Explanations
          </h1>
          <p class="text-muted-foreground">
            Select a nursing care plan to view detailed explanations of each
            component and learn how it adheres to NNN standards.
          </p>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="flex items-center justify-center py-16">
        <LoadingIndicator
          :messages="[
            'Loading your nursing care plans...',
            'Retrieving NCP data...',
            'Checking explanation status...',
            'Preparing explanation portal...',
          ]"
        />
      </div>

      <!-- Empty State -->
      <div v-else-if="ncps.length === 0" class="text-center py-16 space-y-4">
        <BookOpen class="mx-auto h-16 w-16 text-muted-foreground" />
        <div>
          <h3 class="text-lg font-semibold">No NCPs found</h3>
          <p class="text-muted-foreground">
            Generate your first NCP to view explanations and learn about each
            component.
          </p>
        </div>
        <Button @click="router.push('/generate')" class="mt-4">
          Generate Your First NCP
        </Button>
      </div>

      <!-- NCPs Grid -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card
          v-for="ncp in ncps"
          :key="ncp.id"
          class="group hover:shadow-lg hover:border-primary transition-all cursor-pointer flex flex-col justify-between"
          @click="viewNCPExplanation(ncp.id)"
        >
          <CardHeader class="pb-3">
            <div class="space-y-3">
              <CardTitle
                class="text-lg font-semibold line-clamp-2 group-hover:text-primary transition-colors"
              >
                {{ ncp.title }}
              </CardTitle>

              <!-- Badges below title -->
              <div class="flex flex-wrap gap-2">
                <Badge v-if="ncp.is_modified" variant="warning" size="sm">
                  <PencilLine class="w-3 h-3 mr-1" />
                  Modified
                </Badge>
                <Badge
                  v-if="hasExplanation(ncp.id)"
                  variant="success"
                  size="sm"
                >
                  <GraduationCap class="w-3 h-3 mr-1" />
                  Explained
                </Badge>
              </div>
            </div>
          </CardHeader>

          <CardContent class="space-y-4">
            <!-- NCP Info -->
            <div class="space-y-2 text-sm text-muted-foreground">
              <div class="flex items-center gap-2">
                <FileText class="h-4 w-4" />
                <span>{{ ncp.format_type || '7' }}-column format</span>
              </div>
              <div class="flex items-center gap-2">
                <Clock class="h-4 w-4" />
                <span>Created {{ formatDate(ncp.created_at) }}</span>
              </div>
            </div>

            <!-- Preview of diagnosis -->
            <div v-if="ncp.diagnosis" class="text-sm">
              <p class="font-medium text-foreground mb-1">Primary Diagnosis:</p>
              <p class="text-muted-foreground line-clamp-2">
                {{ ncp.diagnosis.replace(/\n/g, ' ').trim() }}
              </p>
            </div>

            <!-- Action Button -->
            <Button
              variant="outline"
              size="sm"
              class="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors self-end"
            >
              <BookOpen class="h-4 w-4 mr-2" />
              {{
                hasExplanation(ncp.id)
                  ? 'View Explanations'
                  : 'Generate Explanations'
              }}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  </SidebarLayout>
</template>
