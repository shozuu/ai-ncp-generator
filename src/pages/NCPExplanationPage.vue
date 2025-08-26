<script setup>
import PageHead from '@/components/PageHead.vue'
import { Alert, AlertDescription } from '@/components/ui/alert'
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
import {
  Brain,
  CheckCircle,
  ClipboardList,
  FileCheck,
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
  FileCheck,
  GraduationCap,
}

// Computed properties using utilities
const availableSections = computed(() => getAvailableSections(ncp.value))

const hasAnyValidExplanationsComputed = computed(() =>
  hasAnyValidExplanations(explanation.value, availableSections.value)
)

onMounted(async () => {
  await loadNCPAndExplanation()
})

const loadNCPAndExplanation = async () => {
  isLoading.value = true
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
const getFormattedExplanationContent = (section, levelKey) =>
  getExplanationContent(explanation.value, section, levelKey)
</script>

<template>
  <PageHead :title="`- ${ncp?.title || 'NCP Explanation'}`" />
  <SidebarLayout>
    <!-- AI Generation Loading State -->
    <div
      v-if="isGeneratingExplanation"
      class="flex items-center justify-center h-screen"
    >
      <LoadingIndicator :messages="loadingMessages" />
    </div>

    <div v-else class="space-y-6">
      <!-- Header -->
      <div class="flex-1 min-w-0">
        <h1 class="text-2xl font-bold font-poppins truncate">
          {{ ncp?.title || 'NCP Explanation' }}
        </h1>
        <p class="text-muted-foreground">
          Evidence-based educational explanations for each NCP component
        </p>
      </div>

      <!-- Initial Loading State -->
      <div v-if="isLoading" class="flex items-center justify-center py-16">
        <LoadingIndicator
          :messages="[
            'Loading NCP data...',
            'Retrieving explanations...',
            'Preparing content...',
          ]"
        />
      </div>

      <div v-else-if="ncp" class="space-y-6">
        <!-- Error Alert -->
        <Alert v-if="generationError" variant="destructive" class="mb-6">
          <AlertDescription>
            {{ generationError }}
          </AlertDescription>
        </Alert>

        <!-- Generate Explanation Section -->
        <div
          v-if="!hasExplanation || !hasAnyValidExplanationsComputed"
          class="text-center py-8"
        >
          <Card class="max-w-md mx-auto">
            <CardContent class="pt-6 space-y-4">
              <Sparkles class="mx-auto h-12 w-12 text-primary" />
              <div>
                <h3 class="text-lg font-semibold">
                  {{ hasExplanation ? 'Regenerate' : 'Generate' }} Educational
                  Explanations
                </h3>
                <p class="text-muted-foreground text-sm">
                  Generate detailed educational explanations with clinical
                  reasoning, evidence-based support, and student guidance for
                  each NCP component.
                </p>
              </div>
              <Button
                @click="generateExplanation"
                :disabled="isGeneratingExplanation"
                class="w-full"
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
          class="space-y-6"
        >
          <Alert>
            <Lightbulb class="h-4 w-4" />
            <AlertDescription>
              These educational explanations provide clinical reasoning,
              evidence-based support, and step-by-step guidance to help nursing
              students understand each component.
            </AlertDescription>
          </Alert>

          <!-- Section Cards -->
          <div class="grid gap-6">
            <Card
              v-for="section in availableSections"
              :key="section"
              class="overflow-hidden transition-all duration-200 hover:shadow-md"
            >
              <CardHeader class="bg-muted/30 border-b">
                <CardTitle class="flex items-center gap-3">
                  <div class="p-2 rounded-lg bg-primary/10">
                    <component
                      :is="iconComponents[sectionIcons[section]]"
                      class="h-5 w-5 text-primary"
                    />
                  </div>
                  <div class="text-lg">{{ sectionTitles[section] }}</div>
                </CardTitle>
              </CardHeader>

              <CardContent class="p-6 space-y-6">
                <!-- Original Content -->
                <div class="space-y-3">
                  <h4
                    class="font-semibold text-sm text-muted-foreground uppercase tracking-wider"
                  >
                    NCP Content
                  </h4>
                  <div
                    class="bg-muted/30 rounded-lg p-4 border-l-4 border-muted"
                  >
                    <div v-if="checkHasContent(section)" class="space-y-2">
                      <div
                        v-for="(line, index) in formatTextToLines(ncp[section])"
                        :key="index"
                        class="text-sm leading-relaxed"
                      >
                        {{ line }}
                      </div>
                    </div>
                    <p v-else class="text-muted-foreground italic text-sm">
                      No content available for this section
                    </p>
                  </div>
                </div>

                <!-- Educational Explanation -->
                <div
                  v-if="checkHasValidSectionExplanation(section)"
                  class="space-y-4"
                >
                  <div class="flex items-center gap-2">
                    <h4
                      class="font-semibold text-sm text-muted-foreground uppercase tracking-wider"
                    >
                      Educational Explanation
                    </h4>
                    <Badge variant="outline" class="text-xs">
                      3 Learning Levels
                    </Badge>
                  </div>

                  <!-- Structured three-level explanation -->
                  <div class="space-y-4">
                    <template
                      v-for="level in explanationLevels"
                      :key="level.key"
                    >
                      <div
                        v-if="
                          getFormattedExplanationContent(section, level.key)
                        "
                        class="border rounded-xl p-5 transition-all duration-200 hover:shadow-sm"
                        :class="[level.bgColor, level.borderColor]"
                      >
                        <div class="flex items-start gap-3 mb-3">
                          <div
                            class="p-2 rounded-lg bg-white/50 dark:bg-gray-800/50"
                          >
                            <component
                              :is="iconComponents[level.icon]"
                              class="h-4 w-4"
                              :class="level.iconColor"
                            />
                          </div>
                          <div class="flex-1">
                            <div class="flex items-center gap-2 mb-1">
                              <span
                                class="font-semibold text-sm"
                                :class="level.titleColor"
                              >
                                {{ level.title }}
                              </span>
                            </div>
                            <p
                              class="text-xs opacity-75"
                              :class="level.textColor"
                            >
                              {{ level.description }}
                            </p>
                          </div>
                        </div>
                        <div
                          v-html="
                            getFormattedExplanationContent(section, level.key)
                          "
                          class="text-sm leading-relaxed prose prose-sm max-w-none"
                          :class="level.textColor"
                        ></div>
                      </div>
                    </template>
                  </div>
                </div>

                <!-- No Explanation Available -->
                <div v-else class="space-y-3">
                  <div class="flex items-center gap-2">
                    <h4
                      class="font-semibold text-sm text-muted-foreground uppercase tracking-wider"
                    >
                      Educational Explanation
                    </h4>
                    <Badge variant="secondary" class="text-xs">
                      Not Available
                    </Badge>
                  </div>
                  <div class="bg-muted/30 rounded-lg p-4 border border-dashed">
                    <div class="text-center py-4">
                      <GraduationCap
                        class="h-8 w-8 text-muted-foreground/50 mx-auto mb-2"
                      />
                      <p class="text-muted-foreground text-sm font-medium">
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
          <div class="text-center pt-6">
            <Button
              variant="outline"
              size="lg"
              @click="generateExplanation"
              :disabled="isGeneratingExplanation"
              class="min-w-[200px]"
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
