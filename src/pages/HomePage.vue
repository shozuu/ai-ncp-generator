<script setup>
import { Button } from '@/components/ui/button'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import { Brain, HelpCircle } from 'lucide-vue-next'
import { RouterLink } from 'vue-router'

const features = [
  {
    title: 'AI-Generated NCPs',
    description:
      'Create comprehensive nursing care plans using advanced AI models',
    icon: Brain,
    path: '/generate',
  },
  {
    title: 'NCPs with Explanations',
    description: 'Understand the components and reasoning behind NCPs',
    icon: HelpCircle,
    path: '/explain',
  },
]
</script>

<template>
  <PageHead title="- Home" />
  <DefaultLayout>
    <div class="py-12 text-center">
      <h1 class="text-4xl font-bold font-poppins">
        AI Nursing Care Plan Generator
      </h1>
      <p class="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
        Generate and learn about nursing care plans with the help of AI
      </p>

      <div
        class="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8 max-w-7xl mx-auto px-4"
      >
        <!-- Feature Cards -->
        <div
          v-for="feature in features"
          :key="feature.title"
          class="flex flex-col p-6 rounded-lg border bg-card text-card-foreground shadow-sm h-full"
        >
          <div class="flex-1 flex flex-col items-center">
            <component :is="feature.icon" class="h-10 w-10 mb-4" />
            <h2 class="text-xl font-semibold mb-2">{{ feature.title }}</h2>
            <p class="text-muted-foreground mb-6 flex-grow">
              {{ feature.description }}
            </p>
          </div>
          <RouterLink :to="feature.path" class="w-full mt-auto">
            <Button variant="outline" class="w-full"> Get Started </Button>
          </RouterLink>
        </div>
      </div>
    </div>
  </DefaultLayout>
</template>
