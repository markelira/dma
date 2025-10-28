'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { 
  Bell, 
  Send, 
  Users, 
  UserCheck, 
  BookOpen,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  Mail,
  MessageSquare,
  Filter
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'

interface Notification {
  id: string
  title: string
  message: string
  type: 'system' | 'course' | 'enrollment' | 'announcement'
  priority: 'low' | 'medium' | 'high'
  recipientType: 'all' | 'students' | 'instructors' | 'specific'
  recipientCount: number
  sentAt: string
  sentBy: string
  status: 'sent' | 'scheduled' | 'draft'
}

// Mock data for demo
const mockNotifications: Notification[] = [
  {
    id: '1',
    title: 'Tavaszi szemeszter kezdete',
    message: 'Tisztelt Hallgatók! A tavaszi szemeszter 2024. február 12-én kezdődik.',
    type: 'announcement',
    priority: 'high',
    recipientType: 'students',
    recipientCount: 2843,
    sentAt: '2024-01-28 10:00',
    sentBy: 'Dr. Kovács János',
    status: 'sent'
  },
  {
    id: '2',
    title: 'Új kurzus: AI alapok',
    message: 'Megnyílt a jelentkezés az "AI alapok" kurzusra. Korlátozott helyek!',
    type: 'course',
    priority: 'medium',
    recipientType: 'all',
    recipientCount: 3567,
    sentAt: '2024-01-27 14:30',
    sentBy: 'Rendszer',
    status: 'sent'
  },
  {
    id: '3',
    title: 'Rendszerkarbantartás',
    message: 'A platform 2024. február 3-án 02:00-06:00 között nem lesz elérhető.',
    type: 'system',
    priority: 'high',
    recipientType: 'all',
    recipientCount: 3567,
    sentAt: '2024-02-01 09:00',
    sentBy: 'IT Admin',
    status: 'scheduled'
  }
]

export default function AdminNotificationsPage() {
  const { user } = useAuthStore()
  const [selectedType, setSelectedType] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [isComposing, setIsComposing] = useState(false)
  
  // New notification form state
  const [newNotification, setNewNotification] = useState({
    title: '',
    message: '',
    type: 'announcement',
    priority: 'medium',
    recipientType: 'all'
  })

  const notifications = mockNotifications

  const filteredNotifications = notifications.filter(notification => {
    const matchesType = selectedType === 'all' || notification.type === selectedType
    const matchesSearch = notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         notification.message.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesType && matchesSearch
  })

  const getTypeBadge = (type: string) => {
    const typeConfig = {
      system: { label: 'Rendszer', className: 'bg-gray-100 text-gray-800' },
      course: { label: 'Kurzus', className: 'bg-blue-100 text-blue-800' },
      enrollment: { label: 'Beiratkozás', className: 'bg-green-100 text-green-800' },
      announcement: { label: 'Közlemény', className: 'bg-purple-100 text-purple-800' }
    }
    const config = typeConfig[type as keyof typeof typeConfig]
    return <Badge className={config.className}>{config.label}</Badge>
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case 'medium':
        return <Clock className="h-4 w-4 text-yellow-500" />
      default:
        return <CheckCircle className="h-4 w-4 text-green-500" />
    }
  }

  if (user?.role !== 'ADMIN') {
    return <div>Nincs jogosultsága az oldal megtekintéséhez</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Értesítések Kezelése</h1>
          <p className="text-muted-foreground mt-1">Rendszerszintű értesítések és közlemények</p>
        </div>
        <Button 
          onClick={() => setIsComposing(!isComposing)}
          className="flex items-center gap-2"
        >
          <Send className="h-4 w-4" />
          Új Értesítés
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Összes Értesítés</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">156</div>
            <p className="text-xs text-muted-foreground">Ebben a hónapban</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Elküldött</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">142</div>
            <p className="text-xs text-muted-foreground">91% kézbesítési arány</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ütemezett</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">Várakozó értesítés</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Átlag Megnyitás</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">68.5%</div>
            <p className="text-xs text-muted-foreground">Megnyitási arány</p>
          </CardContent>
        </Card>
      </div>

      {/* Compose New Notification */}
      {isComposing && (
        <Card>
          <CardHeader>
            <CardTitle>Új Értesítés Létrehozása</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium">Cím</label>
                <Input
                  placeholder="Értesítés címe..."
                  value={newNotification.title}
                  onChange={(e) => setNewNotification({...newNotification, title: e.target.value})}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Típus</label>
                <select 
                  className="w-full px-3 py-2 border rounded-md"
                  value={newNotification.type}
                  onChange={(e) => setNewNotification({...newNotification, type: e.target.value})}
                >
                  <option value="announcement">Közlemény</option>
                  <option value="system">Rendszer</option>
                  <option value="course">Kurzus</option>
                  <option value="enrollment">Beiratkozás</option>
                </select>
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium">Üzenet</label>
              <Textarea
                placeholder="Értesítés szövege..."
                value={newNotification.message}
                onChange={(e) => setNewNotification({...newNotification, message: e.target.value})}
                rows={4}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="text-sm font-medium">Prioritás</label>
                <select 
                  className="w-full px-3 py-2 border rounded-md"
                  value={newNotification.priority}
                  onChange={(e) => setNewNotification({...newNotification, priority: e.target.value})}
                >
                  <option value="low">Alacsony</option>
                  <option value="medium">Közepes</option>
                  <option value="high">Magas</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Címzettek</label>
                <select 
                  className="w-full px-3 py-2 border rounded-md"
                  value={newNotification.recipientType}
                  onChange={(e) => setNewNotification({...newNotification, recipientType: e.target.value})}
                >
                  <option value="all">Mindenki</option>
                  <option value="students">Hallgatók</option>
                  <option value="instructors">Oktatók</option>
                  <option value="specific">Egyéni lista</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Küldés ideje</label>
                <select className="w-full px-3 py-2 border rounded-md">
                  <option>Azonnal</option>
                  <option>Ütemezés...</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsComposing(false)}>Mégse</Button>
              <Button className="flex items-center gap-2">
                <Send className="h-4 w-4" />
                Értesítés Küldése
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Keresés értesítésekben..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-2 border rounded-md"
            >
              <option value="all">Minden típus</option>
              <option value="system">Rendszer</option>
              <option value="course">Kurzus</option>
              <option value="enrollment">Beiratkozás</option>
              <option value="announcement">Közlemény</option>
            </select>
            <Button variant="outline" className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Szűrők
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notifications List */}
      <Card>
        <CardHeader>
          <CardTitle>Értesítési Előzmények</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredNotifications.map((notification) => (
              <div key={notification.id} className="border rounded-lg p-4 hover:bg-muted/50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getPriorityIcon(notification.priority)}
                      <h3 className="font-semibold">{notification.title}</h3>
                      {getTypeBadge(notification.type)}
                      {notification.status === 'scheduled' && (
                        <Badge variant="outline" className="text-orange-600">
                          <Calendar className="h-3 w-3 mr-1" />
                          Ütemezett
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{notification.message}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {notification.recipientCount.toLocaleString()} címzett
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {notification.sentAt}
                      </span>
                      <span className="flex items-center gap-1">
                        <UserCheck className="h-3 w-3" />
                        {notification.sentBy}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm">
                      <MessageSquare className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}