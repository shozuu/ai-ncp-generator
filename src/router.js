import { useAdmin } from '@/composables/useAdmin'
import { useAuth } from '@/composables/useAuth'
import ExplainPage from '@/pages/ExplainPage.vue'
import GeneratePage from '@/pages/GeneratePage.vue'
import HomePage from '@/pages/HomePage.vue'
import LoginPage from '@/pages/LoginPage.vue'
import NCPDisplayPage from '@/pages/NCPDisplayPage.vue'
import NCPExplanationPage from '@/pages/NCPExplanationPage.vue'
import NCPHistoryPage from '@/pages/NCPHistoryPage.vue'
import ResetPasswordPage from '@/pages/ResetPasswordPage.vue'
import SignupPage from '@/pages/SignupPage.vue'
import AdminDashboardPage from '@/pages/admin/AdminDashboardPage.vue'
import SystemHealthPage from '@/pages/admin/SystemHealthPage.vue'
import UserManagementPage from '@/pages/admin/UserManagementPage.vue'
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
    path: '/reset-password',
    name: 'ResetPassword',
    component: ResetPasswordPage,
    meta: {
      authRequired: false,
      redirectIfAuth: false,
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
  {
    path: '/ncps',
    name: 'My NCPs',
    component: NCPHistoryPage,
    meta: {
      authRequired: true,
      breadcrumbs: [
        { title: 'Home', to: '/' },
        { title: 'My NCPs', to: '/ncps', isActive: true },
      ],
    },
  },
  {
    path: '/ncps/:id',
    name: 'NCPDisplay',
    component: NCPDisplayPage,
    meta: {
      authRequired: true,
      breadcrumbs: [
        { title: 'Home', to: '/' },
        { title: 'My NCPs', to: '/ncps' },
        { title: 'NCP Details', to: '', isActive: true },
      ],
    },
  },
  {
    path: '/explain/:id',
    name: 'NCPExplanation',
    component: NCPExplanationPage,
    meta: {
      authRequired: true,
      breadcrumbs: [
        { title: 'Home', to: '/' },
        { title: 'NCP Explanations', to: '/explain' },
        { title: 'Explanation Details', to: '', isActive: true },
      ],
    },
  },
  // Admin Routes
  {
    path: '/admin',
    name: 'AdminDashboard',
    component: AdminDashboardPage,
    meta: {
      authRequired: true,
      adminRequired: true,
      breadcrumbs: [
        { title: 'Home', to: '/' },
        { title: 'Admin Dashboard', to: '/admin', isActive: true },
      ],
    },
  },
  {
    path: '/admin/users',
    name: 'UserManagement',
    component: UserManagementPage,
    meta: {
      authRequired: true,
      adminRequired: true,
      breadcrumbs: [
        { title: 'Home', to: '/' },
        { title: 'Admin', to: '/admin' },
        { title: 'User Management', to: '/admin/users', isActive: true },
      ],
    },
  },
  {
    path: '/admin/health',
    name: 'SystemHealth',
    component: SystemHealthPage,
    meta: {
      authRequired: true,
      adminRequired: true,
      breadcrumbs: [
        { title: 'Home', to: '/' },
        { title: 'Admin', to: '/admin' },
        { title: 'System Health', to: '/admin/health', isActive: true },
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
  const { isAdmin, checkAdminStatus, adminCheckLoading } = useAdmin()

  if (loading.value) {
    await initAuth()
  }

  const isAuthenticated = !!user.value
  const authRequired = to.meta?.authRequired === true
  const adminRequired = to.meta?.adminRequired === true
  const redirectIfAuth = to.meta?.redirectIfAuth === true

  // Check if this is an email confirmation redirect from Supabase
  // Supabase adds hash params with access_token and type=signup
  if (to.hash && to.hash.includes('access_token')) {
    // Wait a moment for the session to be established
    await new Promise(resolve => setTimeout(resolve, 1000))
    await initAuth()

    // After confirmation, redirect to home or generate page
    if (user.value) {
      return next('/generate')
    }
  }

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

  // Check admin access for admin routes
  if (adminRequired) {
    if (!isAuthenticated) {
      return next({
        path: '/login',
        query: { redirect: to.fullPath },
      })
    }

    // Check admin status
    if (adminCheckLoading.value) {
      await checkAdminStatus()
    }

    if (!isAdmin.value) {
      return next({
        path: '/',
        query: { error: 'unauthorized' },
      })
    }
  }

  next()
})

export default router
