<script setup>
import PageHead from '@/components/PageHead.vue'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import SidebarLayout from '@/layouts/SidebarLayout.vue'
import { vAutoAnimate } from '@formkit/auto-animate'
import {
  ArrowRight,
  BookOpen,
  Brain,
  FileText,
  GraduationCap,
  HelpCircle,
  Lightbulb,
  Shield,
  Sparkles,
  Target,
  Zap,
} from 'lucide-vue-next'
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'

const isVisible = ref(false)

onMounted(() => {
  setTimeout(() => {
    isVisible.value = true
  }, 100)
})

const features = [
  {
    title: 'AI-Generated NCPs',
    description:
      'Create comprehensive nursing care plans using advanced AI models trained on evidence-based practice',
    icon: Brain,
    path: '/generate',
    gradient: 'from-blue-500 to-purple-600',
    hoverGradient: 'hover:from-blue-600 hover:to-purple-700',
    iconBg: 'bg-blue-100 dark:bg-blue-900/30',
    iconColor: 'text-blue-600 dark:text-blue-400',
  },
  {
    title: 'NCPs with Explanations',
    description:
      'Understand the components and reasoning behind NCPs with detailed educational explanations',
    icon: HelpCircle,
    path: '/explain',
    gradient: 'from-emerald-500 to-teal-600',
    hoverGradient: 'hover:from-emerald-600 hover:to-teal-700',
    iconBg: 'bg-emerald-100 dark:bg-emerald-900/30',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
  },
]

const stats = [
  { number: 'AI', label: 'Powered Technology', icon: Brain },
  { number: 'NNN', label: 'Standards Based', icon: Shield },
  { number: '7+', label: 'Format Types', icon: FileText },
  { number: 'Free', label: 'Educational Tool', icon: GraduationCap },
]

const testimonials = [
  {
    name: 'Evidence-Based Practice',
    role: 'Foundation',
    content:
      'Built on established NANDA-I nursing diagnoses, NIC interventions, and NOC outcomes to ensure comprehensive educational accuracy.',
    avatar: '📚',
  },
  {
    name: 'Educational Focus',
    role: 'Learning Tool',
    content:
      'Designed specifically for nursing students to understand care plan components using the complete NNN taxonomy framework.',
    avatar: '🎓',
  },
  {
    name: 'AI Technology',
    role: 'Innovation',
    content:
      'Leverages advanced AI trained on NANDA-I, NIC, and NOC standards to generate comprehensive care plans with detailed explanations.',
    avatar: '🤖',
  },
]

const benefits = [
  {
    icon: Zap,
    title: 'Fast Learning',
    description:
      'Understand NCP components quickly with instant generation based on NNN standards',
  },
  {
    icon: Shield,
    title: 'NNN Standards Based',
    description:
      'Learn from NANDA-I diagnoses, NIC interventions, and NOC outcomes - the complete nursing taxonomy',
  },
  {
    icon: GraduationCap,
    title: 'Educational Support',
    description:
      'Enhance your understanding with detailed explanations connecting all three nursing taxonomies',
  },
  {
    icon: Target,
    title: 'Practice & Improve',
    description:
      'Practice creating NCPs using standardized nursing language and improve your clinical reasoning',
  },
]
</script>

<template>
  <PageHead title="- Home" />
  <SidebarLayout :no-padding="true">
    <div class="min-h-screen">
      <!-- Hero Section -->
      <section class="relative py-20 overflow-hidden">
        <!-- Background decorations -->
        <div
          class="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900/20"
        ></div>
        <div
          class="absolute top-20 left-10 w-72 h-72 bg-blue-200 dark:bg-blue-900/30 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"
        ></div>
        <div
          class="absolute bottom-20 right-10 w-72 h-72 bg-purple-200 dark:bg-purple-900/30 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"
          style="animation-delay: 2s"
        ></div>

        <div class="relative max-w-7xl mx-auto px-4 text-center" v-auto-animate>
          <div
            :class="[
              'transition-all duration-1000 ease-out transform',
              isVisible
                ? 'translate-y-0 opacity-100'
                : 'translate-y-10 opacity-0',
            ]"
          >
            <!-- Badge -->
            <div
              class="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-medium mb-6 shadow-lg"
            >
              <Sparkles class="w-4 h-4" />
              AI-Powered Nursing Education
            </div>

            <!-- Main heading -->
            <h1
              class="text-5xl md:text-7xl font-bold font-poppins bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 dark:from-white dark:via-blue-200 dark:to-purple-200 bg-clip-text text-transparent leading-tight"
            >
              AI Nursing Care Plan
              <span class="block">Generator</span>
            </h1>

            <!-- Subtitle -->
            <p
              class="mt-6 text-xl md:text-2xl text-muted-foreground max-w-4xl mx-auto leading-relaxed"
            >
              Generate comprehensive, evidence-based nursing care plans using
              NANDA-I, NIC, and NOC standards with detailed AI explanations
            </p>

            <!-- CTA Buttons -->
            <div
              class="mt-10 flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <RouterLink to="/generate">
                <Button
                  size="lg"
                  class="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 group"
                >
                  <Brain
                    class="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform duration-300"
                  />
                  Start Generating NCPs
                  <ArrowRight
                    class="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-300"
                  />
                </Button>
              </RouterLink>
              <RouterLink to="/explain">
                <Button
                  variant="outline"
                  size="lg"
                  class="shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 group border-2"
                >
                  <HelpCircle
                    class="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform duration-300"
                  />
                  Explore Explanations
                </Button>
              </RouterLink>
            </div>
          </div>
        </div>
      </section>

      <!-- Stats Section -->
      <section class="py-16 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
        <div class="max-w-7xl mx-auto px-4">
          <div class="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div
              v-for="(stat, index) in stats"
              :key="stat.label"
              :class="[
                'text-center transition-all duration-700 ease-out transform',
                isVisible
                  ? 'translate-y-0 opacity-100'
                  : 'translate-y-10 opacity-0',
              ]"
              :style="{ 'transition-delay': `${index * 100 + 400}ms` }"
            >
              <div
                class="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg mb-4 shadow-lg"
              >
                <component :is="stat.icon" class="w-6 h-6 text-white" />
              </div>
              <div
                class="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white"
              >
                {{ stat.number }}
              </div>
              <div class="text-sm text-muted-foreground mt-1">
                {{ stat.label }}
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Features Section -->
      <section class="py-20">
        <div class="max-w-7xl mx-auto px-4">
          <div class="text-center mb-16">
            <h2 class="text-4xl font-bold font-poppins mb-4">
              Powerful Features for Modern Nursing Education
            </h2>
            <p class="text-xl text-muted-foreground max-w-3xl mx-auto">
              Everything you need to create, understand, and learn from nursing
              care plans using standardized nursing language
            </p>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div
              v-for="(feature, index) in features"
              :key="feature.title"
              :class="[
                'group relative overflow-hidden rounded-2xl border bg-card shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:scale-105',
                'transition-all duration-700 ease-out',
                isVisible
                  ? 'translate-y-0 opacity-100'
                  : 'translate-y-10 opacity-0',
              ]"
              :style="{ 'transition-delay': `${index * 200 + 600}ms` }"
            >
              <!-- Gradient background -->
              <div
                :class="[
                  'absolute inset-0 bg-gradient-to-br opacity-5 group-hover:opacity-10 transition-opacity duration-500',
                  feature.gradient,
                ]"
              ></div>

              <div class="relative p-8">
                <div class="flex items-start gap-6">
                  <div
                    :class="[
                      'p-4 rounded-xl shadow-lg group-hover:shadow-xl transition-all duration-300',
                      feature.iconBg,
                    ]"
                  >
                    <component
                      :is="feature.icon"
                      :class="[
                        'w-8 h-8 group-hover:scale-110 transition-transform duration-300',
                        feature.iconColor,
                      ]"
                    />
                  </div>
                  <div class="flex-1">
                    <h3
                      class="text-2xl font-bold mb-3 group-hover:text-primary transition-colors duration-300"
                    >
                      {{ feature.title }}
                    </h3>
                    <p class="text-muted-foreground leading-relaxed mb-6">
                      {{ feature.description }}
                    </p>
                    <RouterLink :to="feature.path">
                      <Button
                        :class="[
                          'group-hover:shadow-lg transition-all duration-300 transform group-hover:scale-105',
                          feature.hoverGradient,
                        ]"
                        class="bg-gradient-to-r text-foreground hover:text-white"
                      >
                        Get Started
                        <ArrowRight
                          class="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300"
                        />
                      </Button>
                    </RouterLink>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Benefits Section -->
      <section
        class="py-20 bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-900/20"
      >
        <div class="max-w-7xl mx-auto px-4">
          <div class="text-center mb-16">
            <h2 class="text-4xl font-bold font-poppins mb-4">
              What Our System Can Do for You
            </h2>
            <p class="text-xl text-muted-foreground">
              Educational capabilities designed to enhance nursing learning
            </p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card
              v-for="(benefit, index) in benefits"
              :key="benefit.title"
              :class="[
                'group hover:shadow-xl transition-all duration-500 transform hover:scale-105 border-0 shadow-lg',
                'transition-all duration-700 ease-out',
                isVisible
                  ? 'translate-y-0 opacity-100'
                  : 'translate-y-10 opacity-0',
              ]"
              :style="{ 'transition-delay': `${index * 100 + 800}ms` }"
            >
              <CardContent class="p-6 text-center">
                <div
                  class="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-4 shadow-lg group-hover:shadow-xl transition-all duration-300"
                >
                  <component
                    :is="benefit.icon"
                    class="w-8 h-8 text-white group-hover:scale-110 transition-transform duration-300"
                  />
                </div>
                <h3
                  class="text-lg font-semibold mb-2 group-hover:text-primary transition-colors duration-300"
                >
                  {{ benefit.title }}
                </h3>
                <p class="text-sm text-muted-foreground leading-relaxed">
                  {{ benefit.description }}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <!-- Testimonials Section -->
      <section class="py-20">
        <div class="max-w-7xl mx-auto px-4">
          <div class="text-center mb-16">
            <h2 class="text-4xl font-bold font-poppins mb-4">
              Built for Nursing Education
            </h2>
            <p class="text-xl text-muted-foreground">
              Key features that make our tool effective for learning
            </p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card
              v-for="(testimonial, index) in testimonials"
              :key="testimonial.name"
              :class="[
                'group hover:shadow-xl transition-all duration-500 transform hover:scale-105 shadow-lg',
                'transition-all duration-700 ease-out',
                isVisible
                  ? 'translate-y-0 opacity-100'
                  : 'translate-y-10 opacity-0',
              ]"
              :style="{ 'transition-delay': `${index * 150 + 1000}ms` }"
            >
              <CardContent class="p-6">
                <div class="text-4xl mb-4">{{ testimonial.avatar }}</div>
                <blockquote class="text-muted-foreground mb-4 leading-relaxed">
                  {{ testimonial.content }}
                </blockquote>
                <div>
                  <div class="font-semibold">{{ testimonial.name }}</div>
                  <div class="text-sm text-muted-foreground">
                    {{ testimonial.role }}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <!-- CTA Section -->
      <section
        class="py-20 bg-gradient-to-r from-blue-600 to-purple-600 text-white"
      >
        <div class="max-w-4xl mx-auto text-center px-4">
          <h2 class="text-4xl font-bold font-poppins mb-4">
            Ready to Start Learning with AI?
          </h2>
          <p class="text-xl mb-8 opacity-90">
            Experience the future of nursing education with our AI-powered care
            plan generator
          </p>
          <div
            class="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <RouterLink to="/generate">
              <Button
                size="lg"
                variant="secondary"
                class="shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 group"
              >
                <Lightbulb
                  class="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform duration-300"
                />
                Try the Generator
                <ArrowRight
                  class="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-300"
                />
              </Button>
            </RouterLink>
            <RouterLink to="/explain">
              <Button
                size="lg"
                variant="outline"
                class="border-white text-foreground hover:bg-white hover:text-blue-600 shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                <BookOpen class="w-5 h-5 mr-2" />
                Learn with Explanations
              </Button>
            </RouterLink>
          </div>
        </div>
      </section>
    </div>
  </SidebarLayout>
</template>
