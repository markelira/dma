'use client'

import { useCourse } from '@/hooks/useCourseQueries'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export default function CourseEnrollPage() {
  const params = useParams<{ courseId: string }>()
  const courseId = params.courseId
  const router = useRouter()
  const { data: course, isLoading, error } = useCourse(courseId)

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Betöltés...</div>
  }

  if (error || !course) {
    return <div className="min-h-screen flex items-center justify-center text-red-500">Tartalom nem található.</div>
  }

  const handleMockPay = () => {
    toast.success('Redirecting to payment processor... (mock)')
    // Simulate redirect back with success param
    router.push(`/courses/${courseId}?success=1`)
  }

  const handleCancel = () => {
    router.push(`/courses/${courseId}?canceled=1`)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Complete Purchase</h1>
        <p className="text-muted-foreground">You are purchasing the course <strong>{course.title}</strong></p>
        <p className="text-2xl font-bold">Price: {(course as any).priceHUF ?? 0} Ft</p>
      </div>

      <div className="flex gap-4">
        <Button className="px-8" onClick={handleMockPay}>Pay</Button>
        <Button variant="outline" onClick={handleCancel}>Cancel</Button>
      </div>
    </div>
  )
} 