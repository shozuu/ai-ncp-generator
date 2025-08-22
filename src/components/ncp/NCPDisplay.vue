<script setup>
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { vAutoAnimate } from '@formkit/auto-animate'
import { useResizeObserver } from '@vueuse/core'
import { ChevronDown, ChevronUp, Info, Settings } from 'lucide-vue-next'
import { computed, onMounted, ref, watch } from 'vue'

const emit = defineEmits(['update:format'])
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

const selectedFormat = ref(props.format)
const isAlertCollapsed = ref(false)
const alertContainer = ref(null)
const elementWidth = ref(0)

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
</script>

<template>
  <div class="space-y-6">
    <!-- Title and Format Selector -->
    <div
      class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
    >
      <div>
        <h1 class="font-poppins text-2xl font-bold">
          Generated Nursing Care Plan
        </h1>
        <p class="text-muted-foreground text-sm">
          {{ selectedFormat }}-Column Format
        </p>
      </div>

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
              <div class="space-y-2">
                <div
                  v-for="(line, lineIndex) in row[column.key]"
                  :key="lineIndex"
                  class="mb-2"
                >
                  {{ line }}
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
