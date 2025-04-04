<script setup>
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { ref } from 'vue'

// Form data structure
const formData = ref({
  // 1. Subjective Data
  subjective: {
    chiefComplaint: '',
    pain: {
      exists: false,
      location: '',
      intensity: '',
      duration: '',
      quality: '',
      qualityOther: '',
      factors: {
        alleviating: '',
        aggravating: '',
      },
    },
    otherSymptoms: '',
    psychologicalStatus: [],
    psychologicalStatusMap: {
      Anxiety: false,
      Depression: false,
      Stress: false,
      Fear: false,
      Anger: false,
      Other: false,
    },
    psychologicalOther: '',
  },

  // 2. Objective Data
  objective: {
    vitalSigns: {
      temperature: '',
      pulse: '',
      respiration: '',
      bloodPressure: {
        systolic: '',
        diastolic: '',
      },
      oxygenSaturation: '',
    },
    physicalExam: '',
    diagnosticResults: '',
  },

  // 3. Functional Assessment
  functional: {
    adl: {
      eating: false,
      bathing: false,
      dressing: false,
      toileting: false,
      mobility: false,
      other: false,
    },
    adlOther: '',
    iadl: {
      finances: false,
      shopping: false,
      transportation: false,
      housekeeping: false,
      other: false,
    },
    iadlOther: '',
  },

  // 4. Psychosocial Assessment
  psychosocial: {
    emotionalStateMap: {
      Anxiety: false,
      Fear: false,
      Denial: false,
      Depression: false,
      Anger: false,
      Hopelessness: false,
      Other: false,
    },
    emotionalStateOther: '',
    emotionalState: [],
    supportSystems: '',
    culturalFactors: '',
  },

  // 5. Environmental Factors
  environmental: '',

  // 6. Risk Assessments
  risks: {
    fallRisk: false,
    pressureUlcerRisk: false,
    infectionRisk: false,
    otherRisks: '',
  },
})

const emit = defineEmits(['submit'])

const handleSubmit = () => {
  emit('submit', formData.value)
}

// Predefined options
const psychologicalOptions = [
  'Anxiety',
  'Depression',
  'Stress',
  'Fear',
  'Anger',
  'Other',
]

const emotionalStateOptions = [
  'Anxiety',
  'Fear',
  'Denial',
  'Depression',
  'Anger',
  'Hopelessness',
  'Other',
]

const painQualityOptions = [
  'Sharp',
  'Dull',
  'Throbbing',
  'Burning',
  'Stabbing',
  'Aching',
  'Other',
]

const requiredFields = [
  'chiefComplaint',
  'temperature',
  'pulse',
  'respiration',
  'bloodPressure.systolic',
  'bloodPressure.diastolic',
]

// Helper text for sections
const isRequired = fieldName => requiredFields.includes(fieldName)

const sectionHelpers = {
  subjective: {
    chiefComplaint: 'Required - Main reason for seeking care',
    pain: 'Optional - Complete if patient reports pain',
    psychologicalStatus: 'Optional - Select all that apply',
    otherSymptoms: 'Optional - Any additional symptoms',
  },
  objective: {
    vitalSigns: 'Required - All vital signs must be documented',
    physicalExam: 'Required - Document pertinent findings',
    diagnosticResults: 'Optional - Include if available',
  },
}

// Handle the checkbox changes
const updatePsychologicalStatus = (option, checked) => {
  // Update the map
  formData.value.subjective.psychologicalStatusMap[option] = checked

  // Update the array for compatibility with existing code
  if (checked) {
    if (!formData.value.subjective.psychologicalStatus.includes(option)) {
      formData.value.subjective.psychologicalStatus.push(option)
    }
  } else {
    formData.value.subjective.psychologicalStatus =
      formData.value.subjective.psychologicalStatus.filter(
        item => item !== option
      )
  }
}

const updateEmotionalState = (option, checked) => {
  // Update the map
  formData.value.psychosocial.emotionalStateMap[option] = checked

  // Update the array for compatibility
  if (checked) {
    if (!formData.value.psychosocial.emotionalState.includes(option)) {
      formData.value.psychosocial.emotionalState.push(option)
    }
  } else {
    formData.value.psychosocial.emotionalState =
      formData.value.psychosocial.emotionalState.filter(item => item !== option)
  }
}
</script>

<template>
  <form @submit.prevent="handleSubmit" class="space-y-8">
    <!-- 1. Subjective Data -->
    <Card>
      <CardHeader>
        <h3 class="text-lg font-semibold">Subjective Data</h3>
        <p class="text-sm text-muted-foreground">
          Patient-reported symptoms and concerns
        </p>
      </CardHeader>
      <CardContent class="space-y-6">
        <!-- Chief Complaint -->
        <div class="space-y-2">
          <div class="flex items-center gap-2">
            <Label for="chief-complaint">Chief Complaint</Label>
            <span v-if="isRequired('chiefComplaint')" class="text-destructive"
              >*</span
            >
            <span class="text-xs text-muted-foreground">
              {{ sectionHelpers.subjective.chiefComplaint }}
            </span>
          </div>
          <Textarea
            id="chief-complaint"
            v-model="formData.subjective.chiefComplaint"
            placeholder="Describe the main issue or concern"
            rows="2"
            required
          />
        </div>

        <!-- Pain Assessment -->
        <div class="space-y-4">
          <div class="flex items-center gap-2">
            <Label>Pain Assessment</Label>
            <span class="text-xs text-muted-foreground">(Optional)</span>
            <span class="text-xs text-muted-foreground">
              {{ sectionHelpers.subjective.pain }}
            </span>
          </div>

          <!-- Checkbox to confirm if pain exists -->
          <div class="flex items-center space-x-2">
            <Checkbox
              id="pain-exists"
              v-model="formData.subjective.pain.exists"
            />
            <Label for="pain-exists">Patient reports pain</Label>
          </div>

          <!-- Show pain assessment fields -->
          <div
            v-if="formData.subjective.pain.exists"
            class="grid gap-4 sm:grid-cols-2"
          >
            <div class="space-y-2">
              <Label for="pain-location">Location</Label>
              <Input
                id="pain-location"
                v-model="formData.subjective.pain.location"
                placeholder="Where is the pain?"
              />
            </div>

            <div class="space-y-2">
              <Label for="pain-intensity">Intensity (0-10)</Label>
              <Input
                id="pain-intensity"
                type="number"
                min="0"
                max="10"
                v-model="formData.subjective.pain.intensity"
              />
            </div>

            <div class="space-y-2">
              <Label for="pain-quality">Quality</Label>
              <Select v-model="formData.subjective.pain.quality">
                <SelectTrigger>
                  <SelectValue placeholder="Select pain quality" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                    v-for="quality in painQualityOptions"
                    :key="quality"
                    :value="quality"
                  >
                    {{ quality }}
                  </SelectItem>
                </SelectContent>
              </Select>
              <!-- Text input for 'Other' pain quality -->
              <div
                v-if="formData.subjective.pain.quality === 'Other'"
                class="mt-2"
              >
                <Label for="pain-quality-other">Specify Pain Quality</Label>
                <Input
                  id="pain-quality-other"
                  v-model="formData.subjective.pain.qualityOther"
                  placeholder="Describe the pain quality"
                  class="mt-1"
                />
              </div>
            </div>

            <!-- Pain Factors -->
            <div class="space-y-2 sm:col-span-2">
              <Label for="alleviating-factors">Alleviating Factors</Label>
              <Textarea
                id="alleviating-factors"
                v-model="formData.subjective.pain.factors.alleviating"
                placeholder="What makes the pain better? (e.g., rest, medication, position change)"
                rows="2"
              />
            </div>

            <div class="space-y-2 sm:col-span-2">
              <Label for="aggravating-factors">Aggravating Factors</Label>
              <Textarea
                id="aggravating-factors"
                v-model="formData.subjective.pain.factors.aggravating"
                placeholder="What makes the pain worse? (e.g., movement, pressure, activities)"
                rows="2"
              />
            </div>
          </div>
        </div>

        <!-- Psychological Status -->
        <div class="space-y-4">
          <div class="flex items-center gap-2">
            <Label>Psychological Status</Label>
            <span class="text-xs text-muted-foreground">
              {{ sectionHelpers.subjective.psychologicalStatus }}
            </span>
          </div>
          <div class="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div
              v-for="option in psychologicalOptions"
              :key="option"
              class="flex items-center space-x-2"
            >
              <Checkbox
                :id="'psych-' + option.toLowerCase()"
                v-model="formData.subjective.psychologicalStatusMap[option]"
                @update:model-value="updatePsychologicalStatus(option, $event)"
              />
              <Label :for="'psych-' + option.toLowerCase()">{{ option }}</Label>
            </div>
          </div>
          <!-- Add text input for 'Other' psychological status -->
          <div
            v-if="formData.subjective.psychologicalStatusMap.Other"
            class="mt-2"
          >
            <Label for="psych-other">Specify Other Psychological Status</Label>
            <Input
              id="psych-other"
              v-model="formData.subjective.psychologicalOther"
              placeholder="Describe other psychological concerns"
              class="mt-1"
            />
          </div>
        </div>

        <!-- Other Symptoms -->
        <div class="space-y-2">
          <Label for="other-symptoms">Other Symptoms</Label>
          <Textarea
            id="other-symptoms"
            v-model="formData.subjective.otherSymptoms"
            placeholder="Describe any other symptoms or concerns"
            rows="2"
          />
        </div>
      </CardContent>
    </Card>

    <!-- 2. Objective Data -->
    <Card>
      <CardHeader>
        <h3 class="text-lg font-semibold">Objective Data</h3>
        <p class="text-sm text-muted-foreground">
          Observable and measurable findings
        </p>
      </CardHeader>
      <CardContent class="space-y-6">
        <!-- Vital Signs -->
        <div class="space-y-4">
          <div class="flex items-center gap-2">
            <Label>Vital Signs</Label>
            <span class="text-destructive">*</span>
            <span class="text-xs text-muted-foreground">
              {{ sectionHelpers.objective.vitalSigns }}
            </span>
          </div>
          <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div class="space-y-2">
              <div class="flex items-center gap-2">
                <Label for="temperature">Temperature (°C)</Label>
                <span v-if="isRequired('temperature')" class="text-destructive"
                  >*</span
                >
              </div>
              <Input
                id="temperature"
                type="number"
                step="0.1"
                v-model="formData.objective.vitalSigns.temperature"
                placeholder="36.5"
                required
              />
            </div>
            <div class="space-y-2">
              <div class="flex items-center gap-2">
                <Label for="pulse">Pulse (bpm)</Label>
                <span v-if="isRequired('pulse')" class="text-destructive"
                  >*</span
                >
              </div>
              <Input
                id="pulse"
                type="number"
                v-model="formData.objective.vitalSigns.pulse"
                placeholder="80"
                required
              />
            </div>
            <div class="space-y-2">
              <div class="flex items-center gap-2">
                <Label for="respiration">Respiration (rpm)</Label>
                <span v-if="isRequired('respiration')" class="text-destructive"
                  >*</span
                >
              </div>
              <Input
                id="respiration"
                type="number"
                v-model="formData.objective.vitalSigns.respiration"
                placeholder="16"
                required
              />
            </div>
            <div class="space-y-2">
              <Label>Blood Pressure (mmHg)</Label>
              <div class="flex gap-2">
                <Input
                  placeholder="120"
                  type="number"
                  v-model="formData.objective.vitalSigns.bloodPressure.systolic"
                  required
                />
                <span class="self-center">/</span>
                <Input
                  placeholder="80"
                  type="number"
                  v-model="
                    formData.objective.vitalSigns.bloodPressure.diastolic
                  "
                  required
                />
              </div>
            </div>
            <div class="space-y-2">
              <Label for="o2sat">O₂ Saturation (%)</Label>
              <Input
                id="o2sat"
                type="number"
                max="100"
                v-model="formData.objective.vitalSigns.oxygenSaturation"
                placeholder="98"
              />
            </div>
          </div>
        </div>

        <!-- Physical Examination -->
        <div class="space-y-2">
          <Label for="physical-exam">Physical Examination</Label>
          <Textarea
            id="physical-exam"
            v-model="formData.objective.physicalExam"
            placeholder="Document physical examination findings"
            rows="3"
          />
        </div>

        <!-- Diagnostic Results -->
        <div class="space-y-2">
          <Label for="diagnostic-results">Diagnostic Results</Label>
          <Textarea
            id="diagnostic-results"
            v-model="formData.objective.diagnosticResults"
            placeholder="Enter relevant lab results, imaging findings, etc."
            rows="3"
          />
        </div>
      </CardContent>
    </Card>

    <!-- 3. Functional Assessment -->
    <Card>
      <CardHeader>
        <h3 class="text-lg font-semibold">Functional Assessment</h3>
        <p class="text-sm text-muted-foreground">
          Evaluation of daily living activities
        </p>
      </CardHeader>
      <CardContent class="space-y-6">
        <!-- ADLs -->
        <div class="space-y-4">
          <Label>Activities of Daily Living (ADLs)</Label>
          <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div
              v-for="(value, key) in formData.functional.adl"
              :key="key"
              class="flex items-center space-x-2"
            >
              <Checkbox
                :id="'adl-' + key"
                v-model="formData.functional.adl[key]"
              />
              <Label :for="'adl-' + key">{{
                key.charAt(0).toUpperCase() + key.slice(1)
              }}</Label>
            </div>
          </div>
          <!-- Text input for 'Other' ADLs -->
          <div v-if="formData.functional.adl.other" class="mt-2">
            <Label for="adl-other">Specify Other ADLs</Label>
            <Input
              id="adl-other"
              v-model="formData.functional.adlOther"
              placeholder="Describe other ADLs"
              class="mt-1"
            />
          </div>
        </div>

        <!-- IADLs -->
        <div class="space-y-4">
          <Label>Instrumental Activities of Daily Living (IADLs)</Label>
          <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div
              v-for="(value, key) in formData.functional.iadl"
              :key="key"
              class="flex items-center space-x-2"
            >
              <Checkbox
                :id="'iadl-' + key"
                v-model="formData.functional.iadl[key]"
              />
              <Label :for="'iadl-' + key">{{
                key.charAt(0).toUpperCase() + key.slice(1)
              }}</Label>
            </div>
          </div>
          <!-- Text input for 'Other' IADLs -->
          <div v-if="formData.functional.iadl.other" class="mt-2">
            <Label for="iadl-other">Specify Other IADLs</Label>
            <Input
              id="iadl-other"
              v-model="formData.functional.iadlOther"
              placeholder="Describe other IADLs"
              class="mt-1"
            />
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- 4. Psychosocial Assessment -->
    <Card>
      <CardHeader>
        <div class="flex items-center gap-2">
          <h3 class="text-lg font-semibold">Psychosocial Assessment</h3>
          <span class="text-xs text-muted-foreground">(Optional)</span>
        </div>
        <p class="text-sm text-muted-foreground">
          Emotional and social well-being evaluation
        </p>
      </CardHeader>
      <CardContent class="space-y-6">
        <!-- Emotional State -->
        <div class="space-y-4">
          <Label>Emotional State</Label>
          <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            <div
              v-for="option in emotionalStateOptions"
              :key="option"
              class="flex items-center space-x-2"
            >
              <Checkbox
                :id="'emotional-' + option.toLowerCase()"
                v-model="formData.psychosocial.emotionalStateMap[option]"
                @update:model-value="updateEmotionalState(option, $event)"
              />
              <Label :for="'emotional-' + option.toLowerCase()">{{
                option
              }}</Label>
            </div>
          </div>
          <!-- Text input for 'Other' emotional state -->
          <div
            v-if="formData.psychosocial.emotionalStateMap.Other"
            class="mt-2"
          >
            <Label for="emotional-other">Specify Other Emotional State</Label>
            <Input
              id="emotional-other"
              v-model="formData.psychosocial.emotionalStateOther"
              placeholder="Describe other emotional state"
              class="mt-1"
            />
          </div>
        </div>

        <!-- Support Systems -->
        <div class="space-y-2">
          <div class="flex items-center gap-2">
            <Label for="support-systems">Support Systems</Label>
            <span class="text-xs text-muted-foreground">(Optional)</span>
          </div>
          <Textarea
            id="support-systems"
            v-model="formData.psychosocial.supportSystems"
            placeholder="Describe available family, friends, and community support"
            rows="2"
          />
        </div>

        <!-- Cultural Factors -->
        <div class="space-y-2">
          <div class="flex items-center gap-2">
            <Label for="cultural-factors">Cultural/Spiritual Factors</Label>
            <span class="text-xs text-muted-foreground">(Optional)</span>
          </div>
          <Textarea
            id="cultural-factors"
            v-model="formData.psychosocial.culturalFactors"
            placeholder="Note any relevant cultural or spiritual considerations that may influence care"
            rows="2"
          />
        </div>
      </CardContent>
    </Card>

    <!-- 5. Environmental Assessment -->
    <Card>
      <CardHeader>
        <h3 class="text-lg font-semibold">Environmental Assessment</h3>
        <p class="text-sm text-muted-foreground">
          Living conditions and environmental factors
        </p>
      </CardHeader>
      <CardContent>
        <div class="space-y-2">
          <Label for="environmental">Environmental Factors</Label>
          <Textarea
            id="environmental"
            v-model="formData.environmental"
            placeholder="Describe living conditions, safety concerns, etc."
            rows="3"
          />
        </div>
      </CardContent>
    </Card>

    <!-- 6. Risk Assessment -->
    <Card>
      <CardHeader>
        <h3 class="text-lg font-semibold">Risk Assessment</h3>
        <p class="text-sm text-muted-foreground">
          Identification of potential risks
        </p>
      </CardHeader>
      <CardContent class="space-y-6">
        <!-- Risk Checkboxes -->
        <div class="space-y-4">
          <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div class="flex items-center space-x-2">
              <Checkbox id="fall-risk" v-model="formData.risks.fallRisk" />
              <Label for="fall-risk">Fall Risk</Label>
            </div>
            <div class="flex items-center space-x-2">
              <Checkbox
                id="pressure-ulcer-risk"
                v-model="formData.risks.pressureUlcerRisk"
              />
              <Label for="pressure-ulcer-risk">Pressure Ulcer Risk</Label>
            </div>
            <div class="flex items-center space-x-2">
              <Checkbox
                id="infection-risk"
                v-model="formData.risks.infectionRisk"
              />
              <Label for="infection-risk">Infection Risk</Label>
            </div>
          </div>
        </div>

        <!-- Other Risks -->
        <div class="space-y-2">
          <Label for="other-risks">Other Risks</Label>
          <Textarea
            id="other-risks"
            v-model="formData.risks.otherRisks"
            placeholder="Describe any other potential risks"
            rows="2"
          />
        </div>
      </CardContent>
    </Card>

    <!-- Submit Button -->
    <div class="flex flex-col gap-2 items-end">
      <p class="text-sm text-muted-foreground">
        <span class="text-destructive">*</span> Required fields
      </p>
      <Button type="submit" size="lg">Generate NCPs</Button>
    </div>
  </form>
</template>

<style scoped>
.required-field {
  @apply after:content-['*'] after:ml-0.5 after:text-destructive;
}
</style>
