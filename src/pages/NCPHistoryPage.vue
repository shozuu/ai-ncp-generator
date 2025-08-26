<script setup>
import PageHead from '@/components/PageHead.vue'
import RenameNCPDialog from '@/components/ncp/RenameNCPDialog.vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import LoadingIndicator from '@/components/ui/loading/LoadingIndicator.vue'
import { useToast } from '@/components/ui/toast/use-toast'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import SidebarLayout from '@/layouts/SidebarLayout.vue'
import { ncpService } from '@/services/ncpService'
import { formatDate, getTimeAgo } from '@/utils/dateUtils'
import {
  getFormatDisplayName,
  getFormatShortName,
  truncateText,
} from '@/utils/ncpUtils'
import {
  Brain,
  Calendar,
  Clock,
  FileText,
  LayoutGrid,
  List,
  Pencil,
  PencilLine,
  Stethoscope,
  Trash2,
} from 'lucide-vue-next'
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

const ncps = ref([])
const router = useRouter()
const viewMode = ref('list')
const isLoading = ref(true)
const { toast } = useToast()

const showRenameDialog = ref(false)
const showDeleteDialog = ref(false)
const ncpToRename = ref(null)
const ncpToDelete = ref(null)

onMounted(async () => {
  await fetchNCPs()
})

const fetchNCPs = async () => {
  isLoading.value = true
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
}

const viewNCP = id => {
  router.push(`/ncps/${id}`)
}

const openRenameDialog = (event, ncp) => {
  event.stopPropagation() // Prevent card click
  ncpToRename.value = ncp
  showRenameDialog.value = true
}

const handleNCPRenamed = async updatedNCP => {
  const index = ncps.value.findIndex(ncp => ncp.id === updatedNCP.id)
  if (index !== -1) {
    ncps.value[index] = updatedNCP
  }

  toast({
    title: 'Success',
    description: 'NCP title updated successfully.',
  })
}

const openDeleteDialog = (event, ncp) => {
  event.stopPropagation() // Prevent card click
  ncpToDelete.value = ncp
  showDeleteDialog.value = true
}

const closeDeleteDialog = () => {
  ncpToDelete.value = null
  showDeleteDialog.value = false
}

const confirmDelete = async () => {
  try {
    await ncpService.deleteNCP(ncpToDelete.value.id)
    toast({
      title: 'Deleted',
      description: 'NCP deleted successfully.',
    })
    await fetchNCPs()
    closeDeleteDialog()
  } catch {
    toast({
      title: 'Error',
      description: 'Failed to delete NCP.',
      variant: 'destructive',
    })
  }
}
</script>

<template>
  <PageHead title="- My NCPs" />
  <SidebarLayout>
    <!-- Page Header -->
    <div
      class="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4"
    >
      <div>
        <h1 class="font-poppins text-3xl font-bold mb-2">
          My Nursing Care Plans
        </h1>
        <p class="text-muted-foreground mb-0">
          Monitor and manage your created nursing care plans.
        </p>
      </div>
      <div class="flex space-x-2">
        <Button
          :variant="viewMode === 'list' ? 'default' : 'outline'"
          size="icon"
          @click="viewMode = 'list'"
          aria-label="List View"
        >
          <List class="w-5 h-5" />
        </Button>
        <Button
          :variant="viewMode === 'grid' ? 'default' : 'outline'"
          size="icon"
          @click="viewMode = 'grid'"
          aria-label="Grid View"
        >
          <LayoutGrid class="w-5 h-5" />
        </Button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="flex items-center justify-center py-16">
      <LoadingIndicator
        :messages="[
          'Loading your nursing care plans...',
          'Retrieving NCP data...',
          'Preparing your dashboard...',
        ]"
      />
    </div>

    <!-- Empty State -->
    <div v-else-if="ncps.length === 0" class="text-center py-16 space-y-4">
      <FileText class="mx-auto h-16 w-16 text-muted-foreground" />
      <div>
        <h3 class="text-lg font-semibold">No NCPs found</h3>
        <p class="text-muted-foreground">
          Create your first nursing care plan to get started.
        </p>
      </div>
      <Button @click="router.push('/generate')" class="mt-4">
        Generate Your First NCP
      </Button>
    </div>

    <div v-else>
      <!-- List View -->
      <div v-if="viewMode === 'list'" class="flex flex-col gap-4">
        <Card
          v-for="ncp in ncps"
          :key="ncp.id"
          class="group border bg-card rounded-xl hover:shadow-lg hover:border-primary transition-all duration-200 cursor-pointer"
          @click="viewNCP(ncp.id)"
        >
          <CardHeader class="pb-4">
            <div class="flex items-start justify-between gap-4">
              <div class="flex-1 min-w-0 space-y-3">
                <CardTitle
                  class="font-semibold text-xl group-hover:text-primary transition-colors line-clamp-2"
                >
                  {{ ncp.title }}
                </CardTitle>

                <!-- Status badges -->
                <div class="flex flex-wrap gap-2">
                  <Badge v-if="ncp.is_modified" variant="warning" size="sm">
                    <PencilLine class="w-3 h-3 mr-1" />
                    Modified
                  </Badge>
                  <Badge variant="info" size="sm">
                    <FileText class="w-3 h-3 mr-1" />
                    {{ getFormatDisplayName(ncp.format_type) }}
                  </Badge>
                </div>
              </div>

              <!-- Action buttons - Always visible -->
              <div class="flex gap-2 shrink-0">
                <Tooltip>
                  <TooltipTrigger as-child>
                    <Button
                      size="icon"
                      variant="outline"
                      @click="openRenameDialog($event, ncp)"
                      aria-label="Rename"
                      class="h-9 w-9"
                    >
                      <Pencil class="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Rename</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger as-child>
                    <Button
                      size="icon"
                      variant="outline"
                      @click="openDeleteDialog($event, ncp)"
                      aria-label="Delete"
                      class="h-9 w-9 hover:bg-destructive hover:text-destructive-foreground"
                    >
                      <Trash2 class="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Delete</TooltipContent>
                </Tooltip>
              </div>
            </div>
          </CardHeader>

          <CardContent class="pt-0">
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <!-- Primary Information -->
              <div class="space-y-4">
                <!-- Assessment Preview -->
                <div v-if="ncp.assessment" class="space-y-2">
                  <div class="flex items-center gap-2">
                    <Stethoscope class="h-4 w-4 text-muted-foreground" />
                    <span class="text-sm font-medium text-muted-foreground"
                      >Assessment</span
                    >
                  </div>
                  <p
                    class="text-sm text-foreground bg-muted/30 p-3 rounded-md line-clamp-3"
                  >
                    {{ truncateText(ncp.assessment, 150) }}
                  </p>
                </div>

                <!-- Primary Diagnosis -->
                <div v-if="ncp.diagnosis" class="space-y-2">
                  <div class="flex items-center gap-2">
                    <Brain class="h-4 w-4 text-muted-foreground" />
                    <span class="text-sm font-medium text-muted-foreground"
                      >Primary Diagnosis</span
                    >
                  </div>
                  <p
                    class="text-sm text-foreground bg-blue-50 dark:bg-blue-950/20 p-3 rounded-md line-clamp-2 border border-blue-200 dark:border-blue-800"
                  >
                    {{
                      truncateText(
                        ncp.diagnosis.replace(/\n/g, ' ').trim(),
                        120
                      )
                    }}
                  </p>
                </div>
              </div>

              <!-- Timeline -->
              <div class="space-y-4">
                <div class="space-y-3">
                  <h4 class="text-sm font-medium text-muted-foreground">
                    Timeline
                  </h4>
                  <div class="space-y-2">
                    <div class="flex items-center gap-2 text-sm">
                      <Calendar class="h-4 w-4 text-muted-foreground" />
                      <span class="text-muted-foreground">Created:</span>
                      <span class="font-medium">{{
                        formatDate(ncp.created_at)
                      }}</span>
                      <span class="text-xs text-muted-foreground"
                        >({{ getTimeAgo(ncp.created_at) }})</span
                      >
                    </div>
                    <div
                      v-if="ncp.updated_at && ncp.updated_at !== ncp.created_at"
                      class="flex items-center gap-2 text-sm"
                    >
                      <Clock class="h-4 w-4 text-muted-foreground" />
                      <span class="text-muted-foreground">Updated:</span>
                      <span class="font-medium">{{
                        formatDate(ncp.updated_at)
                      }}</span>
                      <span class="text-xs text-muted-foreground"
                        >({{ getTimeAgo(ncp.updated_at) }})</span
                      >
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- Grid View -->
      <div v-else class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Card
          v-for="ncp in ncps"
          :key="ncp.id"
          class="group border bg-card rounded-xl hover:shadow-xl hover:border-primary transition-all duration-200 flex flex-col cursor-pointer h-full"
          @click="viewNCP(ncp.id)"
        >
          <CardHeader class="pb-3 flex-shrink-0">
            <div class="space-y-3">
              <CardTitle
                class="font-semibold text-lg group-hover:text-primary transition-colors line-clamp-2 leading-tight"
              >
                {{ ncp.title }}
              </CardTitle>

              <!-- Status badges -->
              <div class="flex flex-wrap gap-1">
                <Badge v-if="ncp.is_modified" variant="warning" size="sm">
                  <PencilLine class="w-3 h-3 mr-1" />
                  Modified
                </Badge>
                <Badge variant="info" size="sm">
                  {{ getFormatShortName(ncp.format_type) }}
                </Badge>
              </div>
            </div>
          </CardHeader>

          <CardContent
            class="flex-1 flex flex-col justify-between space-y-4 pt-0"
          >
            <!-- Content area -->
            <div class="space-y-4">
              <!-- Primary Diagnosis Preview -->
              <div v-if="ncp.diagnosis" class="space-y-2">
                <div class="flex items-center gap-2">
                  <Brain class="h-3 w-3 text-muted-foreground" />
                  <span class="text-xs font-medium text-muted-foreground"
                    >Primary Diagnosis</span
                  >
                </div>
                <p
                  class="text-xs text-foreground bg-blue-50 dark:bg-blue-950/20 p-2 rounded border border-blue-200 dark:border-blue-800 line-clamp-3"
                >
                  {{
                    truncateText(ncp.diagnosis.replace(/\n/g, ' ').trim(), 100)
                  }}
                </p>
              </div>

              <!-- Timeline -->
              <div class="space-y-2">
                <div class="flex items-center gap-2 text-xs">
                  <Calendar class="h-3 w-3 text-muted-foreground" />
                  <span class="text-muted-foreground"
                    >Created {{ getTimeAgo(ncp.created_at) }}</span
                  >
                </div>
                <div
                  v-if="ncp.updated_at && ncp.updated_at !== ncp.created_at"
                  class="flex items-center gap-2 text-xs"
                >
                  <Clock class="h-3 w-3 text-muted-foreground" />
                  <span class="text-muted-foreground"
                    >Updated {{ getTimeAgo(ncp.updated_at) }}</span
                  >
                </div>
              </div>
            </div>

            <!-- Action buttons - Always visible at bottom -->
            <div class="flex gap-2 pt-3 border-t">
              <Tooltip>
                <TooltipTrigger as-child>
                  <Button
                    size="sm"
                    variant="outline"
                    @click="openRenameDialog($event, ncp)"
                    class="flex-1 text-xs"
                  >
                    <Pencil class="w-3 h-3 mr-1" />
                    Rename
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Rename NCP</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger as-child>
                  <Button
                    size="sm"
                    variant="outline"
                    @click="openDeleteDialog($event, ncp)"
                    class="hover:bg-destructive hover:text-destructive-foreground"
                  >
                    <Trash2 class="w-3 h-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Delete NCP</TooltipContent>
              </Tooltip>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>

    <!-- Rename Dialog Component -->
    <RenameNCPDialog
      v-if="ncpToRename"
      v-model:open="showRenameDialog"
      :ncp="ncpToRename"
      @ncp-renamed="handleNCPRenamed"
    />

    <!-- Delete Dialog -->
    <Dialog v-model:open="showDeleteDialog">
      <DialogContent
        class="w-[calc(100vw-2rem)] max-w-md sm:max-w-lg rounded-lg px-4 py-6 sm:px-8 sm:py-8"
        style="max-width: 95vw"
      >
        <DialogHeader>
          <DialogTitle class="text-lg sm:text-xl">Delete NCP</DialogTitle>
          <DialogDescription class="text-sm sm:text-base">
            Are you sure you want to delete
            <span class="font-semibold">{{ ncpToDelete?.title }}</span
            >? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter class="mt-6 flex flex-col gap-2 sm:flex-row justify-end">
          <Button
            variant="ghost"
            class="w-full sm:w-auto"
            @click="closeDeleteDialog"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            class="w-full sm:w-auto"
            @click="confirmDelete"
          >
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </SidebarLayout>
</template>
