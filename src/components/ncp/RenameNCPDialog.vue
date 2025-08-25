<script setup>
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/toast/use-toast'
import { ncpService } from '@/services/ncpService'
import { ref, watch } from 'vue'

const emit = defineEmits(['update:open', 'ncp-renamed'])
const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
  ncp: {
    type: Object,
    required: true,
  },
})

const { toast } = useToast()
const newTitle = ref('')
const isRenaming = ref(false)

watch(
  () => props.open,
  isOpen => {
    if (isOpen) {
      newTitle.value = props.ncp?.title || 'Nursing Care Plan'
    } else {
      newTitle.value = ''
      isRenaming.value = false
    }
  }
)

const closeDialog = () => {
  emit('update:open', false)
}

const confirmRename = async () => {
  if (!newTitle.value.trim()) {
    toast({
      title: 'Error',
      description: 'Title cannot be empty.',
      variant: 'destructive',
    })
    return
  }

  if (newTitle.value.trim() === props.ncp.title) {
    // No changes made, just close the dialog
    closeDialog()
    return
  }

  isRenaming.value = true
  try {
    await ncpService.renameNCP(props.ncp.id, newTitle.value.trim())

    // Emit the renamed NCP data
    emit('ncp-renamed', {
      ...props.ncp,
      title: newTitle.value.trim(),
    })

    toast({
      title: 'Success',
      description: 'NCP title updated successfully.',
    })
    closeDialog()
  } catch (error) {
    console.error('Rename failed:', error)
    toast({
      title: 'Error',
      description: 'Failed to rename NCP. Please try again.',
      variant: 'destructive',
    })
  } finally {
    isRenaming.value = false
  }
}

const handleKeyUp = event => {
  if (event.key === 'Enter' && !isRenaming.value && newTitle.value.trim()) {
    confirmRename()
  }
}
</script>

<template>
  <Dialog :open="open" @update:open="$emit('update:open', $event)">
    <DialogContent
      class="w-[calc(100vw-2rem)] max-w-md sm:max-w-lg rounded-lg px-4 py-6 sm:px-8 sm:py-8"
      style="max-width: 95vw"
    >
      <DialogHeader>
        <DialogTitle class="text-lg sm:text-xl">Rename NCP</DialogTitle>
        <DialogDescription class="text-sm sm:text-base">
          Enter a new title for your nursing care plan.
        </DialogDescription>
      </DialogHeader>

      <Input
        v-model="newTitle"
        maxlength="255"
        placeholder="New title"
        class="mt-4"
        @keyup="handleKeyUp"
        :disabled="isRenaming"
        autofocus
      />

      <DialogFooter class="mt-6 flex flex-col gap-2 sm:flex-row justify-end">
        <Button
          variant="ghost"
          class="w-full sm:w-auto"
          @click="closeDialog"
          :disabled="isRenaming"
        >
          Cancel
        </Button>
        <Button
          variant="default"
          class="w-full sm:w-auto"
          @click="confirmRename"
          :disabled="isRenaming || !newTitle.trim()"
        >
          <span v-if="isRenaming">Saving...</span>
          <span v-else>Save</span>
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
