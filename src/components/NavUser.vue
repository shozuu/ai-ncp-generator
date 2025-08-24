<script setup>
import ThemeToggle from '@/components/ThemeToggle.vue'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'
import { useAuth } from '@/composables/useAuth'
import { Building2, ChevronsUpDown, LogOut, User } from 'lucide-vue-next'
import { computed } from 'vue'

const { user, signOut, isAuthenticated } = useAuth()
const { isMobile } = useSidebar()

const userInitials = computed(() => {
  if (!user.value?.email) return 'U'

  const firstName = user.value.user_metadata?.first_name
  const lastName = user.value.user_metadata?.last_name

  if (firstName && lastName) {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  return user.value.email
    .split('@')[0]
    .split('.')
    .map(part => part.charAt(0).toUpperCase())
    .join('')
    .slice(0, 2)
})

const displayName = computed(() => {
  if (!user.value) return ''

  const firstName = user.value.user_metadata?.first_name
  const lastName = user.value.user_metadata?.last_name

  if (firstName && lastName) {
    return `${firstName} ${lastName}`
  }

  return user.value.email
})

const userRole = computed(() => {
  const role = user.value?.user_metadata?.role
  if (!role) return ''

  const roleMap = {
    nurse: 'Registered Nurse',
    nursing_student: 'Nursing Student',
    nursing_educator: 'Nursing Educator',
    other: 'Other',
  }

  return roleMap[role] || role
})

const userOrganization = computed(() => {
  return user.value?.user_metadata?.organization || ''
})

const handleSignOut = async () => {
  await signOut()
}
</script>

<template>
  <SidebarMenu v-if="isAuthenticated">
    <SidebarMenuItem>
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <SidebarMenuButton
            size="lg"
            class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
          >
            <Avatar class="h-8 w-8 rounded-lg">
              <AvatarImage
                :src="user?.user_metadata?.avatar_url"
                :alt="displayName"
              />
              <AvatarFallback class="rounded-lg">
                {{ userInitials }}
              </AvatarFallback>
            </Avatar>
            <div class="grid flex-1 text-left text-sm leading-tight">
              <span class="truncate font-semibold">{{ displayName }}</span>
              <span class="truncate text-xs text-muted-foreground">
                {{ userRole }}
              </span>
            </div>
            <ChevronsUpDown class="ml-auto size-4" />
          </SidebarMenuButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          class="w-[--reka-dropdown-menu-trigger-width] min-w-72 rounded-lg"
          :side="isMobile ? 'bottom' : 'right'"
          align="end"
          :side-offset="4"
        >
          <!-- User Header -->
          <DropdownMenuLabel class="p-0 font-normal">
            <div class="flex items-center gap-3 px-3 py-3 text-left">
              <Avatar class="h-10 w-10 rounded-lg">
                <AvatarImage
                  :src="user?.user_metadata?.avatar_url"
                  :alt="displayName"
                />
                <AvatarFallback class="rounded-lg text-sm">
                  {{ userInitials }}
                </AvatarFallback>
              </Avatar>
              <div class="grid flex-1 text-left leading-tight">
                <span class="truncate font-semibold text-sm">{{
                  displayName
                }}</span>
                <span class="text-xs text-muted-foreground">{{
                  user?.email
                }}</span>
              </div>
              <ThemeToggle />
            </div>
          </DropdownMenuLabel>

          <DropdownMenuSeparator />

          <div class="px-3 py-3 space-y-3">
            <div v-if="userRole" class="flex items-center gap-3">
              <div
                class="flex items-center justify-center w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-950"
              >
                <User class="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div class="flex-1 min-w-0">
                <p
                  class="text-xs font-medium text-muted-foreground uppercase tracking-wider"
                >
                  Role
                </p>
                <p class="text-sm font-medium truncate">{{ userRole }}</p>
              </div>
            </div>

            <div v-if="userOrganization" class="flex items-center gap-3">
              <div
                class="flex items-center justify-center w-8 h-8 rounded-full bg-green-50 dark:bg-green-950"
              >
                <Building2 class="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
              <div class="flex-1 min-w-0">
                <p
                  class="text-xs font-medium text-muted-foreground uppercase tracking-wider"
                >
                  Organization
                </p>
                <p class="text-sm font-medium">
                  {{ userOrganization }}
                </p>
              </div>
            </div>
          </div>

          <DropdownMenuSeparator />

          <div class="p-1">
            <DropdownMenuItem
              @click="handleSignOut"
              class="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950"
            >
              <LogOut class="w-4 h-4" />
              Log out
            </DropdownMenuItem>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  </SidebarMenu>
</template>
