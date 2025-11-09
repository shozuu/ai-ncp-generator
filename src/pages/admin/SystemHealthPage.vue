<template>
  <AdminLayout>
    <div class="space-y-6">
      <div>
        <h1 class="text-3xl font-bold tracking-tight">System Health</h1>
        <p class="text-muted-foreground mt-2">
          Monitor system status and API health
        </p>
      </div>

      <!-- Overall Status -->
      <Card>
        <CardHeader>
          <div class="flex items-center justify-between">
            <div>
              <CardTitle>System Status</CardTitle>
              <CardDescription
                >Current operational status of all services</CardDescription
              >
            </div>
            <Button
              @click="refreshHealth"
              :disabled="loading"
              variant="outline"
              size="sm"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="h-4 w-4 mr-2"
                :class="{ 'animate-spin': loading }"
              >
                <path
                  d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"
                />
              </svg>
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div v-if="loading" class="space-y-4">
            <Skeleton v-for="i in 4" :key="i" class="h-20 w-full" />
          </div>
          <div v-else class="space-y-4">
            <!-- Backend API Status -->
            <div
              class="flex items-center justify-between p-4 border rounded-lg"
            >
              <div class="flex items-center gap-3">
                <div
                  :class="[
                    'h-3 w-3 rounded-full',
                    getStatusColor(healthData.backend?.status),
                  ]"
                />
                <div>
                  <p class="font-medium">Backend API</p>
                  <p class="text-sm text-muted-foreground">
                    {{ healthData.backend?.message || 'Checking...' }}
                  </p>
                </div>
              </div>
              <Badge :variant="getStatusVariant(healthData.backend?.status)">
                {{ healthData.backend?.status || 'Unknown' }}
              </Badge>
            </div>

            <!-- Database Status -->
            <div
              class="flex items-center justify-between p-4 border rounded-lg"
            >
              <div class="flex items-center gap-3">
                <div
                  :class="[
                    'h-3 w-3 rounded-full',
                    getStatusColor(healthData.database?.status),
                  ]"
                />
                <div>
                  <p class="font-medium">Database (Supabase)</p>
                  <p class="text-sm text-muted-foreground">
                    {{ healthData.database?.message || 'Checking...' }}
                  </p>
                </div>
              </div>
              <Badge :variant="getStatusVariant(healthData.database?.status)">
                {{ healthData.database?.status || 'Unknown' }}
              </Badge>
            </div>

            <!-- Claude API Status -->
            <div
              class="flex items-center justify-between p-4 border rounded-lg"
            >
              <div class="flex items-center gap-3">
                <div
                  :class="[
                    'h-3 w-3 rounded-full',
                    getStatusColor(healthData.claude?.status),
                  ]"
                />
                <div>
                  <p class="font-medium">Claude API</p>
                  <p class="text-sm text-muted-foreground">
                    {{ healthData.claude?.message || 'Checking...' }}
                  </p>
                </div>
              </div>
              <Badge :variant="getStatusVariant(healthData.claude?.status)">
                {{ healthData.claude?.status || 'Unknown' }}
              </Badge>
            </div>

            <!-- Gemini API Status -->
            <div
              class="flex items-center justify-between p-4 border rounded-lg"
            >
              <div class="flex items-center gap-3">
                <div
                  :class="[
                    'h-3 w-3 rounded-full',
                    getStatusColor(healthData.gemini?.status),
                  ]"
                />
                <div>
                  <p class="font-medium">Gemini API</p>
                  <p class="text-sm text-muted-foreground">
                    {{ healthData.gemini?.message || 'Checking...' }}
                  </p>
                </div>
              </div>
              <Badge :variant="getStatusVariant(healthData.gemini?.status)">
                {{ healthData.gemini?.status || 'Unknown' }}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- System Metrics -->
      <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <!-- API Response Time -->
        <Card>
          <CardHeader class="pb-2">
            <CardTitle class="text-sm font-medium">Avg Response Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">
              {{ healthData.metrics?.avgResponseTime || '0' }}ms
            </div>
            <p class="text-xs text-muted-foreground mt-1">Last 24 hours</p>
          </CardContent>
        </Card>

        <!-- API Success Rate -->
        <Card>
          <CardHeader class="pb-2">
            <CardTitle class="text-sm font-medium">API Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">
              {{ healthData.metrics?.successRate || '0' }}%
            </div>
            <p class="text-xs text-muted-foreground mt-1">Last 24 hours</p>
          </CardContent>
        </Card>

        <!-- Total Requests -->
        <Card>
          <CardHeader class="pb-2">
            <CardTitle class="text-sm font-medium">Total Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">
              {{ healthData.metrics?.totalRequests || '0' }}
            </div>
            <p class="text-xs text-muted-foreground mt-1">Last 24 hours</p>
          </CardContent>
        </Card>
      </div>

      <!-- Error Logs -->
      <Card>
        <CardHeader>
          <CardTitle>Recent Errors</CardTitle>
          <CardDescription>Latest system errors and warnings</CardDescription>
        </CardHeader>
        <CardContent>
          <div v-if="loading" class="space-y-4">
            <Skeleton v-for="i in 3" :key="i" class="h-16 w-full" />
          </div>
          <div v-else-if="errorLogs.length > 0" class="space-y-3">
            <div
              v-for="(log, idx) in errorLogs"
              :key="idx"
              class="flex items-start gap-3 p-3 border rounded-lg"
            >
              <Badge
                :variant="log.level === 'error' ? 'destructive' : 'secondary'"
                class="mt-0.5"
              >
                {{ log.level }}
              </Badge>
              <div class="flex-1 space-y-1">
                <p class="text-sm font-medium">{{ log.message }}</p>
                <p class="text-xs text-muted-foreground">{{ log.timestamp }}</p>
              </div>
            </div>
          </div>
          <div v-else class="text-center py-8 text-muted-foreground">
            <p>No errors in the last 24 hours</p>
          </div>
        </CardContent>
      </Card>

      <!-- System Information -->
      <Card>
        <CardHeader>
          <CardTitle>System Information</CardTitle>
          <CardDescription
            >Backend environment and configuration</CardDescription
          >
        </CardHeader>
        <CardContent>
          <div v-if="loading" class="space-y-4">
            <Skeleton v-for="i in 4" :key="i" class="h-12 w-full" />
          </div>
          <div v-else class="grid grid-cols-2 gap-4">
            <div>
              <Label class="text-muted-foreground">Environment</Label>
              <p class="text-sm font-medium">
                {{ systemInfo.environment || 'N/A' }}
              </p>
            </div>
            <div>
              <Label class="text-muted-foreground">Backend Version</Label>
              <p class="text-sm font-medium">
                {{ systemInfo.version || 'N/A' }}
              </p>
            </div>
            <div>
              <Label class="text-muted-foreground">Uptime</Label>
              <p class="text-sm font-medium">
                {{ systemInfo.uptime || 'N/A' }}
              </p>
            </div>
            <div>
              <Label class="text-muted-foreground">Last Deployment</Label>
              <p class="text-sm font-medium">
                {{ systemInfo.lastDeployment || 'N/A' }}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  </AdminLayout>
</template>

<script setup>
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/components/ui/toast/use-toast'
import AdminLayout from '@/layouts/AdminLayout.vue'
import { adminService } from '@/services/adminService'
import { onMounted, ref } from 'vue'

const { toast } = useToast()
const loading = ref(true)
const healthData = ref({
  backend: { status: 'unknown', message: 'Checking...' },
  database: { status: 'unknown', message: 'Checking...' },
  claude: { status: 'unknown', message: 'Checking...' },
  gemini: { status: 'unknown', message: 'Checking...' },
  metrics: {},
})
const errorLogs = ref([])
const systemInfo = ref({})

const getStatusColor = status => {
  switch (status) {
    case 'healthy':
    case 'operational':
      return 'bg-green-500'
    case 'degraded':
    case 'warning':
      return 'bg-yellow-500'
    case 'down':
    case 'error':
      return 'bg-red-500'
    default:
      return 'bg-gray-400'
  }
}

const getStatusVariant = status => {
  switch (status) {
    case 'healthy':
    case 'operational':
      return 'default'
    case 'degraded':
    case 'warning':
      return 'secondary'
    case 'down':
    case 'error':
      return 'destructive'
    default:
      return 'outline'
  }
}

const loadHealthData = async () => {
  try {
    loading.value = true
    const data = await adminService.getSystemHealth()

    healthData.value = data.health
    errorLogs.value = data.errorLogs
    systemInfo.value = data.systemInfo
  } catch (error) {
    console.error('Error loading health data:', error)
    toast({
      title: 'Error',
      description: 'Failed to load system health data',
      variant: 'destructive',
    })
  } finally {
    loading.value = false
  }
}

const refreshHealth = () => {
  loadHealthData()
  toast({
    title: 'Refreshing',
    description: 'System health check in progress...',
  })
}

onMounted(() => {
  loadHealthData()
})
</script>
