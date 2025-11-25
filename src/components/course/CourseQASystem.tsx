"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  MessageSquare, 
  Plus, 
  ChevronUp, 
  Clock, 
  CheckCircle,
  AlertCircle,
  User,
  GraduationCap,
  Shield,
  Send,
  Filter,
  Search,
  Tag,
  MessageCircle
} from 'lucide-react'
import { CourseQuestion, CourseQuestionReply } from '@/types'
import { getFunctions, httpsCallable } from 'firebase/functions'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'sonner'

interface CourseQASystemProps {
  courseId: string
  lessonId?: string
  courseTitle: string
  isInstructor?: boolean
}

export const CourseQASystem: React.FC<CourseQASystemProps> = ({
  courseId,
  lessonId,
  courseTitle,
  isInstructor = false
}) => {
  const { user } = useAuth()
  const functions = getFunctions()

  const [questions, setQuestions] = useState<CourseQuestion[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'open' | 'answered' | 'resolved'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [showNewQuestionModal, setShowNewQuestionModal] = useState(false)
  
  // New question form state
  const [newQuestion, setNewQuestion] = useState({
    title: '',
    content: '',
    isPublic: true,
    priority: 'NORMAL' as const,
    tags: [] as string[]
  })

  // Reply form state
  const [replyContent, setReplyContent] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState<Record<string, boolean>>({})

  // Load questions
  const loadQuestions = async () => {
    if (!user) return

    try {
      setLoading(true)
      const getCourseQuestions = httpsCallable(functions, 'getCourseQuestions')
      const result = await getCourseQuestions({
        courseId,
        lessonId,
        status: filter === 'all' ? undefined : filter.toUpperCase(),
        includePrivate: isInstructor,
        limit: 50,
        offset: 0
      })

      const data = result.data as any
      if (data.success) {
        setQuestions(data.questions || [])
      } else {
        toast.error('Hiba a kérdések betöltésekor')
      }
    } catch (error) {
      console.error('Error loading questions:', error)
      toast.error('Hiba a kérdések betöltésekor')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadQuestions()
  }, [courseId, lessonId, filter, user])

  // Create new question
  const handleCreateQuestion = async () => {
    if (!user || !newQuestion.title.trim() || !newQuestion.content.trim()) {
      toast.error('Cím és tartalom megadása kötelező')
      return
    }

    if (submitting.newQuestion) return

    try {
      setSubmitting(prev => ({ ...prev, newQuestion: true }))
      
      const createCourseQuestion = httpsCallable(functions, 'createCourseQuestion')
      const result = await createCourseQuestion({
        courseId,
        lessonId,
        title: newQuestion.title.trim(),
        content: newQuestion.content.trim(),
        isPublic: newQuestion.isPublic,
        priority: newQuestion.priority,
        tags: newQuestion.tags
      })

      const data = result.data as any
      if (data.success) {
        toast.success('Kérdés sikeresen elküldve')
        setNewQuestion({
          title: '',
          content: '',
          isPublic: true,
          priority: 'NORMAL',
          tags: []
        })
        setShowNewQuestionModal(false)
        loadQuestions() // Reload questions
      } else {
        toast.error(data.message || 'Hiba a kérdés küldésekor')
      }
    } catch (error: any) {
      console.error('Error creating question:', error)
      toast.error(error.message || 'Hiba a kérdés küldésekor')
    } finally {
      setSubmitting(prev => ({ ...prev, newQuestion: false }))
    }
  }

  // Reply to question
  const handleReply = async (questionId: string, isAnswer: boolean = false) => {
    const content = replyContent[questionId]?.trim()
    if (!user || !content) {
      toast.error('Válasz tartalom megadása kötelező')
      return
    }

    if (submitting[questionId]) return

    try {
      setSubmitting(prev => ({ ...prev, [questionId]: true }))
      
      const replyCourseQuestion = httpsCallable(functions, 'replyCourseQuestion')
      const result = await replyCourseQuestion({
        questionId,
        content,
        isAnswer
      })

      const data = result.data as any
      if (data.success) {
        toast.success('Válasz sikeresen elküldve')
        setReplyContent(prev => ({ ...prev, [questionId]: '' }))
        loadQuestions() // Reload questions
      } else {
        toast.error(data.message || 'Hiba a válasz küldésekor')
      }
    } catch (error: any) {
      console.error('Error replying to question:', error)
      toast.error(error.message || 'Hiba a válasz küldésekor')
    } finally {
      setSubmitting(prev => ({ ...prev, [questionId]: false }))
    }
  }

  // Upvote question
  const handleUpvote = async (questionId: string, replyId?: string) => {
    if (!user) return

    try {
      const upvoteQuestion = httpsCallable(functions, 'upvoteQuestion')
      const result = await upvoteQuestion({
        questionId,
        replyId
      })

      const data = result.data as any
      if (data.success) {
        loadQuestions() // Reload to update upvote counts
      }
    } catch (error: any) {
      console.error('Error upvoting:', error)
      toast.error('Hiba a szavazás során')
    }
  }

  // Get role icon
  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'INSTRUCTOR':
        return <GraduationCap className="w-4 h-4 text-brand-secondary" />
      case 'ADMIN':
        return <Shield className="w-4 h-4 text-purple-600" />
      default:
        return <User className="w-4 h-4 text-gray-600" />
    }
  }

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN':
        return 'bg-brand-secondary/10 text-brand-secondary-hover'
      case 'ANSWERED':
        return 'bg-green-100 text-green-800'
      case 'RESOLVED':
        return 'bg-gray-100 text-gray-800'
      case 'CLOSED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-600'
    }
  }

  // Filter questions
  const filteredQuestions = questions.filter(question => {
    if (searchTerm && !question.title.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !question.content.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false
    }
    return true
  })

  if (!user) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Bejelentkezés szükséges a kérdések megtekintéséhez</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Kérdések és válaszok</h2>
          <p className="text-gray-600 mt-1">
            {lessonId ? 'Lecke-specifikus kérdések' : `${courseTitle} - Általános kérdések`}
          </p>
        </div>
        
        <Dialog open={showNewQuestionModal} onOpenChange={setShowNewQuestionModal}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Új kérdés
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Új kérdés feltevése</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="question-title">Kérdés címe *</Label>
                <Input
                  id="question-title"
                  value={newQuestion.title}
                  onChange={(e) => setNewQuestion(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Rövid, lényegre törő cím..."
                  maxLength={200}
                />
              </div>
              
              <div>
                <Label htmlFor="question-content">Részletes kérdés *</Label>
                <Textarea
                  id="question-content"
                  value={newQuestion.content}
                  onChange={(e) => setNewQuestion(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Írja le részletesen a kérdését..."
                  rows={6}
                  maxLength={5000}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {newQuestion.content.length}/5000 karakter
                </p>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="public-question"
                  checked={newQuestion.isPublic}
                  onCheckedChange={(checked) => setNewQuestion(prev => ({ ...prev, isPublic: checked }))}
                />
                <Label htmlFor="public-question">Nyilvános kérdés (mások is láthatják)</Label>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => setShowNewQuestionModal(false)}
                >
                  Mégse
                </Button>
                <Button 
                  onClick={handleCreateQuestion}
                  disabled={submitting.newQuestion}
                >
                  {submitting.newQuestion ? 'Küldés...' : 'Kérdés elküldése'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Kérdések keresése..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              {(['all', 'open', 'answered', 'resolved'] as const).map((status) => (
                <Button
                  key={status}
                  variant={filter === status ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter(status)}
                >
                  {status === 'all' && 'Összes'}
                  {status === 'open' && 'Nyitott'}
                  {status === 'answered' && 'Megválaszolt'}
                  {status === 'resolved' && 'Lezárt'}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Questions List */}
      {loading ? (
        <Card>
          <CardContent className="p-6 text-center">
            <div className="animate-spin w-8 h-8 border-2 border-brand-secondary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Kérdések betöltése...</p>
          </CardContent>
        </Card>
      ) : filteredQuestions.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">
              {searchTerm ? 'Nincs találat a keresési feltételekre.' : 'Még nincsenek kérdések.'}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Legyen Ön az első, aki kérdést tesz fel!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredQuestions.map((question) => (
            <Card key={question.id} className="overflow-hidden">
              <CardContent className="p-6">
                {/* Question Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={getStatusColor(question.status)}>
                        {question.status === 'OPEN' && 'Nyitott'}
                        {question.status === 'ANSWERED' && 'Megválaszolt'}
                        {question.status === 'RESOLVED' && 'Lezárt'}
                        {question.status === 'CLOSED' && 'Bezárt'}
                      </Badge>
                      {question.priority !== 'NORMAL' && (
                        <Badge variant="outline" className={
                          question.priority === 'HIGH' ? 'border-orange-300 text-orange-700' :
                          question.priority === 'URGENT' ? 'border-red-300 text-red-700' :
                          'border-gray-300 text-gray-600'
                        }>
                          {question.priority === 'HIGH' && 'Fontos'}
                          {question.priority === 'URGENT' && 'Sürgős'}
                          {question.priority === 'LOW' && 'Alacsony'}
                        </Badge>
                      )}
                      {!question.isPublic && (
                        <Badge variant="outline" className="border-gray-300 text-gray-600">
                          Privát
                        </Badge>
                      )}
                    </div>
                    <h3 className="text-lg font-bold mb-2">{question.title}</h3>
                    <p className="text-gray-700 mb-3 whitespace-pre-wrap">{question.content}</p>
                  </div>
                  
                  <div className="ml-4 flex flex-col items-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleUpvote(question.id)}
                      className="flex flex-col items-center"
                    >
                      <ChevronUp className="w-4 h-4" />
                      <span className="text-xs">{question.upvotes || 0}</span>
                    </Button>
                  </div>
                </div>

                {/* Question Meta */}
                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Avatar className="w-6 h-6">
                        <AvatarFallback className="text-xs">
                          {question.userName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span>{question.userName}</span>
                      {getRoleIcon(question.userRole)}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(question.createdAt).toLocaleDateString('hu-HU')}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-3 h-3" />
                    <span>{question.replies.length} válasz</span>
                  </div>
                </div>

                {/* Replies */}
                {question.replies.length > 0 && (
                  <div className="border-t pt-4 space-y-3">
                    {question.replies.map((reply) => (
                      <div key={reply.id} className={`p-3 rounded-lg ${
                        reply.isAnswer ? 'bg-green-50 border border-green-200' : 'bg-gray-50'
                      }`}>
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Avatar className="w-5 h-5">
                              <AvatarFallback className="text-xs">
                                {reply.userName.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium">{reply.userName}</span>
                            {getRoleIcon(reply.userRole)}
                            {reply.isAnswer && (
                              <Badge className="bg-green-100 text-green-800 text-xs">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Hivatalos válasz
                              </Badge>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleUpvote(question.id, reply.id)}
                              className="flex items-center gap-1 text-xs"
                            >
                              <ChevronUp className="w-3 h-3" />
                              {reply.upvotes || 0}
                            </Button>
                            <span className="text-xs text-gray-500">
                              {new Date(reply.createdAt).toLocaleDateString('hu-HU')}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{reply.content}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Reply Form */}
                {question.status !== 'CLOSED' && (
                  <div className="border-t pt-4 mt-4">
                    <div className="space-y-3">
                      <Textarea
                        placeholder="Írja meg a válaszát..."
                        value={replyContent[question.id] || ''}
                        onChange={(e) => setReplyContent(prev => ({
                          ...prev,
                          [question.id]: e.target.value
                        }))}
                        rows={3}
                        maxLength={3000}
                      />
                      <div className="flex justify-between items-center">
                        <p className="text-xs text-gray-500">
                          {(replyContent[question.id] || '').length}/3000 karakter
                        </p>
                        <div className="flex gap-2">
                          {isInstructor && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleReply(question.id, true)}
                              disabled={submitting[question.id] || !(replyContent[question.id]?.trim())}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Hivatalos válasz
                            </Button>
                          )}
                          <Button
                            size="sm"
                            onClick={() => handleReply(question.id, false)}
                            disabled={submitting[question.id] || !(replyContent[question.id]?.trim())}
                          >
                            <Send className="w-4 h-4 mr-1" />
                            {submitting[question.id] ? 'Küldés...' : 'Válasz'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}