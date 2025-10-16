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
 * Deep equality check for objects
 */
function deepEqual(obj1, obj2) {
  if (obj1 === obj2) return true

  if (obj1 == null || obj2 == null) return obj1 === obj2

  if (typeof obj1 !== typeof obj2) return false

  if (typeof obj1 !== 'object') return obj1 === obj2

  // Handle arrays
  if (Array.isArray(obj1) !== Array.isArray(obj2)) return false

  if (Array.isArray(obj1)) {
    if (obj1.length !== obj2.length) return false
    for (let i = 0; i < obj1.length; i++) {
      if (!deepEqual(obj1[i], obj2[i])) return false
    }
    return true
  }

  // Handle objects
  const keys1 = Object.keys(obj1).sort()
  const keys2 = Object.keys(obj2).sort()

  if (keys1.length !== keys2.length) return false

  for (let i = 0; i < keys1.length; i++) {
    if (keys1[i] !== keys2[i]) return false
    if (!deepEqual(obj1[keys1[i]], obj2[keys1[i]])) return false
  }

  return true
}

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
      console.log('=== EMERGENCY RATIONALE BACKUP ===')
      console.log(
        'Backing up rationale:',
        JSON.stringify(originalRationale, null, 2)
      )

      // IMPORTANT: Only convert fields that were actually changed by the user
      // This prevents corrupting data (like rationale) that wasn't edited
      const updateData = { ...ncpRef.value } // Start with current NCP data - CRITICAL!
      let hasActualChanges = false
      let userMadeTextChanges = false

      // First, identify which fields the user actually changed
      const changedFields = []
      Object.keys(formData).forEach(key => {
        if (formData[key] !== originalFormData[key]) {
          console.log(`User modified text for ${key}`)
          console.log('Original text:', originalFormData[key])
          console.log('Current text:', formData[key])
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

      // Special debug for rationale - log current state before any changes
      console.log('=== RATIONALE STATE BEFORE SAVE ===')
      console.log(
        'Current rationale in NCP:',
        JSON.stringify(ncpRef.value.rationale, null, 2)
      )
      console.log('Rationale in form data:', formData.rationale)
      console.log('Original rationale form data:', originalFormData.rationale)
      console.log(
        'Did user change rationale?',
        changedFields.includes('rationale')
      )
      console.log('Changed fields:', changedFields)

      // Now, only convert the fields that were actually changed
      changedFields.forEach(key => {
        const textData = formData[key]
        let convertedData

        console.log(`=== CONVERTING CHANGED FIELD: ${key} ===`)
        console.log('Text data to convert:', textData)

        try {
          // First try to parse as JSON (in case user edited JSON directly)
          const parsed = JSON.parse(textData)
          if (typeof parsed === 'object' && parsed !== null) {
            convertedData = parsed
            console.log(`${key}: Successfully parsed as JSON`)
          } else {
            convertedData = convertTextToStructured(textData, key)
            console.log(`${key}: Converted from text format`)
          }
        } catch {
          // Not valid JSON, convert from text format
          convertedData = convertTextToStructured(textData, key)
          console.log(`${key}: Converted from text format (JSON parse failed)`)
        }

        console.log(`${key}: Converted result:`, convertedData)
        updateData[key] = convertedData

        // Check if data actually changed by comparing with original
        const originalValue = ncpRef.value[key]
        const isEqual = deepEqual(originalValue, convertedData)

        // Debug logging to see what's different
        if (!isEqual) {
          console.log(`Data changed for ${key}:`)
          console.log('Original:', originalValue)
          console.log('Converted:', convertedData)
          console.log(
            'Types - Original:',
            typeof originalValue,
            'Converted:',
            typeof convertedData
          )
          hasActualChanges = true
        } else {
          console.log(`No change detected for ${key}`)
        }
      })

      // EMERGENCY: Force preserve rationale if it wasn't changed
      if (!changedFields.includes('rationale')) {
        console.log('=== EMERGENCY RATIONALE PRESERVATION ===')
        console.log('Forcing rationale preservation since it was not changed')
        updateData.rationale = originalRationale
      }

      // Final debug logging
      console.log('=== FINAL UPDATE DATA ===')
      console.log(
        'Rationale in final updateData:',
        JSON.stringify(updateData.rationale, null, 2)
      )

      // If user made changes but data structure comparison says no changes,
      // it means the conversion is working correctly
      if (!hasActualChanges && userMadeTextChanges) {
        console.log(
          'User made text changes but structure remains the same - this is good!'
        )
      }

      console.log('=== SENDING TO DATABASE ===')
      console.log(
        'Update data being sent:',
        JSON.stringify(updateData, null, 2)
      )

      const updatedNCP = await ncpService.updateNCP(ncpRef.value.id, updateData)

      console.log('=== RECEIVED FROM DATABASE ===')
      console.log('Updated NCP received:', JSON.stringify(updatedNCP, null, 2))
      console.log(
        'Rationale in response:',
        JSON.stringify(updatedNCP.rationale, null, 2)
      )

      // CRITICAL: Preserve rationale if it's missing from the response
      if (!updatedNCP.rationale && ncpRef.value.rationale) {
        console.log('=== RESTORING MISSING RATIONALE FROM RESPONSE ===')
        updatedNCP.rationale = ncpRef.value.rationale
      }

      // Update the original ncp object to trigger reactivity
      Object.assign(ncpRef.value, updatedNCP)

      console.log('=== FINAL NCP STATE AFTER SAVE ===')
      console.log(
        'Rationale in final NCP:',
        JSON.stringify(ncpRef.value.rationale, null, 2)
      )

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
