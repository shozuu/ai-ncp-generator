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
import {
  convertStructuredToText,
  convertTextToStructured,
} from '@/utils/structuredToTextConverter'
import { computed, reactive, ref, toRef, watch } from 'vue'

/**
 * Core NCP editing functionality for structured data
 */
export function useStructuredNCPEditor(ncp, format, emit) {
  const { toast } = useToast()
  const isEditing = ref(false)
  const isSaving = ref(false)
  const formData = reactive({})
  const originalFormData = reactive({}) // Track original form text for comparison

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
      // For structured data, convert to user-friendly text format for editing
      const value = ncpRef.value[column.key]

      let textValue
      // Handle different value types
      if (value === null || value === undefined) {
        // Use placeholder text for missing sections
        textValue = convertStructuredToText(null, column.key)
      } else if (typeof value === 'object') {
        textValue = convertStructuredToText(value, column.key)
      } else if (typeof value === 'string') {
        textValue = value
      } else {
        // For any other type, convert to string or use placeholder
        textValue = String(value) || convertStructuredToText(null, column.key)
      }

      formData[column.key] = textValue
      originalFormData[column.key] = textValue // Store original text for comparison
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
      // Store the original rationale to protect it
      const originalRationale = ncpRef.value.rationale

      // IMPORTANT: Only convert fields that were actually changed by the user
      // This prevents corrupting data (like rationale) that wasn't edited
      const updateData = { ...ncpRef.value } // Start with current NCP data - CRITICAL!
      let userMadeTextChanges = false

      // First, identify which fields the user actually changed
      const changedFields = []
      Object.keys(formData).forEach(key => {
        if (formData[key] !== originalFormData[key]) {
          userMadeTextChanges = true
          changedFields.push(key)
        }
      })

      // Only save if user actually made text changes
      if (!userMadeTextChanges) {
        toast({
          title: 'No Changes',
          description: 'No modifications detected. Nothing to save.',
        })
        isEditing.value = false
        return ncpRef.value
      }

      // Now, only convert the fields that were actually changed
      changedFields.forEach(key => {
        const textData = formData[key]
        let convertedData

        try {
          // First try to parse as JSON (in case user edited JSON directly)
          const parsed = JSON.parse(textData)
          if (typeof parsed === 'object' && parsed !== null) {
            convertedData = parsed
          } else {
            convertedData = convertTextToStructured(textData, key)
          }
        } catch {
          // Not valid JSON, convert from text format
          convertedData = convertTextToStructured(textData, key)
        }

        // SPECIAL HANDLING FOR RATIONALE: Be extra careful
        if (key === 'rationale') {
          // Validate that the converted rationale has meaningful content
          const hasValidRationaleContent = data => {
            if (!data || typeof data !== 'object') return false

            if (data.interventions && typeof data.interventions === 'object') {
              return Object.keys(data.interventions).length > 0
            }

            // Check for other valid rationale structures
            if (data.independent || data.dependent || data.collaborative) {
              return true
            }

            return false
          }

          if (!hasValidRationaleContent(convertedData)) {
            console.warn(
              'Converted rationale appears invalid, preserving original'
            )
            convertedData = originalRationale
          }
        }

        updateData[key] = convertedData
      })

      // EMERGENCY: Force preserve rationale if it wasn't changed
      if (!changedFields.includes('rationale')) {
        updateData.rationale = originalRationale
      } else {
        // Double-check rationale preservation even if it was changed
        if (
          !updateData.rationale ||
          Object.keys(updateData.rationale).length === 0
        ) {
          console.warn('Rationale in updateData is empty, restoring original')
          updateData.rationale = originalRationale
        }
      }

      const updatedNCP = await ncpService.updateNCP(ncpRef.value.id, updateData)

      // CRITICAL: Preserve rationale if it's missing from the response
      if (!updatedNCP.rationale && originalRationale) {
        console.warn('Rationale missing from response, restoring from backup')
        updatedNCP.rationale = originalRationale
      }

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
          await exportUtils.toWordEnhanced(finalExportData, columnLabels, false)
          break
        case 'png':
          await exportUtils.toPNGEnhanced(finalExportData, columnLabels, false)
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
