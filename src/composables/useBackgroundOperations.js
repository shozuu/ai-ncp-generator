import { useToast } from '@/components/ui/toast/use-toast'
import { computed, reactive } from 'vue'

// Global state for background operations
const operations = reactive(new Map())
const { toast } = useToast()

export function useBackgroundOperations() {
  /**
   * Start a background operation
   * @param {string} id - Unique identifier for the operation
   * @param {string} type - Type of operation ('ncp-generation', 'explanation-generation')
   * @param {Object} options - Operation options
   */
  const startOperation = (id, type, options = {}) => {
    operations.set(id, {
      id,
      type,
      status: 'in-progress',
      startTime: Date.now(),
      title: options.title || 'AI Operation',
      description: options.description || 'Processing...',
      progress: options.progress || null,
      abortController: options.abortController || null,
      onComplete: options.onComplete || null,
      onError: options.onError || null,
    })
    
    console.log(`Started background operation: ${type} (${id})`)
  }

  /**
   * Update operation progress
   * @param {string} id - Operation ID
   * @param {Object} updates - Updates to apply
   */
  const updateOperation = (id, updates) => {
    const operation = operations.get(id)
    if (operation) {
      Object.assign(operation, updates)
    }
  }

  /**
   * Complete an operation successfully
   * @param {string} id - Operation ID
   * @param {*} result - Operation result
   */
  const completeOperation = (id, result) => {
    const operation = operations.get(id)
    if (operation) {
      operation.status = 'completed'
      operation.result = result
      operation.endTime = Date.now()
      
      // Show success notification
      toast({
        title: 'Success',
        description: `${operation.title} completed successfully!`,
      })

      // Call completion handler if provided
      if (operation.onComplete) {
        operation.onComplete(result)
      }

      // Remove from operations after a delay
      setTimeout(() => {
        operations.delete(id)
      }, 3000)
    }
  }

  /**
   * Fail an operation
   * @param {string} id - Operation ID
   * @param {Error} error - Error that occurred
   */
  const failOperation = (id, error) => {
    const operation = operations.get(id)
    if (operation) {
      operation.status = 'failed'
      operation.error = error
      operation.endTime = Date.now()

      // Show error notification only if not cancelled
      if (error.name !== 'AbortError' && error.name !== 'CanceledError') {
        toast({
          title: 'Error',
          description: `${operation.title} failed: ${error.message}`,
          variant: 'destructive',
        })
      }

      // Call error handler if provided
      if (operation.onError && error.name !== 'AbortError' && error.name !== 'CanceledError') {
        operation.onError(error)
      }

      // Remove from operations after a delay
      setTimeout(() => {
        operations.delete(id)
      }, 3000)
    }
  }

  /**
   * Cancel an operation
   * @param {string} id - Operation ID
   */
  const cancelOperation = (id) => {
    const operation = operations.get(id)
    if (operation && operation.status === 'in-progress') {
      // Abort the request
      if (operation.abortController) {
        operation.abortController.abort()
      }

      operation.status = 'cancelled'
      operation.endTime = Date.now()

      toast({
        title: 'Cancelled',
        description: `${operation.title} was cancelled.`,
      })

      // Remove from operations
      setTimeout(() => {
        operations.delete(id)
      }, 1000)
    }
  }

  /**
   * Get all active operations
   */
  const activeOperations = computed(() => {
    return Array.from(operations.values()).filter(op => op.status === 'in-progress')
  })

  /**
   * Check if there are any active AI operations
   */
  const hasActiveOperations = computed(() => {
    return activeOperations.value.length > 0
  })

  /**
   * Check if a specific type of operation is active
   * @param {string} type - Operation type to check
   */
  const hasActiveOperationType = (type) => {
    return activeOperations.value.some(op => op.type === type)
  }

  /**
   * Get operation by ID
   * @param {string} id - Operation ID
   */
  const getOperation = (id) => {
    return operations.get(id)
  }

  return {
    // State
    operations,
    activeOperations,
    hasActiveOperations,

    // Actions
    startOperation,
    updateOperation,
    completeOperation,
    failOperation,
    cancelOperation,
    hasActiveOperationType,
    getOperation,
  }
}