import { useToast } from '@/components/ui/toast/use-toast'

const ERROR_MAPPINGS = {
  'sex is required': {
    title: 'Missing Required Information',
    description:
      "Patient sex is required. Please provide the patient's sex or switch to Manual Mode.",
  },
  'chief complaint is required': {
    title: 'Missing Required Information',
    description:
      "Chief complaint is required. Please provide the main reason for the patient's visit.",
  },
  'Unable to extract sufficient clinical information': {
    title: 'Insufficient Clinical Data',
    description:
      'Please provide more details: symptoms, vital signs, physical findings, or medical history.',
  },
  parsing: {
    title: 'Data Processing Error',
    description:
      'Failed to process your assessment data. Please check your input format.',
  },
  'Could not generate diagnosis and NCP': {
    title: 'Generation Failed',
    description: 'Could not generate diagnosis and NCP. Please try again.',
  },
}

export function useGenerationErrorHandler() {
  const { toast } = useToast()

  // General error handler (with suggestion support)
  const handleError = (error, opts = {}) => {
    let errorMessage =
      error?.message || opts.defaultMessage || 'An error occurred'
    let suggestion = opts.suggestion || ''
    let variant = opts.variant || 'destructive'

    // Try to match error message to a mapping
    const errorMapping = Object.entries(ERROR_MAPPINGS).find(([key]) =>
      errorMessage.includes(key)
    )

    let title, description
    if (errorMapping) {
      title = errorMapping[1].title
      description = errorMapping[1].description
    } else {
      title = opts.title || 'Error'
      description = errorMessage
    }

    // If suggestion is present, append it
    if (suggestion) {
      description += ` ${suggestion}`
    }

    toast({
      title,
      description,
      variant,
      duration: opts.duration || 7000,
    })
  }

  // Success handler for various states
  const handleSuccess = (type, data = null) => {
    const messages = {
      processing: {
        title: 'Processing',
        description: 'Analyzing and structuring your assessment data...',
      },
      processed: {
        title: 'Success',
        description: 'Assessment data processed successfully',
      },
      generating: {
        title: 'Generating Care Plan',
        description: 'Finding best diagnosis and creating complete NCP...',
      },
      complete: {
        title: 'Care Plan Generated Successfully',
        description: data
          ? `Generated complete NCP with diagnosis: ${data}`
          : 'Generated complete NCP.',
        duration: 5000,
      },
      partial: {
        title: 'Diagnosis Found',
        description: data
          ? `Found diagnosis: ${data}. NCP generation encountered an issue.`
          : 'Diagnosis found, but NCP generation encountered an issue.',
        variant: 'destructive',
      },
    }

    const msg = messages[type]
    if (msg) toast(msg)
  }

  return { handleError, handleSuccess }
}
