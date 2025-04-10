import { z } from 'zod'

export const manualModeSchema = z.object({
  subjective: z
    .string()
    .min(1, 'Subjective data is required')
    .refine(
      value =>
        value
          .split('\n')
          .filter(line => line.trim() !== '')
          .every(line => line.length >= 15 && line.length <= 150),
      {
        message:
          'Each line in subjective data must be between 15 and 150 characters.',
      }
    )
    .refine(
      value => {
        const lines = value
          .split('\n')
          .map(line => line.trim())
          .filter(line => line !== '')
        return new Set(lines).size === lines.length
      },
      {
        message: 'Subjective data must not contain duplicate lines.',
      }
    )
    .refine(
      value =>
        value
          .split('\n')
          .filter(line => line.trim() !== '')
          .every(line => /^[a-zA-Z0-9\s.,:()/%'"°-]+$/.test(line)),
      {
        message:
          'Subjective data must only contain letters, numbers, spaces, and basic punctuation.',
      }
    ),

  objective: z
    .string()
    .min(1, 'Objective data is required')
    .refine(
      value =>
        value
          .split('\n')
          .filter(line => line.trim() !== '')
          .every(line => line.length >= 15 && line.length <= 150),
      {
        message:
          'Each line in objective data must be between 15 and 150 characters.',
      }
    )
    .refine(
      value => {
        const lines = value
          .split('\n')
          .map(line => line.trim())
          .filter(line => line !== '')
        return new Set(lines).size === lines.length
      },
      {
        message: 'Objective data must not contain duplicate lines.',
      }
    )
    .refine(
      value =>
        value
          .split('\n')
          .filter(line => line.trim() !== '')
          .every(line => /^[a-zA-Z0-9\s.,:()/%'"°-]+$/.test(line)),
      {
        message:
          'Objective data must only contain letters, numbers, spaces, and basic punctuation.',
      }
    ),
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
