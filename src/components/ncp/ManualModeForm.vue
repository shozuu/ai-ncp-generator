<script setup>
import { manualModeSchema } from '@/schemas/assessmentSchemas'
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'

import { Button } from '@/components/ui/button'
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import Textarea from '../ui/textarea/Textarea.vue'

const emit = defineEmits(['submit'])

const form = useForm({
  validationSchema: toTypedSchema(manualModeSchema),
})

const onSubmit = form.handleSubmit(values => {
  console.log('Manual Mode Data:', values)
  emit('submit', values)
})
</script>

<template>
  <form @submit="onSubmit">
    <FormField name="subjective" v-slot="{ componentField }">
      <FormItem>
        <FormLabel>Subjective Data</FormLabel>
        <FormControl>
          <Textarea
            placeholder="Enter subjective data"
            v-bind="componentField"
          />
        </FormControl>
        <FormDescription>Enter the patient's subjective data.</FormDescription>
        <FormMessage />
      </FormItem>
    </FormField>

    <FormField name="objective" v-slot="{ componentField }">
      <FormItem>
        <FormLabel>Objective Data</FormLabel>
        <FormControl>
          <Textarea
            placeholder="Enter objective data"
            v-bind="componentField"
          />
        </FormControl>
        <FormDescription>Enter the patient's objective data.</FormDescription>
        <FormMessage />
      </FormItem>
    </FormField>

    <Button type="submit">Submit</Button>
  </form>
</template>
