<script setup>
import RenameNCPDialog from '@/components/ncp/RenameNCPDialog.vue'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useToast } from '@/components/ui/toast/use-toast'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import SidebarLayout from '@/layouts/SidebarLayout.vue'
import { ncpService } from '@/services/ncpService'
import { LayoutGrid, List, Pencil, Trash2 } from 'lucide-vue-next'
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

const openRenameDialog = ncp => {
  ncpToRename.value = ncp
  showRenameDialog.value = true
}

const handleNCPRenamed = async updatedNCP => {
  // Update the NCP in the local list
  const index = ncps.value.findIndex(ncp => ncp.id === updatedNCP.id)
  if (index !== -1) {
    ncps.value[index] = updatedNCP
  }

  toast({
    title: 'Success',
    description: 'NCP title updated successfully.',
  })
}

const openDeleteDialog = ncp => {
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
      <span class="animate-pulse text-muted-foreground text-lg"
        >Loading your nursing care plans...</span
      >
    </div>

    <!-- Empty State -->
    <div
      v-else-if="ncps.length === 0"
      class="text-muted-foreground mt-10 text-center"
    >
      No NCPs found.
    </div>

    <div v-else>
      <!-- List View -->
      <div v-if="viewMode === 'list'" class="flex flex-col gap-4">
        <Card
          v-for="ncp in ncps"
          :key="ncp.id"
          class="group border bg-card rounded-xl px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between hover:shadow-lg hover:border-primary transition"
        >
          <CardHeader class="p-0 flex-1 min-w-0">
            <CardTitle
              class="font-semibold text-lg hover:text-primary cursor-pointer transition block truncate"
              @click="viewNCP(ncp.id)"
            >
              {{ ncp.title }}
            </CardTitle>
            <CardDescription class="text-sm text-muted-foreground mt-1">
              Format: {{ ncp.format_type }} Columns
            </CardDescription>
          </CardHeader>
          <CardFooter class="flex gap-2 mt-4 sm:mt-0 sm:ml-4 p-0">
            <Tooltip>
              <TooltipTrigger as-child>
                <Button
                  size="icon"
                  variant="outline"
                  @click="openRenameDialog(ncp)"
                  aria-label="Rename"
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
                  @click="openDeleteDialog(ncp)"
                  aria-label="Delete"
                >
                  <Trash2 class="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Delete</TooltipContent>
            </Tooltip>
          </CardFooter>
        </Card>
      </div>

      <!-- Grid View -->
      <div
        v-else
        class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      >
        <Card
          v-for="ncp in ncps"
          :key="ncp.id"
          class="group border bg-card rounded-xl p-5 flex flex-col justify-between hover:shadow-xl hover:border-primary transition"
        >
          <CardHeader class="p-0">
            <CardTitle
              class="font-semibold text-lg mb-2 hover:text-primary cursor-pointer transition block truncate"
              @click="viewNCP(ncp.id)"
            >
              {{ ncp.title }}
            </CardTitle>
            <CardDescription class="text-sm text-muted-foreground">
              Format: {{ ncp.format_type }} Columns
            </CardDescription>
          </CardHeader>
          <CardFooter class="flex gap-2 mt-4 p-0">
            <Tooltip>
              <TooltipTrigger as-child>
                <Button
                  size="icon"
                  variant="outline"
                  @click="openRenameDialog(ncp)"
                  aria-label="Rename"
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
                  @click="openDeleteDialog(ncp)"
                  aria-label="Delete"
                >
                  <Trash2 class="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Delete</TooltipContent>
            </Tooltip>
          </CardFooter>
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
