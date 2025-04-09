<script setup>
import { assistantModeSchema } from '@/schemas/assessmentSchemas'
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'

import { Button } from '@/components/ui/button'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import Textarea from '../ui/textarea/Textarea.vue'

const emit = defineEmits(['submit'])

const form = useForm({
  validationSchema: toTypedSchema(assistantModeSchema),
})

const onSubmit = form.handleSubmit(values => {
  console.log('Assistant Mode Data:', values)
  emit('submit', values)
})
</script>

<template>
  <form @submit="onSubmit">
    <FormField name="subjective.primary" v-slot="{ componentField }">
      <FormItem>
        <FormLabel>Primary Symptoms</FormLabel>
        <FormControl>
          <Textarea
            placeholder="Enter primary symptoms"
            v-bind="componentField"
          />
        </FormControl>
        <FormMessage />
      </FormItem>
    </FormField>

    <FormField name="objective.exam" v-slot="{ componentField }">
      <FormItem>
        <FormLabel>Physical Examination</FormLabel>
        <FormControl>
          <Textarea
            placeholder="Enter physical examination findings"
            v-bind="componentField"
          />
        </FormControl>
        <FormMessage />
      </FormItem>
    </FormField>

    <Button type="submit">Submit</Button>
  </form>
</template>
