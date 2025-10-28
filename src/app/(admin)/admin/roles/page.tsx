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
  UserCheck, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Shield, 
  GraduationCap, 
  Users,
  CheckCircle,
  Settings,
  TrendingUp,
  Sparkles,
  Lock,
  Key
} from 'lucide-react'
import { httpsCallable } from 'firebase/functions'
import { functions } from '@/lib/firebase'
import { Spinner } from '@/components/ui/spinner'
import { toast } from 'sonner'

interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: 'STUDENT' | 'INSTRUCTOR' | 'ADMIN'
  createdAt: string
  isActive: boolean
}

interface RoleStats {
  totalUsers: number
  students: number
  instructors: number
  admins: number
}

const fetchUsers = async (): Promise<User[]> => {
  const getUsersFn = httpsCallable(functions, 'getUsers')
  const result: any = await getUsersFn({})
  
  if (!result.data.success) {
    throw new Error(result.data.error || 'Hiba a felhasználók betöltésekor')
  }
  
  return result.data.users || []
}

const updateUserRole = async ({ userId, role }: { userId: string; role: string }) => {
  const updateUserRoleFn = httpsCallable(functions, 'updateUserRole')
  const result: any = await updateUserRoleFn({ userId, role })
  
  if (!result.data.success) {
    throw new Error(result.data.error || 'Hiba a felhasználói szerep frissítésekor')
  }
  
  return result.data
}

export default function AdminRolesPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const queryClient = useQueryClient()

  const { data: users, isLoading, error } = useQuery<User[]>({
    queryKey: ['adminUsers'],
    queryFn: fetchUsers,
  })

  const updateRoleMutation = useMutation({
    mutationFn: updateUserRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] })
      toast.success('Szerepkör sikeresen frissítve!')
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Hiba történt a szerepkör frissítésekor.')
    },
  })

  const filteredUsers = users?.filter(user => {
    const matchesSearch = 
      user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter
    
    return matchesSearch && matchesRole
  }) || []

  const stats = {
    totalUsers: users?.length || 0,
    students: users?.filter(u => u.role === 'STUDENT').length || 0,
    instructors: users?.filter(u => u.role === 'INSTRUCTOR').length || 0,
    admins: users?.filter(u => u.role === 'ADMIN').length || 0,
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-red-100 text-red-700 border-red-200'
      case 'INSTRUCTOR':
        return 'bg-purple-100 text-purple-700 border-purple-200'
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
      case 'INSTRUCTOR':
        return 'Oktató'
      case 'STUDENT':
        return 'Hallgató'
      default:
        return role
    }
  }

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><Spinner size="lg" /></div>
  }

  if (error) {
    return <div className="text-destructive">Hiba a felhasználók betöltése közben: {error.message}</div>
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24" />
        
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Szerepkörök Kezelése</h1>
              <p className="text-purple-100 text-lg">
                Felhasználói jogosultságok és szerepkörök adminisztrációja
              </p>
            </div>
            <div className="hidden lg:block">
              <Button className="bg-white text-purple-600 hover:bg-gray-100 flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Szerepkör Beállítások
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Role Stats */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Szerepkör Eloszlás</h2>
          <Badge className="bg-purple-100 text-purple-700">
            <Sparkles className="w-3 h-3 mr-1" />
            Jogosultságok
          </Badge>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <Badge variant="outline" className="text-xs">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  Összes
                </Badge>
              </div>
              <div className="mt-4">
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {stats.totalUsers}
                </div>
                <div className="text-sm font-medium text-gray-600 mb-1">
                  Összes Felhasználó
                </div>
                <div className="text-xs text-gray-500">
                  Aktív fiókok
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-lg bg-green-50 flex items-center justify-center">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <div className="mt-4">
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {stats.students}
                </div>
                <div className="text-sm font-medium text-gray-600 mb-1">
                  Hallgatók
                </div>
                <div className="text-xs text-gray-500">
                  {stats.totalUsers ? Math.round((stats.students / stats.totalUsers) * 100) : 0}% az összesből
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
                  {stats.instructors}
                </div>
                <div className="text-sm font-medium text-gray-600 mb-1">
                  Oktatók
                </div>
                <div className="text-xs text-gray-500">
                  {stats.totalUsers ? Math.round((stats.instructors / stats.totalUsers) * 100) : 0}% az összesből
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-lg bg-red-50 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-red-600" />
                </div>
                <Badge variant="outline" className="text-xs text-red-600 border-red-600">
                  <Lock className="w-3 h-3 mr-1" />
                  Teljes
                </Badge>
              </div>
              <div className="mt-4">
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {stats.admins}
                </div>
                <div className="text-sm font-medium text-gray-600 mb-1">
                  Adminisztrátorok
                </div>
                <div className="text-xs text-gray-500">
                  {stats.totalUsers ? Math.round((stats.admins / stats.totalUsers) * 100) : 0}% az összesből
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
          <div className="grid gap-4 md:grid-cols-3">
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
            </select>

            <Button 
              variant="outline" 
              className="flex items-center gap-2 hover:bg-gray-50"
              onClick={() => {
                setSearchTerm('')
                setRoleFilter('all')
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
            <CardTitle>Felhasználók Szerepkörökkel</CardTitle>
            <div className="flex items-center gap-2">
              <Badge className="bg-purple-100 text-purple-700">
                <Key className="w-3 h-3 mr-1" />
                Jogosultság kezelés
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-semibold">Felhasználó</TableHead>
                <TableHead className="font-semibold">Email</TableHead>
                <TableHead className="font-semibold">Jelenlegi Szerepkör</TableHead>
                <TableHead className="font-semibold">Regisztráció</TableHead>
                <TableHead className="font-semibold">Állapot</TableHead>
                <TableHead className="text-right font-semibold">Műveletek</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
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
                        <span className="text-sm font-medium">
                          {user.firstName[0]}{user.lastName[0]}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium">{user.firstName} {user.lastName}</div>
                        <div className="text-sm text-muted-foreground">ID: {user.id.slice(0, 8)}...</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getRoleBadgeColor(user.role)}>
                      {user.role === 'ADMIN' && <Shield className="w-3 h-3 mr-1" />}
                      {user.role === 'INSTRUCTOR' && <GraduationCap className="w-3 h-3 mr-1" />}
                      {user.role === 'STUDENT' && <Users className="w-3 h-3 mr-1" />}
                      {getRoleLabel(user.role)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(user.createdAt).toLocaleDateString('hu-HU')}
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
                        <DropdownMenuItem 
                          className="flex items-center gap-2"
                          onClick={() => updateRoleMutation.mutate({ 
                            userId: user.id, 
                            role: 'STUDENT' 
                          })}
                        >
                          <Users className="h-4 w-4" />
                          Hallgatóvá Tétele
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="flex items-center gap-2"
                          onClick={() => updateRoleMutation.mutate({ 
                            userId: user.id, 
                            role: 'INSTRUCTOR' 
                          })}
                        >
                          <GraduationCap className="h-4 w-4" />
                          Oktatóvá Tétele
                        </DropdownMenuItem>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem 
                              className="flex items-center gap-2 text-destructive"
                              onSelect={(e) => e.preventDefault()}
                            >
                              <Shield className="h-4 w-4" />
                              Adminisztrátorrá Tétele
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Adminisztrátor Jogosultság</AlertDialogTitle>
                              <AlertDialogDescription>
                                Biztosan adminisztrátorrá szeretnéd tenni a következő felhasználót: {user.firstName} {user.lastName}?
                                Ez teljes rendszer hozzáférést ad neki.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Mégse</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => updateRoleMutation.mutate({ 
                                  userId: user.id, 
                                  role: 'ADMIN' 
                                })}
                                className="bg-red-600 text-white hover:bg-red-700"
                              >
                                Adminisztrátorrá Tétel
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
    </div>
  )
} 