<template>
  <AdminLayout>
    <div class="space-y-6">
      <!-- Header -->
      <div
        class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 class="text-3xl font-bold tracking-tight">User Management</h1>
          <p class="text-muted-foreground mt-2">
            Manage users, view their NCPs, and monitor activity
          </p>
        </div>
        <div class="flex items-center gap-2">
          <Badge variant="outline" class="gap-1">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="h-3 w-3"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            {{ users.length }} users
          </Badge>
          <Button variant="outline" size="sm" @click="loadUsers">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="h-4 w-4 mr-2"
              :class="{ 'animate-spin': loading }"
            >
              <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
              <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
              <path d="M16 16h5v5" />
            </svg>
            Refresh
          </Button>
        </div>
      </div>

      <!-- Filters and Search -->
      <Card>
        <CardContent class="pt-6">
          <div class="flex flex-col lg:flex-row gap-4">
            <!-- Search -->
            <div class="flex-1 relative">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              <Input
                v-model="searchQuery"
                placeholder="Search by name or email..."
                class="pl-10"
                @input="debouncedSearch"
              />
            </div>

            <!-- Status Filter -->
            <Select v-model="statusFilter" @update:modelValue="applyFilters">
              <SelectTrigger class="w-[160px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>

            <!-- Role Filter -->
            <Select v-model="roleFilter" @update:modelValue="applyFilters">
              <SelectTrigger class="w-[160px]">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="user">Regular Users</SelectItem>
                <SelectItem value="admin">Admins</SelectItem>
                <SelectItem value="super">Super Admins</SelectItem>
              </SelectContent>
            </Select>

            <!-- Sort By -->
            <Select v-model="sortBy" @update:modelValue="applyFilters">
              <SelectTrigger class="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at_desc">Newest First</SelectItem>
                <SelectItem value="created_at_asc">Oldest First</SelectItem>
                <SelectItem value="last_sign_in_desc"
                  >Recently Active</SelectItem
                >
                <SelectItem value="ncp_count_desc">Most NCPs</SelectItem>
                <SelectItem value="ncp_count_asc">Fewest NCPs</SelectItem>
                <SelectItem value="name_asc">Name A-Z</SelectItem>
                <SelectItem value="name_desc">Name Z-A</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <!-- Active Filters -->
          <div
            v-if="hasActiveFilters"
            class="flex items-center gap-2 mt-4 flex-wrap"
          >
            <span class="text-sm text-muted-foreground">Active filters:</span>
            <Badge
              v-if="searchQuery"
              variant="secondary"
              class="gap-1 cursor-pointer hover:bg-secondary/80"
              @click="clearFilter('search')"
            >
              Search: {{ searchQuery }}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                class="h-3 w-3"
              >
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </Badge>
            <Badge
              v-if="statusFilter !== 'all'"
              variant="secondary"
              class="gap-1 cursor-pointer hover:bg-secondary/80"
              @click="clearFilter('status')"
            >
              Status: {{ statusFilter }}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                class="h-3 w-3"
              >
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </Badge>
            <Badge
              v-if="roleFilter !== 'all'"
              variant="secondary"
              class="gap-1 cursor-pointer hover:bg-secondary/80"
              @click="clearFilter('role')"
            >
              Role: {{ roleFilter }}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                class="h-3 w-3"
              >
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              class="text-xs h-6"
              @click="clearAllFilters"
            >
              Clear all
            </Button>
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
                  <TableHead class="w-[280px]">User</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Last Active</TableHead>
                  <TableHead class="text-center">NCPs</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead class="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow
                  v-for="user in filteredUsers"
                  :key="user.id"
                  class="cursor-pointer hover:bg-muted/50"
                  @click="viewUserDetails(user)"
                >
                  <TableCell>
                    <div class="flex items-center gap-3">
                      <Avatar class="h-10 w-10">
                        <AvatarFallback :class="getAvatarColor(user)">
                          {{ getUserInitials(user) }}
                        </AvatarFallback>
                      </Avatar>
                      <div class="min-w-0">
                        <div class="font-medium truncate">
                          {{ user.full_name || 'Anonymous User' }}
                        </div>
                        <div class="text-xs text-muted-foreground truncate">
                          {{ user.email }}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div class="text-sm">{{ formatDate(user.created_at) }}</div>
                    <div class="text-xs text-muted-foreground">
                      {{ formatRelativeDate(user.created_at) }}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div class="text-sm">
                      {{ formatDate(user.last_sign_in_at) }}
                    </div>
                    <div class="text-xs text-muted-foreground">
                      {{ formatRelativeDate(user.last_sign_in_at) }}
                    </div>
                  </TableCell>
                  <TableCell class="text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      class="gap-1 h-8"
                      @click.stop="viewUserNCPs(user)"
                    >
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
                        <path
                          d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
                        />
                        <polyline points="14 2 14 8 20 8" />
                      </svg>
                      {{ user.ncp_count || 0 }}
                    </Button>
                  </TableCell>
                  <TableCell>
                    <div class="flex flex-wrap gap-1">
                      <Badge
                        :variant="user.is_suspended ? 'destructive' : 'default'"
                        class="text-xs"
                      >
                        {{ user.is_suspended ? 'Suspended' : 'Active' }}
                      </Badge>
                      <Badge
                        v-if="user.is_admin"
                        variant="secondary"
                        :class="
                          user.admin_level === 'super'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200'
                            : 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200'
                        "
                        class="text-xs"
                      >
                        {{
                          user.admin_level === 'super' ? '👑 Super' : '🛡️ Admin'
                        }}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell class="text-right" @click.stop>
                    <DropdownMenu>
                      <DropdownMenuTrigger as-child>
                        <Button variant="ghost" size="icon" class="h-8 w-8">
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
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            class="h-4 w-4 mr-2"
                          >
                            <path
                              d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"
                            />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem @click="viewUserNCPs(user)">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            class="h-4 w-4 mr-2"
                          >
                            <path
                              d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
                            />
                            <polyline points="14 2 14 8 20 8" />
                          </svg>
                          View NCPs ({{ user.ncp_count || 0 }})
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          @click="toggleUserStatus(user)"
                          :class="
                            user.is_suspended
                              ? 'text-green-600'
                              : 'text-yellow-600'
                          "
                          :disabled="user.admin_level === 'super'"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            class="h-4 w-4 mr-2"
                          >
                            <path
                              v-if="user.is_suspended"
                              d="M22 11.08V12a10 10 0 1 1-5.93-9.14"
                            />
                            <polyline
                              v-if="user.is_suspended"
                              points="22 4 12 14.01 9 11.01"
                            />
                            <circle
                              v-if="!user.is_suspended"
                              cx="12"
                              cy="12"
                              r="10"
                            />
                            <path
                              v-if="!user.is_suspended"
                              d="m4.9 4.9 14.2 14.2"
                            />
                          </svg>
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
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              stroke-width="2"
                              class="h-4 w-4 mr-2"
                            >
                              <path
                                d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"
                              />
                            </svg>
                            Promote to Admin
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            v-else-if="user.admin_level !== 'super'"
                            @click="confirmDemoteAdmin(user)"
                            class="text-orange-600"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              stroke-width="2"
                              class="h-4 w-4 mr-2"
                            >
                              <path d="m19 5-7 7-7-7" />
                              <path d="m19 12-7 7-7-7" />
                            </svg>
                            Demote from Admin
                          </DropdownMenuItem>
                        </template>

                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          @click="confirmDeleteUser(user)"
                          class="text-destructive"
                          :disabled="user.admin_level === 'super'"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            class="h-4 w-4 mr-2"
                          >
                            <path d="M3 6h18" />
                            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                            <line x1="10" x2="10" y1="11" y2="17" />
                            <line x1="14" x2="14" y1="11" y2="17" />
                          </svg>
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
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              class="h-12 w-12 mx-auto text-muted-foreground/50 mb-4"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <p class="text-muted-foreground">No users found</p>
            <p class="text-sm text-muted-foreground mt-1">
              Try adjusting your search or filters
            </p>
          </div>

          <!-- Pagination -->
          <div
            v-if="filteredUsers.length > 0"
            class="flex items-center justify-between mt-4 pt-4 border-t"
          >
            <p class="text-sm text-muted-foreground">
              Showing {{ filteredUsers.length }} of {{ users.length }} users
            </p>
          </div>
        </CardContent>
      </Card>

      <!-- User Details Sheet -->
      <Sheet v-model:open="showUserDetails">
        <SheetContent class="sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle class="flex items-center gap-3">
              <Avatar class="h-12 w-12">
                <AvatarFallback :class="getAvatarColor(selectedUser)">
                  {{ getUserInitials(selectedUser) }}
                </AvatarFallback>
              </Avatar>
              <div>
                <div>{{ selectedUser?.full_name || 'Anonymous User' }}</div>
                <div class="text-sm font-normal text-muted-foreground">
                  {{ selectedUser?.email }}
                </div>
              </div>
            </SheetTitle>
          </SheetHeader>

          <div v-if="selectedUser" class="mt-6 space-y-6">
            <!-- Status Badges -->
            <div class="flex flex-wrap gap-2">
              <Badge
                :variant="selectedUser.is_suspended ? 'destructive' : 'default'"
              >
                {{ selectedUser.is_suspended ? 'Suspended' : 'Active' }}
              </Badge>
              <Badge
                v-if="selectedUser.is_admin"
                variant="secondary"
                :class="
                  selectedUser.admin_level === 'super'
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200'
                    : 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200'
                "
              >
                {{
                  selectedUser.admin_level === 'super'
                    ? '👑 Super Admin'
                    : '🛡️ Admin'
                }}
              </Badge>
              <Badge
                v-if="selectedUser.email_confirmed_at"
                variant="outline"
                class="gap-1"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  class="h-3 w-3"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Email Verified
              </Badge>
            </div>

            <!-- User Info -->
            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-1">
                <Label class="text-xs text-muted-foreground">User ID</Label>
                <p
                  class="font-mono bg-muted px-2 py-1 rounded text-xs break-all"
                >
                  {{ selectedUser.id }}
                </p>
              </div>
              <div class="space-y-1">
                <Label class="text-xs text-muted-foreground">Total NCPs</Label>
                <p class="text-2xl font-bold">
                  {{ selectedUser.ncp_count || 0 }}
                </p>
              </div>
              <div class="space-y-1">
                <Label class="text-xs text-muted-foreground">Joined</Label>
                <p class="text-sm">{{ formatDate(selectedUser.created_at) }}</p>
                <p class="text-xs text-muted-foreground">
                  {{ formatRelativeDate(selectedUser.created_at) }}
                </p>
              </div>
              <div class="space-y-1">
                <Label class="text-xs text-muted-foreground"
                  >Last Sign In</Label
                >
                <p class="text-sm">
                  {{ formatDate(selectedUser.last_sign_in_at) }}
                </p>
                <p class="text-xs text-muted-foreground">
                  {{ formatRelativeDate(selectedUser.last_sign_in_at) }}
                </p>
              </div>
            </div>

            <!-- Quick Actions -->
            <div class="space-y-2">
              <Label class="text-xs text-muted-foreground">Quick Actions</Label>
              <div class="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  @click="viewUserNCPs(selectedUser)"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    class="h-4 w-4 mr-2"
                  >
                    <path
                      d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
                    />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                  View NCPs
                </Button>
                <Button
                  v-if="selectedUser.admin_level !== 'super'"
                  :variant="selectedUser.is_suspended ? 'default' : 'outline'"
                  size="sm"
                  @click="toggleUserStatus(selectedUser)"
                >
                  {{ selectedUser.is_suspended ? 'Activate' : 'Suspend' }}
                </Button>
                <Button
                  v-if="selectedUser.admin_level !== 'super'"
                  variant="destructive"
                  size="sm"
                  @click="confirmDeleteUser(selectedUser)"
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <!-- User NCPs Dialog -->
      <Dialog v-model:open="showUserNCPs">
        <DialogContent
          class="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col"
        >
          <DialogHeader>
            <DialogTitle class="flex items-center gap-2">
              <Avatar class="h-8 w-8">
                <AvatarFallback
                  :class="getAvatarColor(ncpUser)"
                  class="text-xs"
                >
                  {{ getUserInitials(ncpUser) }}
                </AvatarFallback>
              </Avatar>
              {{ ncpUser?.full_name || 'User' }}'s NCPs
            </DialogTitle>
            <DialogDescription>
              {{ ncpUser?.email }} • {{ ncpPagination.total }} total NCPs
            </DialogDescription>
          </DialogHeader>

          <div class="flex-1 overflow-auto">
            <!-- Loading -->
            <div v-if="ncpLoading" class="space-y-3 py-4">
              <Skeleton v-for="i in 3" :key="i" class="h-20 w-full" />
            </div>

            <!-- NCP List -->
            <div v-else-if="userNCPs.length > 0" class="space-y-3 py-4">
              <Card
                v-for="ncp in userNCPs"
                :key="ncp.id"
                class="cursor-pointer hover:bg-muted/50 transition-colors"
                @click="viewNCPDetails(ncp)"
              >
                <CardContent class="p-4">
                  <div class="flex items-start justify-between gap-4">
                    <div class="min-w-0 flex-1">
                      <h4 class="font-medium truncate">{{ ncp.title }}</h4>
                      <p
                        v-if="ncp.diagnosis_preview"
                        class="text-sm text-muted-foreground line-clamp-2 mt-1"
                      >
                        {{ ncp.diagnosis_preview }}
                      </p>
                    </div>
                    <div
                      class="text-right text-xs text-muted-foreground whitespace-nowrap"
                    >
                      <div>{{ formatDate(ncp.created_at) }}</div>
                      <div>{{ formatRelativeDate(ncp.created_at) }}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <!-- Empty -->
            <div v-else class="text-center py-12">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                class="h-12 w-12 mx-auto text-muted-foreground/50 mb-4"
              >
                <path
                  d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
                />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              <p class="text-muted-foreground">No NCPs found</p>
            </div>
          </div>

          <!-- Pagination -->
          <div
            v-if="ncpPagination.total_pages > 1"
            class="flex items-center justify-between pt-4 border-t"
          >
            <p class="text-sm text-muted-foreground">
              Page {{ ncpPagination.page }} of {{ ncpPagination.total_pages }}
            </p>
            <div class="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                :disabled="ncpPagination.page <= 1"
                @click="loadUserNCPs(ncpUser, ncpPagination.page - 1)"
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                :disabled="ncpPagination.page >= ncpPagination.total_pages"
                @click="loadUserNCPs(ncpUser, ncpPagination.page + 1)"
              >
                Next
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <!-- NCP Details Dialog (Reusable Component) -->
      <NCPViewerDialog
        v-model:open="showNCPDetails"
        :ncp="selectedNCP"
        :loading="ncpDetailsLoading"
      />

      <!-- Delete Confirmation Dialog -->
      <Dialog v-model:open="showDeleteConfirm">
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete
              <span class="font-medium">{{ userToDelete?.email }}</span
              >? This action cannot be undone and will delete all their NCPs.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" @click="showDeleteConfirm = false">
              Cancel
            </Button>
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
              <Select v-model="promoteAdminLevel">
                <SelectTrigger>
                  <SelectValue placeholder="Select admin level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="regular">
                    <div class="flex flex-col items-start">
                      <span class="font-medium">🛡️ Regular Admin</span>
                      <span class="text-xs text-muted-foreground">
                        Can manage users but not other admins
                      </span>
                    </div>
                  </SelectItem>
                  <SelectItem value="super">
                    <div class="flex flex-col items-start">
                      <span class="font-medium">👑 Super Admin</span>
                      <span class="text-xs text-muted-foreground">
                        Full control, can promote/demote admins
                      </span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" @click="showPromoteDialog = false">
              Cancel
            </Button>
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
            <Button variant="outline" @click="showDemoteDialog = false">
              Cancel
            </Button>
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
import NCPViewerDialog from '@/components/ncp/NCPViewerDialog.vue'
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
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

// State
const loading = ref(true)
const users = ref([])
const searchQuery = ref('')
const statusFilter = ref('all')
const roleFilter = ref('all')
const sortBy = ref('created_at_desc')

// User details
const showUserDetails = ref(false)
const selectedUser = ref(null)

// User NCPs
const showUserNCPs = ref(false)
const ncpUser = ref(null)
const userNCPs = ref([])
const ncpLoading = ref(false)
const ncpPagination = ref({
  page: 1,
  limit: 10,
  total: 0,
  total_pages: 0,
})

// NCP Details
const showNCPDetails = ref(false)
const selectedNCP = ref(null)
const ncpDetailsLoading = ref(false)

// Delete user
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

// Debounce timer
let searchTimeout = null

const hasActiveFilters = computed(() => {
  return (
    searchQuery.value ||
    statusFilter.value !== 'all' ||
    roleFilter.value !== 'all'
  )
})

const filteredUsers = computed(() => {
  let result = [...users.value]

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

  // Filter by role
  if (roleFilter.value !== 'all') {
    result = result.filter(user => {
      if (roleFilter.value === 'user') return !user.is_admin
      if (roleFilter.value === 'admin')
        return user.is_admin && user.admin_level !== 'super'
      if (roleFilter.value === 'super') return user.admin_level === 'super'
      return true
    })
  }

  // Sort
  const [field, order] = sortBy.value.split('_')
  const isDesc = order === 'desc'

  result.sort((a, b) => {
    let aVal, bVal

    switch (field) {
      case 'created':
        aVal = new Date(a.created_at || 0).getTime()
        bVal = new Date(b.created_at || 0).getTime()
        break
      case 'last':
        aVal = new Date(a.last_sign_in_at || 0).getTime()
        bVal = new Date(b.last_sign_in_at || 0).getTime()
        break
      case 'ncp':
        aVal = a.ncp_count || 0
        bVal = b.ncp_count || 0
        break
      case 'name':
        aVal = (a.full_name || a.email || '').toLowerCase()
        bVal = (b.full_name || b.email || '').toLowerCase()
        break
      default:
        aVal = new Date(a.created_at || 0).getTime()
        bVal = new Date(b.created_at || 0).getTime()
    }

    if (typeof aVal === 'string') {
      return isDesc ? bVal.localeCompare(aVal) : aVal.localeCompare(bVal)
    }
    return isDesc ? bVal - aVal : aVal - bVal
  })

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

const debouncedSearch = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    // Filtering is done via computed property
  }, 300)
}

const applyFilters = () => {
  // Filtering is done via computed property
}

const clearFilter = type => {
  switch (type) {
    case 'search':
      searchQuery.value = ''
      break
    case 'status':
      statusFilter.value = 'all'
      break
    case 'role':
      roleFilter.value = 'all'
      break
  }
}

const clearAllFilters = () => {
  searchQuery.value = ''
  statusFilter.value = 'all'
  roleFilter.value = 'all'
}

const getUserInitials = user => {
  if (!user) return '??'
  if (user.full_name) {
    const parts = user.full_name.split(' ')
    return parts
      .map(p => p[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }
  return user.email?.slice(0, 2).toUpperCase() || '??'
}

const getAvatarColor = user => {
  if (!user) return 'bg-muted'
  if (user.admin_level === 'super')
    return 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300'
  if (user.is_admin)
    return 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300'
  if (user.is_suspended)
    return 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300'
  return 'bg-primary/10 text-primary'
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

const formatRelativeDate = dateString => {
  if (!dateString) return ''
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now - date
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`
  return `${Math.floor(diffDays / 365)} years ago`
}

const viewUserDetails = user => {
  selectedUser.value = user
  showUserDetails.value = true
}

const viewUserNCPs = async user => {
  ncpUser.value = user
  showUserNCPs.value = true
  await loadUserNCPs(user, 1)
}

const loadUserNCPs = async (user, page = 1) => {
  try {
    ncpLoading.value = true
    const result = await adminService.getUserNCPs(user.id, {
      page,
      limit: 10,
      sortBy: 'created_at',
      sortOrder: 'desc',
    })
    userNCPs.value = result.ncps
    ncpPagination.value = {
      page: result.page,
      limit: result.limit,
      total: result.total,
      total_pages: result.total_pages,
    }
  } catch (error) {
    console.error('Error loading user NCPs:', error)
    toast({
      title: 'Error',
      description: 'Failed to load user NCPs',
      variant: 'destructive',
    })
  } finally {
    ncpLoading.value = false
  }
}

const viewNCPDetails = async ncp => {
  try {
    ncpDetailsLoading.value = true
    showNCPDetails.value = true
    selectedNCP.value = await adminService.getUserNCPDetails(
      ncpUser.value.id,
      ncp.id
    )
  } catch (error) {
    console.error('Error loading NCP details:', error)
    toast({
      title: 'Error',
      description: 'Failed to load NCP details',
      variant: 'destructive',
    })
  } finally {
    ncpDetailsLoading.value = false
  }
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
    showUserDetails.value = false
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

    await adminService.updateAdminRole(
      userToPromote.value.id,
      true,
      promoteAdminLevel.value
    )

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
