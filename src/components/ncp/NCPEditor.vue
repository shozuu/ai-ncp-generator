<script setup>
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/toast/use-toast'
import { ncpService } from '@/services/ncpService'
import { formatNCPForDisplay, parseNCPSectionContent } from '@/utils/ncpUtils'
import { Edit, Save, X } from 'lucide-vue-next'
import { computed, reactive, ref } from 'vue'

const emit = defineEmits(['ncp-updated', 'cancel-edit'])
const props = defineProps({
  ncp: {
    type: Object,
    required: true,
  },
  format: {
    type: String,
    required: true,
  },
})

const { toast } = useToast()
const isEditing = ref(false)
const isSaving = ref(false)

// Editable columns (excluding assessment)
const editableColumns = [
  { key: 'diagnosis', label: 'Diagnosis' },
  { key: 'outcomes', label: 'Outcomes' },
  { key: 'interventions', label: 'Interventions' },
  { key: 'rationale', label: 'Rationale' },
  { key: 'implementation', label: 'Implementation' },
  { key: 'evaluation', label: 'Evaluation' },
]

const allColumns = [
  { key: 'assessment', label: 'Assessment' },
  ...editableColumns,
]

// Create reactive form data
const formData = reactive({})

const columns = computed(() => {
  return allColumns.slice(0, parseInt(props.format))
})

const editableColumnsInFormat = computed(() => {
  return editableColumns.filter(col =>
    columns.value.some(c => c.key === col.key)
  )
})

const initializeFormData = () => {
  editableColumnsInFormat.value.forEach(column => {
    formData[column.key] = props.ncp[column.key] || ''
  })
}

const startEditing = () => {
  isEditing.value = true
  initializeFormData()
}

const cancelEditing = () => {
  isEditing.value = false
  emit('cancel-edit')
}

const saveChanges = async () => {
  isSaving.value = true
  try {
    const updatedNCP = await ncpService.updateNCP(props.ncp.id, formData)

    toast({
      title: 'Success',
      description: 'NCP updated successfully',
    })

    isEditing.value = false
    emit('ncp-updated', updatedNCP)
  } catch (error) {
    toast({
      title: 'Error',
      description: error.message || 'Failed to update NCP',
      variant: 'destructive',
    })
  } finally {
    isSaving.value = false
  }
}

const formatTextToLines = text => {
  // Handle null, undefined, or non-string values
  if (!text || typeof text !== 'string') return []

  return text
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
}

const formattedNCP = computed(() => {
  const formatted = {}
  for (const key in props.ncp) {
    if (
      [
        'assessment',
        'diagnosis',
        'outcomes',
        'interventions',
        'rationale',
        'implementation',
        'evaluation',
      ].includes(key)
    ) {
      const structure = parseNCPSectionContent(props.ncp[key], key)
      formatted[key] = formatNCPForDisplay(structure)
    } else {
      formatted[key] = formatTextToLines(props.ncp[key])
    }
  }
  return formatted
})
</script>

<template>
  <div class="space-y-4">
    <!-- Edit Controls -->
    <div class="flex justify-end gap-2">
      <Button
        v-if="!isEditing"
        variant="outline"
        size="sm"
        @click="startEditing"
        class="hover:bg-muted/10"
      >
        <Edit class="w-4 h-4 mr-2" />
        Edit NCP
      </Button>

      <template v-else>
        <Button
          variant="outline"
          size="sm"
          @click="cancelEditing"
          :disabled="isSaving"
          class="hover:bg-muted/10"
        >
          <X class="w-4 h-4 mr-2" />
          Cancel
        </Button>
        <Button
          size="sm"
          @click="saveChanges"
          :disabled="isSaving"
          class="bg-primary hover:bg-primary/90"
        >
          <Save class="w-4 h-4 mr-2" />
          {{ isSaving ? 'Saving...' : 'Save Changes' }}
        </Button>
      </template>
    </div>

    <!-- Table Container -->
    <div class="max-h-[70vh] overflow-x-auto border border-muted rounded-md">
      <table class="min-w-full border-collapse bg-card text-card-foreground">
        <thead class="bg-muted sticky top-0 z-10">
          <tr class="border-b">
            <th
              v-for="column in columns"
              :key="column.key"
              class="border-primary/10 bg-primary/10 p-4 text-sm font-semibold text-left border min-w-[200px] h-auto"
            >
              {{ column.label }}
              <span
                v-if="column.key === 'assessment'"
                class="text-xs text-muted-foreground ml-1"
              >
                (Read-only)
              </span>
            </th>
          </tr>
        </thead>

        <tbody>
          <tr class="hover:bg-muted/20 border-b">
            <td
              v-for="column in columns"
              :key="column.key"
              class="border-primary/10 group hover:bg-primary/5 p-4 text-sm align-top border min-w-[200px]"
            >
              <!-- Assessment Column (Read-only) -->
              <div v-if="column.key === 'assessment'" class="space-y-3">
                <div
                  v-for="(item, itemIndex) in formattedNCP[column.key]"
                  :key="itemIndex"
                  class="leading-relaxed text-muted-foreground"
                  :class="{
                    'mb-3': itemIndex < formattedNCP[column.key].length - 1,
                    'font-semibold text-sm': item.type === 'header',
                    'mb-1': item.type === 'bullet',
                  }"
                >
                  <span v-if="item.type === 'bullet'" class="text-primary mr-1"
                    >*</span
                  >
                  {{ item.content }}
                </div>
              </div>

              <!-- Editable Columns - View Mode -->
              <div v-else-if="!isEditing" class="space-y-3">
                <div
                  v-for="(item, itemIndex) in formattedNCP[column.key]"
                  :key="itemIndex"
                  class="leading-relaxed"
                  :class="{
                    'mb-4':
                      item.type === 'header' &&
                      itemIndex < formattedNCP[column.key].length - 1,
                    'mb-3':
                      item.type === 'subheader' &&
                      itemIndex < formattedNCP[column.key].length - 1,
                    'mb-2':
                      item.type === 'text' &&
                      itemIndex < formattedNCP[column.key].length - 1,
                    'mb-1': item.type === 'bullet',
                    'font-semibold text-sm text-muted-foreground':
                      item.type === 'header',
                    'font-medium text-sm': item.type === 'subheader',
                  }"
                >
                  <span v-if="item.type === 'bullet'" class="text-primary mr-1"
                    >*</span
                  >
                  {{ item.content }}
                </div>
              </div>

              <!-- Edit Mode -->
              <div
                v-else-if="
                  editableColumnsInFormat.some(col => col.key === column.key)
                "
              >
                <Textarea
                  v-model="formData[column.key]"
                  :placeholder="`Enter ${column.label.toLowerCase()}...`"
                  class="min-h-[200px] resize-none"
                  :disabled="isSaving"
                />
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modification Status -->
    <div
      v-if="ncp.is_modified"
      class="flex items-center gap-2 text-sm text-amber-600"
    >
      <div class="w-2 h-2 bg-amber-500 rounded-full"></div>
      <span
        >This NCP has been modified from its original AI-generated version</span
      >
    </div>
  </div>
</template>
