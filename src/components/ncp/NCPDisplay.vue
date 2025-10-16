<script setup>
import EditingHelp from '@/components/ncp/EditingHelp.vue'
import EditingPreview from '@/components/ncp/EditingPreview.vue'
import RenameNCPDialog from '@/components/ncp/RenameNCPDialog.vue'
import StructuredNCPRenderer from '@/components/ncp/StructuredNCPRenderer.vue'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
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
import { useStructuredNCPComponent } from '@/utils/structuredNCPComponentUtils'
import {
  hasPlaceholderColumns as checkPlaceholderColumns,
  generateFormatOptions,
  getAllNCPColumns,
  getDisplayTitle,
  getExportOptions,
} from '@/utils/structuredNCPUtils'
import { vAutoAnimate } from '@formkit/auto-animate'
import { useResizeObserver } from '@vueuse/core'
import {
  BookOpen,
  ChevronDown,
  ChevronUp,
  Download,
  Edit,
  Info,
  MoreHorizontal,
  Pencil,
  PencilLine,
  Save,
  Settings,
  X,
} from 'lucide-vue-next'
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

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

const router = useRouter()
const selectedFormat = ref(props.format)
const isAlertCollapsed = ref(false)
const alertContainer = ref(null)
const elementWidth = ref(0)

// Use the new structured NCP component utilities
const {
  isEditing,
  isSaving,
  formData,
  formattedNCP,
  handleExport,
  showRenameDialog,
  openRenameDialog,
  handleNCPRenamed: handleRenamed,
  startEditing,
  cancelEditing,
  saveChanges,
  editableColumnsInFormat,
} = useStructuredNCPComponent(props.ncp, selectedFormat, emit)

// Use utilities from structuredNCPUtils
const allColumns = getAllNCPColumns()
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
const columns = computed(() => {
  return allColumns.slice(0, parseInt(selectedFormat.value))
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

const handleNCPRenamed = updatedNCP => {
  handleRenamed(updatedNCP)
  emit('ncp-renamed', updatedNCP)
}

// Navigation to explanation page
const viewExplanations = () => {
  router.push(`/explain/${props.ncp.id}`)
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
      <div class="flex-1 min-w-0 space-y-3">
        <h1 class="font-poppins text-2xl font-bold truncate">
          {{ displayTitle }}
        </h1>

        <!-- Status info below title -->
        <div class="flex flex-wrap items-center gap-3">
          <span class="text-muted-foreground text-sm"
            >{{ selectedFormat }}-Column Format</span
          >
          <Badge v-if="ncp.is_modified" variant="warning" size="sm">
            <PencilLine class="w-3 h-3 mr-1" />
            Modified
          </Badge>
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

            <!-- View Explanations -->
            <DropdownMenuItem
              @click="viewExplanations"
              :disabled="isEditing"
              class="cursor-pointer"
            >
              <BookOpen class="w-4 h-4" />
              View Explanations
            </DropdownMenuItem>

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
        <Button
          as="a"
          href="https://www.amazon.com/Ackley-Ladwigs-Nursing-Diagnosis-Handbook/dp/0323776833"
          target="_blank"
          rel="noopener noreferrer"
          variant="link"
          class="inline-flex items-center px-1"
        >
          Ackley and Ladwig’s Nursing Diagnosis Handbook (13th Edition).
        </Button>
        It is intended to assist and guide users in creating Nursing Care Plans
        and may have other valid interpretations depending on clinical judgment
        and context.
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

    <!-- Diagnosis Reasoning Section -->
    <div
      v-if="ncp.reasoning"
      class="mt-4 p-4 rounded-md border border-blue-200 bg-primary-50 text-sm"
    >
      <div class="flex items-center gap-2 mb-2">
        <Info class="w-4 h-4 text-blue-600 dark:text-blue-300" />
        <span class="font-semibold">Diagnosis Reasoning</span>
      </div>
      <div class="whitespace-pre-line">
        {{ ncp.reasoning }}
      </div>
    </div>

    <!-- Main NCP Table -->
    <div
      class="max-h-[70vh] overflow-x-auto border border-muted rounded-md mx-auto"
      :style="{ maxWidth: elementWidth * 0.99 + 'px' }"
    >
      <table class="min-w-full border-collapse bg-card text-card-foreground">
        <colgroup>
          <col
            v-for="col in columns"
            :key="col.key"
            :style="{ width: 100 / columns.length + '%' }"
          />
        </colgroup>
        <thead class="bg-muted sticky top-0 z-10 min-w-[200px]">
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
              class="border-primary/10 group p-4 text-xs align-top border min-w-[200px]"
              :class="{
                'hover:bg-primary/5': !isEditing,
                'bg-muted/20':
                  isEditing &&
                  editableColumnsInFormat.some(col => col.key === column.key),
              }"
            >
              <!-- All Columns - Use Structured Renderer -->
              <div v-if="!isEditing || column.key === 'assessment'">
                <StructuredNCPRenderer
                  :items="formattedNCP[column.key] || []"
                />
              </div>

              <!-- Editable Columns - Edit Mode -->
              <div
                v-else-if="
                  editableColumnsInFormat.some(col => col.key === column.key)
                "
                class="space-y-2"
              >
                <EditingHelp :column-key="column.key" />
                <Textarea
                  v-model="formData[column.key]"
                  :placeholder="`Enter ${column.label.toLowerCase()}...`"
                  class="min-h-[50vh] resize-none focus:ring-2 focus:ring-primary font-mono text-xs"
                  :disabled="isSaving"
                />
                <div class="flex items-center justify-between">
                  <div
                    class="text-xs text-muted-foreground flex items-center gap-1"
                  >
                    <span>💡</span>
                    <span
                      >Use the structured format above or paste JSON directly -
                      both work perfectly!</span
                    >
                  </div>
                  <EditingPreview
                    :text-data="formData[column.key]"
                    :column-key="column.key"
                    :column-label="column.label"
                  />
                </div>
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
