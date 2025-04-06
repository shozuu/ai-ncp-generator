<script setup>
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { computed, ref } from 'vue'

// Props for format selection
const props = defineProps({
  selectedFormat: {
    type: String,
    default: '4',
  },
})

// Utility function to convert text to array
const textToArray = text =>
  text
    .split(/[.\n]/) // Split by periods or line breaks
    .filter(line => line.trim()) // Remove empty lines
    .map(line => line.trim()) // Trim whitespace
    .filter(line => line.length > 0) // Remove any remaining empty strings

// Form mode state
const isAssistantMode = ref(false)

// Manual mode state
const manualSubjective = ref('')
const manualObjective = ref('')

// Assistant mode state
const assistantData = ref({
  subjective: {
    primary: '',
    secondary: '',
  },
  objective: {
    exam: '',
    vitals: '',
    other: '',
  },
})

// Update computed assessment text for assistant mode
const assistantAssessment = computed(() => {
  const parts = []
  const { subjective, objective } = assistantData.value

  // Process subjective data
  const subjectiveData = [
    ...textToArray(subjective.primary),
    ...textToArray(subjective.secondary),
  ].filter(Boolean)

  if (subjectiveData.length) {
    parts.push('Subjective data: ' + subjectiveData.join('. ') + '.')
  }

  // Process objective data
  const objectiveData = [
    ...textToArray(objective.exam),
    ...textToArray(objective.vitals),
    ...textToArray(objective.other),
  ].filter(Boolean)

  if (objectiveData.length) {
    parts.push('Objective data: ' + objectiveData.join('. ') + '.')
  }

  return parts.join('\n\n')
})

// Manual assessment text
const manualAssessment = computed(() => {
  const parts = []

  if (manualSubjective.value.trim()) {
    parts.push('Subjective data: ' + manualSubjective.value.trim())
  }

  if (manualObjective.value.trim()) {
    parts.push('Objective data: ' + manualObjective.value.trim())
  }

  return parts.join('\n\n')
})

// Final assessment value based on mode
const finalAssessment = computed(() =>
  isAssistantMode.value ? assistantAssessment.value : manualAssessment.value
)

// Validation function
const validateForm = () => {
  if (isAssistantMode.value) {
    return (
      assistantData.value.subjective.primary.trim() ||
      assistantData.value.objective.exam.trim() ||
      assistantData.value.objective.vitals.trim()
    )
  }
  return manualSubjective.value.trim() || manualObjective.value.trim()
}

// Update handleSubmit
const emit = defineEmits(['submit'])
const handleSubmit = () => {
  if (!finalAssessment.value.trim() || !validateForm()) return

  const assessment = {
    format: {
      type: isAssistantMode.value ? 'assisted' : 'manual',
      columns: props.selectedFormat,
    },
    data: {
      subjective: isAssistantMode.value
        ? {
            primary: textToArray(assistantData.value.subjective.primary),
            secondary: textToArray(assistantData.value.subjective.secondary),
          }
        : {
            rawText: textToArray(manualSubjective.value),
          },
      objective: isAssistantMode.value
        ? {
            exam: textToArray(assistantData.value.objective.exam),
            vitals: textToArray(assistantData.value.objective.vitals),
            other: textToArray(assistantData.value.objective.other),
          }
        : {
            rawText: textToArray(manualObjective.value),
          },
    },
    metadata: {
      timestamp: new Date().toISOString(),
      submissionMode: isAssistantMode.value ? 'assistant' : 'manual',
    },
  }

  emit('submit', assessment)
}
</script>

<template>
  <form @submit.prevent="handleSubmit" class="space-y-6">
    <!-- Instructions -->
    <div class="rounded-md bg-muted/50 p-4 space-y-4">
      <p class="text-sm text-muted-foreground">
        Enter your assessment data, clearly separating subjective
        (patient-reported) and objective (observed) findings. This structured
        format will be used to generate your NCP.
      </p>

      <!-- Add format instructions for manual mode -->
      <div v-if="!isAssistantMode" class="space-y-2 border-t pt-2 border-muted">
        <p class="text-sm text-muted-foreground font-medium">
          Formatting Tips:
        </p>
        <ul
          class="list-disc list-inside text-sm text-muted-foreground space-y-1"
        >
          <li>Enter each finding on a new line</li>
          <li>Use clear, concise statements</li>
          <li>Separate distinct observations</li>
        </ul>
        <div class="bg-muted/30 p-2 rounded-md mt-2">
          <p class="text-xs text-muted-foreground font-medium mb-1">
            Example Format:
          </p>
          <pre class="text-xs text-muted-foreground whitespace-pre-line">
            Patient reports severe headache
            Blood pressure is 140/90 mmHg
            Temperature is 38.5°C
            Patient complains of nausea
          </pre>
        </div>
      </div>
    </div>

    <!-- Mode Toggle -->
    <div class="flex items-center justify-between">
      <Label for="assistant-mode">Use Assessment Assistant</Label>
      <Switch id="assistant-mode" v-model="isAssistantMode" class="ml-4" />
    </div>

    <!-- Manual Mode -->
    <div v-if="!isAssistantMode" class="space-y-4">
      <!-- Subjective Data -->
      <div class="space-y-1.5">
        <Label for="manual-subjective">Subjective Data</Label>
        <p class="text-xs text-muted-foreground mb-2">
          Enter each patient-reported symptom or concern on a new line.
        </p>
        <Textarea
          id="manual-subjective"
          v-model="manualSubjective"
          placeholder="Reports sharp abdominal pain rated 7/10
Reports pain worsens with movement
Complains of nausea since morning
Reports loss of appetite"
          class="min-h-[100px] font-mono text-sm"
        />
      </div>

      <!-- Objective Data -->
      <div class="space-y-1.5">
        <Label for="manual-objective">Objective Data</Label>
        <p class="text-xs text-muted-foreground mb-2">
          Enter each observation or measurement on a new line.
        </p>
        <Textarea
          id="manual-objective"
          v-model="manualObjective"
          placeholder="Blood pressure 130/85 mmHg
Heart rate 98 bpm
Guarding observed during abdominal palpation
Mild distention noted in lower abdomen"
          class="min-h-[100px] font-mono text-sm"
        />
      </div>
    </div>

    <!-- Assistant Mode -->
    <div v-else class="space-y-6">
      <!-- Subjective Section -->
      <div class="space-y-4">
        <h3 class="font-medium text-sm">Subjective Data</h3>

        <div class="space-y-1.5">
          <Label for="symptoms">Primary Symptoms</Label>
          <p class="text-xs text-muted-foreground mb-2">
            Enter each reported symptom on a new line.
          </p>
          <Textarea
            id="symptoms"
            v-model="assistantData.subjective.primary"
            placeholder="Reports sharp abdominal pain rated 7/10
Reports pain worsens with movement
Reports pain started 2 hours ago"
            class="min-h-[100px] font-mono text-sm"
          />
        </div>

        <div class="space-y-1.5">
          <Label for="other-complaints">Other Complaints</Label>
          <p class="text-xs text-muted-foreground mb-2">
            Enter any additional complaints or concerns, one per line.
          </p>
          <Textarea
            id="other-complaints"
            v-model="assistantData.subjective.secondary"
            placeholder="Reports feeling nauseous
Reports loss of appetite
Reports difficulty sleeping due to pain"
            class="min-h-[100px] font-mono text-sm"
          />
        </div>
      </div>

      <!-- Objective Section -->
      <div class="space-y-4">
        <h3 class="font-medium text-sm">Objective Data</h3>

        <div class="space-y-1.5">
          <Label for="physical-exam">Physical Examination</Label>
          <p class="text-xs text-muted-foreground mb-2">
            Enter each physical examination finding on a new line.
          </p>
          <Textarea
            id="physical-exam"
            v-model="assistantData.objective.exam"
            placeholder="Guarding observed during abdominal palpation
Tenderness in right lower quadrant
Skin warm and dry to touch"
            class="min-h-[100px] font-mono text-sm"
          />
        </div>

        <div class="space-y-1.5">
          <Label for="vital-signs">Vital Signs</Label>
          <p class="text-xs text-muted-foreground mb-2">
            Enter each vital sign measurement on a new line.
          </p>
          <Textarea
            id="vital-signs"
            v-model="assistantData.objective.vitals"
            placeholder="Blood pressure 130/85 mmHg
Heart rate 98 bpm
Temperature 37.8°C
Respiratory rate 20/min"
            class="min-h-[100px] font-mono text-sm"
          />
        </div>

        <div class="space-y-1.5">
          <Label for="other-findings">Other Findings</Label>
          <p class="text-xs text-muted-foreground mb-2">
            Enter any additional observations on a new line.
          </p>
          <Textarea
            id="other-findings"
            v-model="assistantData.objective.other"
            placeholder="Mild distention noted in lower abdomen
Bowel sounds diminished
Patient appears uncomfortable when moving"
            class="min-h-[100px] font-mono text-sm"
          />
        </div>
      </div>

      <!-- Preview -->
      <Card v-if="assistantAssessment">
        <CardContent class="p-4">
          <Label class="mb-2 block">Generated Assessment:</Label>
          <p class="text-sm whitespace-pre-line">{{ assistantAssessment }}</p>
        </CardContent>
      </Card>
    </div>

    <!-- Submit Button -->
    <Button type="submit" class="w-full" :disabled="!finalAssessment">
      Generate NCP
    </Button>
  </form>
</template>
