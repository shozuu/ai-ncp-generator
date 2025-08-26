<script setup>
import RenameNCPDialog from '@/components/ncp/RenameNCPDialog.vue'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/toast/use-toast'
import { ncpService } from '@/services/ncpService'
import { exportUtils } from '@/utils/exportUtils'
import {
  hasPlaceholderColumns as checkPlaceholderColumns,
  formatNCPForDisplay,
  formatTextToLines,
  generateFormatOptions,
  getAllNCPColumns,
  getDisplayTitle,
  getEditableColumns,
  getExportOptions,
  parseNCPSectionContent,
  prepareExportData,
} from '@/utils/ncpUtils'
import { vAutoAnimate } from '@formkit/auto-animate'
import { useResizeObserver } from '@vueuse/core'
import {
  ChevronDown,
  ChevronUp,
  Download,
  Edit,
  Info,
  MoreHorizontal,
  Pencil,
  Save,
  Settings,
  X,
} from 'lucide-vue-next'
import { computed, onMounted, reactive, ref, watch } from 'vue'

const emit = defineEmits(['update:format', 'ncp-renamed', 'ncp-updated'])
const props = defineProps({
  ncp: {
    type: Object,
    required: true,
  },
  format: {
    type: String,
    required: true,
  },
})

const { toast } = useToast()
const selectedFormat = ref(props.format)
const isAlertCollapsed = ref(false)
const alertContainer = ref(null)
const elementWidth = ref(0)
const showRenameDialog = ref(false)
const isEditing = ref(false)
const isSaving = ref(false)

// Create reactive form data for editing
const formData = reactive({})

// Use utilities from ncpUtils
const allColumns = getAllNCPColumns()
const editableColumns = getEditableColumns()
const formatOptions = computed(() => generateFormatOptions(allColumns))
const exportOptions = getExportOptions()

watch(
  () => props.format,
  newFormat => {
    selectedFormat.value = newFormat
  }
)

useResizeObserver(alertContainer, entries => {
  const entry = entries[0]
  if (entry) {
    const totalWidth =
      entry.borderBoxSize?.[0]?.inlineSize || entry.contentRect.width
    elementWidth.value = totalWidth
  }
})

// Computed properties
const formattedNCP = computed(() => {
  const formatted = {}
  for (const key in props.ncp) {
    if (allColumns.some(col => col.key === key)) {
      // Parse and format each section based on its type
      const structure = parseNCPSectionContent(props.ncp[key], key)
      formatted[key] = formatNCPForDisplay(structure)
    } else {
      formatted[key] = formatTextToLines(props.ncp[key])
    }
  }
  return formatted
})

const columns = computed(() => {
  return allColumns.slice(0, parseInt(selectedFormat.value))
})

const editableColumnsInFormat = computed(() => {
  return editableColumns.filter(col =>
    columns.value.some(c => c.key === col.key)
  )
})

const hasPlaceholderColumns = computed(() =>
  checkPlaceholderColumns(columns.value)
)

// Add a computed property for the display title
const displayTitle = computed(() => getDisplayTitle(props.ncp))

// Event handlers
const updateFormat = value => {
  selectedFormat.value = value
  emit('update:format', value)
}

const handleFormatChange = format => {
  updateFormat(format)
}

const handleExport = async exportType => {
  try {
    const currentColumns = allColumns.slice(0, parseInt(selectedFormat.value))
    const columnLabels = currentColumns.map(col => col.label)

    const finalExportData = prepareExportData(
      props.ncp,
      currentColumns,
      formattedNCP.value
    )

    switch (exportType) {
      case 'pdf':
        await exportUtils.toPDF(finalExportData, columnLabels, false)
        break
      case 'xlsx':
        await exportUtils.toXLSX(finalExportData, columnLabels, false)
        break
      case 'word':
        await exportUtils.toWord(finalExportData, columnLabels, false)
        break
      case 'png':
        await exportUtils.toPNG(finalExportData, columnLabels, false)
        break
      default:
        throw new Error('Unsupported export format')
    }

    toast({
      title: 'Export Successful',
      description: `NCP exported as ${exportType.toUpperCase()} successfully.`,
    })
  } catch (error) {
    console.error('Export failed:', error)
    toast({
      title: 'Export Failed',
      description: `Failed to export NCP as ${exportType.toUpperCase()}. Please try again.`,
      variant: 'destructive',
    })
  }
}

const openRenameDialog = () => {
  showRenameDialog.value = true
}

const handleNCPRenamed = updatedNCP => {
  emit('ncp-renamed', updatedNCP)
}

const handleNCPUpdated = updatedNCP => {
  emit('ncp-updated', updatedNCP)
  isEditing.value = false
}

// Editing functions
const initializeFormData = () => {
  editableColumnsInFormat.value.forEach(column => {
    formData[column.key] = props.ncp[column.key] || ''
  })
}

const startEditing = () => {
  isEditing.value = true
  initializeFormData()
}

const cancelEditing = () => {
  isEditing.value = false
}

const saveChanges = async () => {
  isSaving.value = true
  try {
    const updatedNCP = await ncpService.updateNCP(props.ncp.id, formData)

    toast({
      title: 'Success',
      description: 'NCP updated successfully',
    })

    handleNCPUpdated(updatedNCP)
  } catch (error) {
    toast({
      title: 'Error',
      description: error.message || 'Failed to update NCP',
      variant: 'destructive',
    })
  } finally {
    isSaving.value = false
  }
}

onMounted(() => {
  if (alertContainer.value) {
    alertContainer.value.__v_auto_animate = true
  }
})
</script>

<template>
  <div class="space-y-6">
    <!-- Title and Action Buttons -->
    <div
      class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4"
    >
      <!-- Title Section -->
      <div class="flex-1 min-w-0">
        <h1 class="font-poppins text-2xl font-bold truncate">
          {{ displayTitle }}
        </h1>
        <div class="flex items-center gap-2 text-muted-foreground text-sm">
          <span>{{ selectedFormat }}-Column Format</span>
          <div
            v-if="ncp.is_modified"
            class="flex items-center gap-1 text-amber-600"
          >
            <div class="w-1.5 h-1.5 bg-amber-500 rounded-full"></div>
            <span class="text-xs">Modified</span>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex gap-2">
        <!-- Edit/Save/Cancel Actions -->
        <template v-if="!isEditing">
          <Button
            variant="outline"
            size="sm"
            @click="startEditing"
            class="hover:bg-muted/10"
          >
            <Edit class="w-4 h-4 mr-2" />
            <span class="hidden xs:inline">Edit NCP</span>
            <span class="xs:hidden">Edit</span>
          </Button>
        </template>

        <template v-else>
          <Button
            variant="outline"
            size="sm"
            @click="cancelEditing"
            :disabled="isSaving"
            class="hover:bg-muted/10"
          >
            <X class="w-4 h-4 mr-2" />
            <span class="xs:inline">Cancel</span>
          </Button>
          <Button
            size="sm"
            @click="saveChanges"
            :disabled="isSaving"
            class="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <Save class="w-4 h-4 mr-2" />
            <span class="hidden xs:inline">{{
              isSaving ? 'Saving...' : 'Save'
            }}</span>
            <span class="xs:hidden">{{ isSaving ? '...' : 'Save' }}</span>
          </Button>
        </template>

        <!-- Actions Dropdown Menu -->
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button
              variant="outline"
              size="sm"
              class="hover:bg-muted/10"
              :disabled="isSaving"
            >
              <MoreHorizontal class="w-4 h-4" />
              <span class="hidden sm:inline ml-2">Actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            class="w-64 max-h-[80vh] overflow-y-auto ml-4"
            align="end"
          >
            <!-- NCP Actions Section -->
            <DropdownMenuLabel class="flex items-center gap-2 justify-center">
              NCP Actions
            </DropdownMenuLabel>
            <DropdownMenuSeparator />

            <!-- Rename -->
            <DropdownMenuItem
              @click="openRenameDialog"
              :disabled="isEditing"
              class="cursor-pointer"
            >
              <Pencil class="w-4 h-4" />
              Rename NCP
            </DropdownMenuItem>

            <!-- Format Options Section -->
            <DropdownMenuSeparator />
            <DropdownMenuLabel class="flex items-center justify-center gap-2">
              <Settings class="w-4 h-4" />
              Format Options
            </DropdownMenuLabel>

            <!-- Format Options -->
            <div class="max-h-32 overflow-y-auto">
              <DropdownMenuItem
                v-for="format in formatOptions"
                :key="format.value"
                @click="handleFormatChange(format.value)"
                class="cursor-pointer"
                :class="{
                  'bg-accent text-accent-foreground':
                    selectedFormat === format.value,
                }"
              >
                <div class="flex flex-col w-full">
                  <span class="font-medium">{{ format.label }}</span>
                  <span class="text-xs text-muted-foreground leading-tight">
                    {{ format.description }}
                  </span>
                </div>
              </DropdownMenuItem>
            </div>

            <!-- Export Options Section -->
            <DropdownMenuSeparator />
            <DropdownMenuLabel class="flex items-center gap-2">
              <Download class="w-4 h-4" />
              Export Options
            </DropdownMenuLabel>

            <!-- Export Options -->
            <div class="max-h-40 overflow-y-auto">
              <DropdownMenuItem
                v-for="option in exportOptions"
                :key="option.value"
                @click="handleExport(option.value)"
                :disabled="isEditing"
                class="cursor-pointer"
              >
                <div class="flex flex-col w-full">
                  <span class="font-medium">{{ option.label }}</span>
                  <span class="text-xs text-muted-foreground leading-tight">
                    {{ option.description }}
                  </span>
                </div>
              </DropdownMenuItem>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>

    <!-- Alert Container -->
    <Alert class="flex flex-col space-y-3" ref="alertContainer" v-auto-animate>
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-2">
          <Info class="shrink-0 text-primary w-5 h-5" />
          <AlertTitle class="mb-0">Important Note</AlertTitle>
        </div>
        <button
          class="text-primary hover:underline flex items-center text-sm font-medium"
          @click="isAlertCollapsed = !isAlertCollapsed"
        >
          <span v-if="isAlertCollapsed">Show</span>
          <span v-else>Hide</span>
          <ChevronDown v-if="isAlertCollapsed" class="w-4 h-4 ml-1" />
          <ChevronUp v-else class="w-4 h-4 ml-1" />
        </button>
      </div>
      <AlertDescription v-if="!isAlertCollapsed">
        The generated Nursing Care Plan (NCP) is based on the assessment data
        you provided and the reference book
        <strong
          >"Nursing Diagnosis Handbook, 12th Edition Revised Reprint with
          2021–2023 NANDA-I Updates"</strong
        >. It is intended to assist and guide users in creating Nursing Care
        Plans and may have other valid interpretations depending on clinical
        judgment and context.
        <br />
        <br />
        Users are encouraged to review and modify the plan as needed to ensure
        it aligns with the latest patient assessment and clinical standards.
        <template v-if="hasPlaceholderColumns">
          <br />
          Additionally, the <strong>Implementation</strong> and/or
          <strong>Evaluation</strong> columns contain placeholder data that
          should be verified and updated based on the latest patient assessment.
        </template>
      </AlertDescription>
    </Alert>

    <!-- Main NCP Table -->
    <div
      class="max-h-[70vh] overflow-x-auto border border-muted rounded-md mx-auto"
      :style="{ maxWidth: elementWidth * 0.99 + 'px' }"
    >
      <table class="min-w-full border-collapse bg-card text-card-foreground">
        <thead class="bg-muted sticky top-0 z-10">
          <tr class="border-b">
            <th
              v-for="column in columns"
              :key="column.key"
              class="border-primary/10 bg-primary/10 p-4 text-sm font-semibold text-left border min-w-[200px] h-auto"
            >
              {{ column.label }}
              <span
                v-if="column.key === 'assessment'"
                class="text-xs text-muted-foreground ml-1"
              >
                (Read-only)
              </span>
            </th>
          </tr>
        </thead>

        <tbody>
          <tr class="hover:bg-muted/20 border-b">
            <td
              v-for="column in columns"
              :key="column.key"
              class="border-primary/10 group p-4 text-sm align-top border min-w-[200px]"
              :class="{
                'hover:bg-primary/5': !isEditing,
                'bg-muted/20':
                  isEditing &&
                  editableColumnsInFormat.some(col => col.key === column.key),
              }"
            >
              <!-- Assessment Column (Always Read-only) -->
              <div v-if="column.key === 'assessment'" class="space-y-3">
                <div
                  v-for="(item, itemIndex) in formattedNCP[column.key]"
                  :key="itemIndex"
                  class="leading-relaxed"
                  :class="{
                    'mb-3': itemIndex < formattedNCP[column.key].length - 1,
                    'text-muted-foreground': item.type === 'header',
                    'font-semibold text-sm': item.type === 'header',
                    'mb-1': item.type === 'bullet',
                  }"
                >
                  <span v-if="item.type === 'bullet'" class="text-primary"
                    >*</span
                  >
                  {{ item.content }}
                </div>
              </div>

              <!-- Editable Columns - View Mode -->
              <div v-else-if="!isEditing" class="space-y-3">
                <div
                  v-for="(item, itemIndex) in formattedNCP[column.key]"
                  :key="itemIndex"
                  class="leading-relaxed"
                  :class="{
                    'mb-4':
                      item.type === 'header' &&
                      itemIndex < formattedNCP[column.key].length - 1,
                    'mb-3':
                      item.type === 'subheader' &&
                      itemIndex < formattedNCP[column.key].length - 1,
                    'mb-2':
                      item.type === 'text' &&
                      itemIndex < formattedNCP[column.key].length - 1,
                    'mb-1': item.type === 'bullet',
                    'font-semibold text-sm text-muted-foreground':
                      item.type === 'header',
                    'font-medium text-sm': item.type === 'subheader',
                  }"
                >
                  <span v-if="item.type === 'bullet'" class="text-primary"
                    >*</span
                  >
                  {{ item.content }}
                </div>
              </div>

              <!-- Editable Columns - Edit Mode -->
              <div
                v-else-if="
                  editableColumnsInFormat.some(col => col.key === column.key)
                "
              >
                <Textarea
                  v-model="formData[column.key]"
                  :placeholder="`Enter ${column.label.toLowerCase()}...`"
                  class="min-h-[50vh] resize-none focus:ring-2 focus:ring-primary"
                  :disabled="isSaving"
                />
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modification Status -->
    <div
      v-if="ncp.is_modified"
      class="flex items-center gap-2 text-sm text-amber-600"
    >
      <div class="w-2 h-2 bg-amber-500 rounded-full"></div>
      <span
        >This NCP has been modified from its original AI-generated version</span
      >
    </div>

    <!-- Rename Dialog Component -->
    <RenameNCPDialog
      v-model:open="showRenameDialog"
      :ncp="ncp"
      @ncp-renamed="handleNCPRenamed"
    />
  </div>
</template>
