import ExplainPage from '@/pages/ExplainPage.vue'
import GeneratePage from '@/pages/GeneratePage.vue'
import HomePage from '@/pages/HomePage.vue'
import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  { path: '/', component: HomePage },
  { path: '/generate', component: GeneratePage },
  { path: '/explain', component: ExplainPage },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
