import { z } from 'zod'

export const manualModeSchema = z.object({
  subjective: z.string().min(1, 'Subjective data is required'),
  objective: z.string().min(1, 'Objective data is required'),
})

export const assistantModeSchema = z.object({
  subjective: z.object({
    primary: z.string().min(1, 'At least one primary symptom is required'),
    secondary: z.string().optional(),
  }),
  objective: z.object({
    exam: z.string().min(1, 'At least one physical exam finding is required'),
    vitals: z.string().optional(),
    other: z.string().optional(),
  }),
})
