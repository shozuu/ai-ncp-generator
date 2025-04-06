<script setup>
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
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
    symptoms: '',
    otherComplaints: '',
  },
  objective: {
    physicalExam: '',
    vitalSigns: '',
    otherFindings: '',
  },
})

// Computed assessment text for assistant mode
const assistantAssessment = computed(() => {
  const parts = []
  const { subjective, objective } = assistantData.value

  // Subjective section
  const subjectiveParts = []
  if (subjective.symptoms) subjectiveParts.push(subjective.symptoms)
  if (subjective.otherComplaints)
    subjectiveParts.push(subjective.otherComplaints)

  if (subjectiveParts.length) {
    parts.push('Subjective data: ' + subjectiveParts.join('. ') + '.')
  }

  // Objective section
  const objectiveParts = []
  if (objective.physicalExam) objectiveParts.push(objective.physicalExam)
  if (objective.vitalSigns)
    objectiveParts.push(`Vital signs include ${objective.vitalSigns}`)
  if (objective.otherFindings) objectiveParts.push(objective.otherFindings)

  if (objectiveParts.length) {
    parts.push('Objective data: ' + objectiveParts.join('. ') + '.')
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
      assistantData.value.subjective.symptoms.trim() ||
      assistantData.value.objective.physicalExam.trim() ||
      assistantData.value.objective.vitalSigns.trim()
    )
  }
  return manualSubjective.value.trim() || manualObjective.value.trim()
}

// Handle form submission
const emit = defineEmits(['submit'])
const handleSubmit = () => {
  if (!finalAssessment.value.trim() || !validateForm()) return
  const assessment = {
    format: {
      type: isAssistantMode.value ? 'assisted' : 'manual',
      columns: props.selectedFormat,
    },
    data: {
      subjective: {
        symptoms: isAssistantMode.value
          ? {
              primary: assistantData.value.subjective.symptoms,
              secondary: assistantData.value.subjective.otherComplaints,
            }
          : null,
        rawText: isAssistantMode.value
          ? null
          : textToArray(manualSubjective.value),
      },
      objective: {
        physicalExam: isAssistantMode.value
          ? assistantData.value.objective.physicalExam
          : null,
        vitalSigns: isAssistantMode.value
          ? assistantData.value.objective.vitalSigns
          : null,
        otherFindings: isAssistantMode.value
          ? assistantData.value.objective.otherFindings
          : null,
        rawText: isAssistantMode.value
          ? null
          : textToArray(manualObjective.value),
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
          <Label for="symptoms">What symptoms did the patient report?</Label>
          <Input
            id="symptoms"
            v-model="assistantData.subjective.symptoms"
            placeholder="Sharp abdominal pain rated 7/10, which worsens with movement"
          />
        </div>

        <div class="space-y-1.5">
          <Label for="other-complaints"
            >Any other complaints or concerns?</Label
          >
          <Input
            id="other-complaints"
            v-model="assistantData.subjective.otherComplaints"
            placeholder="Reports feeling nauseous and loss of appetite"
          />
        </div>
      </div>

      <!-- Objective Section -->
      <div class="space-y-4">
        <h3 class="font-medium text-sm">Objective Data</h3>

        <div class="space-y-1.5">
          <Label for="physical-exam">Physical examination findings</Label>
          <Input
            id="physical-exam"
            v-model="assistantData.objective.physicalExam"
            placeholder="Guarding is observed during palpation of the abdomen"
          />
        </div>

        <div class="space-y-1.5">
          <Label for="vital-signs">Vital signs</Label>
          <Input
            id="vital-signs"
            v-model="assistantData.objective.vitalSigns"
            placeholder="blood pressure at 130/85 mmHg and heart rate at 98 bpm"
          />
        </div>

        <div class="space-y-1.5">
          <Label for="other-findings">Other objective findings</Label>
          <Input
            id="other-findings"
            v-model="assistantData.objective.otherFindings"
            placeholder="Mild distention noted in lower abdomen"
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
