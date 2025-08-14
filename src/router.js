import { useAuth } from '@/composables/useAuth'
import DashboardPage from '@/pages/DashboardPage.vue'
import ExplainPage from '@/pages/ExplainPage.vue'
import GeneratePage from '@/pages/GeneratePage.vue'
import HomePage from '@/pages/HomePage.vue'
import LoginPage from '@/pages/LoginPage.vue'
import SignupPage from '@/pages/SignupPage.vue'
import { createRouter, createWebHistory } from 'vue-router'

const requireAuth = async (to, from, next) => {
  const { user, loading } = useAuth()

  // Wait for auth to initialize
  while (loading.value) {
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  if (!user.value) {
    next('/login')
  } else {
    next()
  }
}

const routes = [
  { path: '/', component: HomePage },
  {
    path: '/login',
    name: 'Login',
    component: LoginPage,
  },
  {
    path: '/signup',
    name: 'Signup',
    component: SignupPage,
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: DashboardPage,
    beforeEnter: requireAuth,
  },
  {
    path: '/generate',
    name: 'Generate',
    component: GeneratePage,
    beforeEnter: requireAuth,
  },
  { path: '/explain', component: ExplainPage },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
