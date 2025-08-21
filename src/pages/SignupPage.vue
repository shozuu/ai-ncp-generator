<script setup>
import PageHead from '@/components/PageHead.vue'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/composables/useAuth'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const router = useRouter()
const route = useRoute()
const { signUp } = useAuth()

const form = reactive({
  firstName: '',
  middleName: '',
  lastName: '',
  organization: '',
  role: '',
  email: '',
  password: '',
})

const loading = ref(false)
const error = ref('')
const success = ref('')

const handleSubmit = async () => {
  loading.value = true
  error.value = ''
  success.value = ''

  const { error: signUpError } = await signUp(form.email, form.password, {
    first_name: form.firstName,
    middle_name: form.middleName || null,
    last_name: form.lastName,
    organization: form.organization,
    role: form.role,
  })

  if (signUpError) {
    error.value = signUpError.message
  } else {
    success.value =
      'Account created successfully! Please check your email to verify your account.'
    setTimeout(() => {
      const redirectTo = route.query.redirect || '/login'
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
                v-model="form.firstName"
                type="text"
                placeholder="First Name"
                required
              />
            </div>
            <div>
              <Input
                v-model="form.middleName"
                type="text"
                placeholder="Middle Name (optional)"
              />
            </div>
            <div>
              <Input
                v-model="form.lastName"
                type="text"
                placeholder="Last Name"
                required
              />
            </div>
            <div>
              <Input
                v-model="form.organization"
                type="text"
                placeholder="Organization/School"
                required
              />
            </div>
            <div>
              <select
                v-model="form.role"
                required
                class="w-full p-2 border rounded"
              >
                <option value="">Select Role</option>
                <option value="nurse">Registered Nurse</option>
                <option value="nursing_student">Nursing Student</option>
                <option value="nursing_educator">Nursing Educator</option>
                <option value="other">Other</option>
              </select>
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
