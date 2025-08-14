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
const { signUp } = useAuth()

const form = ref({
  email: '',
  password: '',
  confirmPassword: '',
  fullName: '',
})
const loading = ref(false)
const error = ref('')
const success = ref('')

const handleSubmit = async () => {
  error.value = ''
  success.value = ''

  // Basic validation
  if (!form.value.email || !form.value.password || !form.value.fullName) {
    error.value = 'All fields are required'
    return
  }

  if (form.value.password !== form.value.confirmPassword) {
    error.value = 'Passwords do not match'
    return
  }

  if (form.value.password.length < 6) {
    error.value = 'Password must be at least 6 characters'
    return
  }

  loading.value = true

  const { error: signUpError } = await signUp(
    form.value.email,
    form.value.password,
    { full_name: form.value.fullName }
  )

  if (signUpError) {
    error.value = signUpError.message
  } else {
    success.value =
      'Account created successfully! Please check your email to verify your account.'
    setTimeout(() => {
      const redirectTo = route.query.redirect || '/'
      router.push(redirectTo)
    }, 2000) 
  }

  loading.value = false
}
</script>

<template>
  <PageHead title="- Sign Up" />
  <DefaultLayout>
    <div class="flex items-center justify-center min-h-[80vh]">
      <Card class="w-full max-w-md">
        <CardHeader>
          <CardTitle class="text-center">Create Your Account</CardTitle>
          <p class="text-center text-sm text-muted-foreground">
            Join to save and manage your NCPs
          </p>
        </CardHeader>
        <CardContent class="space-y-4">
          <Alert v-if="error" variant="destructive">
            <AlertDescription>{{ error }}</AlertDescription>
          </Alert>

          <Alert v-if="success">
            <AlertDescription>{{ success }}</AlertDescription>
          </Alert>

          <form @submit.prevent="handleSubmit" class="space-y-4">
            <div>
              <Input
                v-model="form.fullName"
                type="text"
                placeholder="Full Name"
                required
              />
            </div>
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
                placeholder="Password (min. 6 characters)"
                required
              />
            </div>
            <div>
              <Input
                v-model="form.confirmPassword"
                type="password"
                placeholder="Confirm Password"
                required
              />
            </div>
            <Button type="submit" class="w-full" :disabled="loading">
              {{ loading ? 'Creating Account...' : 'Sign Up' }}
            </Button>
          </form>

          <div class="text-center">
            <RouterLink
              to="/login"
              class="text-sm text-muted-foreground hover:underline"
            >
              Already have an account? Sign in
            </RouterLink>
          </div>
        </CardContent>
      </Card>
    </div>
  </DefaultLayout>
</template>
