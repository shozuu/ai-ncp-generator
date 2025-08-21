<script setup>
import NavMain from '@/components/NavMain.vue'
import NavUser from '@/components/NavUser.vue'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar'
import {
  Brain,
  HelpCircle,
  Home,
  KeyRound,
  Stethoscope,
  UserPlus,
} from 'lucide-vue-next'
import { RouterLink } from 'vue-router'

const props = defineProps({
  side: { type: String, required: false },
  variant: { type: String, required: false },
  collapsible: { type: String, required: false, default: 'icon' },
  class: { type: null, required: false },
})

const data = {
  navItems: [
    {
      title: 'Home',
      url: '/',
      icon: Home,
    },
    {
      title: 'Generate NCP',
      url: '/generate',
      icon: Brain,
    },
    {
      title: 'Explanations',
      url: '/explain',
      icon: HelpCircle,
    },
    {
      title: 'My NCPs',
      url: '/ncps',
      icon: Brain,
    },

    // login and signup
    {
      title: 'Login',
      url: '/login',
      icon: KeyRound,
      isAuthItem: true,
      authType: 'login',
    },
    {
      title: 'Sign Up',
      url: '/signup',
      icon: UserPlus,
      isAuthItem: true,
      authType: 'signup',
    },

    // sample nested navigation items
    // {
    //   title: 'Settings',
    //   url: '#',
    //   icon: Settings2,
    //   items: [
    //     {
    //       title: 'General',
    //       url: '#',
    //     },
    //     {
    //       title: 'Team',
    //       url: '#',
    //     },
    //     {
    //       title: 'Billing',
    //       url: '#',
    //     },
    //     {
    //       title: 'Limits',
    //       url: '#',
    //     },
    //   ],
    // },
  ],
}
</script>

<template>
  <Sidebar v-bind="props">
    <SidebarHeader>
      <RouterLink to="/" class="flex items-center gap-2 mt-1">
        <div
          class="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground"
        >
          <Stethoscope class="size-4" />
        </div>
        <span class="truncate font-semibold">SmartCare</span>
      </RouterLink>
    </SidebarHeader>
    <SidebarContent>
      <NavMain :items="data.navItems" />
    </SidebarContent>
    <SidebarFooter>
      <NavUser />
    </SidebarFooter>
    <SidebarRail />
  </Sidebar>
</template>
