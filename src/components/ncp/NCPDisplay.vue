<script setup>
import { computed } from 'vue'

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

  return allColumns.slice(0, parseInt(props.format))
})
</script>

<template>
  <div class="space-y-6">
    <!-- Title and Description -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="font-poppins text-2xl font-bold">
          Generated Nursing Care Plan
        </h1>
        <p class="text-muted-foreground text-sm">{{ format }}-Column Format</p>
      </div>
      <button
        class="text-primary hover:underline text-sm font-medium"
        @click="$emit('back')"
      >
        ← Back to Form
      </button>
    </div>

    <!-- Table -->
    <div class="overflow-x-auto">
      <div class="max-h-[700px] overflow-y-auto border border-muted rounded-md">
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
              v-for="(row, index) in [ncp]"
              :key="index"
              :class="index % 2 === 0 ? 'bg-muted/10' : 'bg-white'"
            >
              <td
                v-for="column in columns"
                :key="column.key"
                class="border-primary/10 group hover:bg-primary/5 p-4 text-sm align-top transition-colors border min-w-[200px]"
              >
                <div class="whitespace-pre-wrap">
                  {{ row[column.key] }}
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
