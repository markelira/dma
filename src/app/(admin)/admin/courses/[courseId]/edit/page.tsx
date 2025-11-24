'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { ArrowLeft, Save, Plus, Trash2, GripVertical, Video, FileText, Link } from 'lucide-react'
import { db } from '@/lib/firebase'
import { doc, getDoc, setDoc, updateDoc, collection, addDoc, deleteDoc, getDocs } from 'firebase/firestore'
import { VideoUpload } from '@/components/admin/video-upload'

interface Lesson {
  id?: string
  title: string
  description: string
  type: 'VIDEO' | 'TEXT' | 'QUIZ'
  videoUrl?: string
  content?: string
  duration: number
  order: number
  isPublished: boolean
  isFree: boolean
  resources: Array<{
    title: string
    url: string
    type: 'PDF' | 'LINK' | 'FILE'
  }>
}

interface CourseData {
  title: string
  description: string
  price: number
  originalPrice?: number
  duration: string
  level: string
  category: string
  thumbnailUrl: string
  status: 'DRAFT' | 'PUBLISHED'
  language?: string
  lessons: Lesson[]
  instructorName?: string
  instructorTitle?: string
  instructorBio?: string
}

export default function EditCoursePage() {
  const params = useParams()
  const router = useRouter()
  const courseId = params?.courseId as string
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [courseData, setCourseData] = useState<CourseData>({
    title: '',
    description: '',
    price: 0,
    duration: '',
    level: 'BEGINNER',
    category: '',
    thumbnailUrl: '',
    status: 'DRAFT',
    language: 'HU',
    lessons: [],
    instructorName: '',
    instructorTitle: '',
    instructorBio: ''
  })
  
  const [activeTab, setActiveTab] = useState('details')

  useEffect(() => {
    if (courseId && courseId !== 'new') {
      loadCourse()
    } else {
      setLoading(false)
    }
  }, [courseId])

  const loadCourse = async () => {
    try {
      const courseDoc = await getDoc(doc(db, 'courses', courseId))
      if (courseDoc.exists()) {
        const data = courseDoc.data() as CourseData
        // Ensure language exists
        if (!data.language) {
          data.language = 'HU'
        }
        
        // Load lessons from direct subcollection
        const lessons: Lesson[] = []
        try {
          // Load lessons from courses/{courseId}/lessons
          const lessonsSnapshot = await getDocs(collection(db, 'courses', courseId, 'lessons'))
          if (!lessonsSnapshot.empty) {
            lessonsSnapshot.docs.forEach(doc => {
              const lessonData = doc.data()
              lessons.push({
                ...lessonData,
                id: doc.id
              } as Lesson)
            })
            // Sort lessons by order
            lessons.sort((a, b) => (a.order || 0) - (b.order || 0))
          }
        } catch (error) {
          console.log('Error loading lessons from subcollection:', error)
        }
        
        // If no lessons in subcollection, check embedded lessons (backward compatibility)
        if (lessons.length === 0 && data.lessons) {
          lessons.push(...data.lessons)
        }
        
        // Set course data with lessons
        setCourseData({
          ...data,
          lessons
        })
      } else {
        toast.error('Tartalom nem található')
        router.push('/admin/courses')
      }
    } catch (error) {
      console.error('Error loading course:', error)
      toast.error('Hiba a tartalom betöltésekor')
    } finally {
      setLoading(false)
    }
  }

  const saveCourse = async () => {
    setSaving(true)
    try {
      const courseRef = courseId === 'new' 
        ? doc(collection(db, 'courses'))
        : doc(db, 'courses', courseId)
      
      // Extract lessons from courseData to save separately
      const { lessons, ...courseDataWithoutLessons } = courseData
      
      const dataToSave = {
        ...courseDataWithoutLessons,
        updatedAt: new Date().toISOString(),
        ...(courseId === 'new' && { createdAt: new Date().toISOString() })
      }
      
      if (courseId === 'new') {
        await setDoc(courseRef, dataToSave)
        toast.success('Tartalom sikeresen létrehozva!')
        router.push(`/admin/courses/${courseRef.id}/edit`)
      } else {
        await updateDoc(courseRef, dataToSave)
        
        // Save lessons directly to course lessons subcollection
        if (lessons && lessons.length > 0) {
          // Update lesson count in course document
          await updateDoc(courseRef, {
            lessonCount: lessons.length
          })
          
          // Save each lesson to the course's lessons subcollection
          for (let i = 0; i < lessons.length; i++) {
            const lesson = lessons[i]
            const lessonId = `lesson-${i + 1}`
            const lessonRef = doc(collection(db, 'courses', courseId, 'lessons'), lessonId)
            await setDoc(lessonRef, {
              ...lesson,
              id: lessonId,
              courseId: courseId,
              order: i + 1,
              published: lesson.published !== false,
              createdAt: lesson.createdAt || new Date().toISOString(),
              updatedAt: new Date().toISOString()
            })
          }
        }
        
        toast.success('Tartalom sikeresen mentve!')
      }
    } catch (error) {
      console.error('Error saving course:', error)
      toast.error('Hiba a mentés során')
    } finally {
      setSaving(false)
    }
  }

  const addLesson = () => {
    const newLesson: Lesson = {
      title: 'Új lecke',
      description: '',
      type: 'VIDEO',
      videoUrl: '',
      content: '',
      duration: 10,
      order: (courseData.lessons?.length || 0) + 1,
      isPublished: false,
      isFree: false,
      resources: []
    }
    
    setCourseData({
      ...courseData,
      lessons: [...(courseData.lessons || []), newLesson]
    })
  }

  const updateLesson = (index: number, lesson: Lesson) => {
    const updatedLessons = [...(courseData.lessons || [])]
    updatedLessons[index] = lesson
    setCourseData({ ...courseData, lessons: updatedLessons })
  }

  const deleteLesson = (index: number) => {
    const updatedLessons = (courseData.lessons || []).filter((_, i) => i !== index)
    // Update order numbers
    updatedLessons.forEach((lesson, i) => {
      lesson.order = i + 1
    })
    setCourseData({ ...courseData, lessons: updatedLessons })
  }

  const moveLesson = (index: number, direction: 'up' | 'down') => {
    const lessons = courseData.lessons || []
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === lessons.length - 1)
    ) {
      return
    }
    
    const newIndex = direction === 'up' ? index - 1 : index + 1
    const updatedLessons = [...lessons]
    const [movedLesson] = updatedLessons.splice(index, 1)
    updatedLessons.splice(newIndex, 0, movedLesson)
    
    // Update order numbers
    updatedLessons.forEach((lesson, i) => {
      lesson.order = i + 1
    })
    
    setCourseData({ ...courseData, lessons: updatedLessons })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            onClick={() => router.push('/admin/courses')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Vissza
          </Button>
          <h1 className="text-2xl font-bold">
            {courseId === 'new' ? 'Új tartalom létrehozása' : 'Tartalom szerkesztése'}
          </h1>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/courses/${courseId}`)}
            disabled={courseId === 'new'}
          >
            Előnézet
          </Button>
          <Button onClick={saveCourse} disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? 'Mentés...' : 'Mentés'}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="details">Alapadatok</TabsTrigger>
          <TabsTrigger value="lessons">Leckék</TabsTrigger>
          <TabsTrigger value="settings">Beállítások</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tartalom információk</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Tartalom címe</Label>
                  <Input
                    id="title"
                    value={courseData.title}
                    onChange={(e) => setCourseData({ ...courseData, title: e.target.value })}
                    placeholder="pl. React Fejlesztés Alapjai"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Kategória</Label>
                  <Input
                    id="category"
                    value={courseData.category}
                    onChange={(e) => setCourseData({ ...courseData, category: e.target.value })}
                    placeholder="pl. Programozás"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Leírás</Label>
                <Textarea
                  id="description"
                  value={courseData.description}
                  onChange={(e) => setCourseData({ ...courseData, description: e.target.value })}
                  placeholder="Tartalom részletes leírása..."
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Ár (HUF)</Label>
                  <Input
                    id="price"
                    type="number"
                    value={courseData.price}
                    onChange={(e) => setCourseData({ ...courseData, price: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration">Időtartam</Label>
                  <Input
                    id="duration"
                    value={courseData.duration}
                    onChange={(e) => setCourseData({ ...courseData, duration: e.target.value })}
                    placeholder="pl. 8 óra"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="level">Szint</Label>
                  <Select 
                    value={courseData.level} 
                    onValueChange={(value) => setCourseData({ ...courseData, level: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BEGINNER">Kezdő</SelectItem>
                      <SelectItem value="INTERMEDIATE">Középhaladó</SelectItem>
                      <SelectItem value="ADVANCED">Haladó</SelectItem>
                      <SelectItem value="EXPERT">Szakértő</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="language">Nyelv</Label>
                  <Select 
                    value={courseData.language || 'HU'} 
                    onValueChange={(value) => setCourseData({ ...courseData, language: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="HU">Magyar</SelectItem>
                      <SelectItem value="EN">Angol</SelectItem>
                      <SelectItem value="DE">Német</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="thumbnail">Borítókép URL</Label>
                <Input
                  id="thumbnail"
                  value={courseData.thumbnailUrl}
                  onChange={(e) => setCourseData({ ...courseData, thumbnailUrl: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                />
                {courseData.thumbnailUrl && (
                  <img 
                    src={courseData.thumbnailUrl} 
                    alt="Borítókép előnézet" 
                    className="mt-2 h-32 w-auto rounded-lg object-cover"
                  />
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Oktató információk</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="instructorName">Oktató neve</Label>
                  <Input
                    id="instructorName"
                    value={courseData.instructorName}
                    onChange={(e) => setCourseData({ ...courseData, instructorName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="instructorTitle">Titulus</Label>
                  <Input
                    id="instructorTitle"
                    value={courseData.instructorTitle}
                    onChange={(e) => setCourseData({ ...courseData, instructorTitle: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="instructorBio">Bio</Label>
                <Textarea
                  id="instructorBio"
                  value={courseData.instructorBio}
                  onChange={(e) => setCourseData({ ...courseData, instructorBio: e.target.value })}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lessons" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Leckék ({courseData.lessons?.length || 0})</CardTitle>
              <Button onClick={addLesson} size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Új lecke
              </Button>
            </CardHeader>
            <CardContent>
              {!courseData.lessons || courseData.lessons.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Még nincs lecke hozzáadva a tartalomhoz
                </p>
              ) : (
                <div className="space-y-4">
                  {courseData.lessons.map((lesson, index) => (
                    <Card key={index} className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="flex flex-col gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => moveLesson(index, 'up')}
                            disabled={index === 0}
                          >
                            ↑
                          </Button>
                          <GripVertical className="h-4 w-4 text-muted-foreground" />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => moveLesson(index, 'down')}
                            disabled={index === (courseData.lessons?.length || 0) - 1}
                          >
                            ↓
                          </Button>
                        </div>
                        
                        <div className="flex-1 space-y-4">
                          <div className="flex items-center gap-2">
                            {lesson.type === 'VIDEO' ? (
                              <Video className="h-4 w-4" />
                            ) : (
                              <FileText className="h-4 w-4" />
                            )}
                            <Input
                              value={lesson.title}
                              onChange={(e) => updateLesson(index, { ...lesson, title: e.target.value })}
                              placeholder="Lecke címe"
                              className="font-semibold"
                            />
                          </div>
                          
                          <Textarea
                            value={lesson.description}
                            onChange={(e) => updateLesson(index, { ...lesson, description: e.target.value })}
                            placeholder="Lecke leírása"
                            rows={2}
                          />
                          
                          <div className="grid grid-cols-3 gap-4">
                            <Select
                              value={lesson.type}
                              onValueChange={(value: 'VIDEO' | 'TEXT' | 'QUIZ') => 
                                updateLesson(index, { ...lesson, type: value })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="VIDEO">Videó</SelectItem>
                                <SelectItem value="TEXT">Szöveges</SelectItem>
                                <SelectItem value="QUIZ">Kvíz</SelectItem>
                              </SelectContent>
                            </Select>
                            
                            <Input
                              type="number"
                              value={lesson.duration}
                              onChange={(e) => updateLesson(index, { ...lesson, duration: parseInt(e.target.value) || 0 })}
                              placeholder="Időtartam (perc)"
                            />
                            
                            <div className="flex items-center gap-4">
                              <label className="flex items-center gap-2">
                                <Switch
                                  checked={lesson.isPublished}
                                  onCheckedChange={(checked) => 
                                    updateLesson(index, { ...lesson, isPublished: checked })
                                  }
                                />
                                <span className="text-sm">Publikált</span>
                              </label>
                              <label className="flex items-center gap-2">
                                <Switch
                                  checked={lesson.isFree}
                                  onCheckedChange={(checked) => 
                                    updateLesson(index, { ...lesson, isFree: checked })
                                  }
                                />
                                <span className="text-sm">Ingyenes</span>
                              </label>
                            </div>
                          </div>
                          
                          {lesson.type === 'VIDEO' && (
                            <VideoUpload
                              value={lesson.videoUrl || ''}
                              onChange={(url) => updateLesson(index, { ...lesson, videoUrl: url })}
                              courseId={courseId}
                              lessonId={lesson.id || `temp-${index}`}
                            />
                          )}
                          
                          {lesson.type === 'TEXT' && (
                            <Textarea
                              value={lesson.content || ''}
                              onChange={(e) => updateLesson(index, { ...lesson, content: e.target.value })}
                              placeholder="Lecke tartalma (HTML támogatott)"
                              rows={6}
                            />
                          )}
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteLesson(index)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Publikálási beállítások</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Tartalom státusza</Label>
                  <p className="text-sm text-muted-foreground">
                    A publikált tartalmak megjelennek a nyilvános listában
                  </p>
                </div>
                <Select
                  value={courseData.status}
                  onValueChange={(value: 'DRAFT' | 'PUBLISHED') => 
                    setCourseData({ ...courseData, status: value })
                  }
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DRAFT">Piszkozat</SelectItem>
                    <SelectItem value="PUBLISHED">Publikált</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {courseData.status === 'PUBLISHED' && (!courseData.lessons || courseData.lessons.length === 0) && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800">
                    ⚠️ Figyelem: A tartalomnak legalább egy leckét kell tartalmaznia a publikáláshoz.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}