'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import {
  AlertTriangle,
  MessageSquare,
  Clock,
  CheckCircle,
  XCircle,
  User,
  Calendar,
  Filter,
  Search,
  ChevronRight,
  Reply,
  Archive,
  Trash2,
  Mail,
  Phone,
  AlertCircle,
  TrendingUp,
  Activity
} from 'lucide-react'
import { db } from '@/lib/firebase'
import { collection, query, orderBy, onSnapshot, doc, updateDoc, serverTimestamp, arrayUnion, where, addDoc } from 'firebase/firestore'
import { useAuth } from '@/hooks/useAuth'
import { format } from 'date-fns'
import { hu } from 'date-fns/locale'

interface SupportTicket {
  id: string
  userId: string
  userName: string
  userEmail: string
  subject: string
  message: string
  category: string
  priority: string
  status: 'open' | 'in-progress' | 'resolved' | 'closed'
  createdAt: any
  updatedAt?: any
  responses?: Array<{
    message: string
    adminId: string
    adminName: string
    createdAt: any
  }>
}

export default function AdminReportsPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null)
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterPriority, setFilterPriority] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [adminResponse, setAdminResponse] = useState('')
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    inProgress: 0,
    resolved: 0,
    urgent: 0
  })
  const { user } = useAuth()

  // Fetch tickets from Firestore
  useEffect(() => {
    const ticketsQuery = query(
      collection(db, 'supportTickets'),
      orderBy('createdAt', 'desc')
    )

    const unsubscribe = onSnapshot(ticketsQuery, (snapshot) => {
      const ticketsData: SupportTicket[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        responses: doc.data().responses || []
      })) as SupportTicket[]

      setTickets(ticketsData)
      
      // Calculate stats
      const newStats = {
        total: ticketsData.length,
        open: ticketsData.filter(t => t.status === 'open').length,
        inProgress: ticketsData.filter(t => t.status === 'in-progress').length,
        resolved: ticketsData.filter(t => t.status === 'resolved').length,
        urgent: ticketsData.filter(t => t.priority === 'urgent' || t.priority === 'high').length
      }
      setStats(newStats)
      
      setLoading(false)
    }, (error) => {
      console.error('Error fetching tickets:', error)
      toast.error('Hiba történt a jegyek betöltésekor')
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <Badge className="bg-brand-secondary/10 text-brand-secondary-hover">Nyitott</Badge>
      case 'in-progress':
        return <Badge className="bg-yellow-100 text-yellow-700">Folyamatban</Badge>
      case 'resolved':
        return <Badge className="bg-green-100 text-green-700">Megoldva</Badge>
      case 'closed':
        return <Badge className="bg-gray-100 text-gray-700">Lezárva</Badge>
      default:
        return null
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <Badge className="bg-red-100 text-red-700">Sürgős</Badge>
      case 'high':
        return <Badge className="bg-orange-100 text-orange-700">Magas</Badge>
      case 'normal':
        return <Badge className="bg-gray-100 text-gray-700">Normál</Badge>
      case 'low':
        return <Badge className="bg-brand-secondary/10 text-brand-secondary-hover">Alacsony</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-700">Normál</Badge>
    }
  }

  const getCategoryName = (category: string) => {
    switch (category) {
      case 'technical': return 'Technikai'
      case 'payment': return 'Számlázás'
      case 'certificate': return 'Tanúsítvány'
      case 'account': return 'Fiók'
      case 'course': return 'Tartalom'
      case 'general': return 'Általános'
      default: return 'Egyéb'
    }
  }

  const formatDate = (timestamp: any) => {
    if (!timestamp) return ''
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return format(date, 'yyyy. MM. dd. HH:mm', { locale: hu })
  }

  const handleStatusChange = async (ticketId: string, newStatus: string) => {
    try {
      const ticket = tickets.find(t => t.id === ticketId)
      
      await updateDoc(doc(db, 'supportTickets', ticketId), {
        status: newStatus,
        updatedAt: serverTimestamp()
      })
      
      // Create audit log entry
      await addDoc(collection(db, 'auditLogs'), {
        userId: user?.uid || '',
        userEmail: user?.email || '',
        userName: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.email || 'Admin',
        action: newStatus === 'closed' ? 'CLOSE_TICKET' : 'UPDATE_TICKET_STATUS',
        resource: 'SupportTicket',
        resourceId: ticketId,
        details: JSON.stringify({
          oldStatus: ticket?.status,
          newStatus,
          ticketSubject: ticket?.subject
        }),
        severity: newStatus === 'closed' ? 'MEDIUM' : 'LOW',
        ipAddress: 'N/A',
        userAgent: navigator.userAgent,
        createdAt: new Date()
      })
      
      toast.success('Státusz frissítve')
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('Hiba történt a státusz frissítésekor')
    }
  }

  const handleSendResponse = async () => {
    if (!selectedTicket || !adminResponse || !user) {
      toast.error('Írj be egy választ!')
      return
    }

    try {
      const newResponse = {
        message: adminResponse,
        adminId: user.uid,
        adminName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Admin Team',
        createdAt: new Date() // Use regular Date instead of serverTimestamp()
      }

      await updateDoc(doc(db, 'supportTickets', selectedTicket.id), {
        responses: arrayUnion(newResponse),
        status: 'in-progress',
        updatedAt: serverTimestamp(),
        hasUnreadResponse: true // Set flag for student notification
      })
      
      // Create audit log entry
      await addDoc(collection(db, 'auditLogs'), {
        userId: user.uid,
        userEmail: user.email || '',
        userName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'Admin',
        action: 'ADMIN_RESPOND_TICKET',
        resource: 'SupportTicket',
        resourceId: selectedTicket.id,
        details: JSON.stringify({
          ticketSubject: selectedTicket.subject,
          responsePreview: adminResponse.substring(0, 100),
          respondedTo: selectedTicket.userName
        }),
        severity: 'MEDIUM',
        ipAddress: 'N/A',
        userAgent: navigator.userAgent,
        createdAt: new Date()
      })

      setAdminResponse('')
      toast.success('Válasz elküldve')
    } catch (error) {
      console.error('Error sending response:', error)
      toast.error('Hiba történt a válasz küldésekor')
    }
  }

  // Filter tickets
  const filteredTickets = tickets.filter(ticket => {
    const matchesStatus = filterStatus === 'all' || ticket.status === filterStatus
    const matchesPriority = filterPriority === 'all' || ticket.priority === filterPriority
    const matchesSearch = !searchQuery || 
      ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.id.toLowerCase().includes(searchQuery.toLowerCase())
    
    return matchesStatus && matchesPriority && matchesSearch
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Jegyek betöltése...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Támogatási Jegyek
          </h1>
          <p className="text-gray-600">
            Felhasználói segítségkérések és jelentések kezelése
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Összes</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <Activity className="w-8 h-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Nyitott</p>
                  <p className="text-2xl font-bold text-brand-secondary">{stats.open}</p>
                </div>
                <AlertCircle className="w-8 h-8 text-brand-secondary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Folyamatban</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.inProgress}</p>
                </div>
                <Clock className="w-8 h-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Megoldva</p>
                  <p className="text-2xl font-bold text-green-600">{stats.resolved}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Sürgős</p>
                  <p className="text-2xl font-bold text-red-600">{stats.urgent}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-red-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    type="search"
                    placeholder="Keresés ID, név vagy tárgy alapján..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Státusz" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Mind</SelectItem>
                  <SelectItem value="open">Nyitott</SelectItem>
                  <SelectItem value="in-progress">Folyamatban</SelectItem>
                  <SelectItem value="resolved">Megoldva</SelectItem>
                  <SelectItem value="closed">Lezárva</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterPriority} onValueChange={setFilterPriority}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Prioritás" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Mind</SelectItem>
                  <SelectItem value="urgent">Sürgős</SelectItem>
                  <SelectItem value="high">Magas</SelectItem>
                  <SelectItem value="normal">Normál</SelectItem>
                  <SelectItem value="low">Alacsony</SelectItem>
                </SelectContent>
              </Select>

              <Button 
                variant="outline" 
                className="gap-2"
                onClick={() => {
                  setFilterStatus('all')
                  setFilterPriority('all')
                  setSearchQuery('')
                }}
              >
                <Filter className="w-4 h-4" />
                Szűrők törlése
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tickets List and Detail */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tickets List */}
          <div className="lg:col-span-1">
            <Card className="h-[600px] overflow-hidden">
              <CardHeader>
                <CardTitle>Jegyek ({filteredTickets.length})</CardTitle>
              </CardHeader>
              <CardContent className="p-0 overflow-y-auto h-[520px]">
                {filteredTickets.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600">Nincs támogatási jegy</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {filteredTickets.map((ticket) => (
                      <div
                        key={ticket.id}
                        onClick={() => setSelectedTicket(ticket)}
                        className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                          selectedTicket?.id === ticket.id ? 'bg-gray-50' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <span className="text-xs font-mono text-gray-500">#{ticket.id.slice(-6).toUpperCase()}</span>
                          {getPriorityBadge(ticket.priority)}
                        </div>
                        <h4 className="font-bold text-gray-900 text-sm mb-1 line-clamp-1">
                          {ticket.subject}
                        </h4>
                        <p className="text-xs text-gray-600 mb-2">
                          {ticket.userName} • {getCategoryName(ticket.category)}
                        </p>
                        <div className="flex items-center justify-between">
                          {getStatusBadge(ticket.status)}
                          <span className="text-xs text-gray-500">
                            {formatDate(ticket.createdAt)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Ticket Detail */}
          <div className="lg:col-span-2">
            {selectedTicket ? (
              <Card className="h-[600px] overflow-hidden">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{selectedTicket.subject}</CardTitle>
                      <CardDescription>
                        #{selectedTicket.id.slice(-6).toUpperCase()} • {formatDate(selectedTicket.createdAt)}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      {getStatusBadge(selectedTicket.status)}
                      {getPriorityBadge(selectedTicket.priority)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 overflow-y-auto h-[480px]">
                  {/* User Info */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-teal-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-900">
                          {selectedTicket.userName}
                        </h4>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {selectedTicket.userEmail}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(selectedTicket.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Original Message */}
                  <div>
                    <h4 className="font-bold text-gray-900 mb-2">
                      Eredeti üzenet
                    </h4>
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <p className="text-gray-700 whitespace-pre-wrap">
                        {selectedTicket.message}
                      </p>
                    </div>
                  </div>

                  {/* Responses */}
                  {selectedTicket.responses && selectedTicket.responses.length > 0 && (
                    <div>
                      <h4 className="font-bold text-gray-900 mb-2">
                        Válaszok ({selectedTicket.responses.length})
                      </h4>
                      <div className="space-y-3">
                        {selectedTicket.responses.map((response, index) => (
                          <div key={index} className="bg-teal-50 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-bold text-teal-700">
                                {response.adminName}
                              </span>
                              <span className="text-xs text-gray-500">
                                {formatDate(response.createdAt)}
                              </span>
                            </div>
                            <p className="text-gray-700">
                              {response.message}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Admin Actions */}
                  <div className="border-t pt-4">
                    <h4 className="font-bold text-gray-900 mb-3">
                      Admin műveletek
                    </h4>
                    
                    {/* Status Change */}
                    <div className="flex items-center gap-2 mb-4">
                      <Label>Státusz:</Label>
                      <Select 
                        value={selectedTicket.status} 
                        onValueChange={(value) => handleStatusChange(selectedTicket.id, value)}
                      >
                        <SelectTrigger className="w-[150px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="open">Nyitott</SelectItem>
                          <SelectItem value="in-progress">Folyamatban</SelectItem>
                          <SelectItem value="resolved">Megoldva</SelectItem>
                          <SelectItem value="closed">Lezárva</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Response Form */}
                    <div className="space-y-3">
                      <Textarea
                        placeholder="Írj választ a felhasználónak..."
                        value={adminResponse}
                        onChange={(e) => setAdminResponse(e.target.value)}
                        className="min-h-[100px]"
                      />
                      <div className="flex gap-2">
                        <Button onClick={handleSendResponse} className="gap-2">
                          <Reply className="w-4 h-4" />
                          Válasz küldése
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="h-[600px] flex items-center justify-center">
                <div className="text-center">
                  <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    Válassz egy jegyet
                  </h3>
                  <p className="text-gray-600">
                    Kattints egy jegyre a bal oldali listából a részletek megtekintéséhez
                  </p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}