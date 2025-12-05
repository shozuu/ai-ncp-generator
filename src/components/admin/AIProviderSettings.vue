<template>
  <Card>
    <CardHeader class="pb-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div
            class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10"
          >
            <Sparkles class="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle>AI Provider</CardTitle>
            <CardDescription>
              Configure the AI model for NCP generation
            </CardDescription>
          </div>
        </div>
      </div>
    </CardHeader>

    <CardContent class="space-y-6">
      <!-- Loading State -->
      <div v-if="loading" class="space-y-4">
        <Skeleton class="h-24 w-full" />
        <Skeleton class="h-24 w-full" />
      </div>

      <!-- Provider Selection -->
      <div v-else class="space-y-4">
        <!-- Provider Cards -->
        <div class="grid gap-4 sm:grid-cols-2">
          <!-- Claude Card -->
          <div
            @click="!switching && selectProvider('claude')"
            :class="[
              'relative cursor-pointer rounded-xl border-2 p-4 transition-all hover:shadow-md',
              currentProvider === 'claude'
                ? 'border-primary bg-primary/5 shadow-sm'
                : 'border-border hover:border-primary/50',
            ]"
          >
            <!-- Selected Indicator -->
            <div
              v-if="currentProvider === 'claude'"
              class="absolute right-3 top-3"
            >
              <div
                class="flex h-6 w-6 items-center justify-center rounded-full bg-primary"
              >
                <Check class="h-4 w-4 text-primary-foreground" />
              </div>
            </div>

            <!-- Provider Icon & Info -->
            <div class="flex items-start gap-3">
              <div
                class="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900/30"
              >
                <Bot class="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div class="flex-1 space-y-1">
                <h3 class="font-semibold">Claude Sonnet 4</h3>
                <p class="text-xs text-muted-foreground">Anthropic</p>
              </div>
            </div>

            <!-- Features -->
            <div class="mt-4 space-y-2">
              <div
                class="flex items-center gap-2 text-sm text-muted-foreground"
              >
                <Zap class="h-3.5 w-3.5" />
                <span>Advanced reasoning</span>
              </div>
              <div
                class="flex items-center gap-2 text-sm text-muted-foreground"
              >
                <FileText class="h-3.5 w-3.5" />
                <span>Detailed clinical outputs</span>
              </div>
            </div>

            <!-- Loading indicator when switching -->
            <div
              v-if="switching && pendingProvider === 'claude'"
              class="absolute inset-0 flex items-center justify-center rounded-xl bg-background/80"
            >
              <Loader2 class="h-6 w-6 animate-spin text-primary" />
            </div>
          </div>

          <!-- Gemini Card -->
          <div
            @click="!switching && selectProvider('gemini')"
            :class="[
              'relative cursor-pointer rounded-xl border-2 p-4 transition-all hover:shadow-md',
              currentProvider === 'gemini'
                ? 'border-primary bg-primary/5 shadow-sm'
                : 'border-border hover:border-primary/50',
            ]"
          >
            <!-- Selected Indicator -->
            <div
              v-if="currentProvider === 'gemini'"
              class="absolute right-3 top-3"
            >
              <div
                class="flex h-6 w-6 items-center justify-center rounded-full bg-primary"
              >
                <Check class="h-4 w-4 text-primary-foreground" />
              </div>
            </div>

            <!-- Provider Icon & Info -->
            <div class="flex items-start gap-3">
              <div
                class="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30"
              >
                <Cpu class="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div class="flex-1 space-y-1">
                <h3 class="font-semibold">Gemini 2.5 Pro</h3>
                <p class="text-xs text-muted-foreground">Google</p>
              </div>
            </div>

            <!-- Features -->
            <div class="mt-4 space-y-2">
              <div
                class="flex items-center gap-2 text-sm text-muted-foreground"
              >
                <Timer class="h-3.5 w-3.5" />
                <span>Fast responses</span>
              </div>
              <div
                class="flex items-center gap-2 text-sm text-muted-foreground"
              >
                <TrendingUp class="h-3.5 w-3.5" />
                <span>Cost efficient</span>
              </div>
            </div>

            <!-- Loading indicator when switching -->
            <div
              v-if="switching && pendingProvider === 'gemini'"
              class="absolute inset-0 flex items-center justify-center rounded-xl bg-background/80"
            >
              <Loader2 class="h-6 w-6 animate-spin text-primary" />
            </div>
          </div>
        </div>

        <!-- Current Configuration -->
        <div class="rounded-lg border bg-muted/30 p-4">
          <div class="flex items-center gap-2 mb-3">
            <Settings class="h-4 w-4 text-muted-foreground" />
            <span class="text-sm font-medium">Current Configuration</span>
          </div>
          <div class="grid gap-3 sm:grid-cols-3">
            <div class="space-y-1">
              <p class="text-xs text-muted-foreground">Model</p>
              <p class="text-sm font-medium truncate">
                {{ providerConfig.model }}
              </p>
            </div>
            <div class="space-y-1">
              <p class="text-xs text-muted-foreground">Max Tokens</p>
              <p class="text-sm font-medium">
                {{ providerConfig.max_tokens?.toLocaleString() }}
              </p>
            </div>
            <div class="space-y-1">
              <p class="text-xs text-muted-foreground">Temperature</p>
              <p class="text-sm font-medium">
                {{ providerConfig.temperature }}
              </p>
            </div>
          </div>
        </div>

        <!-- Status Message -->
        <div
          v-if="statusMessage"
          :class="[
            'flex items-center gap-2 rounded-lg px-4 py-3 text-sm',
            statusMessage.type === 'success'
              ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
              : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400',
          ]"
        >
          <CheckCircle2
            v-if="statusMessage.type === 'success'"
            class="h-4 w-4"
          />
          <AlertCircle v-else class="h-4 w-4" />
          <span>{{ statusMessage.text }}</span>
        </div>
      </div>
    </CardContent>
  </Card>
</template>

<script setup>
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/components/ui/toast/use-toast'
import { adminService } from '@/services/adminService'
import {
  AlertCircle,
  Bot,
  Check,
  CheckCircle2,
  Cpu,
  FileText,
  Loader2,
  Settings,
  Sparkles,
  Timer,
  TrendingUp,
  Zap,
} from 'lucide-vue-next'
import { onMounted, ref } from 'vue'

const { toast } = useToast()
const loading = ref(true)
const switching = ref(false)
const pendingProvider = ref(null)
const currentProvider = ref('claude')
const providerConfig = ref({
  model: '',
  max_tokens: 0,
  temperature: 0,
})
const statusMessage = ref(null)

const loadProviderConfig = async () => {
  try {
    loading.value = true
    const data = await adminService.getAIProvider()
    currentProvider.value = data.provider
    providerConfig.value = data.config
  } catch (error) {
    console.error('Error loading AI provider config:', error)
    toast({
      title: 'Error',
      description: 'Failed to load AI provider configuration',
      variant: 'destructive',
    })
  } finally {
    loading.value = false
  }
}

const selectProvider = async provider => {
  // Don't switch if already on that provider
  if (provider === currentProvider.value) {
    return
  }

  try {
    switching.value = true
    pendingProvider.value = provider
    statusMessage.value = null

    const data = await adminService.switchAIProvider(provider)

    currentProvider.value = data.provider
    providerConfig.value = data.config

    statusMessage.value = {
      type: 'success',
      text: `Successfully switched to ${provider === 'claude' ? 'Claude Sonnet 4' : 'Gemini 2.5 Pro'}`,
    }

    toast({
      title: 'Provider Updated',
      description: `Now using ${provider === 'claude' ? 'Anthropic Claude' : 'Google Gemini'} for NCP generation`,
    })

    // Clear status message after 4 seconds
    setTimeout(() => {
      statusMessage.value = null
    }, 4000)
  } catch (error) {
    console.error('Error switching AI provider:', error)
    statusMessage.value = {
      type: 'error',
      text: 'Failed to switch provider. Please try again.',
    }

    toast({
      title: 'Error',
      description: 'Failed to switch AI provider. Please try again.',
      variant: 'destructive',
    })
  } finally {
    switching.value = false
    pendingProvider.value = null
  }
}

onMounted(() => {
  loadProviderConfig()
})
</script>
