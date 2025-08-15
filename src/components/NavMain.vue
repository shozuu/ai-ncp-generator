<script setup>
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar'
import { useAuth } from '@/composables/useAuth'
import { ChevronRight } from 'lucide-vue-next'
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'

const { isAuthenticated } = useAuth()
const route = useRoute()

const props = defineProps({
  items: { type: Array, required: true },
})

const mainNavItems = computed(() =>
  props.items.filter(item => !item.isAuthItem)
)

const authItems = computed(() => props.items.filter(item => item.isAuthItem))

const isRouteActive = url => {
  return route.path === url
}

const hasActiveSubItem = items => {
  if (!items) return false
  return items.some(subItem => isRouteActive(subItem.url))
}
</script>

<template>
  <div class="flex flex-col h-full">
    <!-- Main Navigation -->
    <SidebarGroup class="flex-1">
      <SidebarMenu>
        <template v-for="item in mainNavItems" :key="item.title">
          <!-- Non-nested items (simple links) -->
          <SidebarMenuItem v-if="!item.items || item.items.length === 0">
            <SidebarMenuButton
              as-child
              :tooltip="item.title"
              :data-active="isRouteActive(item.url)"
            >
              <RouterLink :to="item.url">
                <component :is="item.icon" v-if="item.icon" />
                <span>{{ item.title }}</span>
              </RouterLink>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <!-- Nested items (collapsible) -->
          <Collapsible
            v-else
            as-child
            :default-open="item.isActive || hasActiveSubItem(item.items)"
            class="group/collapsible"
          >
            <SidebarMenuItem>
              <CollapsibleTrigger as-child>
                <SidebarMenuButton
                  :tooltip="item.title"
                  :data-active="hasActiveSubItem(item.items)"
                >
                  <component :is="item.icon" v-if="item.icon" />
                  <span>{{ item.title }}</span>
                  <ChevronRight
                    class="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90"
                  />
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub>
                  <SidebarMenuSubItem
                    v-for="subItem in item.items"
                    :key="subItem.title"
                  >
                    <SidebarMenuSubButton
                      as-child
                      :data-active="isRouteActive(subItem.url)"
                    >
                      <RouterLink :to="subItem.url">
                        <span>{{ subItem.title }}</span>
                      </RouterLink>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                </SidebarMenuSub>
              </CollapsibleContent>
            </SidebarMenuItem>
          </Collapsible>
        </template>
      </SidebarMenu>
    </SidebarGroup>

    <!-- Authentication Items (only when not authenticated) -->
    <SidebarGroup v-if="!isAuthenticated" class="mt-auto">
      <SidebarMenu>
        <SidebarMenuItem v-for="item in authItems" :key="item.title">
          <SidebarMenuButton
            as-child
            :tooltip="item.title"
            :data-active="isRouteActive(item.url)"
            :class="{
              'bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary-hover hover:text-sidebar-primary-foreground data-[active=true]:bg-sidebar-primary/90':
                item.authType === 'login',
              'border border-sidebar-border bg-sidebar-accent text-sidebar-accent-foreground hover:bg-sidebar-accent-hover hover:text-sidebar-accent-foreground data-[active=true]:bg-sidebar-accent/80 flex':
                item.authType === 'signup',
            }"
          >
            <RouterLink :to="item.url">
              <component :is="item.icon" v-if="item.icon" />
              <span class="font-medium">{{ item.title }}</span>
            </RouterLink>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  </div>
</template>
