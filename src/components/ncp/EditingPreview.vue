<script setup>
import StructuredNCPRenderer from '@/components/ncp/StructuredNCPRenderer.vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { formatStructuredNCPForDisplay } from '@/utils/structuredNCPUtils'
import { convertTextToStructured } from '@/utils/structuredToTextConverter'
import { AlertTriangle, Eye } from 'lucide-vue-next'
import { computed, ref } from 'vue'

const props = defineProps({
  textData: {
    type: String,
    required: true,
  },
  columnKey: {
    type: String,
    required: true,
  },
  columnLabel: {
    type: String,
    required: true,
  },
})

const isOpen = ref(false)

const previewData = computed(() => {
  if (!props.textData || !props.textData.trim()) {
    return {
      items: [],
      error: null,
      isEmpty: true,
    }
  }

  try {
    // Convert text to structured format
    const structured = convertTextToStructured(props.textData, props.columnKey)

    // Create a mock NCP object with just this column
    const mockNCP = {
      [props.columnKey]: structured,
    }

    // Format for display
    const formatted = formatStructuredNCPForDisplay(mockNCP)

    return {
      items: formatted[props.columnKey] || [],
      error: null,
      isEmpty: false,
    }
  } catch (error) {
    return {
      items: [],
      error: error.message,
      isEmpty: false,
    }
  }
})

const hasContent = computed(() => {
  return previewData.value.items && previewData.value.items.length > 0
})
</script>

<template>
  <Dialog v-model:open="isOpen">
    <DialogTrigger as-child>
      <Button
        variant="ghost"
        size="sm"
        class="text-xs h-7 text-muted-foreground hover:text-foreground"
        :disabled="!textData || !textData.trim()"
      >
        <Eye class="w-3 h-3 mr-1" />
        Preview
      </Button>
    </DialogTrigger>
    <DialogContent class="max-w-4xl max-h-[80vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle class="flex items-center gap-2">
          <Eye class="w-4 h-4" />
          Preview: {{ columnLabel }}
        </DialogTitle>
        <DialogDescription>
          This is how your {{ columnLabel.toLowerCase() }} content will appear
          after saving.
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-4">
        <!-- Preview Content -->
        <div
          v-if="previewData.isEmpty"
          class="text-center py-8 text-muted-foreground"
        >
          <Eye class="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>No content to preview</p>
          <p class="text-xs">Enter some content to see the preview</p>
        </div>

        <div v-else-if="previewData.error" class="space-y-3">
          <div class="flex items-center gap-2 text-amber-600">
            <AlertTriangle class="w-4 h-4" />
            <span class="text-sm font-medium">Preview Warning</span>
          </div>
          <div class="p-3 bg-amber-50 border border-amber-200 rounded text-sm">
            <p class="mb-2">There was an issue parsing your content:</p>
            <code class="text-xs bg-amber-100 px-2 py-1 rounded">{{
              previewData.error
            }}</code>
            <p class="mt-2 text-xs text-amber-700">
              Your content will be saved as-is. Consider checking the format or
              using JSON if needed.
            </p>
          </div>
        </div>

        <div v-else-if="hasContent" class="space-y-3">
          <div class="flex items-center gap-2">
            <Badge variant="secondary" class="text-xs">
              <Eye class="w-3 h-3 mr-1" />
              Live Preview
            </Badge>
            <span class="text-xs text-muted-foreground">
              This is how it will appear in the NCP display
            </span>
          </div>

          <div class="border rounded-md p-4 bg-card">
            <div class="text-sm font-medium mb-3 text-primary">
              {{ columnLabel }}
            </div>
            <StructuredNCPRenderer :items="previewData.items" />
          </div>
        </div>

        <div v-else class="text-center py-6 text-muted-foreground">
          <AlertTriangle class="w-6 h-6 mx-auto mb-2 opacity-50" />
          <p class="text-sm">Unable to generate preview</p>
          <p class="text-xs">Content may be in an unexpected format</p>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>
