'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import {
  MessageSquare,
  Clock,
  CheckCircle,
  Send,
  Plus,
  ArrowLeft,
  User,
  Calendar,
  AlertCircle,
  Loader2,
  ChevronRight
} from 'lucide-react'
import { db } from '@/lib/firebase'
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore'
import { useAuthStore } from '@/stores/authStore'
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
  hasUnreadResponse?: boolean
  responses?: Array<{
    message: string
    adminId: string
    adminName: string
    createdAt: any
  }>
}

type ViewState = 'list' | 'create' | 'detail'

export default function HelpCenterPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null)
  const [viewState, setViewState] = useState<ViewState>('list')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const { user } = useAuthStore()

  // Form state
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [category, setCategory] = useState('')
  const [priority, setPriority] = useState('normal')

  // Fetch user's tickets
  useEffect(() => {
    if (!user?.uid) return

    const ticketsQuery = query(
      collection(db, 'supportTickets'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    )

    const unsubscribe = onSnapshot(ticketsQuery, (snapshot) => {
      const ticketsData: SupportTicket[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        responses: doc.data().responses || []
      })) as SupportTicket[]

      setTickets(ticketsData)
      setLoading(false)

      // Update selected ticket if it's in the list
      if (selectedTicket) {
        const updated = ticketsData.find(t => t.id === selectedTicket.id)
        if (updated) {
          setSelectedTicket(updated)
        }
      }
    }, (error) => {
      console.error('Error fetching tickets:', error)
      toast.error('Hiba történt a jegyek betöltésekor')
      setLoading(false)
    })

    return () => unsubscribe()
  }, [user?.uid, selectedTicket?.id])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <Badge className="bg-blue-100 text-blue-700">Nyitott</Badge>
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

  const getCategoryName = (cat: string) => {
    switch (cat) {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      toast.error('Be kell jelentkezned a jegy küldéséhez')
      return
    }

    if (!subject.trim() || !message.trim() || !category) {
      toast.error('Kérlek töltsd ki az összes kötelező mezőt')
      return
    }

    setSubmitting(true)

    try {
      const ticketData = {
        userId: user.uid,
        userName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'Felhasználó',
        userEmail: user.email || '',
        subject: subject.trim(),
        message: message.trim(),
        category,
        priority,
        status: 'open',
        createdAt: serverTimestamp(),
        responses: []
      }

      await addDoc(collection(db, 'supportTickets'), ticketData)

      toast.success('Jegy sikeresen elküldve!')

      // Reset form and go back to list
      setSubject('')
      setMessage('')
      setCategory('')
      setPriority('normal')
      setViewState('list')
    } catch (error) {
      console.error('Error creating ticket:', error)
      toast.error('Hiba történt a jegy küldésekor')
    } finally {
      setSubmitting(false)
    }
  }

  const handleViewTicket = async (ticket: SupportTicket) => {
    setSelectedTicket(ticket)
    setViewState('detail')

    // Mark responses as read
    if (ticket.hasUnreadResponse) {
      try {
        await updateDoc(doc(db, 'supportTickets', ticket.id), {
          hasUnreadResponse: false
        })
      } catch (error) {
        console.error('Error marking ticket as read:', error)
      }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-brand-secondary" />
          <p className="text-gray-600">Jegyek betöltése...</p>
        </div>
      </div>
    )
  }

  // Create ticket view
  if (viewState === 'create') {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewState('list')}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Vissza
          </Button>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Új segítségkérés
              </CardTitle>
              <CardDescription>
                Írd le a problémádat vagy kérdésedet, és munkatársaink hamarosan válaszolnak.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="category">Kategória *</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Válassz kategóriát" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="technical">Technikai probléma</SelectItem>
                      <SelectItem value="payment">Számlázás, fizetés</SelectItem>
                      <SelectItem value="certificate">Tanúsítványok</SelectItem>
                      <SelectItem value="account">Fiók beállítások</SelectItem>
                      <SelectItem value="course">Tartalom, kurzusok</SelectItem>
                      <SelectItem value="general">Általános kérdés</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Sürgősség</Label>
                  <Select value={priority} onValueChange={setPriority}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Alacsony - ráér pár napon belül</SelectItem>
                      <SelectItem value="normal">Normál - 1-2 napon belül</SelectItem>
                      <SelectItem value="high">Magas - mihamarabb</SelectItem>
                      <SelectItem value="urgent">Sürgős - azonnal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">Tárgy *</Label>
                  <Input
                    id="subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Röviden írd le a problémát"
                    maxLength={100}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Üzenet *</Label>
                  <Textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Részletesen írd le a problémát vagy kérdést. Minél több információt adsz meg, annál gyorsabban tudunk segíteni."
                    rows={6}
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setViewState('list')}
                  >
                    Mégse
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="gap-2"
                  >
                    {submitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    Küldés
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Ticket detail view
  if (viewState === 'detail' && selectedTicket) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedTicket(null)
              setViewState('list')
            }}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Vissza
          </Button>
        </div>

        <div>
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-xl">{selectedTicket.subject}</CardTitle>
                  <CardDescription className="flex items-center gap-4 mt-2">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(selectedTicket.createdAt)}
                    </span>
                    <span>#{selectedTicket.id.slice(-6).toUpperCase()}</span>
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  {getStatusBadge(selectedTicket.status)}
                  <Badge variant="outline">{getCategoryName(selectedTicket.category)}</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Original message */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-brand-secondary/10 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-brand-secondary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{selectedTicket.userName}</p>
                    <p className="text-xs text-gray-500">{formatDate(selectedTicket.createdAt)}</p>
                  </div>
                </div>
                <p className="text-gray-700 whitespace-pre-wrap">{selectedTicket.message}</p>
              </div>

              {/* Responses */}
              {selectedTicket.responses && selectedTicket.responses.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Válaszok ({selectedTicket.responses.length})
                  </h3>
                  {selectedTicket.responses.map((response, index) => (
                    <div key={index} className="bg-green-50 border border-green-100 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium text-sm text-green-700">{response.adminName}</p>
                          <p className="text-xs text-gray-500">{formatDate(response.createdAt)}</p>
                        </div>
                      </div>
                      <p className="text-gray-700 whitespace-pre-wrap">{response.message}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Status info */}
              {selectedTicket.status === 'open' && (
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex items-start gap-3">
                  <Clock className="w-5 h-5 text-blue-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-700">Várakozás válaszra</p>
                    <p className="text-sm text-blue-600">A jegyedet fogadtuk, munkatársaink hamarosan válaszolnak.</p>
                  </div>
                </div>
              )}

              {selectedTicket.status === 'resolved' && (
                <div className="bg-green-50 border border-green-100 rounded-lg p-4 flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-green-700">Megoldva</p>
                    <p className="text-sm text-green-600">Ez a jegy megoldottnak lett jelölve. Ha további kérdésed van, nyiss új jegyet.</p>
                  </div>
                </div>
              )}

              {selectedTicket.status === 'closed' && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-gray-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-700">Lezárva</p>
                    <p className="text-sm text-gray-600">Ez a jegy le lett zárva. Ha további segítségre van szükséged, nyiss új jegyet.</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Default list view
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <MessageSquare className="w-6 h-6 text-brand-secondary" />
            <h1 className="text-3xl font-bold text-gray-900">
              Segítségkérés
            </h1>
          </div>
          <p className="text-gray-500">
            Küldj üzenetet a támogatási csapatunknak
          </p>
        </div>
        <Button onClick={() => setViewState('create')} className="gap-2">
          <Plus className="w-4 h-4" />
          Új jegy
        </Button>
      </div>

      {/* Tickets list */}
      <div>
        {tickets.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Még nincs jegyed
                </h3>
                <p className="text-gray-500 mb-6">
                  Ha segítségre van szükséged, küldj egy jegyet a támogatási csapatunknak.
                </p>
                <Button onClick={() => setViewState('create')} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Új jegy létrehozása
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Jegyeid ({tickets.length})</CardTitle>
              <CardDescription>
                Korábbi segítségkéréseid és azok státusza
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-gray-200">
                {tickets.map((ticket) => (
                  <button
                    key={ticket.id}
                    onClick={() => handleViewTicket(ticket)}
                    className="w-full p-4 hover:bg-gray-50 transition-colors text-left flex items-center gap-4"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900 truncate">
                          {ticket.subject}
                        </span>
                        {ticket.hasUnreadResponse && (
                          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-500">
                        <span>#{ticket.id.slice(-6).toUpperCase()}</span>
                        <span>{getCategoryName(ticket.category)}</span>
                        <span>{formatDate(ticket.createdAt)}</span>
                        {ticket.responses && ticket.responses.length > 0 && (
                          <span className="text-green-600">
                            {ticket.responses.length} válasz
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {getStatusBadge(ticket.status)}
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Help info */}
        <div className="mt-6 bg-brand-secondary/5 border border-brand-secondary/20 rounded-xl p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            Sürgős probléma?
          </h3>
          <p className="text-gray-600 mb-4">
            Ha azonnali segítségre van szükséged, írj nekünk e-mailben vagy hívj minket.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              className="border-brand-secondary/30 text-brand-secondary hover:bg-brand-secondary/10"
              onClick={() => window.location.href = 'mailto:info@dma.hu'}
            >
              info@dma.hu
            </Button>
            <Button
              variant="outline"
              onClick={() => window.location.href = '/dashboard/help'}
            >
              GYIK megtekintése
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
