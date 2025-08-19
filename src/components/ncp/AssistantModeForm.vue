<script setup>
import { Button } from '@/components/ui/button'
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { assistantModeSchema } from '@/schemas/assessmentSchemas'
import { vAutoAnimate } from '@formkit/auto-animate/vue'
import { toTypedSchema } from '@vee-validate/zod'
import { Clipboard } from 'lucide-vue-next'
import { useForm } from 'vee-validate'
import Textarea from '../ui/textarea/Textarea.vue'

const emit = defineEmits(['submit'])

const form = useForm({
  validationSchema: toTypedSchema(assistantModeSchema),
})

const onSubmit = form.handleSubmit(values => {
  const formattedData = {
    subjective: {
      primary: values.subjective.primary
        .split('\n')
        .map(line => line.trim())
        .filter(line => line !== ''),
      other: values.subjective.other
        ? values.subjective.other
            .split('\n')
            .map(line => line.trim())
            .filter(line => line !== '')
        : [],
    },
    objective: {
      exam: values.objective.exam
        .split('\n')
        .map(line => line.trim())
        .filter(line => line !== ''),
      vitals: values.objective.vitals
        ? values.objective.vitals
            .split('\n')
            .map(line => line.trim())
            .filter(line => line !== '')
        : [],
      other: values.objective.other
        ? values.objective.other
            .split('\n')
            .map(line => line.trim())
            .filter(line => line !== '')
        : [],
    },
  }
  emit('submit', formattedData)
})
</script>

<template>
  <form @submit="onSubmit" class="space-y-8">
    <!-- Subjective Data Section -->
    <div class="space-y-6">
      <div>
        <h4 class="text-lg font-semibold text-foreground">Subjective Data</h4>
        <p class="text-sm text-muted-foreground">
          Provide details about the patient's subjective symptoms.
        </p>
      </div>
      <!-- Primary Symptoms -->
      <FormField
        name="subjective.primary"
        v-slot="{ componentField, errorMessage }"
      >
        <FormItem v-auto-animate>
          <FormLabel class="flex items-center space-x-2">
            <Clipboard class="w-4 h-4 text-primary" />
            <span>Primary Symptoms</span>
          </FormLabel>
          <FormControl>
            <Textarea
              placeholder="Enter primary symptoms (one per line)"
              v-bind="componentField"
              class="bg-background text-foreground border-muted focus:ring-primary focus:border-primary rounded-md p-3 min-h-28"
            />
          </FormControl>
          <FormDescription>
            Enter each primary symptom or concern on a new line.
          </FormDescription>
          <FormMessage v-if="errorMessage" class="text-destructive">{{
            errorMessage
          }}</FormMessage>
        </FormItem>
      </FormField>
      <!-- Other Complaints -->
      <FormField
        name="subjective.other"
        v-slot="{ componentField, errorMessage }"
      >
        <FormItem v-auto-animate>
          <FormLabel class="flex items-center space-x-2">
            <Clipboard class="w-4 h-4 text-primary" />
            <span>Other Complaints</span>
          </FormLabel>
          <FormControl>
            <Textarea
              placeholder="Enter other complaints (optional, one per line)"
              v-bind="componentField"
              class="bg-background text-foreground border-muted focus:ring-primary focus:border-primary rounded-md p-3 min-h-28"
            />
          </FormControl>
          <FormDescription>
            Enter additional complaints, if any, on a new line.
          </FormDescription>
          <FormMessage v-if="errorMessage" class="text-destructive">{{
            errorMessage
          }}</FormMessage>
        </FormItem>
      </FormField>
    </div>

    <!-- Objective Data Section -->
    <div class="space-y-6">
      <div>
        <h4 class="text-lg font-semibold text-foreground">Objective Data</h4>
        <p class="text-sm text-muted-foreground">
          Provide details about the patient's objective findings.
        </p>
      </div>
      <!-- Physical Examination -->
      <FormField
        name="objective.exam"
        v-slot="{ componentField, errorMessage }"
      >
        <FormItem v-auto-animate>
          <FormLabel class="flex items-center space-x-2">
            <Clipboard class="w-4 h-4 text-primary" />
            <span>Physical Examination</span>
          </FormLabel>
          <FormControl>
            <Textarea
              placeholder="Enter physical examination findings (one per line)"
              v-bind="componentField"
              class="bg-background text-foreground border-muted focus:ring-primary focus:border-primary rounded-md p-3 min-h-28"
            />
          </FormControl>
          <FormDescription>
            Enter each physical examination finding on a new line.
          </FormDescription>
          <FormMessage v-if="errorMessage" class="text-destructive">{{
            errorMessage
          }}</FormMessage>
        </FormItem>
      </FormField>
      <!-- Vital Signs -->
      <FormField
        name="objective.vitals"
        v-slot="{ componentField, errorMessage }"
      >
        <FormItem v-auto-animate>
          <FormLabel class="flex items-center space-x-2">
            <Clipboard class="w-4 h-4 text-primary" />
            <span>Vital Signs</span>
          </FormLabel>
          <FormControl>
            <Textarea
              placeholder="Enter vital signs (optional, one per line)"
              v-bind="componentField"
              class="bg-background text-foreground border-muted focus:ring-primary focus:border-primary rounded-md p-3 min-h-28"
            />
          </FormControl>
          <FormDescription>
            Enter each vital sign on a new line.
          </FormDescription>
          <FormMessage v-if="errorMessage" class="text-destructive">{{
            errorMessage
          }}</FormMessage>
        </FormItem>
      </FormField>
      <!-- Other Findings -->
      <FormField
        name="objective.other"
        v-slot="{ componentField, errorMessage }"
      >
        <FormItem v-auto-animate>
          <FormLabel class="flex items-center space-x-2">
            <Clipboard class="w-4 h-4 text-primary" />
            <span>Other Findings</span>
          </FormLabel>
          <FormControl>
            <Textarea
              placeholder="Enter other findings (optional, one per line)"
              v-bind="componentField"
              class="bg-background text-foreground border-muted focus:ring-primary focus:border-primary rounded-md p-3 min-h-28"
            />
          </FormControl>
          <FormDescription>
            Enter additional findings, if any, on a new line.
          </FormDescription>
          <FormMessage v-if="errorMessage" class="text-destructive">{{
            errorMessage
          }}</FormMessage>
        </FormItem>
      </FormField>
    </div>

    <!-- Submit Button -->
    <div class="flex justify-end">
      <Button
        type="submit"
        class="px-8 py-3 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg shadow-lg"
      >
        Submit
      </Button>
    </div>
  </form>
</template>
