import { z } from 'zod'

const noControlChars = line => /^[^\x00-\x1F\x7F]+$/.test(line)

export const manualModeSchema = z.object({
  subjective: z
    .string()
    .min(1, 'Subjective data is required')
    .refine(
      value =>
        value
          .split('\n')
          .filter(line => line.trim() !== '')
          .every(line => line.length >= 5 && line.length <= 150),
      {
        message:
          'Each line in subjective data must be between 5 and 150 characters.',
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
          .every(noControlChars),
      {
        message: 'Subjective data contains invalid control characters.',
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
          .every(line => line.length >= 5 && line.length <= 150),
      {
        message:
          'Each line in objective data must be between 5 and 150 characters.',
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
          .every(noControlChars),
      {
        message: 'Objective data contains invalid control characters.',
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
            .every(line => line.length >= 5 && line.length <= 150),
        {
          message:
            'Each line in primary symptoms must be between 5 and 150 characters.',
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
      )
      .refine(
        value =>
          value
            .split('\n')
            .filter(line => line.trim() !== '')
            .every(noControlChars),
        {
          message: 'Primary symptoms contain invalid control characters.',
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
            .every(line => line.length >= 5 && line.length <= 150),
        {
          message:
            'Each line in other complaints must be between 5 and 150 characters.',
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
      )
      .refine(
        value =>
          !value ||
          value
            .split('\n')
            .filter(line => line.trim() !== '')
            .every(noControlChars),
        {
          message: 'Other complaints contain invalid control characters.',
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
            .every(line => line.length >= 5 && line.length <= 150),
        {
          message:
            'Each line in physical examination must be between 5 and 150 characters.',
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
      )
      .refine(
        value =>
          value
            .split('\n')
            .filter(line => line.trim() !== '')
            .every(noControlChars),
        {
          message:
            'Physical examination findings contain invalid control characters.',
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
            .every(line => line.length >= 5 && line.length <= 150),
        {
          message:
            'Each line in vital signs must be between 5 and 150 characters.',
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
      )
      .refine(
        value =>
          !value ||
          value
            .split('\n')
            .filter(line => line.trim() !== '')
            .every(noControlChars),
        {
          message: 'Vital signs contain invalid control characters.',
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
            .every(line => line.length >= 5 && line.length <= 150),
        {
          message:
            'Each line in other findings must be between 5 and 150 characters.',
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
      )
      .refine(
        value =>
          !value ||
          value
            .split('\n')
            .filter(line => line.trim() !== '')
            .every(noControlChars),
        {
          message: 'Other findings contain invalid control characters.',
        }
      ),
  }),
})

export const comprehensiveAssessmentSchema = z.object({
  demographics: z.object({
    age: z
      .number()
      .min(0, 'Age cannot be negative')
      .max(150, 'Age seems unusually high')
      .nullable()
      .optional()
      .or(z.literal('')),
    sex: z.enum(['male', 'female'], {
      required_error: 'Sex is required',
      invalid_type_error: 'Please select a valid sex',
    }),
    occupation: z.string().optional(),
  }),
  chief_complaint: z
    .string()
    .min(1, 'Chief complaint is required')
    .max(200, 'Chief complaint should be brief and concise'),
  history: z.object({
    onset_duration: z
      .string()
      .max(100, 'Onset duration should be concise')
      .optional(),
    severity: z
      .string()
      .max(100, 'Severity description should be concise')
      .optional(),
    associated_symptoms: z.array(z.string()).optional(),
    other_symptoms: z
      .string()
      .max(200, 'Other symptoms description should be concise')
      .optional(),
  }),
  medical_history: z.array(z.string()).optional(),
  medical_history_other: z
    .string()
    .max(200, 'Medical history should be concise')
    .optional(),
  vital_signs: z.object({
    HR: z
      .number()
      .min(0, 'Heart rate cannot be negative')
      .max(300, 'Heart rate seems unusually high')
      .nullable()
      .optional(),
    BP: z
      .string()
      .regex(/^$|^\d{2,3}\/\d{2,3}$/, 'Blood pressure format should be: 120/80')
      .optional(),
    RR: z
      .number()
      .min(0, 'Respiratory rate cannot be negative')
      .max(60, 'Respiratory rate seems unusually high')
      .nullable()
      .optional(),
    SpO2: z
      .number()
      .min(0, 'Oxygen saturation cannot be negative')
      .max(100, 'Oxygen saturation cannot exceed 100%')
      .nullable()
      .optional(),
    Temp: z
      .number()
      .min(20, 'Temperature seems unusually low')
      .max(50, 'Temperature seems unusually high')
      .nullable()
      .optional(),
  }),
  physical_exam: z.array(z.string()).optional(),
  physical_exam_other: z
    .string()
    .max(300, 'Physical exam findings should be concise')
    .optional(),
  risk_factors: z.array(z.string()).optional(),
  risk_factors_other: z
    .string()
    .max(200, 'Risk factors should be concise')
    .optional(),
  nurse_notes: z.string().max(500, 'Nurse notes should be concise').optional(),
})
