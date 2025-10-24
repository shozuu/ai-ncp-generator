import { z } from 'zod'

const noControlChars = line => {
  // eslint-disable-next-line no-control-regex
  return /^[^\x00-\x1F\x7F]+$/.test(line)
}

export const manualModeSchema = z.object({
  // Patient Demographics
  age: z
    .union([z.string(), z.number()])
    .optional()
    .refine(
      value =>
        !value ||
        (typeof value === 'number' && Number.isInteger(value)) ||
        /^\d+$/.test(String(value).trim()),
      { message: 'Age must be a valid number' }
    )
    .refine(value => !value || (Number(value) >= 0 && Number(value) <= 150), {
      message: 'Age must be between 0 and 150 years',
    })
    .transform(value => (value ? String(value) : value)),
  sex: z.enum(['Male', 'Female']).optional(),
  occupation: z
    .string()
    .optional()
    .refine(value => !value || /^[a-zA-Z\s\-'.]+$/.test(value.trim()), {
      message:
        'Occupation should only contain letters, spaces, hyphens, and apostrophes',
    }),
  religion: z
    .string()
    .optional()
    .refine(value => !value || /^[a-zA-Z\s\-'.]+$/.test(value.trim()), {
      message:
        'Religion should only contain letters, spaces, hyphens, and apostrophes',
    }),
  cultural_background: z
    .string()
    .optional()
    .refine(value => !value || /^[a-zA-Z\s\-'.]+$/.test(value.trim()), {
      message:
        'Cultural background should only contain letters, spaces, hyphens, and apostrophes',
    }),
  language: z
    .string()
    .optional()
    .refine(value => !value || /^[a-zA-Z\s\-',]+$/.test(value.trim()), {
      message:
        'Language should only contain letters, spaces, hyphens, apostrophes, and commas',
    }),

  // Chief Complaint
  general_condition: z
    .string()
    .optional()
    .refine(value => !value || value.trim().length <= 500, {
      message: 'General condition description should not exceed 500 characters',
    }),

  // History of Present Illness
  onset_duration: z
    .string()
    .optional()
    .refine(value => !value || value.trim().length <= 200, {
      message: 'Onset and duration should not exceed 200 characters',
    }),
  severity_progression: z
    .string()
    .optional()
    .refine(value => !value || value.trim().length <= 200, {
      message: 'Severity and progression should not exceed 200 characters',
    }),
  medical_impression: z
    .string()
    .optional()
    .refine(value => !value || value.trim().length <= 300, {
      message: 'Medical impression should not exceed 300 characters',
    }),
  associated_symptoms: z.array(z.string()).optional().default([]),
  other_symptoms: z
    .string()
    .optional()
    .refine(value => !value || value.trim().length <= 300, {
      message: 'Other symptoms should not exceed 300 characters',
    }),

  // Risk Factors
  risk_factors: z.array(z.string()).optional().default([]),
  other_risk_factors: z
    .string()
    .optional()
    .refine(value => !value || value.trim().length <= 300, {
      message: 'Other risk factors should not exceed 300 characters',
    }),

  // Past Medical History
  medical_history: z.array(z.string()).optional().default([]),
  other_medical_history: z
    .string()
    .optional()
    .refine(value => !value || value.trim().length <= 300, {
      message: 'Other medical history should not exceed 300 characters',
    }),

  // Family History
  family_history: z.array(z.string()).optional().default([]),
  other_family_history: z
    .string()
    .optional()
    .refine(value => !value || value.trim().length <= 300, {
      message: 'Other family history should not exceed 300 characters',
    }),

  // Vital Signs
  heart_rate_bpm: z
    .union([z.string(), z.number()])
    .optional()
    .refine(
      value =>
        !value ||
        (typeof value === 'number' && Number.isInteger(value)) ||
        /^\d+$/.test(String(value).trim()),
      { message: 'Heart rate must be a valid number' }
    )
    .refine(value => !value || (Number(value) >= 30 && Number(value) <= 250), {
      message: 'Heart rate must be between 30 and 250 bpm',
    })
    .transform(value => (value ? String(value) : value)),
  blood_pressure_mmhg: z
    .string()
    .optional()
    .refine(value => !value || /^\d{2,3}\/\d{2,3}$/.test(value.trim()), {
      message: 'Blood pressure must be in format: 120/80',
    })
    .refine(
      value => {
        if (!value) return true
        const [systolic, diastolic] = value.split('/').map(Number)
        return (
          systolic >= 50 &&
          systolic <= 300 &&
          diastolic >= 30 &&
          diastolic <= 200
        )
      },
      {
        message:
          'Blood pressure values seem outside normal range (systolic: 50-300, diastolic: 30-200)',
      }
    ),
  respiratory_rate_min: z
    .union([z.string(), z.number()])
    .optional()
    .refine(
      value =>
        !value ||
        (typeof value === 'number' && Number.isInteger(value)) ||
        /^\d+$/.test(String(value).trim()),
      { message: 'Respiratory rate must be a valid number' }
    )
    .refine(value => !value || (Number(value) >= 5 && Number(value) <= 60), {
      message: 'Respiratory rate must be between 5 and 60 per minute',
    })
    .transform(value => (value ? String(value) : value)),
  oxygen_saturation_percent: z
    .union([z.string(), z.number()])
    .optional()
    .refine(
      value =>
        !value ||
        typeof value === 'number' ||
        /^\d+(\.\d+)?$/.test(String(value).trim()),
      { message: 'Oxygen saturation must be a valid number' }
    )
    .refine(value => !value || (Number(value) >= 50 && Number(value) <= 100), {
      message: 'Oxygen saturation must be between 50% and 100%',
    })
    .transform(value => (value ? String(value) : value)),
  temperature_celsius: z
    .union([z.string(), z.number()])
    .optional()
    .refine(
      value =>
        !value ||
        typeof value === 'number' ||
        /^\d+(\.\d+)?$/.test(String(value).trim()),
      { message: 'Temperature must be a valid number' }
    )
    .refine(value => !value || (Number(value) >= 25 && Number(value) <= 45), {
      message: 'Temperature must be between 25°C and 45°C',
    })
    .transform(value => (value ? String(value) : value)),

  // Physical Examination Findings
  height: z
    .union([z.string(), z.number()])
    .optional()
    .refine(
      value =>
        !value ||
        typeof value === 'number' ||
        /^\d+(\.\d+)?$/.test(String(value).trim()),
      { message: 'Height must be a valid number' }
    )
    .refine(value => !value || (Number(value) >= 30 && Number(value) <= 250), {
      message: 'Height must be between 30 and 250 cm',
    })
    .transform(value => (value ? String(value) : value)),
  weight: z
    .union([z.string(), z.number()])
    .optional()
    .refine(
      value =>
        !value ||
        typeof value === 'number' ||
        /^\d+(\.\d+)?$/.test(String(value).trim()),
      { message: 'Weight must be a valid number' }
    )
    .refine(value => !value || (Number(value) >= 1 && Number(value) <= 500), {
      message: 'Weight must be between 1 and 500 kg',
    })
    .transform(value => (value ? String(value) : value)),
  cephalocaudal_assessment: z
    .object({
      general_survey: z
        .string()
        .optional()
        .refine(value => !value || value.trim().length <= 300, {
          message: 'General survey findings should not exceed 300 characters',
        }),
      head_and_face: z
        .string()
        .optional()
        .refine(value => !value || value.trim().length <= 300, {
          message: 'Head and face findings should not exceed 300 characters',
        }),
      eyes: z
        .string()
        .optional()
        .refine(value => !value || value.trim().length <= 300, {
          message: 'Eyes findings should not exceed 300 characters',
        }),
      ears: z
        .string()
        .optional()
        .refine(value => !value || value.trim().length <= 300, {
          message: 'Ears findings should not exceed 300 characters',
        }),
      nose_and_sinuses: z
        .string()
        .optional()
        .refine(value => !value || value.trim().length <= 300, {
          message: 'Nose and sinuses findings should not exceed 300 characters',
        }),
      mouth_and_throat: z
        .string()
        .optional()
        .refine(value => !value || value.trim().length <= 300, {
          message: 'Mouth and throat findings should not exceed 300 characters',
        }),
      neck: z
        .string()
        .optional()
        .refine(value => !value || value.trim().length <= 300, {
          message: 'Neck findings should not exceed 300 characters',
        }),
      chest_and_lungs: z
        .string()
        .optional()
        .refine(value => !value || value.trim().length <= 300, {
          message: 'Chest and lungs findings should not exceed 300 characters',
        }),
      heart: z
        .string()
        .optional()
        .refine(value => !value || value.trim().length <= 300, {
          message: 'Heart findings should not exceed 300 characters',
        }),
      abdomen: z
        .string()
        .optional()
        .refine(value => !value || value.trim().length <= 300, {
          message: 'Abdomen findings should not exceed 300 characters',
        }),
      genitourinary: z
        .string()
        .optional()
        .refine(value => !value || value.trim().length <= 300, {
          message: 'Genitourinary findings should not exceed 300 characters',
        }),
      extremities: z
        .string()
        .optional()
        .refine(value => !value || value.trim().length <= 300, {
          message: 'Extremities findings should not exceed 300 characters',
        }),
      neurological: z
        .string()
        .optional()
        .refine(value => !value || value.trim().length <= 300, {
          message: 'Neurological findings should not exceed 300 characters',
        }),
      skin_and_back: z
        .string()
        .optional()
        .refine(value => !value || value.trim().length <= 300, {
          message: 'Skin and back findings should not exceed 300 characters',
        }),
    })
    .optional(),

  // Laboratory Findings
  laboratory_results: z
    .string()
    .optional()
    .refine(value => !value || value.trim().length <= 1000, {
      message: 'Laboratory results should not exceed 1000 characters',
    })
    .refine(value => !value || value.trim().length >= 10, {
      message:
        'Laboratory results should be at least 10 characters if provided',
    }),

  // Existing Subjective and Objective Data (keep validation)
  subjective: z
    .string()
    .optional()
    .refine(
      value =>
        !value ||
        value
          .split('\n')
          .filter(line => line.trim() !== '')
          .every(line => line.length >= 5 && line.length <= 250),
      {
        message:
          'Each line in subjective data must be between 5 and 250 characters.',
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
        message: 'Subjective data must not contain duplicate lines.',
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
        message: 'Subjective data contains invalid control characters.',
      }
    ),

  objective: z
    .string()
    .optional()
    .refine(
      value =>
        !value ||
        value
          .split('\n')
          .filter(line => line.trim() !== '')
          .every(line => line.length >= 5 && line.length <= 250),
      {
        message:
          'Each line in objective data must be between 5 and 250 characters.',
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
        message: 'Objective data must not contain duplicate lines.',
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
            .every(line => line.length >= 5 && line.length <= 250),
        {
          message:
            'Each line in primary symptoms must be between 5 and 250 characters.',
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
            .every(line => line.length >= 5 && line.length <= 250),
        {
          message:
            'Each line in other complaints must be between 5 and 250 characters.',
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
            .every(line => line.length >= 5 && line.length <= 250),
        {
          message:
            'Each line in physical examination must be between 5 and 250 characters.',
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
            .every(line => line.length >= 5 && line.length <= 250),
        {
          message:
            'Each line in vital signs must be between 5 and 250 characters.',
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
            .every(line => line.length >= 5 && line.length <= 250),
        {
          message:
            'Each line in other findings must be between 5 and 250 characters.',
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
    .max(250, 'Chief complaint should be brief and concise'),
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
      .max(250, 'Other symptoms description should be concise')
      .optional(),
  }),
  medical_history: z.array(z.string()).optional(),
  medical_history_other: z
    .string()
    .max(250, 'Medical history should be concise')
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
    .max(250, 'Risk factors should be concise')
    .optional(),
  nurse_notes: z.string().max(500, 'Nurse notes should be concise').optional(),
})
