<script setup>
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { exportUtils } from '@/utils/exportUtils'
import { ChevronDown } from 'lucide-vue-next'
import { computed, ref } from 'vue'


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

// Local state for selected format
const selectedFormat = ref(props.format)

// Watch for changes in selectedFormat and emit the update
const updateFormat = value => {
  selectedFormat.value = value
  emit('update:format', value)
}

// Helper function to format text
const formatText = text => {
  if (!text) return ''
  return text
    .split('\n') // Split by newlines
    .map(line => `<div class="mb-2">${line.trim()}</div>`) // Wrap each line in a div
    .join('') // Join back as a single string
}

// Compute which columns to show based on format
const columns = computed(() => {
  const allColumns = [
    { key: 'assessment', label: 'Assessment' },
    { key: 'diagnosis', label: 'Diagnosis' },
    { key: 'outcomes', label: 'Outcomes' },
    { key: 'interventions', label: 'Interventions' },
    { key: 'rationale', label: 'Rationale' },
    { key: 'implementation', label: 'Implementation' },
    { key: 'evaluation', label: 'Evaluation' },
  ]

  return allColumns.slice(0, parseInt(selectedFormat.value))
})

// Format the NCP data for display
const formattedNCP = computed(() => {
  const formatted = {}
  for (const key in props.ncp) {
    formatted[key] = formatText(props.ncp[key])
  }
  return formatted
})

// Export handlers
const handleExport = async type => {
  switch (type) {
    case 'pdf':
      await exportUtils.toPDF(props.ncp)
      break
    case 'csv':
      exportUtils.toCSV(props.ncp)
      break
    case 'word':
      exportUtils.toWord(props.ncp)
      break
    case 'png':
      exportUtils.toPNG(props.ncp)
      break
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Title -->
    <div>
      <h1 class="font-poppins text-2xl font-bold">
        Generated Nursing Care Plan
      </h1>
      <p class="text-muted-foreground text-sm">
        {{ selectedFormat }}-Column Format
      </p>
    </div>

    <div class="overflow-x-auto">
      <!-- Format and Export Options -->
      <div
        class="border-muted rounded-t-md flex items-center px-4 py-2 space-x-4 border-t border-l border-r"
      >
        <!-- Format Selector -->
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button variant="outline" size="sm">
              Format: {{ selectedFormat }} Columns
              <ChevronDown class="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent class="w-40">
            <DropdownMenuItem
              v-for="format in ['4', '5', '6', '7']"
              :key="format"
              @click="updateFormat(format)"
            >
              {{ format }} Columns
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <!-- Export Dropdown -->
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button variant="outline" size="sm">
              Export as
              <ChevronDown class="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent class="w-40">
            <DropdownMenuItem @click="handleExport('pdf')"
              >Export as PDF</DropdownMenuItem
            >
            <DropdownMenuItem @click="handleExport('csv')"
              >Export as CSV</DropdownMenuItem
            >
            <DropdownMenuItem @click="handleExport('word')"
              >Export as Word</DropdownMenuItem
            >
            <DropdownMenuItem @click="handleExport('png')"
              >Export as PNG</DropdownMenuItem
            >
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <!-- Table -->
      <div
        class="max-h-[650px] overflow-y-auto border border-muted rounded-b-md"
      >
        <table class="max-w-[1200px] min-w-full border-collapse">
          <!-- Table Header -->
          <thead class="bg-muted sticky top-0 z-10">
            <tr>
              <th
                v-for="column in columns"
                :key="column.key"
                class="border-primary/10 bg-primary/10 p-4 text-sm font-semibold text-left border min-w-[200px]"
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
              :class="index % 2 === 0 ? 'bg-muted/10' : 'bg-white'"
            >
              <td
                v-for="column in columns"
                :key="column.key"
                class="border-primary/10 group hover:bg-primary/5 p-4 text-sm align-top transition-colors border min-w-[200px]"
                v-html="row[column.key]"
              ></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
