<script setup>
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Check } from 'lucide-vue-next'
import { ref } from 'vue'

const formats = [
  {
    value: '4',
    label: '4 Columns',
    description: 'Assessment, Diagnosis, Objectives, Interventions',
  },
  {
    value: '5',
    label: '5 Columns',
    description: 'Assessment, Diagnosis, Objectives, Interventions, Rationale',
  },
  {
    value: '6',
    label: '6 Columns',
    description:
      'Assessment, Diagnosis, Objectives, Interventions, Rationale, Implementation',
  },
  {
    value: '7',
    label: '7 Columns',
    description:
      'Assessment, Diagnosis, Objectives, Interventions, Rationale, Implementation, Evaluation',
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
      class="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
      @update:model-value="updateFormat"
    >
      <!-- Radio Group Card -->
      <div
        v-for="format in formats"
        :key="format.value"
        class="relative flex cursor-pointer rounded-lg border transition hover:border-primary"
        :class="[
          selectedFormat === format.value
            ? 'bg-primary/10 border-primary'
            : 'border',
          'p-3 sm:p-4',
        ]"
        @click="handleCardClick(format.value)"
        :aria-selected="selectedFormat === format.value"
      >
        <!-- Check Icon for Selected Format -->
        <div
          v-if="selectedFormat === format.value"
          class="absolute top-2 right-2 text-primary"
        >
          <Check class="w-4 h-4 sm:w-5 sm:h-5" />
        </div>

        <RadioGroupItem :value="format.value" class="hidden" />
        <div class="space-y-1.5 sm:space-y-2">
          <p class="font-semibold text-sm sm:text-base">{{ format.label }}</p>
          <p class="text-muted-foreground text-xs sm:text-sm leading-tight">
            {{ format.description }}
          </p>
        </div>
      </div>
    </RadioGroup>
  </div>
</template>
