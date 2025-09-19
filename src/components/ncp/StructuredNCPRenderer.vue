<script setup>
defineProps({
  items: {
    type: Array,
    default: () => [],
  },
})

// Mapping for concise subheadings
const subheadingShortLabels = {
  'Subjective Data': 'Subjective',
  'Objective Data': 'Objective',
  'Short-Term Outcomes': 'Short-term',
  'Long-Term Outcomes': 'Long-term',
  'Short-Term Evaluation': 'Short-term',
  'Long-Term Evaluation': 'Long-term',
  'Independent Interventions': 'Independent',
  'Dependent Interventions': 'Dependent',
  'Collaborative Interventions': 'Collaborative',
  'Independent Actions': 'Independent',
  'Dependent Actions': 'Dependent',
  'Collaborative Actions': 'Collaborative',
  // Add more as needed
}

const getShortSubheading = label => subheadingShortLabels[label] || label

const getItemClasses = item => {
  switch (item.type) {
    case 'subheading':
      return ''
    case 'status':
      return ''
    case 'timeframe':
      return ''
    case 'bullet':
    case 'numbered':
      return 'mb-1'
    case 'rationale':
      return 'mb-3'
    default:
      return ''
  }
}

const getStatusColor = status => {
  switch (status.toLowerCase()) {
    case 'met':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200'
    case 'partially met':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200'
    case 'not met':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200'
    default:
      return 'bg-muted text-foreground'
  }
}

const getNumberForItem = (item, items) => {
  // Find the last subheading before this item
  let lastSubheadingIdx = -1
  for (let i = items.indexOf(item); i >= 0; i--) {
    if (items[i].type === 'subheading') {
      lastSubheadingIdx = i
      break
    }
  }
  // Count numbered/rationale items since last subheading
  let count = 0
  for (let i = lastSubheadingIdx + 1; i <= items.indexOf(item); i++) {
    if (items[i].type === 'numbered' || items[i].type === 'rationale') {
      count++
    }
  }
  return count
}
</script>

<!-- Structured NCP Display Template -->
<template>
  <div v-if="items && items.length > 0" class="space-y-2">
    <div
      v-for="(item, index) in items"
      :key="`${item.type}-${index}`"
      :class="['leading-relaxed', getItemClasses(item)]"
    >
      <!-- Subheading (Assessment sections, Intervention categories, etc.) -->
      <div
        v-if="item.type === 'subheading'"
        :class="['text-sm font-normal tracking-wide mb-1', item.className]"
      >
        {{ getShortSubheading(item.content) }}
      </div>

      <!-- Status (Met, Partially Met, Not Met) -->
      <div
        v-else-if="item.type === 'status'"
        :class="[
          'inline-block rounded px-2 py-0.5 text-xs font-semibold mb-1',
          getStatusColor(item.content),
          item.className,
        ]"
      >
        {{ item.content }}
      </div>

      <!-- Timeframe (within 24 hours, after 5 days, etc.) -->
      <div
        v-else-if="item.type === 'timeframe'"
        :class="['italic text-muted-foreground text-xs mb-1', item.className]"
      >
        {{ item.content }}:
      </div>

      <!-- Bullet points (for 'bullet' only) -->
      <div
        v-else-if="item.type === 'bullet'"
        class="flex items-start space-x-2 ml-5"
      >
        <span class="text-primary font-bold flex-shrink-0">•</span>
        <span class="flex-1">{{ item.content }}</span>
      </div>

      <!-- Numbered points (for 'numbered' and 'rationale') -->
      <div
        v-else-if="item.type === 'numbered' || item.type === 'rationale'"
        class="flex items-start space-x-2 ml-5"
      >
        <span class="text-primary font-bold flex-shrink-0">
          {{ getNumberForItem(item, items) }}.
        </span>
        <span class="flex-1">
          <span v-if="item.type === 'rationale'">
            <span class="text-foreground">{{ item.rationale }}</span>
            <span
              v-if="item.evidence"
              class="block text-xs italic text-muted-foreground mt-1"
            >
              {{ item.evidence }}
            </span>
          </span>
          <span v-else>
            {{ item.content }}
          </span>
        </span>
      </div>

      <!-- Regular text -->
      <div v-else class="flex-1" :class="item.className || ''">
        {{ item.content }}
      </div>
    </div>
  </div>

  <!-- Empty state -->
  <div v-else class="text-muted-foreground text-sm italic">
    No content available for this section.
  </div>
</template>
