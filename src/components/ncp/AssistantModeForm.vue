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
  ChevronDown,
  Heart,
  PencilLine,
  ShieldAlert,
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
      age: null,
      sex: '',
      occupation: '',
      religion: '',
      cultural_background: '',
      language: '',
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
      HR: null,
      BP: '',
      RR: null,
      SpO2: null,
      Temp: null,
      additional_vitals: {},
    },
    physical_exam: [],
    physical_exam_other: '',
    risk_factors: [],
    risk_factors_other: '',
    cultural_considerations: {
      dietary_restrictions: '',
      religious_practices: '',
      communication_preferences: '',
      family_involvement: '',
      health_beliefs: '',
      other_considerations: '',
    },
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
  'COPD',
  'Asthma',
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

// Section configuration
const sections = [
  {
    key: 'demographics',
    title: 'Patient Demographics',
    icon: User,
    required: true,
    type: 'demographics',
  },
  {
    key: 'chief_complaint',
    title: 'Chief Complaint',
    icon: Stethoscope,
    required: true,
    type: 'single_input',
    fieldName: 'chief_complaint',
    label: 'What brings the patient in today?',
    placeholder: 'Brief description of primary concern',
  },
  {
    key: 'history',
    title: 'History of Present Illness',
    icon: Calendar,
    required: false,
    type: 'history',
  },
  {
    key: 'medical_history',
    title: 'Past Medical History',
    icon: Heart,
    required: false,
    type: 'checkbox_with_other',
    fieldName: 'medical_history',
    otherFieldName: 'medical_history_other',
    label: 'Medical History',
    otherLabel: 'Other Medical History',
    otherPlaceholder: 'Additional medical conditions',
    options: medicalHistoryOptions,
  },
  {
    key: 'vital_signs',
    title: 'Vital Signs',
    icon: Thermometer,
    required: false,
    type: 'vital_signs',
  },
  {
    key: 'physical_exam',
    title: 'Physical Examination Findings',
    icon: Activity,
    required: false,
    type: 'checkbox_with_other',
    fieldName: 'physical_exam',
    otherFieldName: 'physical_exam_other',
    label: 'Physical Examination Findings',
    otherLabel: 'Other Physical Findings',
    otherPlaceholder: 'Additional examination findings',
    options: physicalExamOptions,
  },
  {
    key: 'risk_factors',
    title: 'Risk Factors',
    icon: ShieldAlert,
    required: false,
    type: 'checkbox_with_other',
    fieldName: 'risk_factors',
    otherFieldName: 'risk_factors_other',
    label: 'Risk Factors',
    otherLabel: 'Other Risk Factors',
    otherPlaceholder: 'Additional risk factors',
    options: riskFactorsOptions,
  },
  {
    key: 'nurse_notes',
    title: "Nurse's Notes",
    icon: PencilLine,
    required: false,
    type: 'textarea',
    fieldName: 'nurse_notes',
    label: 'Additional Notes',
    placeholder: 'Any additional observations or notes...',
    description:
      'Include any additional relevant observations, patient behaviors, or contextual information.',
  },
]

const toggleSection = section => {
  expandedSections.value[section] = !expandedSections.value[section]
}

const onSubmit = form.handleSubmit(values => {
  const formattedData = {
    demographics: {
      age: values.demographics?.age ? Number(values.demographics.age) : null,
      sex: values.demographics?.sex || '',
      occupation: values.demographics?.occupation || '',
      religion: values.demographics?.religion || '',
      cultural_background: values.demographics?.cultural_background || '',
      language: values.demographics?.language || '',
    },
    chief_complaint: values.chief_complaint || '',
    history: {
      onset_duration: values.history?.onset_duration || '',
      severity: values.history?.severity || '',
      associated_symptoms: [
        ...(values.history?.associated_symptoms || []),
        ...(values.history?.other_symptoms
          ? [values.history.other_symptoms]
          : []),
      ].filter(Boolean),
      other_symptoms: values.history?.other_symptoms || '',
    },
    medical_history: Array.isArray(values.medical_history)
      ? values.medical_history
      : [],
    medical_history_other: values.medical_history_other || '',
    vital_signs: {
      HR: values.vital_signs?.HR ? Number(values.vital_signs.HR) : null,
      BP: values.vital_signs?.BP || '',
      RR: values.vital_signs?.RR ? Number(values.vital_signs.RR) : null,
      SpO2: values.vital_signs?.SpO2 ? Number(values.vital_signs.SpO2) : null,
      Temp: values.vital_signs?.Temp ? Number(values.vital_signs.Temp) : null,
      additional_vitals: values.vital_signs?.additional_vitals || {},
    },
    physical_exam: Array.isArray(values.physical_exam)
      ? values.physical_exam
      : [],
    physical_exam_other: values.physical_exam_other || '',
    risk_factors: Array.isArray(values.risk_factors) ? values.risk_factors : [],
    risk_factors_other: values.risk_factors_other || '',
    cultural_considerations: {
      dietary_restrictions:
        values.cultural_considerations?.dietary_restrictions || '',
      religious_practices:
        values.cultural_considerations?.religious_practices || '',
      communication_preferences:
        values.cultural_considerations?.communication_preferences || '',
      family_involvement:
        values.cultural_considerations?.family_involvement || '',
      health_beliefs: values.cultural_considerations?.health_beliefs || '',
      other_considerations:
        values.cultural_considerations?.other_considerations || '',
    },
    nurse_notes: values.nurse_notes || '',
  }

  emit('submit', formattedData)
})
</script>

<template>
  <form @submit="onSubmit" class="space-y-6">
    <!-- Dynamic Sections Loop -->
    <div
      v-for="section in sections"
      :key="section.key"
      class="border rounded-lg overflow-hidden transition-all duration-200 hover:shadow-md"
    >
      <!-- Section Header (Universal) -->
      <button
        type="button"
        @click="toggleSection(section.key)"
        class="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors duration-200"
      >
        <div class="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <component
            :is="section.icon"
            class="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0"
          />
          <h3 class="text-sm sm:text-lg font-semibold truncate">
            {{ section.title }}
            <span v-if="section.required" class="text-destructive ml-1">*</span>
          </h3>
        </div>
        <div
          class="text-muted-foreground transition-transform duration-200 flex-shrink-0 ml-2"
          :class="{ 'rotate-180': expandedSections[section.key] }"
        >
          <ChevronDown class="w-4 h-4" />
        </div>
      </button>

      <!-- Section Content (Conditional based on type) -->
      <div
        class="transition-all duration-300 ease-in-out"
        :class="{
          'max-h-0 opacity-0': !expandedSections[section.key],
          'max-h-[1000px] opacity-100': expandedSections[section.key],
        }"
      >
        <!-- Demographics Section -->
        <div
          v-if="section.type === 'demographics'"
          v-auto-animate
          class="p-4 pt-0 space-y-4"
        >
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              name="demographics.age"
              v-slot="{ componentField, errorMessage }"
            >
              <FormItem v-auto-animate>
                <FormLabel>Age</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="Enter age"
                    v-bind="componentField"
                    min="0"
                    max="150"
                  />
                </FormControl>
                <FormMessage v-if="errorMessage">{{
                  errorMessage
                }}</FormMessage>
              </FormItem>
            </FormField>

            <FormField
              name="demographics.sex"
              v-slot="{ componentField, errorMessage }"
            >
              <FormItem v-auto-animate>
                <FormLabel
                  >Sex <span class="text-destructive">*</span></FormLabel
                >
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
                <FormMessage v-if="errorMessage">{{
                  errorMessage
                }}</FormMessage>
              </FormItem>
            </FormField>

            <FormField
              name="demographics.occupation"
              v-slot="{ componentField }"
            >
              <FormItem v-auto-animate>
                <FormLabel>Occupation</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter occupation"
                    v-bind="componentField"
                  />
                </FormControl>
              </FormItem>
            </FormField>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField name="demographics.religion" v-slot="{ componentField }">
              <FormItem v-auto-animate>
                <FormLabel>Religion</FormLabel>
                <FormControl>
                  <Input placeholder="Enter religion" v-bind="componentField" />
                </FormControl>
              </FormItem>
            </FormField>

            <FormField
              name="demographics.cultural_background"
              v-slot="{ componentField }"
            >
              <FormItem v-auto-animate>
                <FormLabel>Cultural Background</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter cultural background"
                    v-bind="componentField"
                  />
                </FormControl>
              </FormItem>
            </FormField>

            <FormField name="demographics.language" v-slot="{ componentField }">
              <FormItem v-auto-animate>
                <FormLabel>Language</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Preferred language"
                    v-bind="componentField"
                  />
                </FormControl>
              </FormItem>
            </FormField>
          </div>
        </div>

        <!-- Single Input Section -->
        <div
          v-else-if="section.type === 'single_input'"
          v-auto-animate
          class="p-4 pt-0"
        >
          <FormField
            :name="section.fieldName"
            v-slot="{ componentField, errorMessage }"
          >
            <FormItem v-auto-animate>
              <FormLabel>
                {{ section.label }}
                <span v-if="section.required" class="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  :placeholder="section.placeholder"
                  v-bind="componentField"
                />
              </FormControl>
              <FormMessage v-if="errorMessage">{{ errorMessage }}</FormMessage>
            </FormItem>
          </FormField>
        </div>

        <!-- History Section -->
        <div
          v-else-if="section.type === 'history'"
          v-auto-animate
          class="p-4 pt-0 space-y-4"
        >
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              name="history.onset_duration"
              v-slot="{ componentField }"
            >
              <FormItem v-auto-animate>
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
              <FormItem v-auto-animate>
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

          <FormField name="history.associated_symptoms" v-slot="{ value }">
            <FormItem v-auto-animate>
              <FormLabel>Associated Symptoms</FormLabel>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
                <label
                  v-for="symptom in associatedSymptomsOptions"
                  :key="symptom"
                  :for="`history-${symptom}`"
                  class="flex items-center space-x-2 group hover:bg-muted/50 p-2 rounded-md transition-colors cursor-pointer"
                >
                  <Checkbox
                    :id="`history-${symptom}`"
                    :model-value="(value || []).includes(symptom)"
                    @update:model-value="
                      checked => {
                        const currentValue = value || []
                        if (checked) {
                          const newValue = [...currentValue, symptom]
                          form.setFieldValue(
                            'history.associated_symptoms',
                            newValue
                          )
                        } else {
                          const newValue = currentValue.filter(
                            v => v !== symptom
                          )
                          form.setFieldValue(
                            'history.associated_symptoms',
                            newValue
                          )
                        }
                      }
                    "
                  />
                  <span
                    class="text-sm font-normal select-none flex-1 group-hover:text-foreground transition-colors"
                  >
                    {{ symptom }}
                  </span>
                </label>
              </div>
            </FormItem>
          </FormField>

          <FormField name="history.other_symptoms" v-slot="{ componentField }">
            <FormItem v-auto-animate>
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

        <!-- Vital Signs Section -->
        <div
          v-else-if="section.type === 'vital_signs'"
          v-auto-animate
          class="p-4 pt-0"
        >
          <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <FormField
              name="vital_signs.HR"
              v-slot="{ componentField, errorMessage }"
            >
              <FormItem v-auto-animate>
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
                <FormMessage v-if="errorMessage">{{
                  errorMessage
                }}</FormMessage>
              </FormItem>
            </FormField>

            <FormField
              name="vital_signs.BP"
              v-slot="{ componentField, errorMessage }"
            >
              <FormItem v-auto-animate>
                <FormLabel>BP (mmHg)</FormLabel>
                <FormControl>
                  <Input
                    placeholder="120/80"
                    v-bind="componentField"
                    pattern="[0-9]+/[0-9]+"
                    title="Enter blood pressure in format: 120/80"
                  />
                </FormControl>
                <FormMessage v-if="errorMessage">{{
                  errorMessage
                }}</FormMessage>
              </FormItem>
            </FormField>

            <FormField
              name="vital_signs.RR"
              v-slot="{ componentField, errorMessage }"
            >
              <FormItem v-auto-animate>
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
                <FormMessage v-if="errorMessage">{{
                  errorMessage
                }}</FormMessage>
              </FormItem>
            </FormField>

            <FormField
              name="vital_signs.SpO2"
              v-slot="{ componentField, errorMessage }"
            >
              <FormItem v-auto-animate>
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
                <FormMessage v-if="errorMessage">{{
                  errorMessage
                }}</FormMessage>
              </FormItem>
            </FormField>

            <FormField
              name="vital_signs.Temp"
              v-slot="{ componentField, errorMessage }"
            >
              <FormItem v-auto-animate>
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
                <FormMessage v-if="errorMessage">{{
                  errorMessage
                }}</FormMessage>
              </FormItem>
            </FormField>
          </div>
        </div>

        <!-- Checkbox with Other Section -->
        <div
          v-else-if="section.type === 'checkbox_with_other'"
          v-auto-animate
          class="p-4 pt-0 space-y-4"
        >
          <FormField :name="section.fieldName" v-slot="{ value }">
            <FormItem v-auto-animate>
              <FormLabel>{{ section.label }}</FormLabel>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
                <label
                  v-for="option in section.options"
                  :key="option"
                  :for="`${section.key}-${option}`"
                  class="flex items-center space-x-2 group hover:bg-muted/50 p-2 rounded-md transition-colors cursor-pointer"
                >
                  <Checkbox
                    :id="`${section.key}-${option}`"
                    :model-value="(value || []).includes(option)"
                    @update:model-value="
                      checked => {
                        const currentValue = value || []
                        if (checked) {
                          const newValue = [...currentValue, option]
                          form.setFieldValue(section.fieldName, newValue)
                        } else {
                          const newValue = currentValue.filter(
                            v => v !== option
                          )
                          form.setFieldValue(section.fieldName, newValue)
                        }
                      }
                    "
                  />
                  <span
                    class="text-sm font-normal select-none flex-1 group-hover:text-foreground transition-colors"
                  >
                    {{ option }}
                  </span>
                </label>
              </div>
            </FormItem>
          </FormField>

          <FormField :name="section.otherFieldName" v-slot="{ componentField }">
            <FormItem v-auto-animate>
              <FormLabel>{{ section.otherLabel }}</FormLabel>
              <FormControl>
                <Input
                  :placeholder="section.otherPlaceholder"
                  v-bind="componentField"
                />
              </FormControl>
            </FormItem>
          </FormField>
        </div>

        <!-- Textarea Section -->
        <div
          v-else-if="section.type === 'textarea'"
          v-auto-animate
          class="p-4 pt-0"
        >
          <FormField :name="section.fieldName" v-slot="{ componentField }">
            <FormItem v-auto-animate>
              <FormLabel>{{ section.label }}</FormLabel>
              <FormControl>
                <Textarea
                  :placeholder="section.placeholder"
                  v-bind="componentField"
                  class="min-h-24"
                />
              </FormControl>
              <FormDescription v-if="section.description">
                {{ section.description }}
              </FormDescription>
            </FormItem>
          </FormField>
        </div>
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
