<script setup>
import PageHead from '@/components/PageHead.vue'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/toast/use-toast'
import SidebarLayout from '@/layouts/SidebarLayout.vue'
import { explanationService } from '@/services/explanationService'
import { ncpService } from '@/services/ncpService'
import {
  BookOpen,
  Brain,
  CheckCircle,
  ClipboardList,
  Lightbulb,
  RefreshCw,
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

onMounted(async () => {
  await loadNCPAndExplanation()
})

const loadNCPAndExplanation = async () => {
  isLoading.value = true
  try {
    // Load NCP data
    ncp.value = await ncpService.getNCPById(ncpId)

    // Check if explanation exists
    hasExplanation.value = await explanationService.hasExplanation(ncpId)

    if (hasExplanation.value) {
      explanation.value = await explanationService.getNCPExplanation(ncpId)
    }
  } catch {
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
  try {
    explanation.value = await explanationService.generateExplanation(ncpId)
    hasExplanation.value = true

    toast({
      title: 'Success',
      description: 'Explanation generated successfully!',
    })
  } catch {
    toast({
      title: 'Error',
      description: 'Failed to generate explanation. Please try again.',
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
  <SidebarLayout>
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex-1 min-w-0">
        <h1 class="text-2xl font-bold font-poppins truncate">
          {{ ncp?.title || 'NCP Explanation' }}
        </h1>
        <p class="text-muted-foreground">
          Detailed explanations of each component and how it adheres to NNN
          standards
        </p>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="flex items-center justify-center py-16">
        <span class="animate-pulse text-muted-foreground text-lg">
          Loading NCP explanation...
        </span>
      </div>

      <div v-else-if="ncp" class="space-y-6">
        <!-- Generate Explanation Section -->
        <div v-if="!hasExplanation" class="text-center py-8">
          <Card class="max-w-md mx-auto">
            <CardContent class="pt-6 space-y-4">
              <BookOpen class="mx-auto h-12 w-12 text-muted-foreground" />
              <div>
                <h3 class="text-lg font-semibold">Generate Explanation</h3>
                <p class="text-muted-foreground text-sm">
                  Generate detailed explanations for each component of this
                  nursing care plan.
                </p>
              </div>
              <Button
                @click="generateExplanation"
                :disabled="isGeneratingExplanation"
                class="w-full"
              >
                <BookOpen class="h-4 w-4 mr-2" />
                {{
                  isGeneratingExplanation
                    ? 'Generating...'
                    : 'Generate Explanations'
                }}
              </Button>
            </CardContent>
          </Card>
        </div>

        <!-- NCP with Explanations -->
        <div v-if="hasExplanation && explanation" class="space-y-6">
          <Alert>
            <Lightbulb class="h-4 w-4" />
            <AlertDescription>
              These explanations help you understand the clinical reasoning
              behind each component of the nursing care plan and how it aligns
              with NNN (NANDA-I, NIC, NOC) standards.
            </AlertDescription>
          </Alert>

          <!-- Section Cards -->
          <div class="grid gap-6">
            <Card
              v-for="section in availableSections"
              :key="section"
              class="overflow-hidden"
            >
              <CardHeader class="bg-muted/50">
                <CardTitle class="flex items-center gap-2">
                  <component
                    :is="sectionIcons[section]"
                    class="h-5 w-5 text-primary"
                  />
                  {{ sectionTitles[section] }}
                </CardTitle>
              </CardHeader>

              <CardContent class="p-6 space-y-4">
                <!-- Original Content -->
                <div class="space-y-2">
                  <h4
                    class="font-medium text-sm text-muted-foreground uppercase tracking-wider"
                  >
                    Content
                  </h4>
                  <div class="bg-muted/30 rounded-lg p-4">
                    <ul v-if="ncp[section]" class="space-y-1">
                      <li
                        v-for="(line, index) in formatTextToLines(ncp[section])"
                        :key="index"
                        class="text-sm"
                      >
                        {{ line }}
                      </li>
                    </ul>
                    <p v-else class="text-muted-foreground italic text-sm">
                      No content available
                    </p>
                  </div>
                </div>

                <!-- Explanation -->
                <div v-if="explanation.explanation[section]" class="space-y-2">
                  <h4
                    class="font-medium text-sm text-muted-foreground uppercase tracking-wider"
                  >
                    Explanation
                  </h4>
                  <div class="prose prose-sm max-w-none">
                    <div
                      v-html="explanation.explanation[section]"
                      class="text-sm leading-relaxed"
                    ></div>
                  </div>
                </div>

                <div v-else class="space-y-2">
                  <h4
                    class="font-medium text-sm text-muted-foreground uppercase tracking-wider"
                  >
                    Explanation
                  </h4>
                  <p class="text-muted-foreground italic text-sm">
                    No explanation available for this section.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <!-- Regenerate Button -->
          <div class="text-center pt-4">
            <Button
              variant="outline"
              @click="generateExplanation"
              :disabled="isGeneratingExplanation"
            >
              <RefreshCw class="h-4 w-4 mr-2" />
              {{
                isGeneratingExplanation
                  ? 'Regenerating...'
                  : 'Regenerate Explanations'
              }}
            </Button>
          </div>
        </div>
      </div>
    </div>
  </SidebarLayout>
</template>
