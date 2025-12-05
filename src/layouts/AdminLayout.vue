<script setup>
import NavUser from '@/components/NavUser.vue'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { Activity, LayoutDashboard, Shield, Users, Brain } from 'lucide-vue-next'
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'

const route = useRoute()

const breadcrumbItems = computed(() => {
  if (route.meta?.breadcrumbs) {
    if (typeof route.meta.breadcrumbs === 'function') {
      return route.meta.breadcrumbs(route)
    }
    return route.meta.breadcrumbs
  }
  return []
})

const adminNavItems = [
  {
    title: 'Dashboard',
    url: '/admin',
    icon: LayoutDashboard,
  },
  {
    title: 'User Management',
    url: '/admin/users',
    icon: Users,
  },
  {
    title: 'System Health',
    url: '/admin/health',
    icon: Activity,
  },
  {
    title: 'AI Settings',
    url: '/admin/settings',
    icon: Brain,
  },
]
</script>

<template>
  <SidebarProvider>
    <!-- Admin Sidebar -->
    <Sidebar>
      <SidebarHeader>
        <RouterLink to="/" class="flex items-center gap-2 mt-1">
          <div
            class="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground"
          >
            <Shield class="size-4" />
          </div>
          <div class="flex flex-col">
            <span class="truncate font-semibold">SmartCare</span>
            <span class="truncate text-xs text-muted-foreground"
              >Admin Panel</span
            >
          </div>
        </RouterLink>
      </SidebarHeader>

      <SidebarContent>
        <div class="px-3 py-2">
          <div class="space-y-1">
            <RouterLink
              v-for="item in adminNavItems"
              :key="item.url"
              :to="item.url"
              class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
              :class="
                route.path === item.url
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground'
              "
            >
              <component :is="item.icon" class="size-4" />
              <span>{{ item.title }}</span>
            </RouterLink>
          </div>
        </div>

        <Separator class="my-4" />

        <!-- Back to User Side -->
        <div class="px-3 py-2">
          <div class="text-xs font-semibold text-muted-foreground mb-2 px-3">
            User Side
          </div>
          <RouterLink
            to="/"
            class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="size-4"
            >
              <path d="m12 19-7-7 7-7" />
              <path d="M19 12H5" />
            </svg>
            <span>Back to App</span>
          </RouterLink>
        </div>
      </SidebarContent>

      <SidebarFooter>
        <NavUser />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>

    <!-- Main Content -->
    <SidebarInset>
      <header class="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger class="-ml-1" />
        <Separator orientation="vertical" class="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <template v-for="(item, index) in breadcrumbItems" :key="index">
              <BreadcrumbItem v-if="index > 0">
                <BreadcrumbSeparator />
              </BreadcrumbItem>
              <BreadcrumbItem>
                <BreadcrumbLink v-if="item.to" as-child>
                  <RouterLink :to="item.to">{{ item.title }}</RouterLink>
                </BreadcrumbLink>
                <BreadcrumbPage v-else>{{ item.title }}</BreadcrumbPage>
              </BreadcrumbItem>
            </template>
          </BreadcrumbList>
        </Breadcrumb>
      </header>
      <div class="flex flex-1 flex-col gap-4 p-4">
        <slot />
      </div>
    </SidebarInset>
  </SidebarProvider>
</template>
