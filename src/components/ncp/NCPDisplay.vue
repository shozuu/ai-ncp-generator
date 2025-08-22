<script setup>
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { exportUtils } from '@/utils/exportUtils'
import { vAutoAnimate } from '@formkit/auto-animate'
import { useResizeObserver } from '@vueuse/core'
import { ChevronDown, ChevronUp, Info } from 'lucide-vue-next'
import { computed, onMounted, ref } from 'vue'

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

// Add width monitoring
const elementWidth = ref(0)

// Monitor the alert container width
useResizeObserver(alertContainer, entries => {
  const entry = entries[0]
  if (entry) {
    elementWidth.value = entry.contentRect.width
    console.log(`Alert width: ${elementWidth.value}px`)
  }
})

const updateFormat = value => {
  selectedFormat.value = value
  emit('update:format', value)
}

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

onMounted(() => {
  if (alertContainer.value) {
    alertContainer.value.__v_auto_animate = true
  }
})

const formatText = text => {
  if (!text) return ''
  return text
    .split('\n')
    .map(line => `<div class="mb-2">${line.trim()}</div>`)
    .join('')
}

const formattedNCP = computed(() => {
  const formatted = {}
  for (const key in props.ncp) {
    formatted[key] = formatText(props.ncp[key])
  }
  return formatted
})

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

const hasPlaceholderColumns = computed(() =>
  columns.value.some(column =>
    ['implementation', 'evaluation'].includes(column.key)
  )
)
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

    <!-- Collapsible Alert for Placeholder Data -->
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
      class="max-h-[70vh] overflow-x-auto border border-muted rounded-b-md mx-auto"
      :style="{ maxWidth: elementWidth + 'px' }"
    >
      <table class="min-w-full border-collapse">
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
</template>

<style>
/* Add spacing and styles for lists */
ul {
  padding-left: 20px;
  margin-top: 0.5rem;
  margin-bottom: 0.5rem;
}

li {
  margin-bottom: 0.25rem;
}

p {
  margin-bottom: 0.5rem;
}
</style>
