<script setup>
import PageHead from '@/components/PageHead.vue'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import { supabase } from '@/lib/supabase'
import { vAutoAnimate } from '@formkit/auto-animate'
import { Check, Eye, EyeOff, Lock, X } from 'lucide-vue-next'
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const form = ref({
  password: '',
  confirmPassword: '',
})
const loading = ref(false)
const error = ref('')
const success = ref(false)
const showPassword = ref(false)
const showConfirmPassword = ref(false)
const sessionValid = ref(false)
const checkingSession = ref(true)

// Check if the reset session is valid
onMounted(async () => {
  checkingSession.value = true

  // Get the session from URL hash parameters (Supabase auth callback)
  const { data, error: sessionError } = await supabase.auth.getSession()

  if (sessionError || !data.session) {
    error.value =
      'Invalid or expired reset link. Please request a new password reset.'
  } else {
    sessionValid.value = true
  }

  checkingSession.value = false
})

const handleSubmit = async () => {
  if (form.value.password !== form.value.confirmPassword) {
    error.value = 'Passwords do not match'
    return
  }

  if (form.value.password.length < 6) {
    error.value = 'Password must be at least 6 characters long'
    return
  }

  error.value = ''
  success.value = false
  loading.value = true

  const { error: updateError } = await supabase.auth.updateUser({
    password: form.value.password,
  })

  if (updateError) {
    error.value = updateError.message
  } else {
    success.value = true
    // Redirect to login after success
    setTimeout(() => {
      router.push('/login?message=Password updated successfully')
    }, 3000)
  }

  loading.value = false
}
</script>

<template>
  <PageHead title="- Reset Password" />
  <DefaultLayout>
    <!-- Hero Background with Gradient -->
    <div
      class="relative min-h-screen overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900"
    >
      <!-- Animated Background Elements -->
      <div class="absolute inset-0 overflow-hidden">
        <div
          class="absolute -top-4 -right-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob dark:bg-purple-900"
        ></div>
        <div
          class="absolute -bottom-8 -left-4 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000 dark:bg-blue-900"
        ></div>
        <div
          class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-emerald-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000 dark:bg-emerald-900"
        ></div>
      </div>

      <!-- Main Content -->
      <div class="relative flex items-center justify-center min-h-screen p-4">
        <Card
          class="w-full max-w-md backdrop-blur-sm bg-white/80 dark:bg-gray-800/80 shadow-2xl border-0 ring-1 ring-gray-200/50 dark:ring-gray-700/50"
        >
          <CardHeader class="text-center space-y-2 pb-6">
            <div class="flex items-center justify-center space-x-2 mb-2">
              <Lock class="h-6 w-6 text-blue-600" />
              <CardTitle
                class="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
              >
                Reset Password
              </CardTitle>
            </div>
            <p class="text-muted-foreground">Enter your new password below</p>
          </CardHeader>

          <CardContent class="space-y-6" v-auto-animate>
            <!-- Loading State -->
            <div v-if="checkingSession" class="text-center py-8">
              <div
                class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"
              ></div>
              <p class="text-muted-foreground mt-2">Verifying reset link...</p>
            </div>

            <!-- Success Alert -->
            <Alert
              v-else-if="success"
              class="border-green-200 bg-green-50 dark:bg-green-900/20"
            >
              <Check class="h-4 w-4 text-green-600" />
              <AlertDescription class="text-green-800 dark:text-green-200">
                Password updated successfully! Redirecting to login...
              </AlertDescription>
            </Alert>

            <!-- Error Alert -->
            <Alert
              v-else-if="error"
              variant="destructive"
              class="border-red-200 bg-red-50 dark:bg-red-900/20"
            >
              <X class="h-4 w-4" />
              <AlertDescription>{{ error }}</AlertDescription>
            </Alert>

            <!-- Reset Form -->
            <form
              v-if="sessionValid && !success && !checkingSession"
              @submit.prevent="handleSubmit"
              class="space-y-5"
            >
              <!-- New Password -->
              <div class="space-y-2">
                <Label for="password" class="text-sm font-medium"
                  >New Password</Label
                >
                <div class="relative">
                  <Input
                    id="password"
                    v-model="form.password"
                    :type="showPassword ? 'text' : 'password'"
                    placeholder="Enter your new password"
                    required
                    minlength="6"
                    class="pr-10 transition-all duration-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                  <button
                    type="button"
                    @click="showPassword = !showPassword"
                    class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <Eye v-if="!showPassword" class="h-4 w-4" />
                    <EyeOff v-else class="h-4 w-4" />
                  </button>
                </div>
              </div>

              <!-- Confirm Password -->
              <div class="space-y-2">
                <Label for="confirmPassword" class="text-sm font-medium"
                  >Confirm Password</Label
                >
                <div class="relative">
                  <Input
                    id="confirmPassword"
                    v-model="form.confirmPassword"
                    :type="showConfirmPassword ? 'text' : 'password'"
                    placeholder="Confirm your new password"
                    required
                    minlength="6"
                    class="pr-10 transition-all duration-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                  <button
                    type="button"
                    @click="showConfirmPassword = !showConfirmPassword"
                    class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <Eye v-if="!showConfirmPassword" class="h-4 w-4" />
                    <EyeOff v-else class="h-4 w-4" />
                  </button>
                </div>
              </div>

              <!-- Submit Button -->
              <Button
                type="submit"
                class="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
                :disabled="loading || !form.password || !form.confirmPassword"
              >
                <div class="flex items-center justify-center space-x-2">
                  <Lock v-if="!loading" class="h-4 w-4" />
                  <span>{{
                    loading ? 'Updating Password...' : 'Update Password'
                  }}</span>
                </div>
              </Button>
            </form>

            <!-- Back to Login -->
            <div v-if="!sessionValid || success" class="text-center">
              <RouterLink
                to="/login"
                class="text-sm text-blue-600 dark:text-blue-400 hover:underline transition-colors duration-200"
              >
                Back to Login
              </RouterLink>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </DefaultLayout>
</template>

<style scoped>
@keyframes blob {
  0% {
    transform: translate(0px, 0px) scale(1);
  }
  33% {
    transform: translate(30px, -50px) scale(1.1);
  }
  66% {
    transform: translate(-20px, 20px) scale(0.9);
  }
  100% {
    transform: translate(0px, 0px) scale(1);
  }
}

.animate-blob {
  animation: blob 7s infinite;
}

.animation-delay-2000 {
  animation-delay: 2s;
}

.animation-delay-4000 {
  animation-delay: 4s;
}
</style>
