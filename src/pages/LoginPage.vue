<script setup>
import PageHead from '@/components/PageHead.vue'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/composables/useAuth'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const router = useRouter()
const route = useRoute()
const { signIn } = useAuth()

const form = ref({
  email: '',
  password: '',
})
const loading = ref(false)
const error = ref('')

const handleSubmit = async () => {
  error.value = ''
  loading.value = true

  const { error: signInError } = await signIn(
    form.value.email,
    form.value.password
  )

  if (signInError) {
    error.value = signInError.message
  } else {
    const redirectTo = route.query.redirect || '/'
    router.push(redirectTo)
  }

  loading.value = false
}
</script>

<template>
  <PageHead title="- Login" />
  <DefaultLayout>
    <div class="flex items-center justify-center min-h-[80vh]">
      <Card class="w-full max-w-md">
        <CardHeader>
          <CardTitle class="text-center">Welcome Back</CardTitle>
          <p class="text-center text-sm text-muted-foreground">
            Sign in to access your saved NCPs
          </p>
        </CardHeader>
        <CardContent class="space-y-4">
          <Alert v-if="error" variant="destructive">
            <AlertDescription>{{ error }}</AlertDescription>
          </Alert>

          <form @submit.prevent="handleSubmit" class="space-y-4">
            <div>
              <Input
                v-model="form.email"
                type="email"
                placeholder="Email"
                required
              />
            </div>
            <div>
              <Input
                v-model="form.password"
                type="password"
                placeholder="Password"
                required
              />
            </div>
            <Button type="submit" class="w-full" :disabled="loading">
              {{ loading ? 'Signing in...' : 'Sign In' }}
            </Button>
          </form>

          <div class="text-center">
            <RouterLink
              to="/signup"
              class="text-sm text-muted-foreground hover:underline"
            >
              Don't have an account? Sign up
            </RouterLink>
          </div>
        </CardContent>
      </Card>
    </div>
  </DefaultLayout>
</template>
