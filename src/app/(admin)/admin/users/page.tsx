'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { 
  Users, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  UserCheck, 
  UserX,
  Plus,
  Eye,
  Mail,
  Calendar,
  TrendingUp,
  Shield,
  GraduationCap,
  Activity,
  Sparkles
} from 'lucide-react'
import { httpsCallable } from 'firebase/functions'
import { functions } from '@/lib/firebase'
import { Spinner } from '@/components/ui/spinner'

interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: 'STUDENT' | 'INSTRUCTOR' | 'ADMIN' | 'COMPANY_ADMIN'
  createdAt: string
  lastLoginAt?: string
  isActive: boolean
  profilePictureUrl?: string
  emailVerified?: boolean
}

interface UserStats {
  totalUsers: number
  activeUsers: number
  newUsersThisMonth: number
  students: number
  instructors: number
  admins: number
}

const fetchUsers = async (): Promise<User[]> => {
  try {
    console.log('🔍 [AdminUsers] Calling getUsers function...')
    const getUsersFn = httpsCallable(functions, 'getUsers')
    const result: any = await getUsersFn({})
    
    console.log('🔍 [AdminUsers] getUsers result:', result)
    
    if (!result.data.success) {
      console.error('❌ [AdminUsers] getUsers failed:', result.data.error)
      throw new Error(result.data.error || 'Hiba a felhasználók betöltésekor')
    }
    
    console.log('✅ [AdminUsers] Users loaded:', result.data.users?.length || 0)
    return result.data.users || []
  } catch (error) {
    console.error('❌ [AdminUsers] fetchUsers error:', error)
    throw error
  }
}

const fetchUserStats = async (): Promise<UserStats> => {
  const getStatsFn = httpsCallable(functions, 'getStats')
  const result: any = await getStatsFn({})
  
  if (!result.data.success) {
    throw new Error(result.data.error || 'Hiba a felhasználói statisztikák betöltésekor')
  }
  
  // Use real stats from the Cloud Function
  return {
    totalUsers: result.data.stats.userCount || 0,
    activeUsers: result.data.stats.activeUsers || 0,
    newUsersThisMonth: result.data.stats.newUsersThisMonth || 0,
    students: result.data.stats.students || 0,
    instructors: result.data.stats.instructors || 0,
    admins: result.data.stats.admins || 0,
  }
}

const updateUserRole = async ({ userId, role }: { userId: string; role: string }) => {
  const updateUserRoleFn = httpsCallable(functions, 'updateUserRole')
  const result: any = await updateUserRoleFn({ userId, role })
  
  if (!result.data.success) {
    throw new Error(result.data.error || 'Hiba a felhasználói szerep frissítésekor')
  }
  
  return result.data
}

const deleteUser = async (userId: string) => {
  // For now, return success since we don't have delete user endpoint yet
  // TODO: Implement deleteUser Cloud Function
  return { success: true }
}

const toggleUserStatus = async ({ userId, isActive }: { userId: string; isActive: boolean }) => {
  // For now, return success since we don't have toggle user status endpoint yet
  // TODO: Implement toggleUserStatus Cloud Function
  return { success: true }
}

export default function AdminUsersPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [roleDialogOpen, setRoleDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [selectedRole, setSelectedRole] = useState<string>('')
  const queryClient = useQueryClient()

  const { data: users, isLoading: usersLoading, error: usersError } = useQuery<User[]>({
    queryKey: ['adminUsers'],
    queryFn: fetchUsers,
  })

  const { data: stats, isLoading: statsLoading } = useQuery<UserStats>({
    queryKey: ['adminUserStats'],
    queryFn: fetchUserStats,
  })

  const updateRoleMutation = useMutation({
    mutationFn: updateUserRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] })
      queryClient.invalidateQueries({ queryKey: ['adminUserStats'] })
      setRoleDialogOpen(false)
      setSelectedUser(null)
      setSelectedRole('')
    },
  })

  const handleOpenRoleDialog = (user: User) => {
    setSelectedUser(user)
    setSelectedRole(user.role)
    setRoleDialogOpen(true)
  }

  const handleUpdateRole = () => {
    if (selectedUser && selectedRole) {
      updateRoleMutation.mutate({ userId: selectedUser.id, role: selectedRole })
    }
  }

  const deleteUserMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] })
      queryClient.invalidateQueries({ queryKey: ['adminUserStats'] })
    },
  })

  const toggleStatusMutation = useMutation({
    mutationFn: toggleUserStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] })
      queryClient.invalidateQueries({ queryKey: ['adminUserStats'] })
    },
  })

  const filteredUsers = users?.filter(user => {
    const matchesSearch = 
      user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && user.isActive) ||
      (statusFilter === 'inactive' && !user.isActive)
    
    return matchesSearch && matchesRole && matchesStatus
  }) || []

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-red-100 text-red-700 border-red-200'
      case 'COMPANY_ADMIN':
        return 'bg-purple-100 text-purple-700 border-purple-200'
      case 'INSTRUCTOR':
        return 'bg-brand-secondary/10 text-brand-secondary-hover border-brand-secondary/20'
      case 'STUDENT':
        return 'bg-green-100 text-green-700 border-green-200'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'Adminisztrátor'
      case 'COMPANY_ADMIN':
        return 'Cég Adminisztrátor'
      case 'INSTRUCTOR':
        return 'Oktató'
      case 'STUDENT':
        return 'Hallgató'
      default:
        return role
    }
  }

  if (usersLoading || statsLoading) {
    return <div className="flex justify-center items-center h-64"><Spinner size="lg" /></div>
  }

  if (usersError) {
    return <div className="text-destructive">Hiba a felhasználók betöltése közben: {usersError.message}</div>
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-brand-secondary/50 to-indigo-600 rounded-xl p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24" />
        
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Felhasználók Kezelése</h1>
              <p className="text-brand-secondary-light text-lg">
                Platform felhasználók áttekintése és adminisztrációja
              </p>
            </div>
            <div className="hidden lg:block">
              <Button className="bg-white text-brand-secondary hover:bg-gray-100 flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Új Felhasználó
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Felhasználói Statisztikák</h2>
          <Badge className="bg-brand-secondary/10 text-brand-secondary-hover">
            <Sparkles className="w-3 h-3 mr-1" />
            Valós idejű
          </Badge>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-lg bg-brand-secondary/5 flex items-center justify-center">
                  <Users className="w-6 h-6 text-brand-secondary" />
                </div>
                <Badge variant="outline" className="text-xs text-green-600 border-green-600">
                  +{stats?.newUsersThisMonth || 0}
                </Badge>
              </div>
              <div className="mt-4">
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {stats?.totalUsers || 0}
                </div>
                <div className="text-sm font-medium text-gray-600 mb-1">
                  Összes Felhasználó
                </div>
                <div className="text-xs text-gray-500">
                  {stats?.newUsersThisMonth || 0} új ebben a hónapban
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-lg bg-green-50 flex items-center justify-center">
                  <Activity className="w-6 h-6 text-green-600" />
                </div>
                <Badge variant="outline" className="text-xs">
                  {stats?.totalUsers ? Math.round((stats.activeUsers / stats.totalUsers) * 100) : 0}%
                </Badge>
              </div>
              <div className="mt-4">
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {stats?.activeUsers || 0}
                </div>
                <div className="text-sm font-medium text-gray-600 mb-1">
                  Aktív Felhasználók
                </div>
                <div className="text-xs text-gray-500">
                  Elmúlt 30 napban
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-lg bg-purple-50 flex items-center justify-center">
                  <GraduationCap className="w-6 h-6 text-purple-600" />
                </div>
              </div>
              <div className="mt-4">
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {stats?.students || 0}
                </div>
                <div className="text-sm font-medium text-gray-600 mb-1">
                  Hallgatók
                </div>
                <div className="text-xs text-gray-500">
                  {stats?.totalUsers ? Math.round((stats.students / stats.totalUsers) * 100) : 0}% az összesből
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-lg bg-orange-50 flex items-center justify-center">
                  <UserCheck className="w-6 h-6 text-orange-600" />
                </div>
              </div>
              <div className="mt-4">
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {stats?.instructors || 0}
                </div>
                <div className="text-sm font-medium text-gray-600 mb-1">
                  Oktatók
                </div>
                <div className="text-xs text-gray-500">
                  {stats?.totalUsers ? Math.round((stats.instructors / stats.totalUsers) * 100) : 0}% az összesből
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Filters and Search */}
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Keresés és Szűrés</span>
            <Badge variant="outline" className="text-xs">
              <Filter className="w-3 h-3 mr-1" />
              {filteredUsers.length} találat
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Keresés név vagy email alapján..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background transition-colors hover:border-gray-400"
            >
              <option value="all">Minden szerepkör</option>
              <option value="STUDENT">Hallgató</option>
              <option value="INSTRUCTOR">Oktató</option>
              <option value="ADMIN">Adminisztrátor</option>
              <option value="COMPANY_ADMIN">Cég Adminisztrátor</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background transition-colors hover:border-gray-400"
            >
              <option value="all">Minden állapot</option>
              <option value="active">Aktív</option>
              <option value="inactive">Inaktív</option>
            </select>

            <Button 
              variant="outline" 
              className="flex items-center gap-2 hover:bg-gray-50"
              onClick={() => {
                setSearchTerm('')
                setRoleFilter('all')
                setStatusFilter('all')
              }}
            >
              <Filter className="h-4 w-4" />
              Szűrők Törlése
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Felhasználók Listája</CardTitle>
            <div className="flex items-center gap-2">
              <Badge className="bg-indigo-100 text-indigo-700">
                <Users className="w-3 h-3 mr-1" />
                {filteredUsers.length} felhasználó
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-bold">Felhasználó</TableHead>
                <TableHead className="font-bold">Email</TableHead>
                <TableHead className="font-bold">Szerepkör</TableHead>
                <TableHead className="font-bold">Regisztráció</TableHead>
                <TableHead className="font-bold">Utolsó Bejelentkezés</TableHead>
                <TableHead className="font-bold">Állapot</TableHead>
                <TableHead className="text-right font-bold">Műveletek</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Users className="w-12 h-12 text-gray-300" />
                      <p className="text-muted-foreground">Nincs találat a megadott szűrőkkel</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                <TableRow key={user.id} className="hover:bg-gray-50 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                        {user.profilePictureUrl ? (
                          <img 
                            src={user.profilePictureUrl} 
                            alt={`${user.firstName} ${user.lastName}`}
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-sm font-medium">
                            {user.firstName[0]}{user.lastName[0]}
                          </span>
                        )}
                      </div>
                      <div>
                        <div className="font-medium">{user.firstName} {user.lastName}</div>
                        <div className="text-sm text-muted-foreground">ID: {user.id.slice(0, 8)}...</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        {user.email}
                      </div>
                      {user.emailVerified !== undefined && (
                        <Badge 
                          variant="outline" 
                          className={user.emailVerified 
                            ? "text-xs bg-green-50 text-green-700 border-green-200" 
                            : "text-xs bg-yellow-50 text-yellow-700 border-yellow-200"}
                        >
                          {user.emailVerified ? '✓ Megerősített' : '⚠ Nincs megerősítve'}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getRoleBadgeColor(user.role)}>
                      {user.role === 'ADMIN' && <Shield className="w-3 h-3 mr-1" />}
                      {user.role === 'INSTRUCTOR' && <UserCheck className="w-3 h-3 mr-1" />}
                      {user.role === 'STUDENT' && <GraduationCap className="w-3 h-3 mr-1" />}
                      {getRoleLabel(user.role)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      {new Date(user.createdAt).toLocaleDateString('hu-HU')}
                    </div>
                  </TableCell>
                  <TableCell>
                    {user.lastLoginAt ? (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {new Date(user.lastLoginAt).toLocaleDateString('hu-HU')}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Még nem jelentkezett be</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline" 
                      className={user.isActive ? "bg-green-50 text-green-700 border-green-200" : "bg-gray-50 text-gray-700 border-gray-200"}
                    >
                      <div className={`w-2 h-2 rounded-full mr-2 ${user.isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
                      {user.isActive ? 'Aktív' : 'Inaktív'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem className="flex items-center gap-2">
                          <Eye className="h-4 w-4" />
                          Megtekintés
                        </DropdownMenuItem>
                        <DropdownMenuItem className="flex items-center gap-2">
                          <Edit className="h-4 w-4" />
                          Szerkesztés
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="flex items-center gap-2"
                          onClick={() => handleOpenRoleDialog(user)}
                        >
                          <UserCheck className="h-4 w-4" />
                          Szerepkör Módosítása
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="flex items-center gap-2"
                          onClick={() => toggleStatusMutation.mutate({ 
                            userId: user.id, 
                            isActive: !user.isActive 
                          })}
                        >
                          <UserX className="h-4 w-4" />
                          {user.isActive ? 'Deaktiválás' : 'Aktiválás'}
                        </DropdownMenuItem>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem 
                              className="flex items-center gap-2 text-destructive"
                              onSelect={(e) => e.preventDefault()}
                            >
                              <Trash2 className="h-4 w-4" />
                              Törlés
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Felhasználó Törlése</AlertDialogTitle>
                              <AlertDialogDescription>
                                Biztosan törölni szeretnéd a következő felhasználót: {user.firstName} {user.lastName}?
                                Ez a művelet nem vonható vissza.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Mégse</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => deleteUserMutation.mutate(user.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Törlés
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Role Change Dialog */}
      <AlertDialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Felhasználói Szerepkör Módosítása</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedUser && (
                <span>
                  Változtasd meg <strong>{selectedUser.firstName} {selectedUser.lastName}</strong> szerepkörét.
                  Ez azonnal érvénybe lép.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="py-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Új Szerepkör
            </label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background transition-colors hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-secondary"
            >
              <option value="STUDENT">Hallgató</option>
              <option value="INSTRUCTOR">Oktató</option>
              <option value="ADMIN">Adminisztrátor</option>
              <option value="COMPANY_ADMIN">Cég Adminisztrátor</option>
            </select>

            {selectedUser && (
              <div className="mt-4 p-3 bg-gray-50 rounded-md border border-gray-200">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Jelenlegi szerepkör:</span>
                  <Badge variant="outline" className={getRoleBadgeColor(selectedUser.role)}>
                    {getRoleLabel(selectedUser.role)}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm mt-2">
                  <span className="text-gray-600">Új szerepkör:</span>
                  <Badge variant="outline" className={getRoleBadgeColor(selectedRole)}>
                    {getRoleLabel(selectedRole)}
                  </Badge>
                </div>
              </div>
            )}
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Mégse</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUpdateRole}
              disabled={updateRoleMutation.isPending || !selectedRole || selectedRole === selectedUser?.role}
              className="bg-brand-secondary text-white hover:bg-brand-secondary-hover"
            >
              {updateRoleMutation.isPending ? 'Mentés...' : 'Szerepkör Módosítása'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
} 