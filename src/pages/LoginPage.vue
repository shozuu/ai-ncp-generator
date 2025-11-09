<script setup>
import PageHead from '@/components/PageHead.vue'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/composables/useAuth'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import { vAutoAnimate } from '@formkit/auto-animate'
import { Eye, EyeOff, Mail, X } from 'lucide-vue-next'
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const router = useRouter()
const route = useRoute()
const { signIn, resetPassword } = useAuth()

const form = ref({
  email: '',
  password: '',
})
const loading = ref(false)
const error = ref('')
const showPassword = ref(false)

// Verification message from signup
const verificationMessage = ref('')

// Forgot password state
const showForgotPasswordDialog = ref(false)
const forgotPasswordEmail = ref('')
const forgotPasswordLoading = ref(false)
const forgotPasswordError = ref('')
const forgotPasswordSuccess = ref(false)

// Check if user is coming from signup page or was suspended
if (route.query.verified === 'pending') {
  verificationMessage.value =
    'Please check your email to verify your account before logging in.'
  // Auto-hide the message after 8 seconds
} else if (route.query.suspended === 'true') {
  error.value =
    'Your account has been suspended. Please contact support for assistance.'
}

// Auto-hide the message after 8 seconds if it's a verification message
if (route.query.verified === 'pending') {
  setTimeout(() => {
    verificationMessage.value = ''
    // Clean up the URL query parameter
    router.replace({ path: '/login' })
  }, 8000)
}

const getReadableErrorMessage = errorMessage => {
  // Map technical error messages to user-friendly ones
  const errorMap = {
    'Invalid login credentials':
      'The email or password you entered is incorrect. Please try again.',
    'Email not confirmed':
      'Please verify your email address before signing in. Check your inbox for the confirmation link.',
    'User not found':
      'No account found with this email address. Please check your email or sign up.',
    'Invalid email or password':
      'The email or password you entered is incorrect. Please try again.',
    'Too many requests':
      'Too many login attempts. Please wait a few minutes before trying again.',
  }

  // Check if the error message contains any of our known patterns
  for (const [pattern, friendlyMessage] of Object.entries(errorMap)) {
    if (errorMessage.toLowerCase().includes(pattern.toLowerCase())) {
      return friendlyMessage
    }
  }

  // Default fallback for unknown errors
  return 'Unable to sign in. Please check your credentials and try again.'
}

const handleSubmit = async () => {
  error.value = ''
  loading.value = true

  const { error: signInError } = await signIn(
    form.value.email,
    form.value.password
  )

  if (signInError) {
    error.value = getReadableErrorMessage(signInError.message)
    // Scroll to top to show error message
    window.scrollTo({ top: 0, behavior: 'smooth' })
  } else {
    const redirectTo = route.query.redirect || '/'
    router.push(redirectTo)
  }

  loading.value = false
}

const handleForgotPassword = async () => {
  forgotPasswordError.value = ''
  forgotPasswordSuccess.value = false
  forgotPasswordLoading.value = true

  const { error: resetError } = await resetPassword(forgotPasswordEmail.value)

  if (resetError) {
    forgotPasswordError.value = resetError.message
  } else {
    forgotPasswordSuccess.value = true
    // Reset form after success
    setTimeout(() => {
      showForgotPasswordDialog.value = false
      forgotPasswordEmail.value = ''
      forgotPasswordSuccess.value = false
    }, 3000)
  }

  forgotPasswordLoading.value = false
}

const openForgotPasswordDialog = () => {
  // Pre-fill email if user has entered one in the main form
  if (form.value.email) {
    forgotPasswordEmail.value = form.value.email
  }
  forgotPasswordError.value = ''
  forgotPasswordSuccess.value = false
  showForgotPasswordDialog.value = true
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
            <!-- Verification Message (from signup) -->
            <Alert
              v-if="verificationMessage"
              class="border-l-4 border-l-blue-500 bg-blue-50 dark:bg-blue-950/30 border-blue-100 dark:border-blue-900/50"
            >
              <div class="flex items-start gap-3">
                <div class="flex-shrink-0 mt-0.5">
                  <div
                    class="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center"
                  >
                    <Mail class="h-3 w-3 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
                <div class="flex-1">
                  <p
                    class="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1"
                  >
                    Email Verification Required
                  </p>
                  <AlertDescription
                    class="text-sm text-blue-800 dark:text-blue-200"
                  >
                    {{ verificationMessage }}
                  </AlertDescription>
                </div>
              </div>
            </Alert>

            <!-- Success Message (from password reset) -->
            <Alert
              v-if="route.query.message"
              class="border-l-4 border-l-green-500 bg-green-50 dark:bg-green-950/30 border-green-100 dark:border-green-900/50"
            >
              <div class="flex items-start gap-3">
                <div class="flex-shrink-0 mt-0.5">
                  <div
                    class="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center"
                  >
                    <Mail class="h-3 w-3 text-green-600 dark:text-green-400" />
                  </div>
                </div>
                <div class="flex-1">
                  <AlertDescription
                    class="text-sm text-green-800 dark:text-green-200"
                  >
                    {{ route.query.message }}
                  </AlertDescription>
                </div>
              </div>
            </Alert>

            <!-- Error Alert -->
            <Alert
              v-if="error"
              class="border-l-4 border-l-red-500 bg-red-50 dark:bg-red-950/30 border-red-100 dark:border-red-900/50"
            >
              <div class="flex items-start gap-3">
                <div class="flex-shrink-0 mt-0.5">
                  <div
                    class="w-5 h-5 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center"
                  >
                    <X class="h-3 w-3 text-red-600 dark:text-red-400" />
                  </div>
                </div>
                <div class="flex-1">
                  <p
                    class="text-sm font-medium text-red-900 dark:text-red-100 mb-1"
                  >
                    Sign In Failed
                  </p>
                  <AlertDescription
                    class="text-sm text-red-800 dark:text-red-200"
                  >
                    {{ error }}
                  </AlertDescription>
                </div>
              </div>
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
                    class="pr-10 transition-all duration-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 [&::-ms-reveal]:hidden [&::-ms-clear]:hidden"
                  />
                  <button
                    type="button"
                    @click="showPassword = !showPassword"
                    class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors z-10"
                    :aria-label="
                      showPassword ? 'Hide password' : 'Show password'
                    "
                  >
                    <component
                      :is="showPassword ? EyeOff : Eye"
                      class="h-4 w-4"
                    />
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
                  <span>{{ loading ? 'Signing in...' : 'Sign In' }}</span>
                </div>
              </Button>
            </form>

            <!-- Additional Options -->
            <div class="space-y-4">
              <!-- Forgot Password Dialog -->
              <div class="text-center">
                <Dialog v-model:open="showForgotPasswordDialog">
                  <DialogTrigger as-child>
                    <button
                      @click="openForgotPasswordDialog"
                      type="button"
                      class="text-sm text-blue-600 dark:text-blue-400 hover:underline transition-colors duration-200"
                    >
                      Forgot your password?
                    </button>
                  </DialogTrigger>
                  <DialogContent class="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle class="flex items-center space-x-2">
                        <Mail class="h-5 w-5 text-blue-600" />
                        <span>Reset Your Password</span>
                      </DialogTitle>
                      <DialogDescription>
                        Enter your email address and we'll send you a link to
                        reset your password.
                      </DialogDescription>
                    </DialogHeader>

                    <div class="space-y-4" v-auto-animate>
                      <!-- Success Message -->
                      <Alert
                        v-if="forgotPasswordSuccess"
                        class="border-green-200 bg-green-50 dark:bg-green-900/20"
                      >
                        <Mail class="h-4 w-4 text-green-600" />
                        <AlertDescription
                          class="text-green-800 dark:text-green-200"
                        >
                          Password reset email sent successfully! Check your
                          inbox for further instructions.
                        </AlertDescription>
                      </Alert>

                      <!-- Error Message -->
                      <Alert
                        v-if="forgotPasswordError"
                        variant="destructive"
                        class="border-red-200 bg-red-50 dark:bg-red-900/20"
                      >
                        <X class="h-4 w-4" />
                        <AlertDescription>{{
                          forgotPasswordError
                        }}</AlertDescription>
                      </Alert>

                      <!-- Email Input Form -->
                      <form
                        v-if="!forgotPasswordSuccess"
                        @submit.prevent="handleForgotPassword"
                        class="space-y-4"
                      >
                        <div class="space-y-2">
                          <Label for="forgot-email" class="text-sm font-medium"
                            >Email Address</Label
                          >
                          <Input
                            id="forgot-email"
                            v-model="forgotPasswordEmail"
                            type="email"
                            placeholder="john.doe@example.com"
                            required
                            class="transition-all duration-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                          />
                        </div>

                        <DialogFooter class="gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            @click="showForgotPasswordDialog = false"
                            :disabled="forgotPasswordLoading"
                          >
                            Cancel
                          </Button>
                          <Button
                            type="submit"
                            :disabled="
                              forgotPasswordLoading ||
                              !forgotPasswordEmail.trim()
                            "
                            class="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                          >
                            <Mail
                              v-if="!forgotPasswordLoading"
                              class="h-4 w-4 mr-2"
                            />
                            {{
                              forgotPasswordLoading
                                ? 'Sending...'
                                : 'Send Reset Email'
                            }}
                          </Button>
                        </DialogFooter>
                      </form>
                    </div>
                  </DialogContent>
                </Dialog>
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
