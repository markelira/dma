'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Plus,
  Search,
  Mail,
  Phone,
  MoreVertical,
  UserCheck,
  BookOpen,
  Star,
  Users,
  Calendar,
  Award
} from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, orderBy, updateDoc, doc, addDoc } from 'firebase/firestore';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface Instructor {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  title?: string;
  department?: string;
  profilePictureUrl?: string;
  bio?: string;
  courseCount?: number;
  studentCount?: number;
  averageRating?: number;
  status: 'active' | 'inactive' | 'pending';
  universityId: string;
  joinedAt?: Date;
}

export default function UniversityAdminInstructorsPage() {
  const { user } = useAuth();
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [filteredInstructors, setFilteredInstructors] = useState<Instructor[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteMessage, setInviteMessage] = useState('');

  useEffect(() => {
    if (!user?.universityId) return;

    // Load instructors for this university
    const instructorsQuery = query(
      collection(db, 'users'),
      where('universityId', '==', user.universityId),
      where('role', '==', 'INSTRUCTOR'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(instructorsQuery, 
      async (snapshot) => {
        const instructorsData: Instructor[] = [];

        for (const docSnapshot of snapshot.docs) {
          const data = docSnapshot.data();
          
          // Get course count for each instructor
          const coursesQuery = query(
            collection(db, 'courses'),
            where('instructorId', '==', docSnapshot.id),
            where('universityId', '==', user.universityId)
          );
          
          instructorsData.push({
            id: docSnapshot.id,
            firstName: data.firstName || '',
            lastName: data.lastName || '',
            email: data.email || '',
            phone: data.phone,
            title: data.title,
            department: data.department,
            profilePictureUrl: data.profilePictureUrl,
            bio: data.bio,
            courseCount: 0, // Will be updated with actual count
            studentCount: 0,
            averageRating: data.averageRating || 0,
            status: data.status || 'active',
            universityId: data.universityId,
            joinedAt: data.createdAt?.toDate() || new Date()
          });
        }

        setInstructors(instructorsData);
        setFilteredInstructors(instructorsData);
        setLoading(false);
      }, 
      (error) => {
        console.error('Error loading instructors:', error);
        // Ha nincs még index, akkor üres listával dolgozunk
        if (error.code === 'failed-precondition') {
          console.log('Firestore index required for this query');
        }
        setInstructors([]);
        setFilteredInstructors([]);
        setLoading(false);
      });

    return () => unsubscribe();
  }, [user?.universityId]);

  // Filter instructors
  useEffect(() => {
    let filtered = instructors;

    if (searchQuery) {
      filtered = filtered.filter(instructor =>
        `${instructor.firstName} ${instructor.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        instructor.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        instructor.department?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredInstructors(filtered);
  }, [searchQuery, instructors]);

  const handleInviteInstructor = async () => {
    if (!inviteEmail) {
      toast.error('Kérem adja meg az email címet');
      return;
    }

    try {
      // Create invitation record
      await addDoc(collection(db, 'invitations'), {
        type: 'instructor',
        email: inviteEmail,
        message: inviteMessage,
        universityId: user?.universityId,
        invitedBy: user?.uid,
        status: 'pending',
        createdAt: new Date()
      });

      // Create audit log
      await addDoc(collection(db, 'auditLogs'), {
        userId: user?.uid || '',
        userEmail: user?.email || '',
        userName: user?.displayName || user?.email || 'University Admin',
        action: 'INVITE_INSTRUCTOR',
        resource: 'Invitation',
        resourceId: inviteEmail,
        details: JSON.stringify({
          invitedEmail: inviteEmail,
          universityId: user?.universityId
        }),
        universityId: user?.universityId,
        severity: 'MEDIUM',
        ipAddress: 'N/A',
        userAgent: navigator.userAgent,
        createdAt: new Date()
      });

      toast.success('Meghívó sikeresen elküldve');
      setShowInviteDialog(false);
      setInviteEmail('');
      setInviteMessage('');
    } catch (error) {
      console.error('Error inviting instructor:', error);
      toast.error('Hiba történt a meghívó küldésekor');
    }
  };

  const handleActivateInstructor = async (instructorId: string) => {
    try {
      await updateDoc(doc(db, 'users', instructorId), {
        status: 'active',
        activatedAt: new Date()
      });

      toast.success('Oktató aktiválva');
    } catch (error) {
      console.error('Error activating instructor:', error);
      toast.error('Hiba történt az oktató aktiválásakor');
    }
  };

  const handleDeactivateInstructor = async (instructorId: string) => {
    try {
      await updateDoc(doc(db, 'users', instructorId), {
        status: 'inactive',
        deactivatedAt: new Date()
      });

      toast.success('Oktató deaktiválva');
    } catch (error) {
      console.error('Error deactivating instructor:', error);
      toast.error('Hiba történt az oktató deaktiválásakor');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Aktív</Badge>;
      case 'inactive':
        return <Badge className="bg-gray-100 text-gray-800">Inaktív</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Függőben</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Oktatók kezelése</h1>
          <p className="text-muted-foreground">
            Az egyetem oktatóinak kezelése és meghívása
          </p>
        </div>
        <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Oktató meghívása
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Új oktató meghívása</DialogTitle>
              <DialogDescription>
                Küldjön meghívót egy új oktatónak az egyetemhez való csatlakozásra
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="email">Email cím</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="oktato@email.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="message">Üzenet (opcionális)</Label>
                <Textarea
                  id="message"
                  placeholder="Személyes üzenet a meghívóhoz..."
                  value={inviteMessage}
                  onChange={(e) => setInviteMessage(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowInviteDialog(false)}>
                Mégse
              </Button>
              <Button onClick={handleInviteInstructor}>
                Meghívó küldése
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Összes oktató</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{instructors.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Aktív</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {instructors.filter(i => i.status === 'active').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Összes tartalom</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {instructors.reduce((sum, i) => sum + (i.courseCount || 0), 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Átlag értékelés</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-1">
              <span className="text-2xl font-bold">
                {(instructors.reduce((sum, i) => sum + (i.averageRating || 0), 0) / instructors.length || 0).toFixed(1)}
              </span>
              <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Keresés név, email vagy tanszék alapján..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Instructors Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Oktató</TableHead>
                <TableHead>Tanszék</TableHead>
                <TableHead>Tartalmak</TableHead>
                <TableHead>Hallgatók</TableHead>
                <TableHead>Értékelés</TableHead>
                <TableHead>Csatlakozott</TableHead>
                <TableHead>Státusz</TableHead>
                <TableHead className="text-right">Műveletek</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInstructors.map((instructor) => (
                <TableRow key={instructor.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={instructor.profilePictureUrl} />
                        <AvatarFallback>
                          {getInitials(instructor.firstName, instructor.lastName)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">
                          {instructor.firstName} {instructor.lastName}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {instructor.email}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{instructor.department || 'N/A'}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <BookOpen className="h-4 w-4 text-muted-foreground" />
                      {instructor.courseCount || 0}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      {instructor.studentCount || 0}
                    </div>
                  </TableCell>
                  <TableCell>
                    {instructor.averageRating ? (
                      <div className="flex items-center gap-1">
                        <span>{instructor.averageRating.toFixed(1)}</span>
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                      </div>
                    ) : (
                      'N/A'
                    )}
                  </TableCell>
                  <TableCell>
                    {instructor.joinedAt ? 
                      new Date(instructor.joinedAt).toLocaleDateString('hu-HU') :
                      'N/A'
                    }
                  </TableCell>
                  <TableCell>{getStatusBadge(instructor.status)}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Műveletek</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                          <UserCheck className="mr-2 h-4 w-4" />
                          Profil megtekintése
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <BookOpen className="mr-2 h-4 w-4" />
                          Tartalmak megtekintése
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Mail className="mr-2 h-4 w-4" />
                          Email küldése
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {instructor.status === 'inactive' ? (
                          <DropdownMenuItem onClick={() => handleActivateInstructor(instructor.id)}>
                            <UserCheck className="mr-2 h-4 w-4" />
                            Aktiválás
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => handleDeactivateInstructor(instructor.id)}>
                            <UserCheck className="mr-2 h-4 w-4" />
                            Deaktiválás
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}