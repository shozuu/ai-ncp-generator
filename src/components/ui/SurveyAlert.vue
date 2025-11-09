<script setup>
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { ClipboardCheck, ExternalLink, X } from 'lucide-vue-next'
import { ref, watch } from 'vue'

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  surveyUrl: {
    type: String,
    default: 'https://forms.gle/XbEt3GVrJDEJPyhB8',
  },
})

const emit = defineEmits(['close'])

const isVisible = ref(props.show)

// Watch for changes to the show prop
watch(
  () => props.show,
  newValue => {
    isVisible.value = newValue
  }
)

const handleClose = () => {
  isVisible.value = false
  emit('close')
}

const openSurvey = () => {
  window.open(props.surveyUrl, '_blank', 'noopener,noreferrer')
  handleClose()
}
</script>

<template>
  <Transition
    enter-active-class="transition ease-out duration-300"
    enter-from-class="opacity-0 translate-y-2"
    enter-to-class="opacity-100 translate-y-0"
    leave-active-class="transition ease-in duration-200"
    leave-from-class="opacity-100 translate-y-0"
    leave-to-class="opacity-0 translate-y-2"
  >
    <Alert
      v-if="isVisible && show"
      class="border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800 relative"
    >
      <ClipboardCheck class="h-4 w-4 text-blue-600 dark:text-blue-400" />
      <AlertTitle class="text-blue-900 dark:text-blue-100 pr-8">
        Help Us Improve! 📋
      </AlertTitle>
      <AlertDescription class="text-blue-800 dark:text-blue-200 space-y-3 mt-2">
        <p class="text-sm leading-relaxed">
          Your feedback is valuable for our thesis research! If you have a
          moment, please share your experience with the NCP generator through
          our quick survey.
        </p>
        <div class="flex flex-col sm:flex-row gap-2">
          <Button
            @click="openSurvey"
            size="sm"
            class="bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-700 dark:hover:bg-blue-600 flex items-center gap-2"
          >
            <ExternalLink class="h-3.5 w-3.5" />
            Take Survey (2-3 min)
          </Button>
          <Button @click="handleClose" size="sm" variant="ghost">
            Maybe Later
          </Button>
        </div>
      </AlertDescription>
      <Button
        @click="handleClose"
        variant="ghost"
        size="icon"
        class="absolute top-2 right-2 h-6 w-6 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900"
      >
        <X class="h-3.5 w-3.5 text-blue-700 dark:text-blue-300" />
      </Button>
    </Alert>
  </Transition>
</template>
