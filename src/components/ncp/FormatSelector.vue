<script setup>
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Check } from 'lucide-vue-next'
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

const selectedFormat = ref('7')

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
    <h2 class="text-lg font-bold">Select NCP Format</h2>
    <RadioGroup
      v-model="selectedFormat"
      class="sm:grid-cols-2 lg:grid-cols-4 grid gap-4"
      @update:model-value="updateFormat"
    >
      <!-- Radio Group Card -->
      <div
        v-for="format in formats"
        :key="format.value"
        class="relative flex cursor-pointer rounded-lg border p-4 transition hover:border-primary"
        :class="{
          'bg-primary/10 border-primary': selectedFormat === format.value,
          'border-muted': selectedFormat !== format.value,
        }"
        @click="handleCardClick(format.value)"
        :aria-selected="selectedFormat === format.value"
      >
        <!-- Check Icon for Selected Format -->
        <div
          v-if="selectedFormat === format.value"
          class="absolute top-2 right-2 text-primary"
        >
          <Check class="w-5 h-5" />
        </div>

        <RadioGroupItem :value="format.value" class="hidden" />
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
