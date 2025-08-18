import { useAuth } from '@/composables/useAuth'
import ExplainPage from '@/pages/ExplainPage.vue'
import GeneratePage from '@/pages/GeneratePage.vue'
import HomePage from '@/pages/HomePage.vue'
import LoginPage from '@/pages/LoginPage.vue'
import SignupPage from '@/pages/SignupPage.vue'
import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: HomePage,
    meta: {
      breadcrumbs: [{ title: 'Home', to: '/', isActive: true }],
    },
  },
  {
    path: '/login',
    name: 'Login',
    component: LoginPage,
    meta: {
      authRequired: false,
      redirectIfAuth: true,
    },
  },
  {
    path: '/signup',
    name: 'Signup',
    component: SignupPage,
    meta: {
      authRequired: false,
      redirectIfAuth: true,
    },
  },
  {
    path: '/generate',
    name: 'Generate',
    component: GeneratePage,
    meta: {
      authRequired: true,
      breadcrumbs: [
        { title: 'Home', to: '/' },
        { title: 'Generate NCP', to: '/generate', isActive: true },
      ],
    },
  },
  {
    path: '/explain',
    name: 'Explain',
    component: ExplainPage,
    meta: {
      authRequired: true,
      breadcrumbs: [
        { title: 'Home', to: '/' },
        { title: 'NCP Explanations', to: '/explain', isActive: true },
      ],
    },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// Global navigation guard
router.beforeEach(async (to, from, next) => {
  const { user, loading, initAuth } = useAuth()

  if (loading.value) {
    await initAuth()
  }

  const isAuthenticated = !!user.value
  const authRequired = to.meta?.authRequired === true
  const redirectIfAuth = to.meta?.redirectIfAuth === true

  if (isAuthenticated && redirectIfAuth) {
    const redirectTo = to.query.redirect || '/'
    return next(redirectTo)
  }

  if (!isAuthenticated && authRequired) {
    return next({
      path: '/login',
      query: { redirect: to.fullPath },
    })
  }

  next()
})

export default router
