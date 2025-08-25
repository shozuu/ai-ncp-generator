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

const sectionIcons = {
  assessment: Stethoscope,
  diagnosis: Brain,
  outcomes: Target,
  interventions: ClipboardList,
  rationale: Lightbulb,
  implementation: CheckCircle,
  evaluation: RefreshCw,
}

const sectionTitles = {
  assessment: 'Assessment',
  diagnosis: 'Nursing Diagnosis',
  outcomes: 'Outcomes/Goals',
  interventions: 'Interventions',
  rationale: 'Rationale',
  implementation: 'Implementation',
  evaluation: 'Evaluation',
}

// Enhanced explanation level configuration with better styling
const explanationLevels = [
  {
    key: 'clinical_reasoning',
    title: 'Clinical Reasoning',
    icon: Brain,
    bgColor: 'bg-blue-50 dark:bg-blue-950/20',
    borderColor: 'border-blue-200 dark:border-blue-800',
    textColor: 'text-blue-800 dark:text-blue-200',
    titleColor: 'text-blue-900 dark:text-blue-100',
    iconColor: 'text-blue-600 dark:text-blue-400',
    description: 'Why this clinical decision was made',
  },
  {
    key: 'evidence_based_support',
    title: 'Evidence-Based Support',
    icon: FileCheck,
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/20',
    borderColor: 'border-emerald-200 dark:border-emerald-800',
    textColor: 'text-emerald-800 dark:text-emerald-200',
    titleColor: 'text-emerald-900 dark:text-emerald-100',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    description: 'Research and guidelines supporting this approach',
  },
  {
    key: 'student_guidance',
    title: 'Student Guidance',
    icon: GraduationCap,
    bgColor: 'bg-violet-50 dark:bg-violet-950/20',
    borderColor: 'border-violet-200 dark:border-violet-800',
    textColor: 'text-violet-800 dark:text-violet-200',
    titleColor: 'text-violet-900 dark:text-violet-100',
    iconColor: 'text-violet-600 dark:text-violet-400',
    description: 'Step-by-step learning guidance for nursing students',
  },
]

// Dynamic breadcrumbs
const breadcrumbs = computed(() => [
  { title: 'Home', to: '/' },
  { title: 'NCP Explanations', to: '/explain' },
  {
    title: ncp.value?.title || 'Explanation Details',
    to: '',
    isActive: true,
  },
])

const loadingMessages = [
  'Analyzing NCP components...',
  'Generating educational explanations...',
  'Applying evidence-based reasoning...',
  'Creating student guidance...',
  'Finalizing explanations...',
]

onMounted(async () => {
  await loadNCPAndExplanation()
})

const loadNCPAndExplanation = async () => {
  isLoading.value = true
  generationError.value = null

  try {
    // Load NCP data
    ncp.value = await ncpService.getNCPById(ncpId)
    console.log('Loaded NCP:', ncp.value)

    // Check if explanation exists
    hasExplanation.value = await explanationService.hasExplanation(ncpId)
    console.log('Has explanation:', hasExplanation.value)

    if (hasExplanation.value) {
      explanation.value = await explanationService.getNCPExplanation(ncpId)
      console.log('Loaded explanation:', explanation.value)
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

const formatTextToLines = text => {
  if (!text || typeof text !== 'string') return []
  return text
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
}

// Check if a section has meaningful content
const hasContent = section => {
  if (!ncp.value || !ncp.value[section]) return false
  const content = ncp.value[section].trim()
  return (
    content &&
    content.toLowerCase() !== 'not provided' &&
    content.toLowerCase() !== 'n/a'
  )
}

// Enhanced content checking
const hasValidSectionExplanation = section => {
  console.log('Checking hasValidSectionExplanation for section:', section)

  if (!explanation.value?.explanation?.[section]) {
    console.log('No explanation object for section:', section)
    return false
  }

  const sectionExplanation = explanation.value.explanation[section]
  console.log('Section explanation:', sectionExplanation)

  // Check if it's a properly structured explanation object
  if (typeof sectionExplanation !== 'object' || sectionExplanation === null) {
    console.log('Invalid explanation structure for section:', section)
    return false
  }

  // Check if it has at least one of the required levels with meaningful content
  const requiredKeys = [
    'clinical_reasoning',
    'evidence_based_support',
    'student_guidance',
  ]

  const hasValidContent = requiredKeys.some(key => {
    const content = sectionExplanation[key]
    const isValid =
      content &&
      typeof content === 'string' &&
      content.trim().length > 10 && // Minimum meaningful content length
      !content.toLowerCase().includes('temporarily unavailable') &&
      !content.toLowerCase().includes('technical issue')

    console.log(`Key ${key} validation:`, { content, isValid })
    return isValid
  })

  console.log('hasValidContent for section', section, ':', hasValidContent)
  return hasValidContent
}

// Enhanced content formatting with better error handling
const getExplanationContent = (section, levelKey) => {
  // Add debug logging
  console.log('getExplanationContent called with:', { section, levelKey })
  console.log('explanation.value:', explanation.value)

  if (!explanation.value?.explanation?.[section]) {
    console.log('No explanation found for section:', section)
    return null
  }

  const sectionExplanation = explanation.value.explanation[section]
  console.log('sectionExplanation:', sectionExplanation)

  if (!levelKey || typeof levelKey !== 'string') {
    console.log('Invalid levelKey:', levelKey)
    return null
  }

  const content = sectionExplanation[levelKey]
  console.log('content for levelKey', levelKey, ':', content)

  if (!content || typeof content !== 'string') {
    console.log('No valid content found for levelKey:', levelKey)
    return null
  }

  // Clean and format the content
  const cleanContent = content.trim()
  if (cleanContent.length === 0) return null

  // Format the text with better line breaks and emphasis
  return cleanContent
    .replace(/\n\n/g, '</p><p class="mt-2">')
    .replace(/\n/g, '<br>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
}

// Check if we have any valid explanations at all
const hasAnyValidExplanations = computed(() => {
  if (!explanation.value?.explanation) return false

  return availableSections.value.some(section =>
    hasValidSectionExplanation(section)
  )
})

const availableSections = computed(() => {
  if (!ncp.value) return []

  const format = parseInt(ncp.value.format_type || '7')
  const allSections = [
    'assessment',
    'diagnosis',
    'outcomes',
    'interventions',
    'rationale',
    'implementation',
    'evaluation',
  ]
  return allSections.slice(0, format)
})
</script>

<template>
  <PageHead :title="`- ${ncp?.title || 'NCP Explanation'}`" />
  <SidebarLayout :breadcrumbs="breadcrumbs">
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
        <span class="animate-pulse text-muted-foreground text-lg">
          Loading NCP explanation...
        </span>
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
          v-if="!hasExplanation || !hasAnyValidExplanations"
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
        <div v-if="hasExplanation && hasAnyValidExplanations" class="space-y-6">
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
                      :is="sectionIcons[section]"
                      class="h-5 w-5 text-primary"
                    />
                  </div>
                  <div>
                    <div class="text-lg">{{ sectionTitles[section] }}</div>
                    <div class="text-sm font-normal text-muted-foreground">
                      {{
                        hasContent(section) ? 'Content available' : 'No content'
                      }}
                      •
                      {{
                        hasValidSectionExplanation(section)
                          ? 'Explanation available'
                          : 'No explanation'
                      }}
                    </div>
                  </div>
                </CardTitle>
              </CardHeader>

              <CardContent class="p-6 space-y-6">
                <!-- Original Content -->
                <div class="space-y-3">
                  <div class="flex items-center gap-2">
                    <h4
                      class="font-semibold text-sm text-muted-foreground uppercase tracking-wider"
                    >
                      NCP Content
                    </h4>
                    <Badge
                      :variant="hasContent(section) ? 'default' : 'secondary'"
                      class="text-xs"
                    >
                      {{ hasContent(section) ? 'Available' : 'Empty' }}
                    </Badge>
                  </div>
                  <div
                    class="bg-muted/30 rounded-lg p-4 border-l-4 border-muted"
                  >
                    <div v-if="hasContent(section)" class="space-y-2">
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
                  v-if="hasValidSectionExplanation(section)"
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
                        v-if="getExplanationContent(section, level.key)"
                        class="border rounded-xl p-5 transition-all duration-200 hover:shadow-sm"
                        :class="[level.bgColor, level.borderColor]"
                      >
                        <div class="flex items-start gap-3 mb-3">
                          <div
                            class="p-2 rounded-lg bg-white/50 dark:bg-gray-800/50"
                          >
                            <component
                              :is="level.icon"
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
                          v-html="getExplanationContent(section, level.key)"
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
