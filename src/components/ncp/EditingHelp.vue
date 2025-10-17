<script setup>
import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { ChevronDown, Info } from 'lucide-vue-next'
import { ref } from 'vue'

const props = defineProps({
  columnKey: {
    type: String,
    required: true,
  },
})

const isOpen = ref(false)

const getHelpContent = columnKey => {
  switch (columnKey) {
    case 'diagnosis':
      return {
        title: 'Format Help',
        content: `📝 Enter the nursing diagnosis statement as plain text:

"Acute Pain related to physical injury agent as evidenced by pain scale of 7/10, facial grimace, pallor, restlessness, and diaphoresis with HR 115 bpm"

✅ Simple text format - no special formatting needed!`,
      }
    case 'outcomes':
      return {
        title: 'Format Help',
        content: `🎯 Use clear sections for short-term and long-term outcomes:

SHORT-TERM OUTCOMES:

Within 24 hours of nursing interventions:
  - The client will report pain level 3 or below consistently
  - The patient will demonstrate use of at least two techniques

LONG-TERM OUTCOMES:

Within 48 hours of nursing interventions:
  - The patient will participate in activities without pain interference

✅ Use hyphens (-) for outcome lists
✅ Indent with spaces for better readability`,
      }
    case 'interventions':
      return {
        title: 'Format Help',
        content: `🩺 Organize by intervention categories:

INDEPENDENT INTERVENTIONS:

1. Administer prescribed analgesic medications as ordered
2. Implement around-the-clock pain medication schedule

DEPENDENT INTERVENTIONS:

1. Notify physician if pain level remains high
2. Request medication adjustment if needed

COLLABORATIVE INTERVENTIONS:

1. Consult pain management specialists for complex cases

✅ Use numbered lists (1. 2. 3.) for each category
✅ Each category starts with a clear header`,
      }
    case 'rationale':
      return {
        title: 'Format Help',
        content: `💡 Link rationales to specific interventions:

INTERVENTION RATIONALES:

Intervention ID: independent_0
Rationale: Evidence-based pain management improves patient outcomes
Evidence: Moorhead et al., 2022; American Nurses Association, 2021

Intervention ID: dependent_0  
Rationale: Physician collaboration ensures appropriate medication
Evidence: Joint Commission, 2024

✅ Reference intervention IDs to link rationales
✅ Include evidence citations when available`,
      }
    case 'implementation':
      return {
        title: 'Format Help',
        content: `✅ Document completed actions by category:

INDEPENDENT ACTIONS:

1. Administered prescribed analgesic medication at 0800
2. Implemented around-the-clock pain schedule as ordered

DEPENDENT ACTIONS:

1. Notified physician of initial pain level assessment
2. Obtained order for additional pain medication

COLLABORATIVE ACTIONS:

1. Consulted with pain management specialist
2. Coordinated multidisciplinary pain management approach

✅ Use past tense - these are completed actions
✅ Include specific times/details when relevant`,
      }
    case 'evaluation':
      return {
        title: 'Format Help',
        content: `📊 Evaluate outcomes with clear status indicators:

SHORT-TERM EVALUATION:

Within 24 hours of nursing interventions:
  Status: Partially Met
  Details: Pain level reduced to 4/10, using breathing techniques

LONG-TERM EVALUATION:

Within 48 hours of nursing interventions:
  Status: Met
  Details: Participating in ADLs with minimal pain complaints

✅ Status options: Met, Partially Met, Not Met
✅ Include specific details about patient progress`,
      }
    default:
      return {
        title: 'Editing Help',
        content:
          '📝 Enter your content in a structured format. You can also use JSON format if you prefer advanced editing.',
      }
  }
}

const helpContent = getHelpContent(props.columnKey)
</script>

<template>
  <Collapsible v-model:open="isOpen" class="mb-2">
    <CollapsibleTrigger as-child>
      <Button
        variant="ghost"
        size="sm"
        class="w-full justify-between p-2 h-8 text-xs text-muted-foreground hover:text-foreground"
      >
        <div class="flex items-center gap-1">
          <Info class="w-3 h-3" />
          <span>{{ helpContent.title }}</span>
        </div>
        <ChevronDown
          class="w-3 h-3 transition-transform duration-200"
          :class="{ 'rotate-180': isOpen }"
        />
      </Button>
    </CollapsibleTrigger>
    <CollapsibleContent class="space-y-2">
      <div class="p-3 text-xs bg-muted/50 rounded border border-border">
        <pre class="whitespace-pre-wrap font-mono text-xs">{{
          helpContent.content
        }}</pre>
      </div>
    </CollapsibleContent>
  </Collapsible>
</template>
