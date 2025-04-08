<script setup>
import { Card, CardContent, CardHeader } from '@/components/ui/card'
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
  <Card>
    <CardHeader>
      <h3 class="text-lg font-semibold">Generated Nursing Care Plan</h3>
      <p class="text-sm text-muted-foreground">{{ format }}-Column Format</p>
    </CardHeader>
    <CardContent>
      <div class="overflow-x-auto">
        <table class="w-full border-collapse">
          <thead>
            <tr>
              <th
                v-for="column in columns"
                :key="column.key"
                class="border p-2 bg-muted text-left font-medium text-sm"
              >
                {{ column.label }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td
                v-for="column in columns"
                :key="column.key"
                class="border p-2 text-sm align-top"
              >
                <div class="whitespace-pre-wrap">{{ ncp[column.key] }}</div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </CardContent>
  </Card>
</template>
