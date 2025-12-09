<script setup>
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { computed } from 'vue'

const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
  ncp: {
    type: Object,
    default: null,
  },
  loading: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:open'])

const isOpen = computed({
  get: () => props.open,
  set: val => emit('update:open', val),
})

const formatDate = dateString => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

const getStatusColor = status => {
  const statusLower = (status || '').toLowerCase()
  if (statusLower === 'met') {
    return 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200'
  } else if (statusLower === 'partially met') {
    return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200'
  } else if (statusLower === 'not met') {
    return 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200'
  } else if (statusLower === 'ongoing') {
    return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200'
  }
  return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
}

// Check if any data exists for a section
const hasData = data => {
  if (!data) return false
  if (Array.isArray(data)) return data.length > 0
  if (typeof data === 'object') return Object.keys(data).length > 0
  return !!data
}

// Convert items to array (handles both array and object with id keys)
const toArray = items => {
  if (!items) return []
  if (Array.isArray(items)) return items
  if (typeof items === 'object') return Object.values(items)
  return [items]
}

// Extract text from intervention item (handles {intervention: "..."} or string)
const getInterventionText = item => {
  if (typeof item === 'string') return item
  if (item?.intervention) return item.intervention
  return JSON.stringify(item)
}

// Extract text from rationale item (handles {rationale: "..."} or string)
const getRationaleText = item => {
  if (typeof item === 'string') return item
  if (item?.rationale) return item.rationale
  return JSON.stringify(item)
}

// Extract text from implementation item (handles {action_taken: "..."} or {implementation: "..."} or string)
const getImplementationText = item => {
  if (typeof item === 'string') return item
  if (item?.action_taken) return item.action_taken
  if (item?.implementation) return item.implementation
  return JSON.stringify(item)
}

// Extract text from goal item (handles {goal: "..."} or string)
const getGoalText = item => {
  if (typeof item === 'string') return item
  if (item?.goal) return item.goal
  return JSON.stringify(item)
}

// Check if outcomes have timeframes structure
const hasTimeframes = goalData => {
  return goalData && typeof goalData === 'object' && goalData.timeframes
}

// Get goals from outcomes (handles both array and timeframes structure)
const getGoalsFromOutcome = goalData => {
  if (!goalData) return []

  // If it's a simple array of goals
  if (Array.isArray(goalData)) return goalData

  // If it has timeframes structure
  if (goalData.timeframes && typeof goalData.timeframes === 'object') {
    const result = []
    for (const [timeframe, goals] of Object.entries(goalData.timeframes)) {
      if (Array.isArray(goals)) {
        goals.forEach(goal => {
          result.push({
            timeframe,
            goal:
              typeof goal === 'string'
                ? goal
                : goal.goal || JSON.stringify(goal),
          })
        })
      }
    }
    return result
  }

  return []
}
</script>

<template>
  <Dialog v-model:open="isOpen">
    <DialogContent class="max-w-4xl w-[95vw] h-[85vh] p-0 flex flex-col">
      <!-- Fixed Header -->
      <DialogHeader class="px-6 pt-6 pb-4 border-b shrink-0">
        <DialogTitle class="text-xl pr-8">
          {{ ncp?.title || 'Nursing Care Plan' }}
        </DialogTitle>
        <DialogDescription v-if="ncp?.created_at">
          Created on {{ formatDate(ncp.created_at) }}
        </DialogDescription>
      </DialogHeader>

      <!-- Content Area -->
      <div class="flex-1 overflow-hidden">
        <!-- Loading State -->
        <div v-if="loading" class="p-6 space-y-4">
          <Skeleton class="h-10 w-full" />
          <Skeleton class="h-32 w-full" />
          <Skeleton class="h-24 w-full" />
          <Skeleton class="h-24 w-full" />
        </div>

        <!-- NCP Content -->
        <Tabs
          v-else-if="ncp"
          default-value="assessment"
          class="h-full flex flex-col"
        >
          <!-- Fixed Tab List -->
          <div class="px-6 pt-4 shrink-0">
            <TabsList class="w-full grid grid-cols-7 h-auto">
              <TabsTrigger value="assessment" class="text-xs py-2">
                Assessment
              </TabsTrigger>
              <TabsTrigger value="diagnosis" class="text-xs py-2">
                Diagnosis
              </TabsTrigger>
              <TabsTrigger value="outcomes" class="text-xs py-2">
                Outcomes
              </TabsTrigger>
              <TabsTrigger value="interventions" class="text-xs py-2">
                Interventions
              </TabsTrigger>
              <TabsTrigger value="rationale" class="text-xs py-2">
                Rationale
              </TabsTrigger>
              <TabsTrigger value="implementation" class="text-xs py-2">
                Implement
              </TabsTrigger>
              <TabsTrigger value="evaluation" class="text-xs py-2">
                Evaluation
              </TabsTrigger>
            </TabsList>
          </div>

          <!-- Scrollable Tab Content -->
          <div class="flex-1 overflow-y-auto px-6 pb-6">
            <!-- Assessment Tab -->
            <TabsContent value="assessment" class="mt-4 space-y-6">
              <div v-if="hasData(ncp.assessment)">
                <!-- Subjective Data -->
                <div class="space-y-3">
                  <h3
                    class="text-sm font-semibold text-muted-foreground uppercase tracking-wider"
                  >
                    Subjective Data
                  </h3>
                  <div class="bg-muted/50 rounded-lg p-4">
                    <ul
                      v-if="Array.isArray(ncp.assessment.subjective)"
                      class="space-y-2"
                    >
                      <li
                        v-for="(item, i) in ncp.assessment.subjective"
                        :key="i"
                        class="flex items-start gap-3"
                      >
                        <span class="text-primary font-medium shrink-0">•</span>
                        <span class="text-sm leading-relaxed">{{ item }}</span>
                      </li>
                    </ul>
                    <p v-else class="text-sm">
                      {{ ncp.assessment.subjective || 'No subjective data' }}
                    </p>
                  </div>
                </div>

                <!-- Objective Data -->
                <div class="space-y-3">
                  <h3
                    class="text-sm font-semibold text-muted-foreground uppercase tracking-wider"
                  >
                    Objective Data
                  </h3>
                  <div class="bg-muted/50 rounded-lg p-4">
                    <ul
                      v-if="Array.isArray(ncp.assessment.objective)"
                      class="space-y-2"
                    >
                      <li
                        v-for="(item, i) in ncp.assessment.objective"
                        :key="i"
                        class="flex items-start gap-3"
                      >
                        <span class="text-primary font-medium shrink-0">•</span>
                        <span class="text-sm leading-relaxed">{{ item }}</span>
                      </li>
                    </ul>
                    <p v-else class="text-sm">
                      {{ ncp.assessment.objective || 'No objective data' }}
                    </p>
                  </div>
                </div>
              </div>
              <p v-else class="text-muted-foreground text-sm py-8 text-center">
                No assessment data available
              </p>
            </TabsContent>

            <!-- Diagnosis Tab -->
            <TabsContent value="diagnosis" class="mt-4">
              <div v-if="hasData(ncp.diagnosis)" class="space-y-3">
                <h3
                  class="text-sm font-semibold text-muted-foreground uppercase tracking-wider"
                >
                  Nursing Diagnosis Statement
                </h3>
                <div class="bg-muted/50 rounded-lg p-5">
                  <p class="text-base leading-relaxed font-medium">
                    {{
                      ncp.diagnosis.statement ||
                      (typeof ncp.diagnosis === 'string' ? ncp.diagnosis : '')
                    }}
                  </p>
                </div>
              </div>
              <p v-else class="text-muted-foreground text-sm py-8 text-center">
                No diagnosis data available
              </p>
            </TabsContent>

            <!-- Outcomes Tab -->
            <TabsContent value="outcomes" class="mt-4 space-y-6">
              <div v-if="hasData(ncp.outcomes)">
                <!-- Short Term Goals -->
                <div v-if="hasData(ncp.outcomes.short_term)" class="space-y-3">
                  <h3
                    class="text-sm font-semibold text-muted-foreground uppercase tracking-wider"
                  >
                    Short-Term Goals
                  </h3>
                  <div class="bg-muted/50 rounded-lg p-4 space-y-4">
                    <!-- Handle timeframes structure -->
                    <template v-if="hasTimeframes(ncp.outcomes.short_term)">
                      <div
                        v-for="(goals, timeframe) in ncp.outcomes.short_term
                          .timeframes"
                        :key="timeframe"
                        class="space-y-2"
                      >
                        <p
                          class="text-xs font-medium text-muted-foreground italic"
                        >
                          {{ timeframe }}:
                        </p>
                        <div
                          v-for="(goal, i) in goals"
                          :key="i"
                          class="flex items-start gap-3 ml-2"
                        >
                          <span class="text-primary font-medium shrink-0"
                            >•</span
                          >
                          <span class="text-sm leading-relaxed">{{
                            getGoalText(goal)
                          }}</span>
                        </div>
                      </div>
                    </template>
                    <!-- Handle simple array -->
                    <template
                      v-else-if="Array.isArray(ncp.outcomes.short_term)"
                    >
                      <div
                        v-for="(goal, i) in ncp.outcomes.short_term"
                        :key="i"
                        class="flex items-start gap-3"
                      >
                        <span class="text-primary font-bold shrink-0"
                          >{{ i + 1 }}.</span
                        >
                        <span class="text-sm leading-relaxed">{{
                          getGoalText(goal)
                        }}</span>
                      </div>
                    </template>
                  </div>
                </div>

                <!-- Long Term Goals -->
                <div v-if="hasData(ncp.outcomes.long_term)" class="space-y-3">
                  <h3
                    class="text-sm font-semibold text-muted-foreground uppercase tracking-wider"
                  >
                    Long-Term Goals
                  </h3>
                  <div class="bg-muted/50 rounded-lg p-4 space-y-4">
                    <!-- Handle timeframes structure -->
                    <template v-if="hasTimeframes(ncp.outcomes.long_term)">
                      <div
                        v-for="(goals, timeframe) in ncp.outcomes.long_term
                          .timeframes"
                        :key="timeframe"
                        class="space-y-2"
                      >
                        <p
                          class="text-xs font-medium text-muted-foreground italic"
                        >
                          {{ timeframe }}:
                        </p>
                        <div
                          v-for="(goal, i) in goals"
                          :key="i"
                          class="flex items-start gap-3 ml-2"
                        >
                          <span class="text-primary font-medium shrink-0"
                            >•</span
                          >
                          <span class="text-sm leading-relaxed">{{
                            getGoalText(goal)
                          }}</span>
                        </div>
                      </div>
                    </template>
                    <!-- Handle simple array -->
                    <template v-else-if="Array.isArray(ncp.outcomes.long_term)">
                      <div
                        v-for="(goal, i) in ncp.outcomes.long_term"
                        :key="i"
                        class="flex items-start gap-3"
                      >
                        <span class="text-primary font-bold shrink-0"
                          >{{ i + 1 }}.</span
                        >
                        <span class="text-sm leading-relaxed">{{
                          getGoalText(goal)
                        }}</span>
                      </div>
                    </template>
                  </div>
                </div>
              </div>
              <p v-else class="text-muted-foreground text-sm py-8 text-center">
                No outcomes data available
              </p>
            </TabsContent>

            <!-- Interventions Tab -->
            <TabsContent value="interventions" class="mt-4 space-y-6">
              <div v-if="hasData(ncp.interventions)">
                <template
                  v-for="(items, category) in ncp.interventions"
                  :key="category"
                >
                  <div v-if="hasData(items)" class="space-y-3">
                    <h3
                      class="text-sm font-semibold text-muted-foreground uppercase tracking-wider"
                    >
                      {{ category }}
                    </h3>
                    <div class="bg-muted/50 rounded-lg p-4 space-y-3">
                      <div
                        v-for="(item, idx) in toArray(items)"
                        :key="idx"
                        class="flex items-start gap-3"
                      >
                        <span class="text-primary font-bold shrink-0">
                          {{ idx + 1 }}.
                        </span>
                        <span class="text-sm leading-relaxed">
                          {{ getInterventionText(item) }}
                        </span>
                      </div>
                    </div>
                  </div>
                </template>
              </div>
              <p v-else class="text-muted-foreground text-sm py-8 text-center">
                No interventions data available
              </p>
            </TabsContent>

            <!-- Rationale Tab -->
            <TabsContent value="rationale" class="mt-4 space-y-6">
              <div v-if="hasData(ncp.rationale)">
                <template
                  v-for="(items, category) in ncp.rationale"
                  :key="category"
                >
                  <div v-if="hasData(items)" class="space-y-3">
                    <h3
                      class="text-sm font-semibold text-muted-foreground uppercase tracking-wider"
                    >
                      {{ category }}
                    </h3>
                    <div class="bg-muted/50 rounded-lg p-4 space-y-3">
                      <div
                        v-for="(item, idx) in toArray(items)"
                        :key="idx"
                        class="flex items-start gap-3"
                      >
                        <span class="text-primary font-bold shrink-0">
                          {{ idx + 1 }}.
                        </span>
                        <span class="text-sm leading-relaxed">
                          {{ getRationaleText(item) }}
                        </span>
                      </div>
                    </div>
                  </div>
                </template>
              </div>
              <p v-else class="text-muted-foreground text-sm py-8 text-center">
                No rationale data available
              </p>
            </TabsContent>

            <!-- Implementation Tab -->
            <TabsContent value="implementation" class="mt-4 space-y-6">
              <div v-if="hasData(ncp.implementation)">
                <template
                  v-for="(items, category) in ncp.implementation"
                  :key="category"
                >
                  <div v-if="hasData(items)" class="space-y-3">
                    <h3
                      class="text-sm font-semibold text-muted-foreground uppercase tracking-wider"
                    >
                      {{ category }}
                    </h3>
                    <div class="bg-muted/50 rounded-lg p-4 space-y-3">
                      <div
                        v-for="(item, idx) in toArray(items)"
                        :key="idx"
                        class="flex items-start gap-3"
                      >
                        <span class="text-primary font-bold shrink-0">
                          {{ idx + 1 }}.
                        </span>
                        <span class="text-sm leading-relaxed">
                          {{ getImplementationText(item) }}
                        </span>
                      </div>
                    </div>
                  </div>
                </template>
              </div>
              <p v-else class="text-muted-foreground text-sm py-8 text-center">
                No implementation data available
              </p>
            </TabsContent>

            <!-- Evaluation Tab -->
            <TabsContent value="evaluation" class="mt-4 space-y-6">
              <div v-if="hasData(ncp.evaluation)">
                <div
                  v-for="(periodData, period) in ncp.evaluation"
                  :key="period"
                  class="space-y-4"
                >
                  <h3
                    class="text-sm font-semibold text-muted-foreground uppercase tracking-wider"
                  >
                    {{ period.replace('_', ' ').replace('-', ' ') }} Evaluation
                  </h3>

                  <div class="space-y-4">
                    <div
                      v-for="(statusData, status) in periodData"
                      :key="status"
                      class="bg-muted/50 rounded-lg p-4"
                    >
                      <!-- Status Badge -->
                      <Badge :class="['mb-3', getStatusColor(status)]">
                        {{ status }}
                      </Badge>

                      <!-- Timeframes -->
                      <div
                        v-for="(items, timeframe) in statusData"
                        :key="timeframe"
                        class="mt-3"
                      >
                        <p class="text-xs text-muted-foreground italic mb-2">
                          {{ timeframe }}:
                        </p>
                        <ul v-if="Array.isArray(items)" class="space-y-2 ml-2">
                          <li
                            v-for="(item, i) in items"
                            :key="i"
                            class="flex items-start gap-3"
                          >
                            <span class="text-primary font-medium shrink-0">
                              •
                            </span>
                            <span class="text-sm leading-relaxed">
                              {{ item }}
                            </span>
                          </li>
                        </ul>
                        <p v-else class="text-sm ml-2">{{ items }}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <p v-else class="text-muted-foreground text-sm py-8 text-center">
                No evaluation data available
              </p>
            </TabsContent>
          </div>
        </Tabs>

        <!-- Empty State -->
        <div v-else class="p-6 text-center text-muted-foreground">
          No NCP data available
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>
