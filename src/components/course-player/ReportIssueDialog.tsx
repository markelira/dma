"use client"

import React, { useState } from 'react'
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { useTranslation } from '@/hooks/useTranslation'
import { httpsCallable } from 'firebase/functions'
import { functions } from '@/lib/firebase'

interface ReportIssueDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  lessonId: string
  courseId: string
  lessonTitle?: string
  courseTitle?: string
}

type IssueType = 'technical' | 'content' | 'video' | 'audio' | 'other'

interface FormData {
  issueType: IssueType | ''
  subject: string
  description: string
}

interface ValidationErrors {
  issueType?: string
  subject?: string
  description?: string
}

export const ReportIssueDialog: React.FC<ReportIssueDialogProps> = ({
  open,
  onOpenChange,
  lessonId,
  courseId,
  lessonTitle,
  courseTitle,
}) => {
  const { t } = useTranslation()
  const [formData, setFormData] = useState<FormData>({
    issueType: '',
    subject: '',
    description: '',
  })
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {}

    // Validate issue type
    if (!formData.issueType) {
      newErrors.issueType = t('reportIssue.validation.issueTypeRequired')
    }

    // Validate subject
    if (formData.subject.trim().length < 3) {
      newErrors.subject = t('reportIssue.validation.subjectTooShort')
    } else if (formData.subject.length > 200) {
      newErrors.subject = t('reportIssue.validation.subjectTooLong')
    }

    // Validate description
    if (formData.description.trim().length < 10) {
      newErrors.description = t('reportIssue.validation.descriptionTooShort')
    } else if (formData.description.length > 2000) {
      newErrors.description = t('reportIssue.validation.descriptionTooLong')
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    setSubmitStatus('idle')

    try {
      const reportLessonIssue = httpsCallable(functions, 'reportLessonIssue')

      // Get browser and platform info
      const browser = navigator.userAgent
      const platform = navigator.platform
      const url = window.location.href

      await reportLessonIssue({
        lessonId,
        courseId,
        issueType: formData.issueType,
        subject: formData.subject,
        description: formData.description,
        browser,
        platform,
        url,
      })

      setSubmitStatus('success')

      // Reset form after 2 seconds and close dialog
      setTimeout(() => {
        setFormData({ issueType: '', subject: '', description: '' })
        setErrors({})
        setSubmitStatus('idle')
        onOpenChange(false)
      }, 2000)
    } catch (error) {
      console.error('Error reporting issue:', error)
      setSubmitStatus('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    setFormData({ issueType: '', subject: '', description: '' })
    setErrors({})
    setSubmitStatus('idle')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t('reportIssue.title')}</DialogTitle>
          <DialogDescription>
            {t('reportIssue.description')}
          </DialogDescription>
        </DialogHeader>

        {submitStatus === 'success' ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <CheckCircle2 className="h-12 w-12 text-green-500 mb-3" />
            <p className="text-sm font-medium text-green-700">
              {t('reportIssue.success')}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Issue Type */}
            <div className="space-y-2">
              <Label htmlFor="issueType">{t('reportIssue.issueType')}</Label>
              <Select
                value={formData.issueType}
                onValueChange={(value) => {
                  setFormData({ ...formData, issueType: value as IssueType })
                  setErrors({ ...errors, issueType: undefined })
                }}
              >
                <SelectTrigger id="issueType" className={errors.issueType ? 'border-red-500' : ''}>
                  <SelectValue placeholder={t('reportIssue.issueTypePlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="technical">
                    {t('reportIssue.issueTypes.technical')}
                  </SelectItem>
                  <SelectItem value="content">
                    {t('reportIssue.issueTypes.content')}
                  </SelectItem>
                  <SelectItem value="video">
                    {t('reportIssue.issueTypes.video')}
                  </SelectItem>
                  <SelectItem value="audio">
                    {t('reportIssue.issueTypes.audio')}
                  </SelectItem>
                  <SelectItem value="other">
                    {t('reportIssue.issueTypes.other')}
                  </SelectItem>
                </SelectContent>
              </Select>
              {errors.issueType && (
                <p className="text-xs text-red-500">{errors.issueType}</p>
              )}
            </div>

            {/* Subject */}
            <div className="space-y-2">
              <Label htmlFor="subject">{t('reportIssue.subject')}</Label>
              <Input
                id="subject"
                value={formData.subject}
                onChange={(e) => {
                  setFormData({ ...formData, subject: e.target.value })
                  setErrors({ ...errors, subject: undefined })
                }}
                placeholder={t('reportIssue.subjectPlaceholder')}
                maxLength={200}
                className={errors.subject ? 'border-red-500' : ''}
              />
              {errors.subject && (
                <p className="text-xs text-red-500">{errors.subject}</p>
              )}
              <p className="text-xs text-gray-500">
                {formData.subject.length} / 200
              </p>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">{t('reportIssue.description')}</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => {
                  setFormData({ ...formData, description: e.target.value })
                  setErrors({ ...errors, description: undefined })
                }}
                placeholder={t('reportIssue.descriptionPlaceholder')}
                maxLength={2000}
                rows={5}
                className={errors.description ? 'border-red-500' : ''}
              />
              {errors.description && (
                <p className="text-xs text-red-500">{errors.description}</p>
              )}
              <p className="text-xs text-gray-500">
                {formData.description.length} / 2000
              </p>
            </div>

            {/* Error message */}
            {submitStatus === 'error' && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <p className="text-xs text-red-700">{t('reportIssue.error')}</p>
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isSubmitting}
              >
                {t('reportIssue.cancel')}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('reportIssue.submitting')}
                  </>
                ) : (
                  t('reportIssue.submit')
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
