<script setup>
import EditingHelp from '@/components/ncp/EditingHelp.vue'
import EditingPreview from '@/components/ncp/EditingPreview.vue'
import StructuredNCPRenderer from '@/components/ncp/StructuredNCPRenderer.vue'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useStructuredNCPComponent } from '@/utils/structuredNCPComponentUtils'
import { Edit, Save, X } from 'lucide-vue-next'
import { toRef, watch } from 'vue'

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

const ncp = toRef(props, 'ncp')
const format = toRef(props, 'format')

const {
  isEditing,
  isSaving,
  formData,
  columns,
  editableColumnsInFormat,
  formattedNCP,
  startEditing,
  cancelEditing,
  saveChanges,
} = useStructuredNCPComponent(ncp, format, emit)

watch(
  () => props.ncp,
  newNcp => {
    if (newNcp && ncp.value !== newNcp) {
      ncp.value = newNcp
    }
  },
  { deep: true }
)

watch(
  () => props.format,
  newFormat => {
    if (newFormat && format.value !== newFormat) {
      format.value = newFormat
    }
  }
)
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
              class="border-primary/10 group p-4 text-xs align-top border min-w-[200px]"
              :class="{
                'hover:bg-primary/5': !isEditing,
                'bg-muted/20':
                  isEditing &&
                  editableColumnsInFormat.some(col => col.key === column.key),
              }"
            >
              <!-- Assessment Column (Read-only) -->
              <div v-if="column.key === 'assessment'" class="space-y-3">
                <StructuredNCPRenderer
                  :items="formattedNCP[column.key] || []"
                />
              </div>

              <!-- Editable Columns - View Mode -->
              <div v-else-if="!isEditing" class="space-y-3">
                <StructuredNCPRenderer
                  :items="formattedNCP[column.key] || []"
                />
              </div>

              <!-- Edit Mode -->
              <div
                v-else-if="
                  editableColumnsInFormat.some(col => col.key === column.key)
                "
                class="space-y-2"
              >
                <EditingHelp :column-key="column.key" />
                <Textarea
                  v-model="formData[column.key]"
                  :placeholder="`Enter ${column.label.toLowerCase()}...`"
                  class="min-h-[200px] resize-none font-mono text-xs"
                  :disabled="isSaving"
                />
                <div class="flex items-center justify-between">
                  <div
                    class="text-xs text-muted-foreground flex items-center gap-1"
                  >
                    <span>💡</span>
                    <span
                      >Use the structured format above or paste JSON directly -
                      both work perfectly!</span
                    >
                  </div>
                  <EditingPreview
                    :text-data="formData[column.key]"
                    :column-key="column.key"
                    :column-label="column.label"
                    :full-ncp="ncp"
                  />
                </div>
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
