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
import { manualModeSchema } from '@/schemas/assessmentSchemas'
import { vAutoAnimate } from '@formkit/auto-animate/vue'
import { toTypedSchema } from '@vee-validate/zod'
import { Clipboard } from 'lucide-vue-next'
import { useForm } from 'vee-validate'
import Textarea from '../ui/textarea/Textarea.vue'

const emit = defineEmits(['submit'])

const form = useForm({
  validationSchema: toTypedSchema(manualModeSchema),
})

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
    subjective: cleanText(values.subjective),
    objective: cleanText(values.objective),
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
      <FormField name="subjective" v-slot="{ componentField, errorMessage }">
        <FormItem v-auto-animate>
          <FormLabel class="flex items-center space-x-2">
            <Clipboard class="w-4 h-4 text-primary" />
            <span>Subjective Data</span>
          </FormLabel>
          <FormControl>
            <Textarea
              placeholder="Enter subjective data (one per line)"
              v-bind="componentField"
              class="bg-background text-foreground border-muted focus:ring-primary focus:border-primary rounded-md p-3 min-h-28"
            />
          </FormControl>
          <FormDescription>
            Enter each patient-reported symptom or concern on a new line.
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
      <FormField name="objective" v-slot="{ componentField, errorMessage }">
        <FormItem v-auto-animate>
          <FormLabel class="flex items-center space-x-2">
            <Clipboard class="w-4 h-4 text-primary" />
            <span>Objective Data</span>
          </FormLabel>
          <FormControl>
            <Textarea
              placeholder="Enter objective data (one per line)"
              v-bind="componentField"
              class="bg-background text-foreground border-muted focus:ring-primary focus:border-primary rounded-md p-3 min-h-28"
            />
          </FormControl>
          <FormDescription>
            Enter each observation or measurement on a new line.
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
