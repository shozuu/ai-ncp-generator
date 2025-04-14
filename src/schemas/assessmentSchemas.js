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
          .every(line => line.length >= 15 && line.length <= 100),
      {
        message:
          'Each line in subjective data must be between 15 and 100 characters.',
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
          .every(line => /^[a-zA-Z0-9\s.,:()/%'"°“”-]+$/.test(line)),
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
          .every(line => line.length >= 15 && line.length <= 100),
      {
        message:
          'Each line in objective data must be between 15 and 100 characters.',
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
          .every(line => /^[a-zA-Z0-9\s.,:()/%'"°“”-]+$/.test(line)),
      {
        message:
          'Objective data must only contain letters, numbers, spaces, and basic punctuation.',
      }
    ),
})

export const assistantModeSchema = z.object({
  subjective: z.object({
    primary: z
      .string()
      .min(1, 'Primary symptoms are required')
      .refine(
        value =>
          value
            .split('\n')
            .filter(line => line.trim() !== '')
            .every(line => line.length >= 15 && line.length <= 100),
        {
          message:
            'Each line in primary symptoms must be between 15 and 100 characters.',
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
          message: 'Primary symptoms must not contain duplicate lines.',
        }
      ),
    other: z
      .string()
      .optional()
      .refine(
        value =>
          !value ||
          value
            .split('\n')
            .filter(line => line.trim() !== '')
            .every(line => line.length >= 15 && line.length <= 100),
        {
          message:
            'Each line in other complaints must be between 15 and 100 characters.',
        }
      )
      .refine(
        value => {
          if (!value) return true
          const lines = value
            .split('\n')
            .map(line => line.trim())
            .filter(line => line !== '')
          return new Set(lines).size === lines.length
        },
        {
          message: 'Other complaints must not contain duplicate lines.',
        }
      ),
  }),
  objective: z.object({
    exam: z
      .string()
      .min(1, 'Physical examination findings are required')
      .refine(
        value =>
          value
            .split('\n')
            .filter(line => line.trim() !== '')
            .every(line => line.length >= 15 && line.length <= 100),
        {
          message:
            'Each line in physical examination must be between 15 and 100 characters.',
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
          message:
            'Physical examination findings must not contain duplicate lines.',
        }
      ),
    vitals: z
      .string()
      .optional()
      .refine(
        value =>
          !value ||
          value
            .split('\n')
            .filter(line => line.trim() !== '')
            .every(line => line.length >= 15 && line.length <= 100),
        {
          message:
            'Each line in vital signs must be between 15 and 100 characters.',
        }
      )
      .refine(
        value => {
          if (!value) return true
          const lines = value
            .split('\n')
            .map(line => line.trim())
            .filter(line => line !== '')
          return new Set(lines).size === lines.length
        },
        {
          message: 'Vital signs must not contain duplicate lines.',
        }
      ),
    other: z
      .string()
      .optional()
      .refine(
        value =>
          !value ||
          value
            .split('\n')
            .filter(line => line.trim() !== '')
            .every(line => line.length >= 15 && line.length <= 100),
        {
          message:
            'Each line in other findings must be between 15 and 100 characters.',
        }
      )
      .refine(
        value => {
          if (!value) return true
          const lines = value
            .split('\n')
            .map(line => line.trim())
            .filter(line => line !== '')
          return new Set(lines).size === lines.length
        },
        {
          message: 'Other findings must not contain duplicate lines.',
        }
      ),
  }),
})
