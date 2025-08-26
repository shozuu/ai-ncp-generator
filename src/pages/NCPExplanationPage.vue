<script setup>
import PageHead from '@/components/PageHead.vue'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import LoadingIndicator from '@/components/ui/loading/LoadingIndicator.vue'
import { useToast } from '@/components/ui/toast/use-toast'
import SidebarLayout from '@/layouts/SidebarLayout.vue'
import { explanationService } from '@/services/explanationService'
import { ncpService } from '@/services/ncpService'
import {
  explanationLevels,
  formatTextToLines,
  getAvailableSections,
  getExplanationContent,
  hasAnyValidExplanations,
  hasContent,
  hasValidSectionExplanation,
  loadingMessages,
  sectionIcons,
  sectionTitles,
} from '@/utils/ncpUtils'
import { vAutoAnimate } from '@formkit/auto-animate'
import {
  AlertTriangle,
  Brain,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  GraduationCap,
  Lightbulb,
  RefreshCw,
  Sparkles,
  Stethoscope,
  Target,
} from 'lucide-vue-next'
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const { toast } = useToast()

const ncp = ref(null)
const explanation = ref(null)
const isLoading = ref(false)
const isGeneratingExplanation = ref(false)
const hasExplanation = ref(false)
const generationError = ref(null)
const isDisclaimerCollapsed = ref(false)
const disclaimerContainer = ref(null)

const ncpId = route.params.id

// Convert string icon names to actual icon components
const iconComponents = {
  Stethoscope,
  Brain,
  Target,
  ClipboardList,
  Lightbulb,
  CheckCircle,
  RefreshCw,
}

// Computed properties using utilities
const availableSections = computed(() => getAvailableSections(ncp.value))

const hasAnyValidExplanationsComputed = computed(() =>
  hasAnyValidExplanations(explanation.value, availableSections.value)
)

const currentLoadingState = computed(() => {
  if (isGeneratingExplanation.value) {
    return 'generating'
  } else if (isLoading.value) {
    return 'loading'
  }
  return null
})

// Show disclaimer only when we have explanations
const shouldShowDisclaimer = computed(() => {
  return hasExplanation.value && hasAnyValidExplanationsComputed.value
})

onMounted(async () => {
  await loadNCPAndExplanation()

  if (disclaimerContainer.value) {
    disclaimerContainer.value.__v_auto_animate = true
  }
})

const loadNCPAndExplanation = async () => {
  isLoading.value = true
  isGeneratingExplanation.value = false // Ensure only one loading state
  generationError.value = null

  try {
    // Load NCP data
    ncp.value = await ncpService.getNCPById(ncpId)

    // Check if explanation exists
    hasExplanation.value = await explanationService.hasExplanation(ncpId)

    if (hasExplanation.value) {
      explanation.value = await explanationService.getNCPExplanation(ncpId)
    }
  } catch (error) {
    console.error('Error loading NCP:', error)
    toast({
      title: 'Error',
      description: 'Failed to load NCP data. Please try again.',
      variant: 'destructive',
    })
    router.push('/explain')
  } finally {
    isLoading.value = false
  }
}

const generateExplanation = async () => {
  isGeneratingExplanation.value = true
  isLoading.value = false
  generationError.value = null

  try {
    explanation.value = await explanationService.generateExplanation(ncpId)
    hasExplanation.value = true

    toast({
      title: 'Success',
      description: 'Educational explanations generated successfully!',
    })
  } catch (error) {
    console.error('Error generating explanation:', error)
    generationError.value = error.message

    toast({
      title: 'Error',
      description:
        error.message || 'Failed to generate explanation. Please try again.',
      variant: 'destructive',
    })
  } finally {
    isGeneratingExplanation.value = false
  }
}

// Wrapper functions to pass the current data to utilities
const checkHasContent = section => hasContent(ncp.value, section)
const checkHasValidSectionExplanation = section =>
  hasValidSectionExplanation(explanation.value, section)
const getFormattedExplanationContent = (
  section,
  levelKey,
  contentType = 'summary'
) => getExplanationContent(explanation.value, section, levelKey, contentType)

// Detailed view management
const showDetailedView = ref({})
const levelContainerRefs = ref({})

const toggleDetailedView = (section, levelKey) => {
  const key = `${section}-${levelKey}`
  showDetailedView.value[key] = !showDetailedView.value[key]
}

const isDetailedViewOpen = (section, levelKey) => {
  const key = `${section}-${levelKey}`
  return showDetailedView.value[key] || false
}

const setLevelContainerRef = (section, levelKey) => {
  return el => {
    const key = `${section}-${levelKey}`
    if (el) {
      levelContainerRefs.value[key] = el
      // Enable auto-animate on this container
      el.__v_auto_animate = true
    }
  }
}
</script>

<template>
  <PageHead :title="`- ${ncp?.title || 'NCP Explanation'}`" />
  <SidebarLayout>
    <!-- Single Loading State Handler -->
    <div
      v-if="currentLoadingState"
      class="flex items-center justify-center h-screen"
    >
      <LoadingIndicator
        :messages="
          currentLoadingState === 'generating'
            ? loadingMessages
            : [
                'Loading NCP data...',
                'Retrieving explanations...',
                'Preparing educational content...',
              ]
        "
      />
    </div>

    <div v-else class="space-y-4 sm:space-y-6 px-2 sm:px-0">
      <!-- Header -->
      <div class="flex-1 min-w-0">
        <h1 class="text-xl sm:text-2xl font-bold font-poppins truncate">
          {{ ncp?.title || 'NCP Explanation' }}
        </h1>
        <p class="text-muted-foreground text-sm sm:text-base">
          Evidence-based educational explanations for each NCP component
        </p>
      </div>

      <!-- Important Disclaimer Alert - Only show when explanations exist -->
      <Alert
        v-if="shouldShowDisclaimer"
        variant="default"
        class="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800"
        ref="disclaimerContainer"
        v-auto-animate
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-2">
            <AlertTriangle
              class="shrink-0 text-amber-600 dark:text-amber-400 w-4 h-4"
            />
            <AlertTitle class="mb-0 text-amber-800 dark:text-amber-200 text-sm">
              Educational Disclaimer
            </AlertTitle>
          </div>
          <button
            class="text-amber-700 dark:text-amber-300 hover:underline flex items-center text-xs sm:text-sm font-medium"
            @click="isDisclaimerCollapsed = !isDisclaimerCollapsed"
          >
            <!-- Hide text on mobile, show only on sm and up -->
            <span class="hidden text-xs sm:block">
              <span v-if="isDisclaimerCollapsed">Show</span>
              <span v-else>Hide</span>
            </span>
            <ChevronDown v-if="isDisclaimerCollapsed" class="w-4 h-4 ml-1" />
            <ChevronUp v-else class="w-4 h-4 ml-1" />
          </button>
        </div>
        <AlertDescription
          v-if="!isDisclaimerCollapsed"
          class="text-amber-700 dark:text-amber-200 mt-3"
        >
          <div class="space-y-3">
            <p class="font-medium text-xs">
              These explanations are AI-generated educational tools designed to
              support learning and understanding of nursing care plan
              components.
            </p>
            <div class="space-y-2">
              <p class="font-semibold text-xs">Please Remember:</p>
              <ul class="space-y-2 text-xs ml-2 sm:ml-4">
                <li class="flex items-start gap-2">
                  <span
                    class="text-amber-600 dark:text-amber-400 font-bold mt-0.5 text-xs"
                    >•</span
                  >
                  <span
                    ><strong>Verify all sources and citations</strong> -
                    Cross-reference any mentioned studies, guidelines, or
                    textbook references with original sources</span
                  >
                </li>
                <li class="flex items-start gap-2">
                  <span
                    class="text-amber-600 dark:text-amber-400 font-bold mt-0.5 text-xs"
                    >•</span
                  >
                  <span
                    ><strong>Exercise critical thinking</strong> - Use these
                    explanations as a starting point for deeper analysis and
                    discussion</span
                  >
                </li>
                <li class="flex items-start gap-2">
                  <span
                    class="text-amber-600 dark:text-amber-400 font-bold mt-0.5 text-xs"
                    >•</span
                  >
                  <span
                    ><strong>Consult current literature</strong> - Always refer
                    to the most recent nursing textbooks, evidence-based
                    guidelines, and peer-reviewed research</span
                  >
                </li>
                <li class="flex items-start gap-2">
                  <span
                    class="text-amber-600 dark:text-amber-400 font-bold mt-0.5 text-xs"
                    >•</span
                  >
                  <span
                    ><strong>Seek instructor guidance</strong> - Discuss these
                    explanations with your nursing instructors and clinical
                    supervisors</span
                  >
                </li>
              </ul>
            </div>
            <p
              class="text-xs italic bg-amber-100 dark:bg-amber-900/30 p-2 sm:p-3 rounded-md border border-amber-200 dark:border-amber-700"
            >
              <strong>Learning Objective:</strong> These explanations aim to
              help you understand the "why" behind nursing decisions. Use them
              to develop your clinical reasoning skills, but always validate
              information through authoritative sources and professional
              guidance.
            </p>
          </div>
        </AlertDescription>
      </Alert>

      <!-- Content when not loading -->
      <div v-if="ncp" class="space-y-4 sm:space-y-6">
        <!-- Error Alert -->
        <Alert v-if="generationError" variant="destructive" class="mb-6">
          <AlertDescription class="text-sm">
            {{ generationError }}
          </AlertDescription>
        </Alert>

        <!-- Generate Explanation Section -->
        <div
          v-if="!hasExplanation || !hasAnyValidExplanationsComputed"
          class="text-center py-6 sm:py-8"
        >
          <Card class="max-w-sm sm:max-w-md mx-auto">
            <CardContent class="pt-6 space-y-4">
              <Sparkles
                class="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-primary"
              />
              <div>
                <h3 class="text-base sm:text-lg font-semibold">
                  {{ hasExplanation ? 'Regenerate' : 'Generate' }} Educational
                  Explanations
                </h3>
                <p class="text-muted-foreground text-xs sm:text-sm">
                  Generate detailed educational explanations with clinical
                  reasoning, evidence-based support, and student guidance for
                  each NCP component.
                </p>
              </div>
              <Button
                @click="generateExplanation"
                :disabled="isGeneratingExplanation"
                class="w-full text-sm"
              >
                <Sparkles class="h-4 w-4 mr-2" />
                {{ hasExplanation ? 'Regenerate' : 'Generate' }} Explanations
              </Button>
            </CardContent>
          </Card>
        </div>

        <!-- NCP with Explanations -->
        <div
          v-if="hasExplanation && hasAnyValidExplanationsComputed"
          class="space-y-4 sm:space-y-6"
        >
          <!-- Section Cards -->
          <div class="grid gap-4 sm:gap-6">
            <Card
              v-for="section in availableSections"
              :key="section"
              class="overflow-hidden transition-all duration-200 hover:shadow-md"
            >
              <CardHeader class="bg-muted/30 border-b p-4 sm:p-6">
                <CardTitle class="flex items-center gap-2 sm:gap-3">
                  <div class="p-1.5 sm:p-2 rounded-lg bg-primary/10">
                    <component
                      :is="iconComponents[sectionIcons[section]]"
                      class="h-4 w-4 sm:h-5 sm:w-5 text-primary"
                    />
                  </div>
                  <div class="text-base sm:text-lg font-medium">
                    {{ sectionTitles[section] }}
                  </div>
                </CardTitle>
              </CardHeader>

              <CardContent class="p-4 sm:p-6 space-y-4 sm:space-y-6">
                <!-- Original Content -->
                <div class="space-y-2 sm:space-y-3">
                  <h4
                    class="font-semibold text-xs sm:text-sm text-muted-foreground uppercase tracking-wider"
                  >
                    NCP Content
                  </h4>
                  <div
                    class="bg-muted/30 rounded-lg p-3 sm:p-4 border-l-4 border-muted"
                  >
                    <div v-if="checkHasContent(section)" class="space-y-2">
                      <div
                        v-for="(line, index) in formatTextToLines(ncp[section])"
                        :key="index"
                        class="text-xs sm:text-sm leading-relaxed"
                      >
                        {{ line }}
                      </div>
                    </div>
                    <p
                      v-else
                      class="text-muted-foreground italic text-xs sm:text-sm"
                    >
                      No content available for this section
                    </p>
                  </div>
                </div>

                <!-- Educational Explanation -->
                <div
                  v-if="checkHasValidSectionExplanation(section)"
                  class="space-y-3 sm:space-y-4"
                >
                  <div class="flex items-center gap-2">
                    <h4
                      class="font-semibold text-xs sm:text-sm text-muted-foreground uppercase tracking-wider"
                    >
                      Educational Explanation
                    </h4>
                    <Badge variant="outline" class="text-xs text-center">
                      3 Learning Levels
                    </Badge>
                  </div>

                  <!-- Enhanced three-level explanation with summary/detailed -->
                  <div class="space-y-3 sm:space-y-4">
                    <template
                      v-for="level in explanationLevels"
                      :key="level.key"
                    >
                      <div
                        v-if="
                          getFormattedExplanationContent(
                            section,
                            level.key,
                            'summary'
                          )
                        "
                        class="border rounded-xl p-3 sm:p-5 transition-all duration-200 hover:shadow-sm"
                        :class="[level.bgColor, level.borderColor]"
                        :ref="setLevelContainerRef(section, level.key)"
                        v-auto-animate
                      >
                        <div
                          class="flex items-start gap-2 sm:gap-3 mb-2 sm:mb-3"
                        >
                          <div
                            class="p-1.5 sm:p-2 rounded-lg bg-white/50 dark:bg-gray-800/50 shrink-0"
                          >
                            <component
                              :is="iconComponents[level.icon]"
                              class="h-3 w-3 sm:h-4 sm:w-4"
                              :class="level.iconColor"
                            />
                          </div>
                          <div class="flex-1 min-w-0">
                            <div
                              class="flex items-center justify-between gap-1 sm:gap-0 mb-1"
                            >
                              <div class="flex items-center gap-2">
                                <span
                                  class="font-semibold text-xs sm:text-sm"
                                  :class="level.titleColor"
                                >
                                  {{ level.title }}
                                </span>
                              </div>
                              <Button
                                v-if="
                                  getFormattedExplanationContent(
                                    section,
                                    level.key,
                                    'detailed'
                                  )
                                "
                                variant="ghost"
                                size="sm"
                                @click="toggleDetailedView(section, level.key)"
                                class="h-5 sm:h-6 px-1.5 sm:px-2 text-xs self-start sm:self-auto transition-transform duration-200 hover:scale-105"
                              >
                                <!-- Hide text on mobile, show only on sm and up -->
                                <span class="hidden sm:inline text-xs">{{
                                  isDetailedViewOpen(section, level.key)
                                    ? 'Hide'
                                    : 'See More'
                                }}</span>
                                <ChevronDown
                                  v-if="!isDetailedViewOpen(section, level.key)"
                                  class="h-3 w-3 transition-transform duration-200"
                                />
                                <ChevronUp
                                  v-else
                                  class="h-3 w-3 transition-transform duration-200"
                                />
                              </Button>
                            </div>
                            <p
                              class="text-xs opacity-75"
                              :class="level.textColor"
                            >
                              {{ level.description }}
                            </p>
                          </div>
                        </div>

                        <!-- Summary Content -->
                        <div
                          v-html="
                            getFormattedExplanationContent(
                              section,
                              level.key,
                              'summary'
                            )
                          "
                          class="text-xs sm:text-sm leading-relaxed prose prose-xs sm:prose-sm max-w-none mb-2 sm:mb-3"
                          :class="level.textColor"
                        ></div>

                        <!-- Detailed Content (Expandable) -->
                        <div
                          v-if="
                            isDetailedViewOpen(section, level.key) &&
                            getFormattedExplanationContent(
                              section,
                              level.key,
                              'detailed'
                            )
                          "
                          class="border-t pt-2 sm:pt-3 mt-2 sm:mt-3"
                          :class="level.borderColor"
                        >
                          <div class="flex items-center gap-2 mb-2">
                            <Badge variant="secondary" class="text-xs">
                              Detailed Explanation
                            </Badge>
                          </div>
                          <div
                            v-html="
                              getFormattedExplanationContent(
                                section,
                                level.key,
                                'detailed'
                              )
                            "
                            class="text-xs sm:text-sm leading-relaxed prose prose-xs sm:prose-sm max-w-none"
                            :class="level.textColor"
                          ></div>
                        </div>
                      </div>
                    </template>
                  </div>
                </div>

                <!-- No Explanation Available -->
                <div v-else class="space-y-2 sm:space-y-3">
                  <div class="flex items-center gap-2">
                    <h4
                      class="font-semibold text-xs sm:text-sm text-muted-foreground uppercase tracking-wider"
                    >
                      Educational Explanation
                    </h4>
                    <Badge variant="secondary" class="text-xs">
                      Not Available
                    </Badge>
                  </div>
                  <div
                    class="bg-muted/30 rounded-lg p-3 sm:p-4 border border-dashed"
                  >
                    <div class="text-center py-3 sm:py-4">
                      <GraduationCap
                        class="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground/50 mx-auto mb-2"
                      />
                      <p
                        class="text-muted-foreground text-xs sm:text-sm font-medium"
                      >
                        No explanation available for this section
                      </p>
                      <p class="text-muted-foreground/70 text-xs mt-1">
                        Try regenerating explanations to get educational content
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <!-- Regenerate Button -->
          <div class="text-center pt-4 sm:pt-6">
            <Button
              variant="outline"
              size="default"
              @click="generateExplanation"
              :disabled="isGeneratingExplanation"
              class="min-w-[180px] sm:min-w-[200px] text-sm"
            >
              <RefreshCw class="h-4 w-4 mr-2" />
              Regenerate All Explanations
            </Button>
          </div>
        </div>
      </div>
    </div>
  </SidebarLayout>
</template>
