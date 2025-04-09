<script setup>
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { ref } from 'vue'

const formats = [
  {
    value: '4',
    label: '4 Columns',
    description: 'Assessment, Diagnosis, Outcomes, Interventions',
  },
  {
    value: '5',
    label: '5 Columns',
    description: 'Assessment, Diagnosis, Outcomes, Interventions, Rationale',
  },
  {
    value: '6',
    label: '6 Columns',
    description:
      'Assessment, Diagnosis, Outcomes, Interventions, Rationale, Implementation',
  },
  {
    value: '7',
    label: '7 Columns',
    description:
      'Assessment, Diagnosis, Outcomes, Interventions, Rationale, Implementation, Evaluation',
  },
]

const selectedFormat = ref('7') // Default format

const emit = defineEmits(['update:format'])

const updateFormat = value => {
  selectedFormat.value = value
  emit('update:format', value)
}

const handleCardClick = value => {
  selectedFormat.value = value
  emit('update:format', value)
}
</script>

<template>
  <div class="space-y-4">
    <Label class="text-base">Select NCP Format</Label>
    <RadioGroup
      v-model="selectedFormat"
      class="sm:grid-cols-2 lg:grid-cols-4 grid gap-4"
      @update:model-value="updateFormat"
    >
      <!-- Radio Group Card -->
      <div
        v-for="format in formats"
        :key="format.value"
        class="relative flex cursor-pointer rounded-lg border p-4 hover:border-primary [&:has(:checked)]:border-primary"
        @click="handleCardClick(format.value)"
      >
        <RadioGroupItem :value="format.value" class="right-2 top-2 absolute" />
        <div class="space-y-2">
          <p class="font-medium">{{ format.label }}</p>
          <p class="text-muted-foreground text-sm">
            {{ format.description }}
          </p>
        </div>
      </div>
    </RadioGroup>
  </div>
</template>
