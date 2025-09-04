<script setup>
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { comprehensiveAssessmentSchema } from '@/schemas/assessmentSchemas'
import { vAutoAnimate } from '@formkit/auto-animate/vue'
import { toTypedSchema } from '@vee-validate/zod'
import {
  Activity,
  Calendar,
  Heart,
  Stethoscope,
  Thermometer,
  User,
} from 'lucide-vue-next'
import { useForm } from 'vee-validate'
import { ref } from 'vue'

const emit = defineEmits(['submit'])

const form = useForm({
  validationSchema: toTypedSchema(comprehensiveAssessmentSchema),
  initialValues: {
    demographics: {
      age: undefined,
      sex: undefined,
      occupation: '',
    },
    chief_complaint: '',
    history: {
      onset_duration: '',
      severity: '',
      associated_symptoms: [],
      other_symptoms: '',
    },
    medical_history: [],
    medical_history_other: '',
    vital_signs: {
      HR: undefined,
      BP: '',
      RR: undefined,
      SpO2: undefined,
      Temp: undefined,
    },
    physical_exam: [],
    physical_exam_other: '',
    risk_factors: [],
    risk_factors_other: '',
    nurse_notes: '',
  },
})

// Options for multi-select checkboxes
const associatedSymptomsOptions = [
  'Shortness of breath',
  'Chest pain',
  'Fatigue',
  'Dizziness',
  'Nausea/vomiting',
]

const medicalHistoryOptions = [
  'Hypertension',
  'Diabetes mellitus',
  'COPD/asthma',
  'Heart disease',
  'Kidney disease',
  'Immunocompromised condition',
]

const physicalExamOptions = [
  'Respiratory: Crackles',
  'Respiratory: Wheezing',
  'Respiratory: Diminished breath sounds',
  'Cardiac: Irregular rhythm',
  'Cardiac: Edema',
  'Cardiac: Cyanosis',
  'Mobility: Limited ROM',
  'Mobility: Bedridden',
  'Mobility: Weak gait',
  'Skin: Intact',
  'Skin: Pressure ulcer',
  'Skin: Pallor',
]

const riskFactorsOptions = [
  'Surgery (recent)',
  'Indwelling catheter',
  'Prolonged immobility',
  'Smoking',
  'Malnutrition',
  'Advanced age',
]

// Track expanded sections
const expandedSections = ref({
  demographics: true,
  chief_complaint: true,
  history: false,
  medical_history: false,
  vital_signs: false,
  physical_exam: false,
  risk_factors: false,
  nurse_notes: false,
})

const toggleSection = section => {
  expandedSections.value[section] = !expandedSections.value[section]
}

const onSubmit = form.handleSubmit(values => {
  // Clean and format the data for the backend
  const formattedData = {
    demographics: {
      age: values.demographics.age,
      sex: values.demographics.sex,
      occupation: values.demographics.occupation || '',
    },
    chief_complaint: values.chief_complaint,
    history: {
      onset_duration: values.history.onset_duration || '',
      severity: values.history.severity || '',
      associated_symptoms: [
        ...(values.history.associated_symptoms || []),
        ...(values.history.other_symptoms
          ? [values.history.other_symptoms]
          : []),
      ].filter(Boolean),
    },
    medical_history: [
      ...(values.medical_history || []),
      ...(values.medical_history_other ? [values.medical_history_other] : []),
    ].filter(Boolean),
    vital_signs: {
      HR: values.vital_signs.HR,
      BP: values.vital_signs.BP || '',
      RR: values.vital_signs.RR,
      SpO2: values.vital_signs.SpO2,
      Temp: values.vital_signs.Temp,
    },
    physical_exam: [
      ...(values.physical_exam || []),
      ...(values.physical_exam_other ? [values.physical_exam_other] : []),
    ].filter(Boolean),
    risk_factors: [
      ...(values.risk_factors || []),
      ...(values.risk_factors_other ? [values.risk_factors_other] : []),
    ].filter(Boolean),
    nurse_notes: values.nurse_notes || '',
  }

  console.log('Structured Assessment Data:', formattedData)
  emit('submit', formattedData)
})
</script>

<template>
  <form @submit="onSubmit" class="space-y-6">
    <!-- Section 1: Patient Demographics -->
    <div class="border rounded-lg">
      <button
        type="button"
        @click="toggleSection('demographics')"
        class="w-full flex items-center justify-between p-4 hover:bg-muted transition-colors"
      >
        <div class="flex items-center gap-3">
          <User class="w-5 h-5 text-primary" />
          <h3 class="text-lg font-semibold">
            Patient Demographics
            <span class="text-destructive ml-1">*</span>
          </h3>
        </div>
        <div class="text-muted-foreground">
          {{ expandedSections.demographics ? '−' : '+' }}
        </div>
      </button>

      <div
        v-if="expandedSections.demographics"
        v-auto-animate
        class="p-4 pt-0 space-y-4"
      >
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            name="demographics.age"
            v-slot="{ componentField, errorMessage }"
          >
            <FormItem>
              <FormLabel>Age <span class="text-destructive">*</span></FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="Enter age"
                  v-bind="componentField"
                  min="0"
                  max="150"
                />
              </FormControl>
              <FormMessage v-if="errorMessage">{{ errorMessage }}</FormMessage>
            </FormItem>
          </FormField>

          <FormField
            name="demographics.sex"
            v-slot="{ componentField, errorMessage }"
          >
            <FormItem>
              <FormLabel>Sex <span class="text-destructive">*</span></FormLabel>
              <Select v-bind="componentField">
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select sex" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage v-if="errorMessage">{{ errorMessage }}</FormMessage>
            </FormItem>
          </FormField>

          <FormField name="demographics.occupation" v-slot="{ componentField }">
            <FormItem>
              <FormLabel>Occupation</FormLabel>
              <FormControl>
                <Input placeholder="Enter occupation" v-bind="componentField" />
              </FormControl>
            </FormItem>
          </FormField>
        </div>
      </div>
    </div>

    <!-- Section 2: Chief Complaint -->
    <div class="border rounded-lg">
      <button
        type="button"
        @click="toggleSection('chief_complaint')"
        class="w-full flex items-center justify-between p-4 hover:bg-muted transition-colors"
      >
        <div class="flex items-center gap-3">
          <Stethoscope class="w-5 h-5 text-primary" />
          <h3 class="text-lg font-semibold">
            Chief Complaint
            <span class="text-destructive ml-1">*</span>
          </h3>
        </div>
        <div class="text-muted-foreground">
          {{ expandedSections.chief_complaint ? '−' : '+' }}
        </div>
      </button>

      <div
        v-if="expandedSections.chief_complaint"
        v-auto-animate
        class="p-4 pt-0"
      >
        <FormField
          name="chief_complaint"
          v-slot="{ componentField, errorMessage }"
        >
          <FormItem>
            <FormLabel
              >What brings the patient in today?
              <span class="text-destructive">*</span></FormLabel
            >
            <FormControl>
              <Input
                placeholder="Brief description of primary concern"
                v-bind="componentField"
              />
            </FormControl>
            <FormMessage v-if="errorMessage">{{ errorMessage }}</FormMessage>
          </FormItem>
        </FormField>
      </div>
    </div>

    <!-- Section 3: History of Present Illness -->
    <div class="border rounded-lg">
      <button
        type="button"
        @click="toggleSection('history')"
        class="w-full flex items-center justify-between p-4 hover:bg-muted transition-colors"
      >
        <div class="flex items-center gap-3">
          <Calendar class="w-5 h-5 text-primary" />
          <h3 class="text-lg font-semibold">History of Present Illness</h3>
        </div>
        <div class="text-muted-foreground">
          {{ expandedSections.history ? '−' : '+' }}
        </div>
      </button>

      <div
        v-if="expandedSections.history"
        v-auto-animate
        class="p-4 pt-0 space-y-4"
      >
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField name="history.onset_duration" v-slot="{ componentField }">
            <FormItem>
              <FormLabel>Onset & Duration</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., 3 days ago, sudden onset"
                  v-bind="componentField"
                />
              </FormControl>
            </FormItem>
          </FormField>

          <FormField name="history.severity" v-slot="{ componentField }">
            <FormItem>
              <FormLabel>Severity / Progression</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., worsening, stable, improving"
                  v-bind="componentField"
                />
              </FormControl>
            </FormItem>
          </FormField>
        </div>

        <FormField
          name="history.associated_symptoms"
          v-slot="{ value, setValue }"
        >
          <FormItem>
            <FormLabel>Associated Symptoms</FormLabel>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div
                v-for="symptom in associatedSymptomsOptions"
                :key="symptom"
                class="flex items-center space-x-2"
              >
                <Checkbox
                  :id="symptom"
                  :checked="value?.includes(symptom)"
                  @update:checked="
                    checked => {
                      const currentValue = value || []
                      if (checked) {
                        setValue([...currentValue, symptom])
                      } else {
                        setValue(currentValue.filter(v => v !== symptom))
                      }
                    }
                  "
                />
                <FormLabel :for="symptom" class="text-sm font-normal">
                  {{ symptom }}
                </FormLabel>
              </div>
            </div>
          </FormItem>
        </FormField>

        <FormField name="history.other_symptoms" v-slot="{ componentField }">
          <FormItem>
            <FormLabel>Other Symptoms</FormLabel>
            <FormControl>
              <Input
                placeholder="Additional symptoms not listed above"
                v-bind="componentField"
              />
            </FormControl>
          </FormItem>
        </FormField>
      </div>
    </div>

    <!-- Section 4: Past Medical History -->
    <div class="border rounded-lg">
      <button
        type="button"
        @click="toggleSection('medical_history')"
        class="w-full flex items-center justify-between p-4 hover:bg-muted transition-colors"
      >
        <div class="flex items-center gap-3">
          <Heart class="w-5 h-5 text-primary" />
          <h3 class="text-lg font-semibold">Past Medical History</h3>
        </div>
        <div class="text-muted-foreground">
          {{ expandedSections.medical_history ? '−' : '+' }}
        </div>
      </button>

      <div
        v-if="expandedSections.medical_history"
        v-auto-animate
        class="p-4 pt-0 space-y-4"
      >
        <FormField name="medical_history" v-slot="{ value, setValue }">
          <FormItem>
            <FormLabel>Medical History</FormLabel>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div
                v-for="condition in medicalHistoryOptions"
                :key="condition"
                class="flex items-center space-x-2"
              >
                <Checkbox
                  :id="condition"
                  :checked="value?.includes(condition)"
                  @update:checked="
                    checked => {
                      const currentValue = value || []
                      if (checked) {
                        setValue([...currentValue, condition])
                      } else {
                        setValue(currentValue.filter(v => v !== condition))
                      }
                    }
                  "
                />
                <FormLabel :for="condition" class="text-sm font-normal">
                  {{ condition }}
                </FormLabel>
              </div>
            </div>
          </FormItem>
        </FormField>

        <FormField name="medical_history_other" v-slot="{ componentField }">
          <FormItem>
            <FormLabel>Other Medical History</FormLabel>
            <FormControl>
              <Input
                placeholder="Additional medical conditions"
                v-bind="componentField"
              />
            </FormControl>
          </FormItem>
        </FormField>
      </div>
    </div>

    <!-- Section 5: Vital Signs -->
    <div class="border rounded-lg">
      <button
        type="button"
        @click="toggleSection('vital_signs')"
        class="w-full flex items-center justify-between p-4 hover:bg-muted transition-colors"
      >
        <div class="flex items-center gap-3">
          <Thermometer class="w-5 h-5 text-primary" />
          <h3 class="text-lg font-semibold">Vital Signs</h3>
        </div>
        <div class="text-muted-foreground">
          {{ expandedSections.vital_signs ? '−' : '+' }}
        </div>
      </button>

      <div v-if="expandedSections.vital_signs" v-auto-animate class="p-4 pt-0">
        <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <FormField
            name="vital_signs.HR"
            v-slot="{ componentField, errorMessage }"
          >
            <FormItem>
              <FormLabel>HR (bpm)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="80"
                  v-bind="componentField"
                  min="0"
                  max="300"
                />
              </FormControl>
              <FormMessage v-if="errorMessage">{{ errorMessage }}</FormMessage>
            </FormItem>
          </FormField>

          <FormField
            name="vital_signs.BP"
            v-slot="{ componentField, errorMessage }"
          >
            <FormItem>
              <FormLabel>BP (mmHg)</FormLabel>
              <FormControl>
                <Input
                  placeholder="120/80"
                  v-bind="componentField"
                  pattern="[0-9]+/[0-9]+"
                  title="Enter blood pressure in format: 120/80"
                />
              </FormControl>
              <FormMessage v-if="errorMessage">{{ errorMessage }}</FormMessage>
            </FormItem>
          </FormField>

          <FormField
            name="vital_signs.RR"
            v-slot="{ componentField, errorMessage }"
          >
            <FormItem>
              <FormLabel>RR (/min)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="16"
                  v-bind="componentField"
                  min="0"
                  max="60"
                />
              </FormControl>
              <FormMessage v-if="errorMessage">{{ errorMessage }}</FormMessage>
            </FormItem>
          </FormField>

          <FormField
            name="vital_signs.SpO2"
            v-slot="{ componentField, errorMessage }"
          >
            <FormItem>
              <FormLabel>SpO₂ (%)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="98"
                  v-bind="componentField"
                  min="0"
                  max="100"
                />
              </FormControl>
              <FormMessage v-if="errorMessage">{{ errorMessage }}</FormMessage>
            </FormItem>
          </FormField>

          <FormField
            name="vital_signs.Temp"
            v-slot="{ componentField, errorMessage }"
          >
            <FormItem>
              <FormLabel>Temp (°C)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="37.0"
                  v-bind="componentField"
                  min="20"
                  max="50"
                />
              </FormControl>
              <FormMessage v-if="errorMessage">{{ errorMessage }}</FormMessage>
            </FormItem>
          </FormField>
        </div>
      </div>
    </div>

    <!-- Section 6: Physical Examination -->
    <div class="border rounded-lg">
      <button
        type="button"
        @click="toggleSection('physical_exam')"
        class="w-full flex items-center justify-between p-4 hover:bg-muted transition-colors"
      >
        <div class="flex items-center gap-3">
          <Activity class="w-5 h-5 text-primary" />
          <h3 class="text-lg font-semibold">Physical Examination Findings</h3>
        </div>
        <div class="text-muted-foreground">
          {{ expandedSections.physical_exam ? '−' : '+' }}
        </div>
      </button>

      <div
        v-if="expandedSections.physical_exam"
        v-auto-animate
        class="p-4 pt-0 space-y-4"
      >
        <FormField name="physical_exam" v-slot="{ value, setValue }">
          <FormItem>
            <FormLabel>Physical Examination Findings</FormLabel>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div
                v-for="finding in physicalExamOptions"
                :key="finding"
                class="flex items-center space-x-2"
              >
                <Checkbox
                  :id="finding"
                  :checked="value?.includes(finding)"
                  @update:checked="
                    checked => {
                      const currentValue = value || []
                      if (checked) {
                        setValue([...currentValue, finding])
                      } else {
                        setValue(currentValue.filter(v => v !== finding))
                      }
                    }
                  "
                />
                <FormLabel :for="finding" class="text-sm font-normal">
                  {{ finding }}
                </FormLabel>
              </div>
            </div>
          </FormItem>
        </FormField>

        <FormField name="physical_exam_other" v-slot="{ componentField }">
          <FormItem>
            <FormLabel>Other Physical Findings</FormLabel>
            <FormControl>
              <Input
                placeholder="Additional examination findings"
                v-bind="componentField"
              />
            </FormControl>
          </FormItem>
        </FormField>
      </div>
    </div>

    <!-- Section 7: Risk Factors -->
    <div class="border rounded-lg">
      <button
        type="button"
        @click="toggleSection('risk_factors')"
        class="w-full flex items-center justify-between p-4 hover:bg-muted transition-colors"
      >
        <div class="flex items-center gap-3">
          <Activity class="w-5 h-5 text-primary" />
          <h3 class="text-lg font-semibold">Risk Factors</h3>
        </div>
        <div class="text-muted-foreground">
          {{ expandedSections.risk_factors ? '−' : '+' }}
        </div>
      </button>

      <div
        v-if="expandedSections.risk_factors"
        v-auto-animate
        class="p-4 pt-0 space-y-4"
      >
        <FormField name="risk_factors" v-slot="{ value, setValue }">
          <FormItem>
            <FormLabel>Risk Factors</FormLabel>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div
                v-for="factor in riskFactorsOptions"
                :key="factor"
                class="flex items-center space-x-2"
              >
                <Checkbox
                  :id="factor"
                  :checked="value?.includes(factor)"
                  @update:checked="
                    checked => {
                      const currentValue = value || []
                      if (checked) {
                        setValue([...currentValue, factor])
                      } else {
                        setValue(currentValue.filter(v => v !== factor))
                      }
                    }
                  "
                />
                <FormLabel :for="factor" class="text-sm font-normal">
                  {{ factor }}
                </FormLabel>
              </div>
            </div>
          </FormItem>
        </FormField>

        <FormField name="risk_factors_other" v-slot="{ componentField }">
          <FormItem>
            <FormLabel>Other Risk Factors</FormLabel>
            <FormControl>
              <Input
                placeholder="Additional risk factors"
                v-bind="componentField"
              />
            </FormControl>
          </FormItem>
        </FormField>
      </div>
    </div>

    <!-- Section 8: Nurse's Notes -->
    <div class="border rounded-lg">
      <button
        type="button"
        @click="toggleSection('nurse_notes')"
        class="w-full flex items-center justify-between p-4 hover:bg-muted transition-colors"
      >
        <div class="flex items-center gap-3">
          <Activity class="w-5 h-5 text-primary" />
          <h3 class="text-lg font-semibold">Nurse's Notes</h3>
        </div>
        <div class="text-muted-foreground">
          {{ expandedSections.nurse_notes ? '−' : '+' }}
        </div>
      </button>

      <div v-if="expandedSections.nurse_notes" v-auto-animate class="p-4 pt-0">
        <FormField name="nurse_notes" v-slot="{ componentField }">
          <FormItem>
            <FormLabel>Additional Notes</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Any additional observations or notes..."
                v-bind="componentField"
                class="min-h-24"
              />
            </FormControl>
            <FormDescription>
              Include any additional relevant observations, patient behaviors,
              or contextual information.
            </FormDescription>
          </FormItem>
        </FormField>
      </div>
    </div>

    <!-- Submit Button -->
    <div class="flex justify-end pt-6">
      <Button
        type="submit"
        class="px-8 py-3 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg shadow-lg"
      >
        Submit
      </Button>
    </div>
  </form>
</template>
