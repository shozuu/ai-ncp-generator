<script setup>
import AppSidebar from '@/components/AppSidebar.vue'
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
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const props = defineProps({
  breadcrumbs: {
    type: Array,
    default: null,
  },
  noPadding: {
    type: Boolean,
    default: false,
  },
})

const route = useRoute()

const isHomePage = computed(() => route.name === 'Home')

const breadcrumbItems = computed(() => {
  if (props.breadcrumbs) {
    return props.breadcrumbs
  }

  if (route.meta?.breadcrumbs) {
    if (typeof route.meta.breadcrumbs === 'function') {
      return route.meta.breadcrumbs(route)
    }
    return route.meta.breadcrumbs
  }

  const items = []

  if (route.name !== 'Home') {
    items.push({
      title: 'Home',
      to: '/',
      isActive: false,
    })
  }

  if (route.meta?.breadcrumb) {
    items.push({
      title:
        typeof route.meta.breadcrumb === 'function'
          ? route.meta.breadcrumb(route)
          : route.meta.breadcrumb,
      to: route.path,
      isActive: true,
    })
  }

  return items
})
</script>

<template>
  <SidebarProvider>
    <AppSidebar class="z-30" />
    <SidebarInset>
      <header
        :class="[
          'sticky top-0 z-40 flex h-16 shrink-0 items-center gap-2 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12',
          !isHomePage && 'mb-4',
        ]"
      >
        <div class="flex items-center gap-2 px-4">
          <SidebarTrigger class="-ml-1" />
          <Separator orientation="vertical" class="mr-2 h-4" />
          <Breadcrumb v-if="breadcrumbItems.length > 0">
            <BreadcrumbList>
              <template
                v-for="(item, index) in breadcrumbItems"
                :key="item.to || index"
              >
                <BreadcrumbItem>
                  <BreadcrumbLink
                    v-if="!item.isActive && item.to"
                    :href="item.to"
                    @click.prevent="$router.push(item.to)"
                    class="hover:text-foreground transition-colors"
                  >
                    {{ item.title }}
                  </BreadcrumbLink>
                  <BreadcrumbPage v-else>
                    {{ item.title }}
                  </BreadcrumbPage>
                </BreadcrumbItem>
                <BreadcrumbSeparator
                  v-if="index < breadcrumbItems.length - 1"
                />
              </template>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>
      <div
        :class="[
          'w-full',
          noPadding ? '' : 'py-8 pt-4 px-4 lg:px-6 space-y-10',
        ]"
      >
        <slot />
      </div>
    </SidebarInset>
  </SidebarProvider>
</template>
