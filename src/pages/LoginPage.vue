<script setup>
import PageHead from '@/components/PageHead.vue'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/composables/useAuth'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import { vAutoAnimate } from '@formkit/auto-animate'
import { Eye, EyeOff, Sparkles, X } from 'lucide-vue-next'
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
const showPassword = ref(false)

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
              <CardTitle
                class="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
              >
                Welcome Back
              </CardTitle>
            </div>
            <p class="text-muted-foreground">
              Sign in to access your saved NCPs
            </p>
          </CardHeader>

          <CardContent class="space-y-6" v-auto-animate>
            <!-- Error Alert -->
            <Alert
              v-if="error"
              variant="destructive"
              class="border-red-200 bg-red-50 dark:bg-red-900/20"
            >
              <X class="h-4 w-4" />
              <AlertDescription>{{ error }}</AlertDescription>
            </Alert>

            <form @submit.prevent="handleSubmit" class="space-y-5">
              <!-- Email -->
              <div class="space-y-2">
                <Label for="email" class="text-sm font-medium">Email</Label>
                <Input
                  id="email"
                  v-model="form.email"
                  type="email"
                  placeholder="john.doe@example.com"
                  required
                  class="transition-all duration-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <!-- Password -->
              <div class="space-y-2">
                <Label for="password" class="text-sm font-medium"
                  >Password</Label
                >
                <div class="relative">
                  <Input
                    id="password"
                    v-model="form.password"
                    :type="showPassword ? 'text' : 'password'"
                    placeholder="Enter your password"
                    required
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

              <!-- Submit Button -->
              <Button
                type="submit"
                class="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
                :disabled="loading"
              >
                <div class="flex items-center justify-center space-x-2">
                  <Sparkles v-if="!loading" class="h-4 w-4" />
                  <span>{{ loading ? 'Signing in...' : 'Sign In' }}</span>
                </div>
              </Button>
            </form>

            <!-- Additional Options -->
            <div class="space-y-4">
              <!-- Forgot Password Link -->
              <div class="text-center">
                <a
                  href="#"
                  class="text-sm text-blue-600 dark:text-blue-400 hover:underline transition-colors duration-200"
                >
                  Forgot your password?
                </a>
              </div>

              <!-- Divider -->
              <div class="relative">
                <div class="absolute inset-0 flex items-center">
                  <span
                    class="w-full border-t border-gray-200 dark:border-gray-700"
                  />
                </div>
                <div class="relative flex justify-center text-xs uppercase">
                  <span
                    class="bg-white dark:bg-gray-800 px-2 text-muted-foreground"
                  >
                    New to SmartCare?
                  </span>
                </div>
              </div>

              <!-- Sign Up Link -->
              <div class="text-center">
                <RouterLink
                  to="/signup"
                  class="text-sm text-muted-foreground hover:text-primary transition-colors duration-200"
                >
                  Don't have an account?
                  <span
                    class="text-blue-600 dark:text-blue-400 font-medium hover:underline"
                    >Sign up</span
                  >
                </RouterLink>
              </div>
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
