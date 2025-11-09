<template>
  <AdminLayout>
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold tracking-tight">User Management</h1>
          <p class="text-muted-foreground mt-2">
            Manage and monitor all registered users
          </p>
        </div>
      </div>

      <!-- Filters and Search -->
      <Card>
        <CardContent class="pt-6">
          <div class="flex flex-col sm:flex-row gap-4">
            <div class="flex-1">
              <Input
                v-model="searchQuery"
                placeholder="Search by email..."
                class="max-w-sm"
                @input="handleSearch"
              />
            </div>
            <Select v-model="statusFilter" @update:modelValue="loadUsers">
              <SelectTrigger class="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <!-- Users Table -->
      <Card>
        <CardContent class="pt-6">
          <!-- Loading State -->
          <div v-if="loading" class="space-y-4">
            <Skeleton v-for="i in 5" :key="i" class="h-16 w-full" />
          </div>

          <!-- Table -->
          <div
            v-else-if="filteredUsers.length > 0"
            class="relative w-full overflow-auto"
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Last Active</TableHead>
                  <TableHead>NCPs</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead class="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow v-for="user in filteredUsers" :key="user.id">
                  <TableCell>
                    <div class="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>{{
                          getUserInitials(user)
                        }}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div class="font-medium">
                          {{ user.full_name || 'Anonymous User' }}
                        </div>
                        <div class="text-xs text-muted-foreground">
                          ID: {{ user.id.slice(0, 8) }}...
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{{ user.email }}</TableCell>
                  <TableCell>{{ formatDate(user.created_at) }}</TableCell>
                  <TableCell>{{ formatDate(user.last_sign_in_at) }}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{{ user.ncp_count || 0 }}</Badge>
                  </TableCell>
                  <TableCell>
                    <div class="flex gap-2">
                      <Badge
                        :variant="user.is_suspended ? 'destructive' : 'default'"
                      >
                        {{ user.is_suspended ? 'Suspended' : 'Active' }}
                      </Badge>
                      <Badge
                        v-if="user.is_admin"
                        variant="secondary"
                        class="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                      >
                        {{
                          user.admin_level === 'super'
                            ? '👑 Super Admin'
                            : '🛡️ Admin'
                        }}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell class="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger as-child>
                        <Button variant="ghost" size="icon">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            class="h-4 w-4"
                          >
                            <circle cx="12" cy="12" r="1" />
                            <circle cx="12" cy="5" r="1" />
                            <circle cx="12" cy="19" r="1" />
                          </svg>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem @click="viewUserDetails(user)">
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          @click="toggleUserStatus(user)"
                          :class="
                            user.is_suspended
                              ? 'text-green-600'
                              : 'text-yellow-600'
                          "
                          :disabled="user.admin_level === 'super'"
                        >
                          {{
                            user.is_suspended ? 'Activate User' : 'Suspend User'
                          }}
                        </DropdownMenuItem>

                        <!-- Admin Management (Super Admin Only) -->
                        <template v-if="isSuperAdmin">
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            v-if="!user.is_admin"
                            @click="confirmPromoteToAdmin(user)"
                            class="text-purple-600"
                          >
                            Promote to Admin
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            v-else-if="user.admin_level !== 'super'"
                            @click="confirmDemoteAdmin(user)"
                            class="text-orange-600"
                          >
                            Demote from Admin
                          </DropdownMenuItem>
                        </template>

                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          @click="confirmDeleteUser(user)"
                          class="text-destructive"
                          :disabled="user.admin_level === 'super'"
                        >
                          Delete User
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          <!-- Empty State -->
          <div v-else class="text-center py-12">
            <p class="text-muted-foreground">No users found</p>
          </div>
        </CardContent>
      </Card>

      <!-- User Details Dialog -->
      <Dialog v-model:open="showUserDetails">
        <DialogContent class="max-w-2xl">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>
              Detailed information about {{ selectedUser?.email }}
            </DialogDescription>
          </DialogHeader>
          <div v-if="selectedUser" class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <Label class="text-muted-foreground">User ID</Label>
                <p class="text-sm font-mono">{{ selectedUser.id }}</p>
              </div>
              <div>
                <Label class="text-muted-foreground">Email</Label>
                <p class="text-sm">{{ selectedUser.email }}</p>
              </div>
              <div>
                <Label class="text-muted-foreground">Full Name</Label>
                <p class="text-sm">{{ selectedUser.full_name || 'N/A' }}</p>
              </div>
              <div>
                <Label class="text-muted-foreground">Status</Label>
                <Badge
                  :variant="
                    selectedUser.is_suspended ? 'destructive' : 'default'
                  "
                  class="mt-1"
                >
                  {{ selectedUser.is_suspended ? 'Suspended' : 'Active' }}
                </Badge>
              </div>
              <div>
                <Label class="text-muted-foreground">Joined</Label>
                <p class="text-sm">{{ formatDate(selectedUser.created_at) }}</p>
              </div>
              <div>
                <Label class="text-muted-foreground">Last Sign In</Label>
                <p class="text-sm">
                  {{ formatDate(selectedUser.last_sign_in_at) }}
                </p>
              </div>
              <div>
                <Label class="text-muted-foreground">Total NCPs</Label>
                <p class="text-sm">{{ selectedUser.ncp_count || 0 }}</p>
              </div>
              <div>
                <Label class="text-muted-foreground">Email Confirmed</Label>
                <p class="text-sm">
                  {{ selectedUser.email_confirmed_at ? 'Yes' : 'No' }}
                </p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <!-- Delete Confirmation Dialog -->
      <Dialog v-model:open="showDeleteConfirm">
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {{ userToDelete?.email }}? This
              action cannot be undone and will delete all their NCPs.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" @click="showDeleteConfirm = false"
              >Cancel</Button
            >
            <Button
              variant="destructive"
              @click="deleteUser"
              :disabled="deleting"
            >
              {{ deleting ? 'Deleting...' : 'Delete User' }}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <!-- Promote to Admin Dialog -->
      <Dialog v-model:open="showPromoteDialog">
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Promote to Admin</DialogTitle>
            <DialogDescription>
              Promote {{ userToPromote?.email }} to admin? They will have access
              to the admin panel.
            </DialogDescription>
          </DialogHeader>
          <div class="space-y-4 py-4">
            <div class="space-y-2">
              <Label>Admin Level</Label>
              <Select
                v-model="promoteAdminLevel"
                @update:modelValue="val => (promoteAdminLevel = val)"
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select admin level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="regular">
                    <div class="flex flex-col items-start">
                      <span class="font-medium">🛡️ Regular Admin</span>
                      <span class="text-xs text-muted-foreground"
                        >Can manage users but not other admins</span
                      >
                    </div>
                  </SelectItem>
                  <SelectItem value="super">
                    <div class="flex flex-col items-start">
                      <span class="font-medium">👑 Super Admin</span>
                      <span class="text-xs text-muted-foreground"
                        >Full control, can promote/demote admins</span
                      >
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p class="text-xs text-muted-foreground mt-2">
                Selected: {{ promoteAdminLevel }}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" @click="showPromoteDialog = false"
              >Cancel</Button
            >
            <Button @click="promoteToAdmin" :disabled="promoting">
              {{ promoting ? 'Promoting...' : 'Promote' }}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <!-- Demote Admin Dialog -->
      <Dialog v-model:open="showDemoteDialog">
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Demote Admin</DialogTitle>
            <DialogDescription>
              Remove admin privileges from {{ userToDemote?.email }}? They will
              lose access to the admin panel.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" @click="showDemoteDialog = false"
              >Cancel</Button
            >
            <Button
              variant="destructive"
              @click="demoteAdmin"
              :disabled="demoting"
            >
              {{ demoting ? 'Demoting...' : 'Demote' }}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  </AdminLayout>
</template>

<script setup>
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useToast } from '@/components/ui/toast/use-toast'
import { useAdmin } from '@/composables/useAdmin'
import AdminLayout from '@/layouts/AdminLayout.vue'
import { adminService } from '@/services/adminService'
import { computed, onMounted, ref } from 'vue'

const { toast } = useToast()
const { isSuperAdmin } = useAdmin()
const loading = ref(true)
const users = ref([])
const searchQuery = ref('')
const statusFilter = ref('all')
const showUserDetails = ref(false)
const selectedUser = ref(null)
const showDeleteConfirm = ref(false)
const userToDelete = ref(null)
const deleting = ref(false)

// Admin promotion/demotion
const showPromoteDialog = ref(false)
const userToPromote = ref(null)
const promoteAdminLevel = ref('regular')
const promoting = ref(false)
const showDemoteDialog = ref(false)
const userToDemote = ref(null)
const demoting = ref(false)

const filteredUsers = computed(() => {
  let result = users.value

  // Filter by search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(
      user =>
        user.email.toLowerCase().includes(query) ||
        (user.full_name && user.full_name.toLowerCase().includes(query))
    )
  }

  // Filter by status
  if (statusFilter.value !== 'all') {
    result = result.filter(user => {
      if (statusFilter.value === 'active') return !user.is_suspended
      if (statusFilter.value === 'suspended') return user.is_suspended
      return true
    })
  }

  return result
})

const loadUsers = async () => {
  try {
    loading.value = true
    users.value = await adminService.getUsers()
  } catch (error) {
    console.error('Error loading users:', error)
    toast({
      title: 'Error',
      description: 'Failed to load users',
      variant: 'destructive',
    })
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  // Debouncing handled by computed property
}

const getUserInitials = user => {
  if (user.full_name) {
    const parts = user.full_name.split(' ')
    return parts
      .map(p => p[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }
  return user.email.slice(0, 2).toUpperCase()
}

const formatDate = dateString => {
  if (!dateString) return 'Never'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

const viewUserDetails = user => {
  selectedUser.value = user
  showUserDetails.value = true
}

const toggleUserStatus = async user => {
  try {
    const newStatus = !user.is_suspended
    await adminService.updateUserStatus(user.id, newStatus)

    user.is_suspended = newStatus

    toast({
      title: 'Success',
      description: `User ${newStatus ? 'suspended' : 'activated'} successfully`,
    })
  } catch (error) {
    console.error('Error updating user status:', error)
    toast({
      title: 'Error',
      description: 'Failed to update user status',
      variant: 'destructive',
    })
  }
}

const confirmDeleteUser = user => {
  userToDelete.value = user
  showDeleteConfirm.value = true
}

const deleteUser = async () => {
  if (!userToDelete.value) return

  try {
    deleting.value = true
    await adminService.deleteUser(userToDelete.value.id)

    users.value = users.value.filter(u => u.id !== userToDelete.value.id)

    toast({
      title: 'Success',
      description: 'User deleted successfully',
    })

    showDeleteConfirm.value = false
    userToDelete.value = null
  } catch (error) {
    console.error('Error deleting user:', error)
    const errorMessage = error.response?.data?.detail || 'Failed to delete user'
    toast({
      title: 'Error',
      description: errorMessage,
      variant: 'destructive',
    })
  } finally {
    deleting.value = false
  }
}

const confirmPromoteToAdmin = user => {
  userToPromote.value = user
  promoteAdminLevel.value = 'regular'
  showPromoteDialog.value = true
}

const promoteToAdmin = async () => {
  if (!userToPromote.value) return

  try {
    promoting.value = true

    console.log('Promoting user:', {
      userId: userToPromote.value.id,
      email: userToPromote.value.email,
      adminLevel: promoteAdminLevel.value,
    })

    await adminService.updateAdminRole(
      userToPromote.value.id,
      true,
      promoteAdminLevel.value
    )

    // Update local user object
    const user = users.value.find(u => u.id === userToPromote.value.id)
    if (user) {
      user.is_admin = true
      user.admin_level = promoteAdminLevel.value
    }

    const levelText =
      promoteAdminLevel.value === 'super' ? 'Super Admin' : 'Regular Admin'
    toast({
      title: 'Success',
      description: `User promoted to ${levelText} successfully`,
    })

    showPromoteDialog.value = false
    userToPromote.value = null
  } catch (error) {
    console.error('Error promoting user:', error)
    console.error('Error details:', error.response?.data)
    const errorMessage =
      error.response?.data?.detail || 'Failed to promote user'
    toast({
      title: 'Error',
      description: errorMessage,
      variant: 'destructive',
    })
  } finally {
    promoting.value = false
  }
}

const confirmDemoteAdmin = user => {
  userToDemote.value = user
  showDemoteDialog.value = true
}

const demoteAdmin = async () => {
  if (!userToDemote.value) return

  try {
    demoting.value = true
    await adminService.updateAdminRole(userToDemote.value.id, false)

    // Update local user object
    const user = users.value.find(u => u.id === userToDemote.value.id)
    if (user) {
      user.is_admin = false
      user.admin_level = null
    }

    toast({
      title: 'Success',
      description: 'Admin privileges removed successfully',
    })

    showDemoteDialog.value = false
    userToDemote.value = null
  } catch (error) {
    console.error('Error demoting admin:', error)
    const errorMessage =
      error.response?.data?.detail || 'Failed to demote admin'
    toast({
      title: 'Error',
      description: errorMessage,
      variant: 'destructive',
    })
  } finally {
    demoting.value = false
  }
}

onMounted(() => {
  loadUsers()
})
</script>
