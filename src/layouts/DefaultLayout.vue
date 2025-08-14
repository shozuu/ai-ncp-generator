<script setup>
import ThemeToggle from '@/components/ThemeToggle.vue'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/composables/useAuth'
import {
  Brain,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  Stethoscope,
  User,
  UserCircle,
  X,
} from 'lucide-vue-next'
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'

const isMenuOpen = ref(false)
const { user, signOut, isAuthenticated } = useAuth()

const navItems = [
  {
    title: 'Generate NCP',
    description: 'Create AI-generated nursing care plans',
    path: '/generate',
    icon: Brain,
  },
  {
    title: 'Explanations',
    description: 'Learn about NCP components',
    path: '/explain',
    icon: HelpCircle,
  },
]

// Get user initials for avatar
const userInitials = computed(() => {
  if (!user.value?.email) return 'U'
  return user.value.email
    .split('@')[0]
    .split('.')
    .map(part => part.charAt(0).toUpperCase())
    .join('')
    .slice(0, 2)
})

const handleSignOut = async () => {
  await signOut()
}

// Close mobile menu when clicking a link
const closeMobileMenu = () => {
  isMenuOpen.value = false
}
</script>

<template>
  <div class="flex flex-col min-h-screen">
    <!-- Header -->
    <header
      class="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
    >
      <div class="container">
        <div class="h-14 flex items-center py-2">
          <!-- Logo -->
          <div class="flex mr-4">
            <RouterLink to="/" class="flex items-center mr-6 space-x-2">
              <Stethoscope class="w-6 h-6" />
              <span class="font-poppins font-bold">SmartCare</span>
            </RouterLink>
          </div>

          <!-- Desktop Navigation -->
          <div
            class="md:flex md:flex-1 md:items-center md:justify-between hidden"
          >
            <nav class="flex items-center space-x-6 text-sm font-medium">
              <RouterLink
                v-for="item in navItems"
                :key="item.path"
                :to="item.path"
                class="hover:text-foreground/80 flex items-center space-x-2 transition-colors"
              >
                <component :is="item.icon" class="w-4 h-4" />
                <span>{{ item.title }}</span>
              </RouterLink>
            </nav>

            <!-- Right side buttons -->
            <div class="flex items-center space-x-4">
              <ThemeToggle />

              <!-- Authentication Section -->
              <div v-if="isAuthenticated" class="flex items-center space-x-2">
                <!-- Dashboard Button -->
                <RouterLink to="/dashboard">
                  <Button variant="ghost" size="sm" class="hidden sm:flex">
                    <LayoutDashboard class="w-4 h-4 mr-2" />
                    Dashboard
                  </Button>
                </RouterLink>

                <!-- Profile Dropdown -->
                <DropdownMenu>
                  <DropdownMenuTrigger as-child>
                    <Button
                      variant="ghost"
                      class="relative h-8 w-8 rounded-full"
                    >
                      <Avatar class="h-8 w-8">
                        <AvatarFallback class="text-xs">
                          {{ userInitials }}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent class="w-56" align="end">
                    <div class="flex items-center justify-start gap-2 p-2">
                      <div class="flex flex-col space-y-1 leading-none">
                        <p class="font-medium">{{ user?.email }}</p>
                        <p
                          class="w-[200px] truncate text-sm text-muted-foreground"
                        >
                          Nurse Practitioner
                        </p>
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <RouterLink to="/dashboard">
                      <DropdownMenuItem class="cursor-pointer">
                        <LayoutDashboard class="mr-2 h-4 w-4" />
                        <span>Dashboard</span>
                      </DropdownMenuItem>
                    </RouterLink>
                    <DropdownMenuItem class="cursor-pointer" disabled>
                      <User class="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem class="cursor-pointer" disabled>
                      <Settings class="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      class="cursor-pointer"
                      @click="handleSignOut"
                    >
                      <LogOut class="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <!-- Not Authenticated - Login/Signup Buttons -->
              <div v-else class="flex items-center space-x-2">
                <RouterLink to="/login">
                  <Button variant="ghost" size="sm"> Log in </Button>
                </RouterLink>
                <RouterLink to="/signup">
                  <Button size="sm"> Sign up </Button>
                </RouterLink>
              </div>
            </div>
          </div>

          <!-- Mobile menu button -->
          <div class="md:hidden flex items-center justify-end flex-1">
            <Button
              variant="ghost"
              size="icon"
              @click="isMenuOpen = !isMenuOpen"
            >
              <span class="sr-only">Toggle menu</span>
              <Menu v-if="!isMenuOpen" class="w-5 h-5" />
              <X v-else class="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      <!-- Mobile menu container -->
      <div v-show="isMenuOpen" class="md:hidden border-t">
        <div class="container py-4">
          <nav class="flex flex-col space-y-4">
            <!-- Navigation Links -->
            <RouterLink
              v-for="item in navItems"
              :key="item.path"
              :to="item.path"
              class="hover:text-foreground/80 flex items-center py-2 space-x-4 text-sm transition-colors"
              @click="closeMobileMenu"
            >
              <component :is="item.icon" class="w-5 h-5" />
              <div>
                <div class="text-base font-medium">{{ item.title }}</div>
                <div class="text-muted-foreground text-sm">
                  {{ item.description }}
                </div>
              </div>
            </RouterLink>

            <!-- Mobile Authentication Section -->
            <div class="pt-4 border-t border-muted">
              <div v-if="isAuthenticated" class="space-y-2">
                <!-- User Info -->
                <div
                  class="flex items-center space-x-3 p-2 rounded-lg bg-muted/50"
                >
                  <Avatar class="h-8 w-8">
                    <AvatarFallback class="text-xs">
                      {{ userInitials }}
                    </AvatarFallback>
                  </Avatar>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium truncate">
                      {{ user?.email }}
                    </p>
                    <p class="text-xs text-muted-foreground">
                      Nurse Practitioner
                    </p>
                  </div>
                </div>

                <!-- Mobile Menu Items -->
                <RouterLink
                  to="/dashboard"
                  class="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                  @click="closeMobileMenu"
                >
                  <LayoutDashboard class="w-5 h-5" />
                  <span>Dashboard</span>
                </RouterLink>

                <button
                  class="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50 transition-colors w-full text-left opacity-50 cursor-not-allowed"
                  disabled
                >
                  <User class="w-5 h-5" />
                  <span>Profile</span>
                </button>

                <button
                  class="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50 transition-colors w-full text-left opacity-50 cursor-not-allowed"
                  disabled
                >
                  <Settings class="w-5 h-5" />
                  <span>Settings</span>
                </button>

                <button
                  @click="handleSignOut"
                  class="flex items-center space-x-3 p-2 rounded-lg hover:bg-destructive/10 text-destructive transition-colors w-full text-left"
                >
                  <LogOut class="w-5 h-5" />
                  <span>Log out</span>
                </button>
              </div>

              <!-- Mobile Not Authenticated -->
              <div v-else class="space-y-2">
                <RouterLink to="/login" @click="closeMobileMenu">
                  <Button variant="ghost" class="w-full justify-start">
                    <UserCircle class="w-4 h-4 mr-2" />
                    Log in
                  </Button>
                </RouterLink>
                <RouterLink to="/signup" @click="closeMobileMenu">
                  <Button class="w-full justify-start">
                    <UserCircle class="w-4 h-4 mr-2" />
                    Sign up
                  </Button>
                </RouterLink>
              </div>
            </div>
          </nav>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="container flex-1 py-8">
      <slot />
    </main>

    <!-- Footer -->
    <footer class="border-t">
      <div class="container py-4">
        <p class="text-muted-foreground text-sm text-center">
          © 2024 AI NCP Generator. All rights reserved.
        </p>
      </div>
    </footer>
  </div>
</template>
