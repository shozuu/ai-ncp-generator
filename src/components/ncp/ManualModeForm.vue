<script setup>
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
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
import { manualModeSchema } from '@/schemas/assessmentSchemas'
import { vAutoAnimate } from '@formkit/auto-animate/vue'
import { toTypedSchema } from '@vee-validate/zod'
import {
  Activity,
  ChevronDown,
  Clipboard,
  FileText,
  FlaskConical,
  Heart,
  Thermometer,
  User,
  Users,
} from 'lucide-vue-next'
import { useForm } from 'vee-validate'
import { ref } from 'vue'
import Textarea from '../ui/textarea/Textarea.vue'

const emit = defineEmits(['submit'])

const props = defineProps({
  disabled: {
    type: Boolean,
    default: false,
  },
})

const form = useForm({
  validationSchema: toTypedSchema(manualModeSchema),
})

// Collapsible section state management
const sectionStates = ref({
  demographics: true, // Start with demographics expanded
  chiefComplaint: false,
  presentIllness: false,
  riskFactors: false,
  medicalHistory: false,
  familyHistory: false,
  vitalSigns: false,
  physicalExam: false,
  labFindings: false,
  subjective: false, // Keep subjective expanded as it's part of original form
  objective: false, // Keep objective expanded as it's part of original form
})

// Checkbox options arrays
const associatedSymptomsOptions = [
  'shortness of breath',
  'fatigue',
  'nausea',
  'vomiting',
  'chest pain',
  'dizziness',
]

const riskFactorsOptions = [
  'recent surgery',
  'prolonged immobility',
  'malnutrition',
  'indwelling catheter',
  'smoking',
  'advanced age',
]

const medicalHistoryOptions = [
  'hypertension',
  'COPD',
  'heart disease',
  'immunocompromised condition',
  'diabetes mellitus',
  'asthma',
  'kidney disease',
]

const familyHistoryOptions = [
  'hypertension',
  'heart disease',
  'diabetes mellitus',
  'stroke',
  'cancer',
  'asthma',
  'kidney disease',
  'tuberculosis',
  'none',
]

const cephalocaudalAssessments = [
  'general survey',
  'head and face',
  'eyes',
  'ears',
  'nose and sinuses',
  'mouth and throat',
  'neck',
  'chest and lungs',
  'heart',
  'abdomen',
  'genitourinary',
  'extremities',
  'neurological',
  'skin and back',
]

// Helper functions to manage all sections
const expandAllSections = () => {
  Object.keys(sectionStates.value).forEach(key => {
    sectionStates.value[key] = true
  })
}

const collapseAllSections = () => {
  Object.keys(sectionStates.value).forEach(key => {
    sectionStates.value[key] = false
  })
}

// Define checkbox options
const onSubmit = form.handleSubmit(values => {
  const cleanText = text => {
    return text
      .split('\n')
      .map(
        line =>
          line
            .trim() // Remove leading/trailing whitespace
            .replace(/^[-•*]\s*/, '') // Remove leading bullets/dashes
            .replace(/^\d+\.\s*/, '') // Remove leading numbers (1. 2. etc)
            .trim() // Trim again after removing prefixes
      )
      .filter(line => line !== '' && line.length > 0) // Remove empty lines
  }

  const formattedData = {
    // Patient Demographics
    age: values.age,
    sex: values.sex,
    occupation: values.occupation,
    religion: values.religion,
    cultural_background: values.cultural_background,
    language: values.language,

    // Chief Complaint
    general_condition: values.general_condition,

    // History of Present Illness
    onset_duration: values.onset_duration,
    severity_progression: values.severity_progression,
    medical_impression: values.medical_impression,
    associated_symptoms: values.associated_symptoms || [],
    other_symptoms: values.other_symptoms,

    // Risk Factors
    risk_factors: values.risk_factors || [],
    other_risk_factors: values.other_risk_factors,

    // Past Medical History
    medical_history: values.medical_history || [],
    other_medical_history: values.other_medical_history,

    // Family History
    family_history: values.family_history || [],
    other_family_history: values.other_family_history,

    // Vital Signs
    heart_rate_bpm: values.heart_rate_bpm,
    blood_pressure_mmhg: values.blood_pressure_mmhg,
    respiratory_rate_min: values.respiratory_rate_min,
    oxygen_saturation_percent: values.oxygen_saturation_percent,
    temperature_celsius: values.temperature_celsius,

    // Physical Examination Findings
    height: values.height,
    weight: values.weight,
    cephalocaudal_assessment: values.cephalocaudal_assessment || {},

    // Laboratory Findings
    laboratory_results: values.laboratory_results,

    // Keep existing subjective and objective data processing
    subjective: values.subjective ? cleanText(values.subjective) : [],
    objective: values.objective ? cleanText(values.objective) : [],
  }
  emit('submit', formattedData)
})
</script>

<template>
  <form @submit="onSubmit" class="space-y-4 sm:space-y-6 px-2 sm:px-0">
    <!-- Enhanced Instructions Banner -->
    <div
      class="relative overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 sm:p-6"
    >
      <div class="relative z-10">
        <div
          class="flex flex-col sm:flex-row items-start space-y-3 sm:space-y-0 sm:space-x-4"
        >
          <div class="flex-shrink-0 self-center sm:self-start">
            <div
              class="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg"
            >
              <FileText class="w-5 h-5 text-white" />
            </div>
          </div>
          <div class="flex-1 text-center sm:text-left">
            <h3
              class="text-lg sm:text-xl font-semibold text-blue-900 dark:text-blue-100 mb-2"
            >
              🏥 Comprehensive Nursing Assessment
            </h3>
            <p
              class="text-sm sm:text-base text-blue-700 dark:text-blue-300 mb-4 leading-relaxed"
            >
              Complete the relevant sections below to create a thorough patient
              assessment. Use the collapsible sections to focus on specific
              areas and maintain a clean workspace.
            </p>
            <div
              class="flex flex-col sm:flex-row flex-wrap gap-2 items-center sm:items-start"
            >
              <div class="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  @click="expandAllSections"
                  class="bg-white/70 hover:bg-white border-blue-300 text-blue-700 shadow-sm w-full sm:w-auto"
                >
                  <span class="hidden sm:inline">Expand All</span>
                  <span class="sm:hidden">Expand</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  @click="collapseAllSections"
                  class="bg-white/70 hover:bg-white border-blue-300 text-blue-700 shadow-sm w-full sm:w-auto"
                >
                  <span class="hidden sm:inline">Collapse All</span>
                  <span class="sm:hidden">Collapse</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <!-- Decorative background -->
      <div
        class="hidden sm:block absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-200/30 to-transparent rounded-full -mr-16 -mt-16"
      ></div>
      <div
        class="hidden sm:block absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-indigo-200/30 to-transparent rounded-full -ml-12 -mb-12"
      ></div>
    </div>

    <!-- Patient Demographics Section -->
    <Card
      class="border-2 border-primary/10 hover:border-primary/20 transition-all duration-200 shadow-sm hover:shadow-md"
    >
      <Collapsible v-model:open="sectionStates.demographics">
        <CollapsibleTrigger class="w-full">
          <CardHeader
            class="hover:bg-muted/30 transition-colors cursor-pointer rounded-t-lg p-4 sm:p-6"
          >
            <CardTitle class="flex items-center justify-between text-left">
              <div class="flex items-center space-x-2 sm:space-x-3 flex-wrap">
                <User
                  class="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0"
                />
                <span class="text-sm sm:text-base font-medium"
                  >Patient Demographics</span
                >
              </div>
              <ChevronDown
                class="h-4 w-4 transition-transform duration-200 text-muted-foreground flex-shrink-0"
                :class="{ 'transform rotate-180': sectionStates.demographics }"
              />
            </CardTitle>
            <CardDescription class="text-left text-sm">
              Basic patient information and background details.
            </CardDescription>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent
          class="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
        >
          <CardContent class="space-y-4 pt-0">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField name="age" v-slot="{ componentField, errorMessage }">
                <FormItem v-auto-animate>
                  <FormLabel>Age</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., 25"
                      v-bind="componentField"
                      type="number"
                      min="0"
                      max="150"
                    />
                  </FormControl>
                  <FormDescription>Age in years (0-150)</FormDescription>
                  <FormMessage v-if="errorMessage">{{
                    errorMessage
                  }}</FormMessage>
                </FormItem>
              </FormField>

              <FormField name="sex" v-slot="{ componentField, errorMessage }">
                <FormItem v-auto-animate>
                  <FormLabel>Sex</FormLabel>
                  <FormControl>
                    <Select v-bind="componentField">
                      <SelectTrigger>
                        <SelectValue placeholder="Select sex" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage v-if="errorMessage">{{
                    errorMessage
                  }}</FormMessage>
                </FormItem>
              </FormField>

              <FormField
                name="occupation"
                v-slot="{ componentField, errorMessage }"
              >
                <FormItem v-auto-animate>
                  <FormLabel>Occupation</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Teacher, Engineer, Retired"
                      v-bind="componentField"
                    />
                  </FormControl>
                  <FormDescription
                    >Letters, spaces, hyphens, and apostrophes
                    only</FormDescription
                  >
                  <FormMessage v-if="errorMessage">{{
                    errorMessage
                  }}</FormMessage>
                </FormItem>
              </FormField>

              <FormField
                name="religion"
                v-slot="{ componentField, errorMessage }"
              >
                <FormItem v-auto-animate>
                  <FormLabel>Religion</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter patient's religion"
                      v-bind="componentField"
                    />
                  </FormControl>
                  <FormMessage v-if="errorMessage">{{
                    errorMessage
                  }}</FormMessage>
                </FormItem>
              </FormField>

              <FormField
                name="cultural_background"
                v-slot="{ componentField, errorMessage }"
              >
                <FormItem v-auto-animate>
                  <FormLabel>Cultural Background</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter cultural background"
                      v-bind="componentField"
                    />
                  </FormControl>
                  <FormMessage v-if="errorMessage">{{
                    errorMessage
                  }}</FormMessage>
                </FormItem>
              </FormField>

              <FormField
                name="language"
                v-slot="{ componentField, errorMessage }"
              >
                <FormItem v-auto-animate>
                  <FormLabel>Language</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter primary language"
                      v-bind="componentField"
                    />
                  </FormControl>
                  <FormMessage v-if="errorMessage">{{
                    errorMessage
                  }}</FormMessage>
                </FormItem>
              </FormField>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>

    <!-- Chief Complaint Section -->
    <Card
      class="border-2 border-primary/10 hover:border-primary/20 transition-all duration-200 shadow-sm hover:shadow-md"
    >
      <Collapsible v-model:open="sectionStates.chiefComplaint">
        <CollapsibleTrigger class="w-full">
          <CardHeader
            class="hover:bg-muted/30 transition-colors cursor-pointer rounded-t-lg p-4 sm:p-6"
          >
            <CardTitle class="flex items-center justify-between text-left">
              <div class="flex items-center space-x-2 sm:space-x-3 flex-wrap">
                <Clipboard
                  class="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0"
                />
                <span class="text-sm sm:text-base font-medium"
                  >Chief Complaint</span
                >
              </div>
              <ChevronDown
                class="h-4 w-4 transition-transform duration-200 text-muted-foreground flex-shrink-0"
                :class="{
                  'transform rotate-180': sectionStates.chiefComplaint,
                }"
              />
            </CardTitle>
            <CardDescription class="text-left text-sm">
              Patient's main reason for seeking care.
            </CardDescription>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent class="pt-0">
            <FormField
              name="general_condition"
              v-slot="{ componentField, errorMessage }"
            >
              <FormItem v-auto-animate>
                <FormLabel>General Condition</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter patient's chief complaint"
                    v-bind="componentField"
                  />
                </FormControl>
                <FormMessage v-if="errorMessage">{{
                  errorMessage
                }}</FormMessage>
              </FormItem>
            </FormField>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>

    <!-- History of Present Illness Section -->
    <Card
      class="border-2 border-primary/10 hover:border-primary/20 transition-all duration-200 shadow-sm hover:shadow-md"
    >
      <Collapsible v-model:open="sectionStates.presentIllness">
        <CollapsibleTrigger class="w-full">
          <CardHeader
            class="hover:bg-muted/30 transition-colors cursor-pointer rounded-t-lg p-4 sm:p-6"
          >
            <CardTitle class="flex items-center justify-between text-left">
              <div class="flex items-center space-x-2 sm:space-x-3 flex-wrap">
                <Activity
                  class="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0"
                />
                <span class="text-sm sm:text-base font-medium"
                  >History of Present Illness</span
                >
              </div>
              <ChevronDown
                class="h-4 w-4 transition-transform duration-200 text-muted-foreground flex-shrink-0"
                :class="{
                  'transform rotate-180': sectionStates.presentIllness,
                }"
              />
            </CardTitle>
            <CardDescription class="text-left text-sm">
              Detailed information about the current illness.
            </CardDescription>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent class="space-y-4 pt-0">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                name="onset_duration"
                v-slot="{ componentField, errorMessage }"
              >
                <FormItem v-auto-animate>
                  <FormLabel>Onset Duration</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., 3 days ago, sudden onset"
                      v-bind="componentField"
                    />
                  </FormControl>
                  <FormMessage v-if="errorMessage">{{
                    errorMessage
                  }}</FormMessage>
                </FormItem>
              </FormField>

              <FormField
                name="severity_progression"
                v-slot="{ componentField, errorMessage }"
              >
                <FormItem v-auto-animate>
                  <FormLabel>Severity Progression</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., mild to severe, constant"
                      v-bind="componentField"
                    />
                  </FormControl>
                  <FormMessage v-if="errorMessage">{{
                    errorMessage
                  }}</FormMessage>
                </FormItem>
              </FormField>

              <FormField
                name="medical_impression"
                v-slot="{ componentField, errorMessage }"
              >
                <FormItem v-auto-animate class="md:col-span-2">
                  <FormLabel>Medical Impression</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter medical impression"
                      v-bind="componentField"
                    />
                  </FormControl>
                  <FormMessage v-if="errorMessage">{{
                    errorMessage
                  }}</FormMessage>
                </FormItem>
              </FormField>
            </div>

            <div class="space-y-3">
              <FormField
                name="associated_symptoms"
                v-slot="{ componentField, errorMessage }"
              >
                <FormItem v-auto-animate>
                  <FormLabel>Associated Symptoms</FormLabel>
                  <div
                    class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3"
                  >
                    <div
                      v-for="symptom in associatedSymptomsOptions"
                      :key="symptom"
                      class="flex items-center space-x-2 py-1"
                    >
                      <Checkbox
                        :id="symptom"
                        :checked="componentField.value?.includes(symptom)"
                        @update:checked="
                          checked => {
                            const current = componentField.value || []
                            if (checked) {
                              componentField.onChange([...current, symptom])
                            } else {
                              componentField.onChange(
                                current.filter(s => s !== symptom)
                              )
                            }
                          }
                        "
                      />
                      <label
                        :for="symptom"
                        class="text-sm sm:text-base font-medium leading-relaxed peer-disabled:cursor-not-allowed peer-disabled:opacity-70 capitalize cursor-pointer"
                      >
                        {{ symptom }}
                      </label>
                    </div>
                  </div>
                  <FormMessage v-if="errorMessage">{{
                    errorMessage
                  }}</FormMessage>
                </FormItem>
              </FormField>

              <FormField
                name="other_symptoms"
                v-slot="{ componentField, errorMessage }"
              >
                <FormItem v-auto-animate>
                  <FormLabel>Other Symptoms</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter any other symptoms"
                      v-bind="componentField"
                    />
                  </FormControl>
                  <FormMessage v-if="errorMessage">{{
                    errorMessage
                  }}</FormMessage>
                </FormItem>
              </FormField>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>

    <!-- Risk Factors Section -->
    <Card
      class="border-2 border-primary/10 hover:border-primary/20 transition-all duration-200 shadow-sm hover:shadow-md"
    >
      <Collapsible v-model:open="sectionStates.riskFactors">
        <CollapsibleTrigger class="w-full">
          <CardHeader
            class="hover:bg-muted/30 transition-colors cursor-pointer rounded-t-lg p-4 sm:p-6"
          >
            <CardTitle class="flex items-center justify-between text-left">
              <div class="flex items-center space-x-2 sm:space-x-3 flex-wrap">
                <Users
                  class="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0"
                />
                <span class="text-sm sm:text-base font-medium"
                  >Risk Factors</span
                >
              </div>
              <ChevronDown
                class="h-4 w-4 transition-transform duration-200 text-muted-foreground flex-shrink-0"
                :class="{ 'transform rotate-180': sectionStates.riskFactors }"
              />
            </CardTitle>
            <CardDescription class="text-left text-sm">
              Factors that may contribute to patient's condition.
            </CardDescription>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent class="space-y-4 pt-0">
            <div class="space-y-3">
              <FormField
                name="risk_factors"
                v-slot="{ componentField, errorMessage }"
              >
                <FormItem v-auto-animate>
                  <FormLabel>Risk Factors</FormLabel>
                  <div
                    class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3"
                  >
                    <div
                      v-for="factor in riskFactorsOptions"
                      :key="factor"
                      class="flex items-center space-x-2 py-1"
                    >
                      <Checkbox
                        :id="factor"
                        :checked="componentField.value?.includes(factor)"
                        @update:checked="
                          checked => {
                            const current = componentField.value || []
                            if (checked) {
                              componentField.onChange([...current, factor])
                            } else {
                              componentField.onChange(
                                current.filter(f => f !== factor)
                              )
                            }
                          }
                        "
                      />
                      <label
                        :for="factor"
                        class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 capitalize"
                      >
                        {{ factor }}
                      </label>
                    </div>
                  </div>
                  <FormMessage v-if="errorMessage">{{
                    errorMessage
                  }}</FormMessage>
                </FormItem>
              </FormField>

              <FormField
                name="other_risk_factors"
                v-slot="{ componentField, errorMessage }"
              >
                <FormItem v-auto-animate>
                  <FormLabel>Other Risk Factors</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter any other risk factors"
                      v-bind="componentField"
                    />
                  </FormControl>
                  <FormMessage v-if="errorMessage">{{
                    errorMessage
                  }}</FormMessage>
                </FormItem>
              </FormField>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>

    <!-- Past Medical History Section -->
    <Card
      class="border-2 border-primary/10 hover:border-primary/20 transition-all duration-200 shadow-sm hover:shadow-md"
    >
      <Collapsible v-model:open="sectionStates.medicalHistory">
        <CollapsibleTrigger class="w-full">
          <CardHeader
            class="hover:bg-muted/30 transition-colors cursor-pointer rounded-t-lg p-4 sm:p-6"
          >
            <CardTitle class="flex items-center justify-between text-left">
              <div class="flex items-center space-x-2 sm:space-x-3 flex-wrap">
                <Heart
                  class="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0"
                />
                <span class="text-sm sm:text-base font-medium"
                  >Past Medical History</span
                >
              </div>
              <ChevronDown
                class="h-4 w-4 transition-transform duration-200 text-muted-foreground flex-shrink-0"
                :class="{
                  'transform rotate-180': sectionStates.medicalHistory,
                }"
              />
            </CardTitle>
            <CardDescription class="text-left text-sm">
              Previous medical conditions and treatments.
            </CardDescription>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent class="space-y-4 pt-0">
            <div class="space-y-3">
              <FormField
                name="medical_history"
                v-slot="{ componentField, errorMessage }"
              >
                <FormItem v-auto-animate>
                  <FormLabel>Medical History</FormLabel>
                  <div
                    class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3"
                  >
                    <div
                      v-for="condition in medicalHistoryOptions"
                      :key="condition"
                      class="flex items-center space-x-2 py-1"
                    >
                      <Checkbox
                        :id="condition"
                        :checked="componentField.value?.includes(condition)"
                        @update:checked="
                          checked => {
                            const current = componentField.value || []
                            if (checked) {
                              componentField.onChange([...current, condition])
                            } else {
                              componentField.onChange(
                                current.filter(c => c !== condition)
                              )
                            }
                          }
                        "
                      />
                      <label
                        :for="condition"
                        class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 capitalize"
                      >
                        {{ condition }}
                      </label>
                    </div>
                  </div>
                  <FormMessage v-if="errorMessage">{{
                    errorMessage
                  }}</FormMessage>
                </FormItem>
              </FormField>

              <FormField
                name="other_medical_history"
                v-slot="{ componentField, errorMessage }"
              >
                <FormItem v-auto-animate>
                  <FormLabel>Other Medical History</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter any other medical conditions"
                      v-bind="componentField"
                    />
                  </FormControl>
                  <FormMessage v-if="errorMessage">{{
                    errorMessage
                  }}</FormMessage>
                </FormItem>
              </FormField>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>

    <!-- Family History Section -->
    <Card
      class="border-2 border-primary/10 hover:border-primary/20 transition-all duration-200 shadow-sm hover:shadow-md"
    >
      <Collapsible v-model:open="sectionStates.familyHistory">
        <CollapsibleTrigger class="w-full">
          <CardHeader
            class="hover:bg-muted/30 transition-colors cursor-pointer rounded-t-lg p-4 sm:p-6"
          >
            <CardTitle class="flex items-center justify-between text-left">
              <div class="flex items-center space-x-2 sm:space-x-3 flex-wrap">
                <Users
                  class="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0"
                />
                <span class="text-sm sm:text-base font-medium"
                  >Family History</span
                >
              </div>
              <ChevronDown
                class="h-4 w-4 transition-transform duration-200 text-muted-foreground flex-shrink-0"
                :class="{ 'transform rotate-180': sectionStates.familyHistory }"
              />
            </CardTitle>
            <CardDescription class="text-left text-sm">
              Family medical history and genetic predispositions.
            </CardDescription>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent class="space-y-4 pt-0">
            <div class="space-y-3">
              <FormField
                name="family_history"
                v-slot="{ componentField, errorMessage }"
              >
                <FormItem v-auto-animate>
                  <FormLabel>Family History</FormLabel>
                  <div
                    class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3"
                  >
                    <div
                      v-for="condition in familyHistoryOptions"
                      :key="condition"
                      class="flex items-center space-x-2 py-1"
                    >
                      <Checkbox
                        :id="`family-${condition}`"
                        :checked="componentField.value?.includes(condition)"
                        @update:checked="
                          checked => {
                            const current = componentField.value || []
                            if (checked) {
                              componentField.onChange([...current, condition])
                            } else {
                              componentField.onChange(
                                current.filter(c => c !== condition)
                              )
                            }
                          }
                        "
                      />
                      <label
                        :for="`family-${condition}`"
                        class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 capitalize"
                      >
                        {{ condition }}
                      </label>
                    </div>
                  </div>
                  <FormMessage v-if="errorMessage">{{
                    errorMessage
                  }}</FormMessage>
                </FormItem>
              </FormField>

              <FormField
                name="other_family_history"
                v-slot="{ componentField, errorMessage }"
              >
                <FormItem v-auto-animate>
                  <FormLabel>Other Family History</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter any other family medical history"
                      v-bind="componentField"
                    />
                  </FormControl>
                  <FormMessage v-if="errorMessage">{{
                    errorMessage
                  }}</FormMessage>
                </FormItem>
              </FormField>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>

    <!-- Vital Signs Section -->
    <Card
      class="border-2 border-primary/10 hover:border-primary/20 transition-all duration-200 shadow-sm hover:shadow-md"
    >
      <Collapsible v-model:open="sectionStates.vitalSigns">
        <CollapsibleTrigger class="w-full">
          <CardHeader
            class="hover:bg-muted/30 transition-colors cursor-pointer rounded-t-lg p-4 sm:p-6"
          >
            <CardTitle class="flex items-center justify-between text-left">
              <div class="flex items-center space-x-2 sm:space-x-3 flex-wrap">
                <Thermometer
                  class="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0"
                />
                <span class="text-sm sm:text-base font-medium"
                  >Vital Signs</span
                >
              </div>
              <ChevronDown
                class="h-4 w-4 transition-transform duration-200 text-muted-foreground flex-shrink-0"
                :class="{ 'transform rotate-180': sectionStates.vitalSigns }"
              />
            </CardTitle>
            <CardDescription class="text-left text-sm">
              Patient's current vital sign measurements.
            </CardDescription>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent class="pt-0">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <FormField
                name="heart_rate_bpm"
                v-slot="{ componentField, errorMessage }"
              >
                <FormItem v-auto-animate>
                  <FormLabel>Heart Rate (bpm)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., 72"
                      v-bind="componentField"
                      type="number"
                      min="30"
                      max="200"
                    />
                  </FormControl>
                  <FormMessage v-if="errorMessage">{{
                    errorMessage
                  }}</FormMessage>
                </FormItem>
              </FormField>

              <FormField
                name="blood_pressure_mmhg"
                v-slot="{ componentField, errorMessage }"
              >
                <FormItem v-auto-animate>
                  <FormLabel>Blood Pressure (mmHg)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., 120/80" v-bind="componentField" />
                  </FormControl>
                  <FormMessage v-if="errorMessage">{{
                    errorMessage
                  }}</FormMessage>
                </FormItem>
              </FormField>

              <FormField
                name="respiratory_rate_min"
                v-slot="{ componentField, errorMessage }"
              >
                <FormItem v-auto-animate>
                  <FormLabel>Respiratory Rate (/min)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., 18"
                      v-bind="componentField"
                      type="number"
                      min="8"
                      max="40"
                    />
                  </FormControl>
                  <FormMessage v-if="errorMessage">{{
                    errorMessage
                  }}</FormMessage>
                </FormItem>
              </FormField>

              <FormField
                name="oxygen_saturation_percent"
                v-slot="{ componentField, errorMessage }"
              >
                <FormItem v-auto-animate>
                  <FormLabel>Oxygen Saturation (%)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., 98"
                      v-bind="componentField"
                      type="number"
                      min="50"
                      max="100"
                    />
                  </FormControl>
                  <FormMessage v-if="errorMessage">{{
                    errorMessage
                  }}</FormMessage>
                </FormItem>
              </FormField>

              <FormField
                name="temperature_celsius"
                v-slot="{ componentField, errorMessage }"
              >
                <FormItem v-auto-animate>
                  <FormLabel>Temperature (°C)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., 36.5"
                      v-bind="componentField"
                      type="number"
                      step="0.1"
                      min="32"
                      max="45"
                    />
                  </FormControl>
                  <FormMessage v-if="errorMessage">{{
                    errorMessage
                  }}</FormMessage>
                </FormItem>
              </FormField>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>

    <!-- Physical Examination Findings Section -->
    <Card
      class="border-2 border-primary/10 hover:border-primary/20 transition-all duration-200 shadow-sm hover:shadow-md"
    >
      <Collapsible v-model:open="sectionStates.physicalExam">
        <CollapsibleTrigger class="w-full">
          <CardHeader
            class="hover:bg-muted/30 transition-colors cursor-pointer rounded-t-lg"
          >
            <CardTitle class="flex items-center justify-between text-left">
              <div class="flex items-center space-x-3">
                <Activity class="w-5 h-5 text-primary" />
                <span>Physical Examination Findings</span>
              </div>
              <ChevronDown
                class="h-4 w-4 transition-transform duration-200 text-muted-foreground"
                :class="{ 'transform rotate-180': sectionStates.physicalExam }"
              />
            </CardTitle>
            <CardDescription class="text-left">
              Comprehensive physical examination findings.
            </CardDescription>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent class="space-y-4 pt-0">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <FormField
                name="height"
                v-slot="{ componentField, errorMessage }"
              >
                <FormItem v-auto-animate>
                  <FormLabel>Height (cm)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., 170"
                      v-bind="componentField"
                      type="number"
                      min="50"
                      max="250"
                    />
                  </FormControl>
                  <FormMessage v-if="errorMessage">{{
                    errorMessage
                  }}</FormMessage>
                </FormItem>
              </FormField>

              <FormField
                name="weight"
                v-slot="{ componentField, errorMessage }"
              >
                <FormItem v-auto-animate>
                  <FormLabel>Weight (kg)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., 70"
                      v-bind="componentField"
                      type="number"
                      min="1"
                      max="300"
                    />
                  </FormControl>
                  <FormMessage v-if="errorMessage">{{
                    errorMessage
                  }}</FormMessage>
                </FormItem>
              </FormField>
            </div>

            <div class="space-y-4">
              <h4 class="text-base font-semibold text-foreground">
                Cephalocaudal Assessment
              </h4>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  v-for="assessment in cephalocaudalAssessments"
                  :key="assessment"
                  :name="`cephalocaudal_assessment.${assessment.replace(/ /g, '_')}`"
                  v-slot="{ componentField, errorMessage }"
                >
                  <FormItem v-auto-animate>
                    <FormLabel class="capitalize">{{ assessment }}</FormLabel>
                    <FormControl>
                      <Textarea
                        :placeholder="`Enter ${assessment} assessment findings`"
                        v-bind="componentField"
                        class="min-h-20"
                      />
                    </FormControl>
                    <FormMessage v-if="errorMessage">{{
                      errorMessage
                    }}</FormMessage>
                  </FormItem>
                </FormField>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>

    <!-- Laboratory Findings Section -->
    <Card
      class="border-2 border-primary/10 hover:border-primary/20 transition-all duration-200 shadow-sm hover:shadow-md"
    >
      <Collapsible v-model:open="sectionStates.labFindings">
        <CollapsibleTrigger class="w-full">
          <CardHeader
            class="hover:bg-muted/30 transition-colors cursor-pointer rounded-t-lg"
          >
            <CardTitle class="flex items-center justify-between text-left">
              <div class="flex items-center space-x-3">
                <FlaskConical class="w-5 h-5 text-primary" />
                <span>Laboratory Findings</span>
              </div>
              <ChevronDown
                class="h-4 w-4 transition-transform duration-200 text-muted-foreground"
                :class="{ 'transform rotate-180': sectionStates.labFindings }"
              />
            </CardTitle>
            <CardDescription class="text-left">
              Laboratory test results and diagnostic findings.
            </CardDescription>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent class="pt-0">
            <FormField
              name="laboratory_results"
              v-slot="{ componentField, errorMessage }"
            >
              <FormItem v-auto-animate>
                <FormLabel>Laboratory Results</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Enter laboratory test results, diagnostic imaging findings, etc."
                    v-bind="componentField"
                    class="min-h-32"
                  />
                </FormControl>
                <FormDescription>
                  Include blood tests, imaging results, and other diagnostic
                  findings.
                </FormDescription>
                <FormMessage v-if="errorMessage">{{
                  errorMessage
                }}</FormMessage>
              </FormItem>
            </FormField>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>

    <!-- Subjective Data Section -->
    <Card
      class="border-2 border-primary/10 hover:border-primary/20 transition-all duration-200 shadow-sm hover:shadow-md"
    >
      <Collapsible v-model:open="sectionStates.subjective">
        <CollapsibleTrigger class="w-full">
          <CardHeader
            class="hover:bg-muted/30 transition-colors cursor-pointer rounded-t-lg"
          >
            <CardTitle class="flex items-center justify-between text-left">
              <div class="flex items-center space-x-3">
                <Clipboard class="w-5 h-5 text-primary" />
                <span>Subjective Data</span>
              </div>
              <ChevronDown
                class="h-4 w-4 transition-transform duration-200 text-muted-foreground"
                :class="{ 'transform rotate-180': sectionStates.subjective }"
              />
            </CardTitle>
            <CardDescription class="text-left">
              Patient-reported symptoms and concerns.
            </CardDescription>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent
          class="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
        >
          <CardContent class="pt-0">
            <FormField
              name="subjective"
              v-slot="{ componentField, errorMessage }"
            >
              <FormItem v-auto-animate>
                <FormLabel>Subjective Data</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Enter subjective data (one per line)"
                    v-bind="componentField"
                    class="min-h-28"
                  />
                </FormControl>
                <FormDescription>
                  Enter each patient-reported symptom or concern on a new line.
                </FormDescription>
                <FormMessage v-if="errorMessage">{{
                  errorMessage
                }}</FormMessage>
              </FormItem>
            </FormField>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>

    <!-- Objective Data Section -->
    <Card
      class="border-2 border-primary/10 hover:border-primary/20 transition-all duration-200 shadow-sm hover:shadow-md"
    >
      <Collapsible v-model:open="sectionStates.objective">
        <CollapsibleTrigger class="w-full">
          <CardHeader
            class="hover:bg-muted/30 transition-colors cursor-pointer rounded-t-lg"
          >
            <CardTitle class="flex items-center justify-between text-left">
              <div class="flex items-center space-x-3">
                <Clipboard class="w-5 h-5 text-primary" />
                <span>Objective Data</span>
              </div>
              <ChevronDown
                class="h-4 w-4 transition-transform duration-200 text-muted-foreground"
                :class="{ 'transform rotate-180': sectionStates.objective }"
              />
            </CardTitle>
            <CardDescription class="text-left">
              Observable and measurable findings.
            </CardDescription>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent
          class="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
        >
          <CardContent class="pt-0">
            <FormField
              name="objective"
              v-slot="{ componentField, errorMessage }"
            >
              <FormItem v-auto-animate>
                <FormLabel>Objective Data</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Enter objective data (one per line)"
                    v-bind="componentField"
                    class="min-h-28"
                  />
                </FormControl>
                <FormDescription>
                  Enter each observation or measurement on a new line.
                </FormDescription>
                <FormMessage v-if="errorMessage">{{
                  errorMessage
                }}</FormMessage>
              </FormItem>
            </FormField>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>

    <!-- Enhanced Submit Section -->
    <div
      class="sticky bottom-0 bg-background/95 backdrop-blur-sm border-t border-muted p-4 sm:p-6 rounded-lg shadow-lg"
    >
      <div
        class="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0"
      >
        <div class="flex items-center justify-center sm:justify-start">
          <div
            class="text-xs sm:text-sm text-muted-foreground text-center sm:text-left"
          >
            <span class="font-medium">Progress:</span>
            <span class="text-primary"
              >{{ Object.values(sectionStates).filter(Boolean).length }}/{{
                Object.keys(sectionStates).length
              }}
              sections expanded</span
            >
          </div>
        </div>
        <div
          class="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 w-full sm:w-auto"
        >
          <Button
            type="button"
            variant="outline"
            @click="expandAllSections"
            class="px-4 sm:px-6 w-full sm:w-auto text-sm"
          >
            <span class="sm:hidden">Expand</span>
            <span class="hidden sm:inline">Expand All</span>
          </Button>
          <Button
            type="submit"
            :disabled="props.disabled"
            class="px-6 sm:px-8 py-3 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 w-full sm:w-auto"
          >
            <span
              v-if="props.disabled"
              class="flex items-center justify-center space-x-2"
            >
              <div
                class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"
              ></div>
              <span class="text-sm sm:text-base">Generating...</span>
            </span>
            <span v-else class="text-sm sm:text-base font-medium">
              <span class="sm:hidden">Submit</span>
              <span class="hidden sm:inline">Submit Assessment</span>
            </span>
          </Button>
        </div>
      </div>
    </div>
  </form>
</template>
