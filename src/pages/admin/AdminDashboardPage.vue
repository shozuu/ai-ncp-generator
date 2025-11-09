<template>
  <AdminLayout>
    <div class="space-y-6">
      <div>
        <h1 class="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p class="text-muted-foreground mt-2">
          Overview of system metrics and key statistics
        </p>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card v-for="i in 4" :key="i">
          <CardHeader
            class="flex flex-row items-center justify-between space-y-0 pb-2"
          >
            <Skeleton class="h-4 w-[100px]" />
            <Skeleton class="h-4 w-4 rounded" />
          </CardHeader>
          <CardContent>
            <Skeleton class="h-8 w-[120px] mb-2" />
            <Skeleton class="h-3 w-[140px]" />
          </CardContent>
        </Card>
      </div>

      <!-- Metrics Cards -->
      <div v-else class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <!-- Total Users -->
        <Card>
          <CardHeader
            class="flex flex-row items-center justify-between space-y-0 pb-2"
          >
            <CardTitle class="text-sm font-medium">Total Users</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              class="h-4 w-4 text-muted-foreground"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">{{ stats.totalUsers }}</div>
            <p class="text-xs text-muted-foreground">
              {{ stats.activeUsers }} active this month
            </p>
          </CardContent>
        </Card>

        <!-- Total NCPs -->
        <Card>
          <CardHeader
            class="flex flex-row items-center justify-between space-y-0 pb-2"
          >
            <CardTitle class="text-sm font-medium">Total NCPs</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              class="h-4 w-4 text-muted-foreground"
            >
              <path
                d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
              />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">{{ stats.totalNCPs }}</div>
            <p class="text-xs text-muted-foreground">
              {{ stats.ncpsThisMonth }} generated this month
            </p>
          </CardContent>
        </Card>

        <!-- Today's NCPs -->
        <Card>
          <CardHeader
            class="flex flex-row items-center justify-between space-y-0 pb-2"
          >
            <CardTitle class="text-sm font-medium">Today's NCPs</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              class="h-4 w-4 text-muted-foreground"
            >
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">{{ stats.ncpsToday }}</div>
            <p class="text-xs text-muted-foreground">
              {{ stats.todayVsYesterday }}% from yesterday
            </p>
          </CardContent>
        </Card>

        <!-- System Health -->
        <Card>
          <CardHeader
            class="flex flex-row items-center justify-between space-y-0 pb-2"
          >
            <CardTitle class="text-sm font-medium">System Health</CardTitle>
            <div
              :class="[
                'h-3 w-3 rounded-full',
                systemHealth.status === 'healthy'
                  ? 'bg-green-500'
                  : 'bg-yellow-500',
              ]"
            />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold capitalize">
              {{ systemHealth.status }}
            </div>
            <p class="text-xs text-muted-foreground">
              {{ systemHealth.uptime }}
            </p>
          </CardContent>
        </Card>
      </div>

      <!-- Charts Section -->
      <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <!-- NCP Generation Chart -->
        <Card class="col-span-4">
          <CardHeader>
            <CardTitle>NCP Generation Overview</CardTitle>
            <CardDescription
              >Daily NCP generation for the last 30 days</CardDescription
            >
          </CardHeader>
          <CardContent v-if="loading" class="pl-2">
            <Skeleton class="h-[300px] w-full" />
          </CardContent>
          <CardContent v-else class="pl-2">
            <div
              class="h-[300px] flex items-center justify-center text-muted-foreground"
            >
              <div class="text-center">
                <p class="text-sm">
                  {{ chartData.length }} NCPs in the last 30 days
                </p>
                <div class="mt-4 space-y-2">
                  <div
                    v-for="(day, idx) in chartData.slice(0, 10)"
                    :key="idx"
                    class="flex items-center gap-2"
                  >
                    <span class="text-xs text-muted-foreground w-24">{{
                      day.date
                    }}</span>
                    <div class="flex-1 bg-muted rounded-full h-2">
                      <div
                        class="bg-primary rounded-full h-2 transition-all"
                        :style="{
                          width: `${(day.count / Math.max(...chartData.map(d => d.count))) * 100}%`,
                        }"
                      />
                    </div>
                    <span class="text-sm font-medium w-8">{{ day.count }}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- Top Diagnoses -->
        <Card class="col-span-3">
          <CardHeader>
            <CardTitle>Top Diagnoses</CardTitle>
            <CardDescription
              >Most frequently generated diagnoses</CardDescription
            >
          </CardHeader>
          <CardContent v-if="loading">
            <div class="space-y-4">
              <Skeleton v-for="i in 5" :key="i" class="h-12 w-full" />
            </div>
          </CardContent>
          <CardContent v-else>
            <div class="space-y-4">
              <div
                v-for="(diagnosis, idx) in topDiagnoses"
                :key="idx"
                class="flex items-center"
              >
                <div class="flex-1 space-y-1">
                  <p class="text-sm font-medium leading-none">
                    {{ diagnosis.name }}
                  </p>
                  <p class="text-xs text-muted-foreground">
                    {{ diagnosis.count }} NCPs
                  </p>
                </div>
                <Badge variant="secondary">{{ diagnosis.percentage }}%</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- Recent Activity -->
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription
            >Latest user registrations and NCP generations</CardDescription
          >
        </CardHeader>
        <CardContent v-if="loading">
          <div class="space-y-4">
            <Skeleton v-for="i in 5" :key="i" class="h-16 w-full" />
          </div>
        </CardContent>
        <CardContent v-else>
          <div class="space-y-4">
            <div
              v-for="activity in recentActivity"
              :key="activity.id"
              class="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
            >
              <div class="flex items-center gap-4">
                <Avatar>
                  <AvatarFallback>{{ activity.userInitials }}</AvatarFallback>
                </Avatar>
                <div>
                  <p class="text-sm font-medium">{{ activity.description }}</p>
                  <p class="text-xs text-muted-foreground">
                    {{ activity.time }}
                  </p>
                </div>
              </div>
              <Badge
                :variant="activity.type === 'user' ? 'default' : 'secondary'"
              >
                {{ activity.type }}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  </AdminLayout>
</template>

<script setup>
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/components/ui/toast/use-toast'
import AdminLayout from '@/layouts/AdminLayout.vue'
import { adminService } from '@/services/adminService'
import { onMounted, ref } from 'vue'

const { toast } = useToast()
const loading = ref(true)

const stats = ref({
  totalUsers: 0,
  activeUsers: 0,
  totalNCPs: 0,
  ncpsThisMonth: 0,
  ncpsToday: 0,
  todayVsYesterday: 0,
})

const systemHealth = ref({
  status: 'healthy',
  uptime: 'All systems operational',
})

const chartData = ref([])
const topDiagnoses = ref([])
const recentActivity = ref([])

const loadDashboardData = async () => {
  try {
    loading.value = true
    const data = await adminService.getDashboardStats()

    stats.value = data.stats
    systemHealth.value = data.systemHealth
    chartData.value = data.chartData
    topDiagnoses.value = data.topDiagnoses
    recentActivity.value = data.recentActivity
  } catch (error) {
    console.error('Error loading dashboard:', error)
    toast({
      title: 'Error',
      description: 'Failed to load dashboard data',
      variant: 'destructive',
    })
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadDashboardData()
})
</script>
