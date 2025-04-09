import { useToast } from '@/components/ui/toast'
import { ref } from 'vue'

export function useApiError() {
  const error = ref(null)
  const { toast } = useToast()

  const handleError = err => {
    error.value = err
    toast({
      title: 'Error',
      description: err.response?.data?.message || err.message,
      variant: 'destructive',
    })
  }

  return {
    error,
    handleError,
  }
}
