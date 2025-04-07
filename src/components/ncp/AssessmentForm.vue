<script setup>
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/toast'
import { ref } from 'vue'

// Props for format selection
const props = defineProps({
  selectedFormat: {
    type: String,
    default: '4',
  },
})

// Utility function to convert text to array
const textToArray = text => {
  if (!text || typeof text !== 'string') return []

  return text
    .split(/[.\n]/) // Split by periods or line breaks
    .filter(line => line.trim()) // Remove empty lines
    .map(line => line.trim()) // Trim whitespace
    .filter(line => line.length > 0) // Remove any remaining empty strings
}

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

// New state for preview visibility
const showPreview = ref(false)

// Form submission states
const toast = useToast()
const errors = ref([])
const isSubmitting = ref(false)

// Validation function
const validateForm = () => {
  errors.value = []
  let isValid = true

  if (isAssistantMode.value) {
    // Assistant mode validation
    const hasSubjective =
      assistantData.value.subjective.primary.trim() ||
      assistantData.value.subjective.secondary.trim()
    const hasObjective =
      assistantData.value.objective.exam.trim() ||
      assistantData.value.objective.vitals.trim() ||
      assistantData.value.objective.other.trim()

    if (!hasSubjective) {
      errors.value.push('At least one subjective finding is required')
      isValid = false
    }
    if (!hasObjective) {
      errors.value.push('At least one objective finding is required')
      isValid = false
    }
  } else {
    // Manual mode validation
    if (!manualSubjective.value.trim()) {
      errors.value.push('Subjective data is required')
      isValid = false
    }
    if (!manualObjective.value.trim()) {
      errors.value.push('Objective data is required')
      isValid = false
    }
  }

  return isValid
}

// Submit handler
const emit = defineEmits(['submit'])
const handleSubmit = async () => {
  if (!validateForm()) {
    toast({
      title: 'Validation Error',
      description: errors.value.join('\n'),
      variant: 'destructive',
    })
    return
  }

  isSubmitting.value = true

  try {
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
    toast({
      title: 'Success',
      description: 'Assessment submitted successfully',
    })
  } catch (error) {
    toast({
      title: 'Error',
      description: `Failed to submit assessment: ${error.message}`,
      variant: 'destructive',
    })
  } finally {
    isSubmitting.value = false
  }
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

      <!-- Update the format instructions for manual mode -->
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

        <div class="bg-muted/30 p-3 rounded-md mt-2">
          <p class="text-xs font-medium text-muted-foreground mb-2">
            Example Format:
          </p>
          <div class="space-y-3">
            <!-- Subjective Example -->
            <div class="space-y-1">
              <p class="text-xs font-medium text-muted-foreground">
                Subjective Data:
              </p>
              <pre class="text-xs text-muted-foreground pl-4">
Reports severe headache (8/10 pain scale)
Reports nausea and dizziness
Complains of sensitivity to light</pre
              >
            </div>

            <!-- Objective Example -->
            <div class="space-y-1">
              <p class="text-xs font-medium text-muted-foreground">
                Objective Data:
              </p>
              <pre class="text-xs text-muted-foreground pl-4">
Blood pressure 140/90 mmHg
Temperature 38.5°C
Pupils equally reactive to light
Facial grimacing noted</pre
              >
            </div>
          </div>
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
        <div class="relative">
          <Textarea
            id="manual-subjective"
            v-model="manualSubjective"
            :class="{
              'border-destructive': errors.includes(
                'Subjective data is required'
              ),
              'border-primary': manualSubjective.trim().length > 0,
            }"
            placeholder="Reports sharp abdominal pain rated 7/10
Reports pain worsens with movement
Complains of nausea since morning
Reports loss of appetite"
            class="min-h-[100px] font-mono text-sm"
          />
        </div>
      </div>

      <!-- Objective Data -->
      <div class="space-y-1.5">
        <Label for="manual-objective">Objective Data</Label>
        <p class="text-xs text-muted-foreground mb-2">
          Enter each observation or measurement on a new line.
        </p>
        <div class="relative">
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
          <div class="relative">
            <Textarea
              id="symptoms"
              v-model="assistantData.subjective.primary"
              :class="{
                'border-destructive': errors.includes(
                  'At least one subjective finding is required'
                ),
              }"
              placeholder="Reports sharp abdominal pain rated 7/10
Reports pain worsens with movement
Reports pain started 2 hours ago"
              class="min-h-[100px] font-mono text-sm"
            />
            <div class="absolute bottom-2 right-2 flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <p class="text-xs text-muted-foreground">
                    {{ subjectiveCharCount }} characters
                  </p>
                </TooltipTrigger>
                <TooltipContent>
                  <p class="text-xs">Recommended: 50-200 characters</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>

        <div class="space-y-1.5">
          <Label for="other-complaints">Other Complaints</Label>
          <p class="text-xs text-muted-foreground mb-2">
            Enter any additional complaints or concerns, one per line.
          </p>
          <div class="relative">
            <Textarea
              id="other-complaints"
              v-model="assistantData.subjective.secondary"
              placeholder="Reports feeling nauseous
Reports loss of appetite
Reports difficulty sleeping due to pain"
              class="min-h-[100px] font-mono text-sm"
            />
            <div class="absolute bottom-2 right-2 flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <p class="text-xs text-muted-foreground">
                    {{ subjectiveCharCount }} characters
                  </p>
                </TooltipTrigger>
                <TooltipContent>
                  <p class="text-xs">Recommended: 50-200 characters</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
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
          <div class="relative">
            <Textarea
              id="physical-exam"
              v-model="assistantData.objective.exam"
              placeholder="Guarding observed during abdominal palpation
Tenderness in right lower quadrant
Skin warm and dry to touch"
              class="min-h-[100px] font-mono text-sm"
            />
            <div class="absolute bottom-2 right-2 flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <p class="text-xs text-muted-foreground">
                    {{ objectiveCharCount }} characters
                  </p>
                </TooltipTrigger>
                <TooltipContent>
                  <p class="text-xs">Recommended: 50-200 characters</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>

        <div class="space-y-1.5">
          <Label for="vital-signs">Vital Signs</Label>
          <p class="text-xs text-muted-foreground mb-2">
            Enter each vital sign measurement on a new line.
          </p>
          <div class="relative">
            <Textarea
              id="vital-signs"
              v-model="assistantData.objective.vitals"
              placeholder="Blood pressure 130/85 mmHg
Heart rate 98 bpm
Temperature 37.8°C
Respiratory rate 20/min"
              class="min-h-[100px] font-mono text-sm"
            />
            <div class="absolute bottom-2 right-2 flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <p class="text-xs text-muted-foreground">
                    {{ objectiveCharCount }} characters
                  </p>
                </TooltipTrigger>
                <TooltipContent>
                  <p class="text-xs">Recommended: 50-200 characters</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>

        <div class="space-y-1.5">
          <Label for="other-findings">Other Findings</Label>
          <p class="text-xs text-muted-foreground mb-2">
            Enter any additional observations on a new line.
          </p>
          <div class="relative">
            <Textarea
              id="other-findings"
              v-model="assistantData.objective.other"
              placeholder="Mild distention noted in lower abdomen
Bowel sounds diminished
Patient appears uncomfortable when moving"
              class="min-h-[100px] font-mono text-sm"
            />
            <div class="absolute bottom-2 right-2 flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <p class="text-xs text-muted-foreground">
                    {{ objectiveCharCount }} characters
                  </p>
                </TooltipTrigger>
                <TooltipContent>
                  <p class="text-xs">Recommended: 50-200 characters</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Assistant Mode Preview section -->
    <div v-if="isAssistantMode" class="border-t border-muted pt-4">
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-2">
          <p class="text-sm text-muted-foreground">
            Review your assessment before submission
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          type="button"
          @click="showPreview = !showPreview"
        >
          {{ showPreview ? 'Hide' : 'Show' }} Preview
        </Button>
      </div>

      <Collapsible :open="showPreview">
        <CollapsibleContent>
          <Card class="bg-muted/30">
            <CardContent class="p-4">
              <div class="space-y-4">
                <!-- Subjective Data Section -->
                <div
                  v-if="
                    textToArray(assistantData.subjective.primary).length ||
                    textToArray(assistantData.subjective.secondary).length
                  "
                  class="space-y-2"
                >
                  <h4 class="font-medium text-primary text-sm">
                    Subjective Data
                  </h4>
                  <div class="space-y-3">
                    <div
                      v-if="
                        textToArray(assistantData.subjective.primary).length
                      "
                    >
                      <p class="text-xs font-medium text-muted-foreground mb-1">
                        Primary Symptoms
                      </p>
                      <ul class="list-disc list-inside space-y-1 pl-2">
                        <li
                          v-for="(symptom, i) in textToArray(
                            assistantData.subjective.primary
                          )"
                          :key="`primary-${i}`"
                          class="text-sm text-foreground/90"
                        >
                          {{ symptom }}
                        </li>
                      </ul>
                    </div>

                    <div
                      v-if="
                        textToArray(assistantData.subjective.secondary).length
                      "
                    >
                      <p class="text-xs font-medium text-muted-foreground mb-1">
                        Other Complaints
                      </p>
                      <ul class="list-disc list-inside space-y-1 pl-2">
                        <li
                          v-for="(symptom, i) in textToArray(
                            assistantData.subjective.secondary
                          )"
                          :key="`secondary-${i}`"
                          class="text-sm text-foreground/90"
                        >
                          {{ symptom }}
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                <!-- Objective Data Section -->
                <div
                  v-if="
                    textToArray(assistantData.objective.exam).length ||
                    textToArray(assistantData.objective.vitals).length ||
                    textToArray(assistantData.objective.other).length
                  "
                  class="space-y-2"
                >
                  <h4 class="font-medium text-primary text-sm">
                    Objective Data
                  </h4>
                  <div class="space-y-3">
                    <div
                      v-if="textToArray(assistantData.objective.exam).length"
                    >
                      <p class="text-xs font-medium text-muted-foreground mb-1">
                        Physical Examination
                      </p>
                      <ul class="list-disc list-inside space-y-1 pl-2">
                        <li
                          v-for="(finding, i) in textToArray(
                            assistantData.objective.exam
                          )"
                          :key="`exam-${i}`"
                          class="text-sm text-foreground/90"
                        >
                          {{ finding }}
                        </li>
                      </ul>
                    </div>

                    <div
                      v-if="textToArray(assistantData.objective.vitals).length"
                    >
                      <p class="text-xs font-medium text-muted-foreground mb-1">
                        Vital Signs
                      </p>
                      <ul class="list-disc list-inside space-y-1 pl-2">
                        <li
                          v-for="(vital, i) in textToArray(
                            assistantData.objective.vitals
                          )"
                          :key="`vital-${i}`"
                          class="text-sm text-foreground/90"
                        >
                          {{ vital }}
                        </li>
                      </ul>
                    </div>

                    <div
                      v-if="textToArray(assistantData.objective.other).length"
                    >
                      <p class="text-xs font-medium text-muted-foreground mb-1">
                        Other Findings
                      </p>
                      <ul class="list-disc list-inside space-y-1 pl-2">
                        <li
                          v-for="(finding, i) in textToArray(
                            assistantData.objective.other
                          )"
                          :key="`other-${i}`"
                          class="text-sm text-foreground/90"
                        >
                          {{ finding }}
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>
    </div>

    <!-- Submit Button -->
    <Button
      type="submit"
      class="w-full"
      :disabled="isSubmitting || !validateForm()"
    >
      {{ isSubmitting ? 'Generating...' : 'Generate NCP' }}
    </Button>

    <!-- Add error messages display -->
    <div v-if="errors.length" class="mt-4">
      <ul class="space-y-1">
        <li
          v-for="(error, index) in errors"
          :key="index"
          class="text-sm text-destructive"
        >
          {{ error }}
        </li>
      </ul>
    </div>
  </form>
</template>
