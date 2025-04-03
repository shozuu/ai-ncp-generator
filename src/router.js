import ExplainPage from '@/pages/ExplainPage.vue'
import GeneratePage from '@/pages/GeneratePage.vue'
import HomePage from '@/pages/HomePage.vue'
import ValidatePage from '@/pages/ValidatePage.vue'
import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomePage,
  },
  {
    path: '/generate',
    name: 'generate',
    component: GeneratePage,
  },
  {
    path: '/validate',
    name: 'validate',
    component: ValidatePage,
  },
  {
    path: '/explain',
    name: 'explain',
    component: ExplainPage,
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
