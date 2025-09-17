/**
 * Simplified NCP Component Utilities
 * Uses the new structured approach for handling JSON NCP data from backend
 */

import { useToast } from '@/components/ui/toast/use-toast'
import { ncpService } from '@/services/ncpService'
import { exportUtils } from '@/utils/exportUtils'
import {
  formatStructuredNCPForDisplay,
  getAllNCPColumns,
  getEditableColumns,
  prepareExportData,
} from '@/utils/structuredNCPUtils'
import { computed, reactive, ref, toRef, watch } from 'vue'

/**
 * Core NCP editing functionality for structured data
 */
export function useStructuredNCPEditor(ncp, format, emit) {
  const { toast } = useToast()
  const isEditing = ref(false)
  const isSaving = ref(false)
  const formData = reactive({})

  const allColumns = getAllNCPColumns()
  const editableColumns = getEditableColumns()

  const ncpRef = toRef(ncp)
  const formatRef = toRef(format)

  const columns = computed(() => {
    return allColumns.slice(0, parseInt(formatRef.value))
  })

  const editableColumnsInFormat = computed(() => {
    return editableColumns.filter(col =>
      columns.value.some(c => c.key === col.key)
    )
  })

  const initializeFormData = () => {
    editableColumnsInFormat.value.forEach(column => {
      // For structured data, we need to serialize complex objects as JSON strings for editing
      const value = ncpRef.value[column.key]
      if (typeof value === 'object' && value !== null) {
        formData[column.key] = JSON.stringify(value, null, 2)
      } else {
        formData[column.key] = value || ''
      }
    })
  }

  // Watch for changes in ncp data and reinitialize form data
  watch(
    ncpRef,
    newNcp => {
      if (newNcp && isEditing.value) {
        initializeFormData()
      }
    },
    { deep: true }
  )

  const startEditing = () => {
    isEditing.value = true
    initializeFormData()
  }

  const cancelEditing = () => {
    isEditing.value = false
    if (emit) emit('cancel-edit')
  }

  const saveChanges = async () => {
    isSaving.value = true
    try {
      // Parse JSON strings back to objects before saving
      const updateData = {}
      Object.keys(formData).forEach(key => {
        try {
          // Try to parse as JSON first (for structured fields)
          updateData[key] = JSON.parse(formData[key])
        } catch {
          // If not valid JSON, keep as string
          updateData[key] = formData[key]
        }
      })

      const updatedNCP = await ncpService.updateNCP(ncpRef.value.id, updateData)

      // Update the original ncp object to trigger reactivity
      Object.assign(ncpRef.value, updatedNCP)

      toast({
        title: 'Success',
        description: 'NCP updated successfully',
      })

      isEditing.value = false
      if (emit) emit('ncp-updated', updatedNCP)
      return updatedNCP
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update NCP',
        variant: 'destructive',
      })
      throw error
    } finally {
      isSaving.value = false
    }
  }

  return {
    isEditing,
    isSaving,
    formData,
    columns,
    editableColumnsInFormat,
    startEditing,
    cancelEditing,
    saveChanges,
    initializeFormData,
  }
}

/**
 * NCP formatting functionality for structured data
 */
export function useStructuredNCPFormatter(ncp) {
  const ncpRef = toRef(ncp)

  const formattedNCP = computed(() => {
    return formatStructuredNCPForDisplay(ncpRef.value)
  })

  return {
    formattedNCP,
  }
}

/**
 * NCP export functionality for structured data
 */
export function useStructuredNCPExporter(ncp, format, formattedNCP) {
  const { toast } = useToast()
  const allColumns = getAllNCPColumns()
  const ncpRef = toRef(ncp)
  const formatRef = toRef(format)

  const handleExport = async exportType => {
    try {
      const currentColumns = allColumns.slice(0, parseInt(formatRef.value))
      const columnLabels = currentColumns.map(col => col.label)

      const finalExportData = prepareExportData(
        ncpRef.value,
        currentColumns,
        formattedNCP.value
      )

      switch (exportType) {
        case 'pdf':
          await exportUtils.toPDF(finalExportData, columnLabels, false)
          break
        case 'xlsx':
          await exportUtils.toXLSX(finalExportData, columnLabels, false)
          break
        case 'word':
          await exportUtils.toWord(finalExportData, columnLabels, false)
          break
        case 'png':
          await exportUtils.toPNG(finalExportData, columnLabels, false)
          break
        default:
          throw new Error('Unsupported export format')
      }

      toast({
        title: 'Export Successful',
        description: `NCP exported as ${exportType.toUpperCase()} successfully.`,
      })
    } catch (error) {
      console.error('Export failed:', error)
      toast({
        title: 'Export Failed',
        description: `Failed to export NCP as ${exportType.toUpperCase()}. Please try again.`,
        variant: 'destructive',
      })
    }
  }

  return {
    handleExport,
  }
}

/**
 * NCP management functionality (rename, delete, etc.)
 */
export function useStructuredNCPManagement(ncp, emit) {
  const { toast } = useToast()
  const showRenameDialog = ref(false)
  const ncpRef = toRef(ncp)

  const openRenameDialog = () => {
    showRenameDialog.value = true
  }

  const handleNCPRenamed = updatedNCP => {
    // Update the original ncp object to trigger reactivity
    if (ncpRef.value) {
      Object.assign(ncpRef.value, updatedNCP)
    }

    if (emit) emit('ncp-renamed', updatedNCP)

    // Update document title if available
    if (typeof document !== 'undefined') {
      document.title = `${updatedNCP.title} - AI NCP Generator`
    }

    toast({
      title: 'Success',
      description: 'NCP renamed successfully',
    })
  }

  const handleNCPUpdated = updatedNCP => {
    // Update the original ncp object to trigger reactivity
    if (ncpRef.value) {
      Object.assign(ncpRef.value, updatedNCP)
    }

    if (emit) emit('ncp-updated', updatedNCP)

    toast({
      title: 'Success',
      description: 'NCP updated successfully',
    })
  }

  return {
    showRenameDialog,
    openRenameDialog,
    handleNCPRenamed,
    handleNCPUpdated,
  }
}

/**
 * NCP loading functionality
 */
export function useStructuredNCPLoader() {
  const { toast } = useToast()
  const ncp = ref(null)
  const isLoading = ref(true)
  const format = ref('7')

  const loadNCP = async ncpId => {
    try {
      isLoading.value = true
      const result = await ncpService.getNCPById(ncpId)
      ncp.value = result
      format.value = result.format_type || '7'

      console.log('Fetched Structured NCP from database:', result)
      return result
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load NCP. Please try again.',
        variant: 'destructive',
      })
      throw error
    } finally {
      isLoading.value = false
    }
  }

  const refreshNCP = async () => {
    if (ncp.value?.id) {
      const refreshedNCP = await ncpService.getNCPById(ncp.value.id)
      Object.assign(ncp.value, refreshedNCP)
    }
  }

  return {
    ncp,
    isLoading,
    format,
    loadNCP,
    refreshNCP,
  }
}

/**
 * Error handling functionality
 */
export function useStructuredNCPErrorHandler() {
  const { toast } = useToast()

  const handleError = (error, context = 'Operation') => {
    console.error(`${context} error:`, error)

    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      `${context} failed. Please try again.`

    toast({
      title: 'Error',
      description: errorMessage,
      variant: 'destructive',
    })
  }

  const handleSuccess = (message = 'Operation completed successfully') => {
    toast({
      title: 'Success',
      description: message,
    })
  }

  return {
    handleError,
    handleSuccess,
  }
}

/**
 * Comprehensive structured NCP component utilities
 * Combines multiple utilities for complete NCP management with structured data
 */
export function useStructuredNCPComponent(ncp, format, emit) {
  const editor = useStructuredNCPEditor(ncp, format, emit)
  const formatter = useStructuredNCPFormatter(ncp)
  const exporter = useStructuredNCPExporter(ncp, format, formatter.formattedNCP)
  const management = useStructuredNCPManagement(ncp, emit)
  const errorHandler = useStructuredNCPErrorHandler()

  return {
    ...editor,
    ...formatter,
    ...exporter,
    ...management,
    ...errorHandler,
  }
}

// Backward compatibility exports (using the original names but with structured functionality)
export {
  useStructuredNCPComponent as useNCPComponent,
  useStructuredNCPEditor as useNCPEditor,
  useStructuredNCPErrorHandler as useNCPErrorHandler,
  useStructuredNCPExporter as useNCPExporter,
  useStructuredNCPFormatter as useNCPFormatter,
  useStructuredNCPLoader as useNCPLoader,
  useStructuredNCPManagement as useNCPManagement,
}
