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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
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
  Sparkles,
  Phone,
  Building2,
  CreditCard,
  Clock,
  UserPlus,
  Loader2,
  X
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
  isActive: boolean
  profilePictureUrl?: string
  emailVerified?: boolean
  // NEW: Additional fields
  phone?: string | null
  subscriptionStatus?: 'active' | 'trialing' | 'past_due' | 'canceled' | 'none' | null
  companyId?: string | null
  companyRole?: string | null
  lastLoginAt?: string | null
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

// Pre-registration form interface
interface PreRegistrationForm {
  firstName: string
  lastName: string
  email: string
  phone: string
  companyName: string
}

const createPreRegistration = async (data: PreRegistrationForm) => {
  const createPreRegFn = httpsCallable(functions, 'createPreRegistration')
  const result: any = await createPreRegFn(data)

  if (!result.data.success) {
    throw new Error(result.data.error || 'Hiba az előregisztráció létrehozásakor')
  }

  return result.data
}

export default function AdminUsersPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [roleDialogOpen, setRoleDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [selectedRole, setSelectedRole] = useState<string>('')
  const queryClient = useQueryClient()

  // Pre-registration state
  const [showPreRegModal, setShowPreRegModal] = useState(false)
  const [preRegForm, setPreRegForm] = useState<PreRegistrationForm>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    companyName: '',
  })
  const [preRegError, setPreRegError] = useState('')
  const [preRegSuccess, setPreRegSuccess] = useState('')

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

  // Pre-registration mutation
  const preRegMutation = useMutation({
    mutationFn: createPreRegistration,
    onSuccess: (data) => {
      setPreRegSuccess(data.message || 'Előregisztráció sikeresen létrehozva!')
      setPreRegError('')
      // Reset form
      setPreRegForm({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        companyName: '',
      })
      // Close modal after 3 seconds
      setTimeout(() => {
        setShowPreRegModal(false)
        setPreRegSuccess('')
      }, 3000)
    },
    onError: (error: any) => {
      setPreRegError(error.message || 'Hiba történt az előregisztráció létrehozásakor')
      setPreRegSuccess('')
    },
  })

  const handlePreRegSubmit = () => {
    setPreRegError('')
    setPreRegSuccess('')

    // Validation
    if (!preRegForm.firstName.trim()) {
      setPreRegError('A keresztnév megadása kötelező')
      return
    }
    if (!preRegForm.lastName.trim()) {
      setPreRegError('A vezetéknév megadása kötelező')
      return
    }
    if (!preRegForm.email.trim()) {
      setPreRegError('Az email cím megadása kötelező')
      return
    }
    if (!preRegForm.phone.trim()) {
      setPreRegError('A telefonszám megadása kötelező')
      return
    }
    if (!preRegForm.companyName.trim()) {
      setPreRegError('A cégnév megadása kötelező')
      return
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(preRegForm.email.trim())) {
      setPreRegError('Érvénytelen email cím formátum')
      return
    }

    preRegMutation.mutate(preRegForm)
  }

  const handlePreRegModalClose = () => {
    setShowPreRegModal(false)
    setPreRegError('')
    setPreRegSuccess('')
    setPreRegForm({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      companyName: '',
    })
  }

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
        return 'bg-blue-100 text-blue-700 border-blue-200'
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

  const getSubscriptionBadgeColor = (status: string | null | undefined) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700 border-green-200'
      case 'trialing':
        return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'past_due':
        return 'bg-red-100 text-red-700 border-red-200'
      case 'canceled':
        return 'bg-gray-100 text-gray-700 border-gray-200'
      case 'none':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      default:
        return 'bg-gray-50 text-gray-500 border-gray-200'
    }
  }

  const getSubscriptionLabel = (status: string | null | undefined) => {
    switch (status) {
      case 'active':
        return 'Aktív'
      case 'trialing':
        return 'Próba'
      case 'past_due':
        return 'Lejárt'
      case 'canceled':
        return 'Lemondva'
      case 'none':
        return 'Nincs'
      default:
        return '-'
    }
  }

  if (usersLoading || statsLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#112a4b]" />
      </div>
    )
  }

  if (usersError) {
    return <div className="text-red-600">Hiba a felhasználók betöltése közben: {usersError.message}</div>
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Felhasználók Kezelése</h1>
          <p className="text-gray-500">
            Platform felhasználók áttekintése és adminisztrációja
          </p>
        </div>
        <div className="hidden lg:flex items-center gap-3">
          <Button
            onClick={() => setShowPreRegModal(true)}
            className="bg-[#112a4b] text-white hover:bg-[#1a3d6e] flex items-center gap-2"
          >
            <UserPlus className="h-4 w-4" />
            Előregisztráció
          </Button>
        </div>
      </div>

      {/* Stats Section */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Felhasználói Statisztikák</h2>
          <Badge className="bg-[#112a4b]/10 text-[#112a4b]">
            <Sparkles className="w-3 h-3 mr-1" />
            Valós idejű
          </Badge>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-lg bg-[#112a4b]/10 flex items-center justify-center">
                  <Users className="w-6 h-6 text-[#112a4b]" />
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
              <Badge className="bg-[#112a4b]/10 text-[#112a4b]">
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
                <TableHead className="font-bold">Elérhetőség</TableHead>
                <TableHead className="font-bold">Szerepkör</TableHead>
                <TableHead className="font-bold">Előfizetés</TableHead>
                <TableHead className="font-bold">Cég</TableHead>
                <TableHead className="font-bold">Regisztráció</TableHead>
                <TableHead className="font-bold">Állapot</TableHead>
                <TableHead className="text-right font-bold">Műveletek</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
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
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                        <span className="truncate max-w-[180px]">{user.email}</span>
                      </div>
                      {user.phone && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Phone className="h-3.5 w-3.5 flex-shrink-0" />
                          {user.phone}
                        </div>
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
                    <Badge variant="outline" className={getSubscriptionBadgeColor(user.subscriptionStatus)}>
                      <CreditCard className="w-3 h-3 mr-1" />
                      {getSubscriptionLabel(user.subscriptionStatus)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {user.companyId ? (
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm">
                          <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="truncate max-w-[100px]">{user.companyId.slice(0, 8)}...</span>
                        </div>
                        {user.companyRole && (
                          <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                            {user.companyRole === 'owner' ? 'Tulajdonos' : user.companyRole === 'admin' ? 'Admin' : 'Alkalmazott'}
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                      {new Date(user.createdAt).toLocaleDateString('hu-HU')}
                    </div>
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
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background transition-colors hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-[#112a4b]"
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
              className="bg-[#112a4b] text-white hover:bg-[#1a3d6e]"
            >
              {updateRoleMutation.isPending ? 'Mentés...' : 'Szerepkör Módosítása'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Pre-Registration Modal */}
      <Dialog open={showPreRegModal} onOpenChange={handlePreRegModalClose}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Előregisztráció létrehozása
            </DialogTitle>
            <DialogDescription>
              Hozz létre egy előregisztrációt egy új cég adminisztrátor számára. A felhasználó emailben kapja meg a regisztrációs linket.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Success message */}
            {preRegSuccess && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {preRegSuccess}
                </p>
              </div>
            )}

            {/* Error message */}
            {preRegError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">{preRegError}</p>
              </div>
            )}

            {/* Form fields */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="preRegLastName">Vezetéknév *</Label>
                <Input
                  id="preRegLastName"
                  placeholder="Kovács"
                  value={preRegForm.lastName}
                  onChange={(e) => setPreRegForm({ ...preRegForm, lastName: e.target.value })}
                  disabled={preRegMutation.isPending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="preRegFirstName">Keresztnév *</Label>
                <Input
                  id="preRegFirstName"
                  placeholder="János"
                  value={preRegForm.firstName}
                  onChange={(e) => setPreRegForm({ ...preRegForm, firstName: e.target.value })}
                  disabled={preRegMutation.isPending}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="preRegCompanyName">Cégnév *</Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="preRegCompanyName"
                  className="pl-10"
                  placeholder="Kovács Kft."
                  value={preRegForm.companyName}
                  onChange={(e) => setPreRegForm({ ...preRegForm, companyName: e.target.value })}
                  disabled={preRegMutation.isPending}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="preRegEmail">Email cím *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="preRegEmail"
                  type="email"
                  className="pl-10"
                  placeholder="pelda@email.com"
                  value={preRegForm.email}
                  onChange={(e) => setPreRegForm({ ...preRegForm, email: e.target.value })}
                  disabled={preRegMutation.isPending}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="preRegPhone">Telefonszám *</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="preRegPhone"
                  type="tel"
                  className="pl-10"
                  placeholder="+36 30 123 4567"
                  value={preRegForm.phone}
                  onChange={(e) => setPreRegForm({ ...preRegForm, phone: e.target.value })}
                  disabled={preRegMutation.isPending}
                />
              </div>
            </div>

            <div className="text-xs text-muted-foreground">
              * Kötelező mezők. A felhasználó 7 napig érvényes linket kap emailben.
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={handlePreRegModalClose}
              disabled={preRegMutation.isPending}
            >
              Mégse
            </Button>
            <Button
              onClick={handlePreRegSubmit}
              disabled={preRegMutation.isPending}
              className="bg-[#112a4b] text-white hover:bg-[#1a3d6e]"
            >
              {preRegMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Küldés...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-2" />
                  Előregisztráció küldése
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 