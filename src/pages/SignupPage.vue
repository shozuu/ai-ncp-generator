<script setup>
import PageHead from '@/components/PageHead.vue'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAuth } from '@/composables/useAuth'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import {
  getPasswordSuggestions,
  validatePasswordStrength,
} from '@/utils/passwordUtils'
import { vAutoAnimate } from '@formkit/auto-animate'
import { Check, Eye, EyeOff, X } from 'lucide-vue-next'
import { computed, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const { signUp } = useAuth()

const form = reactive({
  firstName: '',
  middleName: '',
  lastName: '',
  organization: '',
  role: '',
  email: '',
  password: '',
  confirmPassword: '',
})

const loading = ref(false)
const error = ref('')
const success = ref('')
const showPassword = ref(false)
const showConfirmPassword = ref(false)
const passwordTouched = ref(false)

// Password strength validation
const passwordStrength = computed(() => {
  if (!form.password) return null
  return validatePasswordStrength(form.password)
})

const passwordSuggestions = computed(() => {
  if (!passwordStrength.value) return []
  return getPasswordSuggestions(passwordStrength.value.criteria)
})

// Password matching validation
const passwordsMatch = computed(() => {
  if (!form.confirmPassword) return true
  return form.password === form.confirmPassword
})

// Form validation
const isFormValid = computed(() => {
  return (
    form.firstName &&
    form.lastName &&
    form.organization &&
    form.role &&
    form.email &&
    passwordStrength.value?.isValid &&
    passwordsMatch.value
  )
})

// Watch password input to show suggestions after user starts typing
watch(
  () => form.password,
  () => {
    if (form.password && !passwordTouched.value) {
      passwordTouched.value = true
    }
  }
)

const handleSubmit = async () => {
  if (!isFormValid.value) {
    error.value = 'Please fill in all required fields with valid information.'
    // Scroll to top to show error message
    window.scrollTo({ top: 0, behavior: 'smooth' })
    return
  }

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
    // Scroll to top to show error message
    window.scrollTo({ top: 0, behavior: 'smooth' })
  } else {
    success.value =
      'Account created successfully! Please check your email to verify your account.'
    // Scroll to top to show success message
    window.scrollTo({ top: 0, behavior: 'smooth' })

    // Redirect to login page with a query parameter
    setTimeout(() => {
      router.push({
        path: '/login',
        query: { verified: 'pending' },
      })
    }, 3000)
  }

  loading.value = false
}
</script>

<template>
  <PageHead title="- Sign Up" />
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
          class="w-full max-w-lg backdrop-blur-sm bg-white/80 dark:bg-gray-800/80 shadow-2xl border-0 ring-1 ring-gray-200/50 dark:ring-gray-700/50"
        >
          <CardHeader class="text-center space-y-2 pb-6">
            <div class="flex items-center justify-center space-x-2 mb-2">
              <CardTitle
                class="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
              >
                Create Your Account
              </CardTitle>
            </div>
            <p class="text-muted-foreground">
              Join SmartCare to save and manage your NCPs
            </p>
          </CardHeader>

          <CardContent class="space-y-6" v-auto-animate>
            <!-- Alerts -->
            <Alert
              v-if="error"
              variant="destructive"
              class="border-red-200 bg-red-50 dark:bg-red-900/20 flex items-center"
            >
              <X class="h-4 w-4" />
              <AlertDescription>{{ error }}</AlertDescription>
            </Alert>

            <Alert
              v-if="success"
              class="border-emerald-200 bg-emerald-50 dark:bg-emerald-900/20 animate-pulse"
            >
              <Check class="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              <AlertDescription
                class="text-emerald-800 dark:text-emerald-200 font-medium"
                >{{ success }}</AlertDescription
              >
            </Alert>

            <form @submit.prevent="handleSubmit" class="space-y-5">
              <!-- Name Fields -->
              <div class="grid grid-cols-2 gap-4">
                <div class="space-y-2">
                  <Label for="firstName" class="text-sm font-medium"
                    >First Name</Label
                  >
                  <Input
                    id="firstName"
                    v-model="form.firstName"
                    type="text"
                    placeholder="John"
                    required
                    class="transition-all duration-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
                <div class="space-y-2">
                  <Label for="lastName" class="text-sm font-medium"
                    >Last Name</Label
                  >
                  <Input
                    id="lastName"
                    v-model="form.lastName"
                    type="text"
                    placeholder="Doe"
                    required
                    class="transition-all duration-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              <!-- Middle Name -->
              <div class="space-y-2">
                <Label for="middleName" class="text-sm font-medium"
                  >Middle Name (Optional)</Label
                >
                <Input
                  id="middleName"
                  v-model="form.middleName"
                  type="text"
                  placeholder=""
                  class="transition-all duration-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <!-- Organization -->
              <div class="space-y-2">
                <Label for="organization" class="text-sm font-medium"
                  >Organization/School</Label
                >
                <Input
                  id="organization"
                  v-model="form.organization"
                  type="text"
                  placeholder="Organization or School"
                  required
                  class="transition-all duration-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <!-- Role Selection -->
              <div class="space-y-2">
                <Label for="role" class="text-sm font-medium">Role</Label>
                <Select v-model="form.role" required>
                  <SelectTrigger
                    class="transition-all duration-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nurse">Registered Nurse</SelectItem>
                    <SelectItem value="nursing_student"
                      >Nursing Student</SelectItem
                    >
                    <SelectItem value="nursing_educator"
                      >Nursing Educator</SelectItem
                    >
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

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

              <!-- Password with Strength Indicator -->
              <div class="space-y-2">
                <Label for="password" class="text-sm font-medium"
                  >Password</Label
                >
                <div class="relative">
                  <Input
                    id="password"
                    v-model="form.password"
                    :type="showPassword ? 'text' : 'password'"
                    placeholder="Create a strong password"
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

                <!-- Password Strength Indicator -->
                <div v-if="passwordTouched && form.password" class="space-y-2">
                  <div class="flex items-center justify-between text-xs">
                    <span class="text-muted-foreground"
                      >Password strength:</span
                    >
                    <span
                      :class="passwordStrength?.color.replace('bg-', 'text-')"
                      class="font-medium capitalize"
                    >
                      {{ passwordStrength?.strength }}
                    </span>
                  </div>
                  <Progress
                    :value="passwordStrength?.percentage || 0"
                    :class="passwordStrength?.color"
                    class="h-2"
                  />

                  <!-- Password Requirements -->
                  <div v-if="passwordSuggestions.length > 0" class="space-y-1">
                    <p class="text-xs text-muted-foreground">
                      Password should include:
                    </p>
                    <ul class="space-y-1">
                      <li
                        v-for="suggestion in passwordSuggestions"
                        :key="suggestion"
                        class="flex items-center space-x-2 text-xs"
                      >
                        <X class="h-3 w-3 text-red-500" />
                        <span class="text-muted-foreground">{{
                          suggestion
                        }}</span>
                      </li>
                    </ul>
                  </div>

                  <!-- Completed Requirements -->
                  <div v-if="passwordStrength?.criteria" class="space-y-1">
                    <div
                      v-if="
                        Object.values(passwordStrength.criteria).some(Boolean)
                      "
                      class="space-y-1"
                    >
                      <p class="text-xs text-emerald-600 dark:text-emerald-400">
                        Password includes:
                      </p>
                      <ul class="space-y-1">
                        <li
                          v-if="passwordStrength.criteria.length"
                          class="flex items-center space-x-2 text-xs"
                        >
                          <Check class="h-3 w-3 text-emerald-500" />
                          <span class="text-emerald-600 dark:text-emerald-400"
                            >At least 8 characters</span
                          >
                        </li>
                        <li
                          v-if="passwordStrength.criteria.lowercase"
                          class="flex items-center space-x-2 text-xs"
                        >
                          <Check class="h-3 w-3 text-emerald-500" />
                          <span class="text-emerald-600 dark:text-emerald-400"
                            >Lowercase letters</span
                          >
                        </li>
                        <li
                          v-if="passwordStrength.criteria.uppercase"
                          class="flex items-center space-x-2 text-xs"
                        >
                          <Check class="h-3 w-3 text-emerald-500" />
                          <span class="text-emerald-600 dark:text-emerald-400"
                            >Uppercase letters</span
                          >
                        </li>
                        <li
                          v-if="passwordStrength.criteria.number"
                          class="flex items-center space-x-2 text-xs"
                        >
                          <Check class="h-3 w-3 text-emerald-500" />
                          <span class="text-emerald-600 dark:text-emerald-400"
                            >Numbers</span
                          >
                        </li>
                        <li
                          v-if="passwordStrength.criteria.special"
                          class="flex items-center space-x-2 text-xs"
                        >
                          <Check class="h-3 w-3 text-emerald-500" />
                          <span class="text-emerald-600 dark:text-emerald-400"
                            >Special characters</span
                          >
                        </li>
                      </ul>
                    </div>
                  </div>
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
                    placeholder="Confirm your password"
                    required
                    :class="[
                      'pr-10 transition-all duration-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500',
                      form.confirmPassword && !passwordsMatch
                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                        : '',
                    ]"
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

                <!-- Password Match Indicator -->
                <div
                  v-if="form.confirmPassword"
                  class="flex items-center space-x-2 text-xs"
                >
                  <Check
                    v-if="passwordsMatch"
                    class="h-3 w-3 text-emerald-500"
                  />
                  <X v-else class="h-3 w-3 text-red-500" />
                  <span
                    :class="
                      passwordsMatch
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-red-600 dark:text-red-400'
                    "
                  >
                    {{
                      passwordsMatch
                        ? 'Passwords match'
                        : 'Passwords do not match'
                    }}
                  </span>
                </div>
              </div>

              <!-- Submit Button -->
              <Button
                type="submit"
                class="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
                :disabled="loading || !isFormValid"
              >
                <div class="flex items-center justify-center space-x-2">
                  <Sparkles v-if="!loading" class="h-4 w-4" />
                  <span>{{ loading ? 'Creating Account...' : 'Sign Up' }}</span>
                </div>
              </Button>
            </form>

            <!-- Sign In Link -->
            <div
              class="text-center pt-4 border-t border-gray-200 dark:border-gray-700"
            >
              <RouterLink
                to="/login"
                class="text-sm text-muted-foreground hover:text-primary transition-colors duration-200 hover:underline"
              >
                Already have an account?
                <span class="text-blue-600 dark:text-blue-400 font-medium"
                  >Sign in</span
                >
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
