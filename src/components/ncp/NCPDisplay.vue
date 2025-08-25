<script setup>
import RenameNCPDialog from '@/components/ncp/RenameNCPDialog.vue'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useToast } from '@/components/ui/toast/use-toast'
import { exportUtils } from '@/utils/exportUtils'
import { vAutoAnimate } from '@formkit/auto-animate'
import { useResizeObserver } from '@vueuse/core'
import {
  ChevronDown,
  ChevronUp,
  Download,
  Info,
  Pencil,
  Settings,
} from 'lucide-vue-next'
import { computed, onMounted, ref, watch } from 'vue'

const emit = defineEmits(['update:format', 'ncp-renamed'])
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

const allColumns = [
  { key: 'assessment', label: 'Assessment' },
  { key: 'diagnosis', label: 'Diagnosis' },
  { key: 'outcomes', label: 'Outcomes' },
  { key: 'interventions', label: 'Interventions' },
  { key: 'rationale', label: 'Rationale' },
  { key: 'implementation', label: 'Implementation' },
  { key: 'evaluation', label: 'Evaluation' },
]

const formatOptions = computed(() => {
  const options = []
  for (let i = 4; i <= allColumns.length; i++) {
    options.push({
      value: i.toString(),
      label: `${i} Columns`,
      description: allColumns
        .slice(0, i)
        .map(col => col.label)
        .join(', '),
    })
  }
  return options
})

const exportOptions = [
  {
    value: 'pdf',
    label: 'Export as PDF',
    description: 'Portable Document Format',
  },
  {
    value: 'xlsx',
    label: 'Export as Excel',
    description: 'Microsoft Excel spreadsheet',
  },
  {
    value: 'word',
    label: 'Export as Word',
    description: 'Microsoft Word document',
  },
  {
    value: 'png',
    label: 'Export as PNG',
    description: 'Portable Network Graphics image',
  },
]

watch(
  () => props.format,
  newFormat => {
    selectedFormat.value = newFormat
  }
)

useResizeObserver(alertContainer, entries => {
  const entry = entries[0]
  if (entry) {
    // Use borderBoxSize for total width including padding and borders
    const totalWidth =
      entry.borderBoxSize?.[0]?.inlineSize || entry.contentRect.width
    elementWidth.value = totalWidth
    // use 99% of elementWidth's value to serve as max-width to bypass layout problem
  }
})

const updateFormat = value => {
  selectedFormat.value = value
  emit('update:format', value)
}

const handleFormatChange = format => {
  updateFormat(format)
}

const handleExport = async exportType => {
  try {
    const filteredFormattedNCP = {}
    const currentColumns = allColumns.slice(0, parseInt(selectedFormat.value))
    const columnLabels = currentColumns.map(col => col.label)

    currentColumns.forEach(column => {
      if (formattedNCP.value[column.key]) {
        filteredFormattedNCP[column.key] = formattedNCP.value[column.key]
      }
    })

    const exportData = {
      ...filteredFormattedNCP,
      title: props.ncp.title || 'Nursing Care Plan',
    }

    switch (exportType) {
      case 'pdf':
        await exportUtils.toPDF(exportData, columnLabels, true)
        break
      case 'xlsx':
        await exportUtils.toXLSX(exportData, columnLabels, true)
        break
      case 'word':
        await exportUtils.toWord(exportData, columnLabels, true)
        break
      case 'png':
        await exportUtils.toPNG(exportData, columnLabels, true)
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

onMounted(() => {
  if (alertContainer.value) {
    alertContainer.value.__v_auto_animate = true
  }
})

const formatTextToLines = text => {
  if (!text) return []
  return text
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
}

const formattedNCP = computed(() => {
  const formatted = {}
  for (const key in props.ncp) {
    formatted[key] = formatTextToLines(props.ncp[key])
  }
  return formatted
})

const columns = computed(() => {
  return allColumns.slice(0, parseInt(selectedFormat.value))
})

const hasPlaceholderColumns = computed(() =>
  columns.value.some(column =>
    ['implementation', 'evaluation'].includes(column.key)
  )
)

const currentFormatOption = computed(() =>
  formatOptions.value.find(option => option.value === selectedFormat.value)
)

const openRenameDialog = () => {
  showRenameDialog.value = true
}

const handleNCPRenamed = updatedNCP => {
  emit('ncp-renamed', updatedNCP)
}
</script>

<template>
  <div class="space-y-6">
    <!-- Title and Action Buttons -->
    <div
      class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
    >
      <div class="flex items-center gap-3 flex-1 min-w-0">
        <!-- Display the custom NCP title -->
        <div class="flex-1 min-w-0">
          <h1 class="font-poppins text-2xl font-bold truncate">
            {{ ncp.title || 'Generated Nursing Care Plan' }}
          </h1>
          <p class="text-muted-foreground text-sm">
            {{ selectedFormat }}-Column Format
          </p>
        </div>

        <!-- Rename Button -->
        <Button
          variant="ghost"
          size="sm"
          @click="openRenameDialog"
          class="hover:bg-muted/10 flex-shrink-0"
          title="Rename NCP"
        >
          <Pencil class="w-4 h-4" />
          <span class="hidden sm:inline ml-2">Rename</span>
        </Button>
      </div>

      <!-- Action Buttons -->
      <div class="flex gap-2">
        <!-- Format Dropdown -->
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button
              variant="outline"
              size="sm"
              class="hover:bg-muted/10 min-w-fit"
            >
              <Settings class="w-4 h-4 mr-2" />
              {{ currentFormatOption?.label || `${selectedFormat} Columns` }}
              <ChevronDown class="w-4 h-4 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent class="w-[calc(100vw-2rem)] md:w-80" align="end">
            <DropdownMenuItem
              v-for="format in formatOptions"
              :key="format.value"
              @click="handleFormatChange(format.value)"
              class="flex flex-col items-start p-3 cursor-pointer"
              :class="{
                'bg-primary/10 text-primary': selectedFormat === format.value,
              }"
            >
              <div class="font-medium">{{ format.label }}</div>
              <div class="text-xs text-muted-foreground mt-1">
                {{ format.description }}
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <!-- Export Dropdown -->
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button
              variant="outline"
              size="sm"
              class="hover:bg-muted/10 min-w-fit"
            >
              <Download class="w-4 h-4 mr-2" />
              Export
              <ChevronDown class="w-4 h-4 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent class="w-[calc(100vw-2rem)] md:w-60" align="end">
            <DropdownMenuItem
              v-for="option in exportOptions"
              :key="option.value"
              @click="handleExport(option.value)"
              class="flex flex-col items-start p-3 cursor-pointer hover:bg-muted/50"
            >
              <div class="font-medium">{{ option.label }}</div>
              <div class="text-xs text-muted-foreground mt-1">
                {{ option.description }}
              </div>
            </DropdownMenuItem>
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

    <!-- Table Container -->
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
            </th>
          </tr>
        </thead>

        <!-- Table Body -->
        <tbody>
          <tr
            v-for="(row, index) in [formattedNCP]"
            :key="index"
            class="hover:bg-muted/20 border-b"
          >
            <td
              v-for="column in columns"
              :key="column.key"
              class="border-primary/10 group hover:bg-primary/5 p-4 text-sm align-top border min-w-[200px]"
            >
              <div class="space-y-3">
                <div
                  v-for="(line, lineIndex) in row[column.key]"
                  :key="lineIndex"
                  class="leading-relaxed"
                  :class="{
                    'mb-3': lineIndex < row[column.key].length - 1,
                    'mb-4':
                      line.match(/^\d+\./) &&
                      lineIndex < row[column.key].length - 1,
                    'mb-3':
                      line.startsWith('-') &&
                      lineIndex < row[column.key].length - 1,
                  }"
                >
                  {{ line }}
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Rename Dialog Component -->
    <RenameNCPDialog
      v-model:open="showRenameDialog"
      :ncp="ncp"
      @ncp-renamed="handleNCPRenamed"
    />
  </div>
</template>
