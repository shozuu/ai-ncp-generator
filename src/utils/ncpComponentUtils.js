import { useToast } from '@/components/ui/toast/use-toast'
import { ncpService } from '@/services/ncpService'
import { exportUtils } from '@/utils/exportUtils'
import {
  formatNCPForDisplay,
  getAllNCPColumns,
  getEditableColumns,
  parseNCPSectionContent,
  prepareExportData,
} from '@/utils/ncpUtils'
import { computed, reactive, ref, toRef, watch } from 'vue'

/**
 * Common NCP editing functionality
 */
export function useNCPEditor(ncp, format, emit) {
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
      formData[column.key] = ncpRef.value[column.key] || ''
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
      const updatedNCP = await ncpService.updateNCP(ncpRef.value.id, formData)

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
 * Common NCP formatting functionality
 */
export function useNCPFormatter(ncp) {
  const allColumns = getAllNCPColumns()
  const ncpRef = toRef(ncp)

  const formatTextToLines = text => {
    if (!text || typeof text !== 'string') return []
    return text
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
  }

  const formattedNCP = computed(() => {
    const formatted = {}
    for (const key in ncpRef.value) {
      if (allColumns.some(col => col.key === key)) {
        const structure = parseNCPSectionContent(ncpRef.value[key], key)
        formatted[key] = formatNCPForDisplay(structure)
      } else {
        formatted[key] = formatTextToLines(ncpRef.value[key])
      }
    }
    return formatted
  })

  return {
    formattedNCP,
    formatTextToLines,
  }
}

/**
 * Common NCP export functionality
 */
export function useNCPExporter(ncp, format, formattedNCP) {
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
 * Common NCP management functionality (rename, delete, etc.)
 */
export function useNCPManagement(ncp, emit) {
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
 * Common NCP loading functionality
 */
export function useNCPLoader() {
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
 * Common error handling functionality
 */
export function useNCPErrorHandler() {
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
 * Comprehensive NCP component utilities
 * Combines multiple utilities for complete NCP management
 */
export function useNCPComponent(ncp, format, emit) {
  const editor = useNCPEditor(ncp, format, emit)
  const formatter = useNCPFormatter(ncp)
  const exporter = useNCPExporter(ncp, format, formatter.formattedNCP)
  const management = useNCPManagement(ncp, emit)
  const errorHandler = useNCPErrorHandler()

  return {
    ...editor,
    ...formatter,
    ...exporter,
    ...management,
    ...errorHandler,
  }
}
