'use client'

import { useParams } from 'next/navigation'
import { useUniversities } from '@/hooks/useUniversityQueries'
import { useUniversityMembers, useAddUniversityMember, useUpdateMemberRole, useRemoveMember } from '@/hooks/useUniversityMembers'
import { useUpdateUniversity } from '@/hooks/useUniversityQueries'
import { UniversityLogoUploader } from '@/components/branding/UniversityLogoUploader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Users, BookOpen, Percent, Trash, Pencil } from 'lucide-react'
import { Spinner } from '@/components/ui/spinner'
import { useState } from 'react'
import { useEffect } from 'react'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useUniversityCourses, useAddCoursesToUniversity, useRemoveCourseFromUniversity } from '@/hooks/useUniversityCourses'
import { httpsCallable } from 'firebase/functions'
import { functions } from '@/lib/firebase'
import { toast } from 'sonner'

interface Stats { 
  courseCount: number; 
  memberCount: number; 
  revenue: number;
  activeStudents: number;
  totalEnrollments: number;
  averageRating: number;
  completionRate: number;
  activeCoursesCount: number;
  coursesCreatedThisMonth: number;
  newMembersThisMonth: number;
}

export default function UniversityDetailPage() {
  const params = useParams<{ universityId: string }>()
  const universityId = params.universityId
  const { data: universities } = useUniversities()
  const university = universities?.find(u => u.id === universityId)

  const qc = useQueryClient()
  const updateUni = useUpdateUniversity(universityId)
  // Removed useUploadUniversityLogo – handled inside UniversityLogoUploader

  const [brandingForm, setBrandingForm] = useState({
    description: university?.description || '',
    website: university?.website || '',
    phone: university?.phone || '',
    address: university?.address || '',
    primaryColor: university?.primaryColor || '#004aad',
    secondaryColor: university?.secondaryColor || '#ffa500',
    type: university?.type || 'PUBLIC',
  })

  // Sync brandingForm with university data whenever university changes
  useEffect(() => {
    if (university) {
      setBrandingForm({
        description: university.description || '',
        website: university.website || '',
        phone: university.phone || '',
        address: university.address || '',
        primaryColor: university.primaryColor || '#004aad',
        secondaryColor: university.secondaryColor || '#ffa500',
        type: university.type || 'PUBLIC',
      })
    }
  }, [university])

  const handleBrandingChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setBrandingForm(prev => ({ ...prev, [name]: value }))
  }

  const saveBranding = () => {
    updateUni.mutate({
      universityId,
      ...brandingForm
    }, {
      onSuccess: () => {
        toast.success('Branding beállítások sikeresen mentve')
      },
      onError: (error: any) => {
        console.error('Branding update error:', error)
        
        let errorMessage = 'Hiba a branding beállítások mentésekor'
        
        if (error?.details?.details) {
          // Validation errors from Cloud Function
          const validationErrors = error.details.details
          errorMessage = validationErrors.map((e: any) => `${e.field}: ${e.message}`).join(', ')
        } else if (error?.message) {
          errorMessage = error.message
        }
        
        toast.error(errorMessage)
      }
    })
  }

  const { data: stats, isLoading: statsLoading, error: statsError } = useQuery<Stats>({
    queryKey: ['universityStats', universityId],
    queryFn: async () => {
      try {
        const getStatsCallableFn = httpsCallable(functions, 'getUniversityStats')
        const result: any = await getStatsCallableFn({ universityId })
        
        if (!result.data.success) {
          throw new Error(result.data.error || 'Hiba a statisztikák betöltésekor')
        }
        
        // Transform to match the expected Stats interface
        const realStats = result.data.stats
        return {
          courseCount: realStats.courseCount || 0,
          memberCount: realStats.memberCount || 0,
          revenue: realStats.totalRevenue || 0,
          activeStudents: realStats.activeStudents || 0,
          totalEnrollments: realStats.totalEnrollments || 0,
          averageRating: realStats.averageRating || 0,
          completionRate: realStats.completionRate || 0,
          activeCoursesCount: realStats.activeCoursesCount || 0,
          coursesCreatedThisMonth: realStats.coursesCreatedThisMonth || 0,
          newMembersThisMonth: realStats.newMembersThisMonth || 0
        }
      } catch (error) {
        console.error('Failed to fetch university stats:', error)
        // Return default stats on error to prevent UI breaking
        return {
          courseCount: 0,
          memberCount: 0,
          revenue: 0,
          activeStudents: 0,
          totalEnrollments: 0,
          averageRating: 0,
          completionRate: 0,
          activeCoursesCount: 0,
          coursesCreatedThisMonth: 0,
          newMembersThisMonth: 0
        }
      }
    },
    enabled: !!universityId,
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    refetchInterval: 10 * 60 * 1000, // Refetch every 10 minutes
  })

  const { data: members, isLoading } = useUniversityMembers(universityId)

  const addMember = useAddUniversityMember(universityId)
  const updateRole = useUpdateMemberRole(universityId)
  const removeMember = useRemoveMember(universityId)

  // Courses management
  const { data: uniCourses = [] } = useUniversityCourses(universityId)
  const addCourses = useAddCoursesToUniversity(universityId)
  const removeCourse = useRemoveCourseFromUniversity(universityId)
  const { data: allCourses } = useQuery<any[]>({
    queryKey: ['allCourses'],
    queryFn: async () => {
      const getCoursesCallableFn = httpsCallable(functions, 'getCoursesCallable')
      const result: any = await getCoursesCallableFn({})
      
      if (!result.data.success) {
        throw new Error(result.data.error || 'Hiba a tartalmak betöltésekor')
      }
      
      return result.data.courses || []
    }
  })
  const availableCourses = Array.isArray(allCourses)
    ? allCourses.filter((c: any) => c.universityId !== universityId)
    : []

  // Add member modal state
  const [search, setSearch] = useState('')
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [selectedRole, setSelectedRole] = useState<'OWNER' | 'EDITOR' | 'VIEWER'>('VIEWER')
  const { data: allUsers, error: usersError, isLoading: usersLoading } = useQuery<any[]>({
    queryKey: ['allUsers'],
    queryFn: async () => {
      try {
        const getUsersFn = httpsCallable(functions, 'getUsers')
        const result: any = await getUsersFn({})
        
        console.log('🔍 getUsers response:', result.data)
        
        if (!result.data.success) {
          throw new Error(result.data.error || 'Hiba a felhasználók betöltésekor')
        }
        
        const users = result.data.users || []
        console.log('🔍 Fetched users:', users.length, users)
        
        return users
      } catch (error) {
        console.error('❌ Error fetching users:', error)
        throw error
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2
  })
  const filteredUsers = allUsers?.filter(u => {
    // First filter out users who are already members of this university
    const isAlreadyMember = members?.some(member => member.userId === u.id)
    if (isAlreadyMember) return false
    
    // Then filter by search term
    const searchTerm = search.toLowerCase()
    const fullName = `${u.firstName || ''} ${u.lastName || ''}`.toLowerCase()
    const email = (u.email || '').toLowerCase()
    
    return fullName.includes(searchTerm) || email.includes(searchTerm)
  }) || []

  if (!university) return <div className="text-destructive p-8">Egyetem nem található.</div>

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">{university.name}</h1>
        <Button variant="outline" size="sm"><Pencil className="h-4 w-4 mr-2" />Szerkesztés</Button>
      </div>
      <p className="text-muted-foreground">Slug: {university.slug} • Revenue Share: {university.revenueSharePct}%</p>

      {/* Stats */}
      {statsLoading ? (
        <div className="grid gap-6 md:grid-cols-3">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : statsError ? (
        <Card className="border-red-200">
          <CardContent className="p-6 text-center">
            <p className="text-red-600">Hiba a statisztikák betöltésekor</p>
            <p className="text-sm text-gray-500 mt-1">Alapértelmezett értékek megjelenítése</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tagok</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.memberCount ?? 0}</div>
              <p className="text-xs text-muted-foreground">
                +{stats?.newMembersThisMonth ?? 0} ebben a hónapban
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tartalmak</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.courseCount ?? 0}</div>
              <p className="text-xs text-muted-foreground">
                {stats?.activeCoursesCount ?? 0} aktív tartalom
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aktív Hallgatók</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.activeStudents ?? 0}</div>
              <p className="text-xs text-muted-foreground">
                {stats?.totalEnrollments ?? 0} összesen beiratkozva
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Bevétel</CardTitle>
              <Percent className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(stats?.revenue ?? 0).toLocaleString('hu-HU')} Ft</div>
              <p className="text-xs text-muted-foreground">
                {university?.revenueSharePct}% megosztás
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Additional Stats Row */}
      {!statsLoading && !statsError && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Átlagos Értékelés</CardTitle>
              <span className="text-2xl">⭐</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.averageRating?.toFixed(1) ?? '0.0'}</div>
              <p className="text-xs text-muted-foreground">5.0-ból</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Befejezési Arány</CardTitle>
              <span className="text-2xl">📊</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.completionRate?.toFixed(1) ?? '0.0'}%</div>
              <p className="text-xs text-muted-foreground">Lecke befejezés</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Branding Section */}
      <h2 className="text-2xl font-semibold mt-8">Branding</h2>
      <Card className="mt-2">
        <CardContent className="space-y-4 pt-6">
          {/* Logo upload */}
          <UniversityLogoUploader
            universityId={universityId}
            logoUrl={university?.logoUrl}
            onUploaded={() => {
              // Refetch universities list so cache stays in sync
              // Assuming qc is available from @tanstack/react-query
              // If not, you might need to import it or use a different approach
              // For now, commenting out as qc is not defined in the original file
              qc.invalidateQueries({ queryKey: ['universities'] })
            }}
            onRemoved={() => {
              // Refetch universities list so cache stays in sync
              // Assuming qc is available from @tanstack/react-query
              // If not, you might need to import it or use a different approach
              // For now, commenting out as qc is not defined in the original file
              qc.invalidateQueries({ queryKey: ['universities'] })
            }}
          />

          {/* Profile form */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Leírás</label>
              <textarea name="description" value={brandingForm.description} onChange={handleBrandingChange} className="w-full border rounded-md p-2 h-24 text-sm" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Weboldal</label>
              <Input 
                name="website" 
                value={brandingForm.website} 
                onChange={handleBrandingChange} 
                placeholder="https://example.com"
                type="url"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Telefon</label>
              <Input 
                name="phone" 
                value={brandingForm.phone} 
                onChange={handleBrandingChange} 
                placeholder="+36 1 234 5678"
                type="tel"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Cím</label>
              <Input name="address" value={brandingForm.address} onChange={handleBrandingChange} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Elsődleges Szín</label>
              <Input type="color" name="primaryColor" value={brandingForm.primaryColor} onChange={handleBrandingChange} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Másodlagos Szín</label>
              <Input type="color" name="secondaryColor" value={brandingForm.secondaryColor} onChange={handleBrandingChange} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Egyetem Típusa</label>
              <select name="type" value={brandingForm.type} onChange={handleBrandingChange} className="border rounded-md p-2 text-sm">
                <option value="PUBLIC">Állami</option>
                <option value="PRIVATE">Magán</option>
                <option value="TECHNICAL">Műszaki</option>
                <option value="COMMUNITY">Közösségi</option>
                <option value="ONLINE">Online</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setBrandingForm({
              description: university?.description || '', website: university?.website || '', phone: university?.phone || '', address: university?.address || '', primaryColor: university?.primaryColor || '#004aad', secondaryColor: university?.secondaryColor || '#ffa500', type: university?.type || 'PUBLIC'
            })}>Mégse</Button>
            <Button onClick={saveBranding} disabled={updateUni.status==='pending'}>Mentés</Button>
          </div>
        </CardContent>
      </Card>

      {/* Member management */}
      <div className="flex items-center justify-between mt-8">
        <h2 className="text-2xl font-semibold">Tagok Kezelése</h2>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button className="flex items-center gap-2"><Plus className="h-4 w-4" />Új Tag Hozzáadása</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Új Tag Hozzáadása</AlertDialogTitle>
            </AlertDialogHeader>
            <Input placeholder="Keresés felhasználók között..." value={search} onChange={e => setSearch(e.target.value)} />
            
            {/* Debug information */}
            {usersError && (
              <div className="bg-red-50 border border-red-200 rounded-md p-2 text-sm text-red-700">
                <strong>Hiba:</strong> {usersError.message}
              </div>
            )}
            
            {usersLoading && (
              <div className="flex items-center justify-center p-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                <span className="ml-2 text-sm text-gray-600">Felhasználók betöltése...</span>
              </div>
            )}
            
            <div className="max-h-48 overflow-y-auto space-y-2 mt-2">
              {!usersLoading && !usersError && (
                <>
                  {filteredUsers.length === 0 && allUsers?.length === 0 && (
                    <div className="text-center p-4 text-gray-500 text-sm">
                      Nincsenek elérhető felhasználók
                    </div>
                  )}
                  
                  {filteredUsers.length === 0 && allUsers?.length > 0 && (
                    <div className="text-center p-4 text-gray-500 text-sm">
                      Nincs találat a keresési feltételekre
                      <br />
                      <span className="text-xs">Összesen {allUsers.length} felhasználó elérhető</span>
                    </div>
                  )}
                  
                  {filteredUsers.map(u => (
                    <div key={u.id} className={`p-2 border rounded-md cursor-pointer ${selectedUser?.id === u.id ? 'bg-accent' : ''}`} onClick={() => setSelectedUser(u)}>
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="font-medium">{u.firstName} {u.lastName}</span>
                          <span className="text-gray-600 ml-2">({u.email})</span>
                        </div>
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded">{u.role}</span>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
            <select value={selectedRole} onChange={e => setSelectedRole(e.target.value as any)} className="mt-2 w-full border rounded-md p-2 text-sm">
              <option value="VIEWER">Megtekintő</option>
              <option value="EDITOR">Szerkesztő</option>
              <option value="OWNER">Tulajdonos</option>
            </select>
            <AlertDialogFooter>
              <AlertDialogCancel>Mégse</AlertDialogCancel>
              <AlertDialogAction disabled={!selectedUser} onClick={() => {
                if (!selectedUser) return
                addMember.mutate({ userId: selectedUser.id, role: selectedRole })
              }}>Hozzáadás</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Courses management */}
      <div className="flex items-center justify-between mt-8">
        <h2 className="text-2xl font-semibold">Tartalmak Kezelése</h2>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button>Tartalmak Hozzárendelése</Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="max-w-xl">
            <AlertDialogHeader>
              <AlertDialogTitle>Tartalmak kiválasztása</AlertDialogTitle>
            </AlertDialogHeader>
            <div className="max-h-64 overflow-y-auto space-y-2">
              {availableCourses?.map(c => (
                <div key={c.id} className="flex items-center justify-between border p-2 rounded-md">
                  <span>{c.title}</span>
                  <Button size="sm" onClick={() => addCourses.mutate([c.id])}>Hozzáadás</Button>
                </div>
              ))}
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Mégse</AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tartalmak ({uniCourses?.length ?? 0})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cím</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Státusz</TableHead>
                <TableHead className="text-right">Műveletek</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {uniCourses?.map(c => (
                <TableRow key={c.id}>
                  <TableCell>{c.title}</TableCell>
                  <TableCell>{c.slug}</TableCell>
                  <TableCell><Badge>{c.status}</Badge></TableCell>
                  <TableCell className="text-right"><Button size="icon" variant="ghost" onClick={() => removeCourse.mutate(c.id)}><Trash className="h-4 w-4" /></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tagok ({members?.length ?? 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? <Spinner size="lg" /> : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Felhasználó</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Szerepkör</TableHead>
                  <TableHead>Csatlakozott</TableHead>
                  <TableHead className="text-right">Műveletek</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members?.map(m => (
                  <TableRow key={m.userId}>
                    <TableCell>{m.user.firstName} {m.user.lastName}</TableCell>
                    <TableCell>{m.user.email}</TableCell>
                    <TableCell>
                      <select value={m.role} onChange={e => updateRole.mutate({ userId: m.userId, role: e.target.value as any })} className="border rounded-md p-1 text-sm">
                        <option value="VIEWER">Megtekintő</option>
                        <option value="EDITOR">Szerkesztő</option>
                        <option value="OWNER">Tulajdonos</option>
                      </select>
                    </TableCell>
                    <TableCell>{new Date(m.createdAt).toLocaleDateString('hu-HU')}</TableCell>
                    <TableCell className="text-right">
                      <Button size="icon" variant="ghost" onClick={() => removeMember.mutate(m.userId)}><Trash className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 