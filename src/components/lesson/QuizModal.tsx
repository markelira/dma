"use client"

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { LessonQuiz } from '@/types'

interface Props {
  quiz: LessonQuiz
  open: boolean
  onClose: () => void
  onPassed: () => void
}

export const QuizModal: React.FC<Props> = ({ quiz, open, onClose, onPassed }) => {
  const [responses, setResponses] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)
  const passing = quiz.passingScore ?? 80

  const handleSelect = (qId: string, aId: string) => {
    setResponses(prev => ({ ...prev, [qId]: aId }))
  }

  const handleSubmit = () => {
    setSubmitted(true)
    const correct = quiz.questions.filter(q => {
      const ans = q.answers.find(a => a.id === responses[q.id])
      return ans?.isCorrect
    }).length
    const score = (correct / quiz.questions.length) * 100
    if (score >= passing) {
      onPassed()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Kvíz</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
          {quiz.questions.map(q => (
            <div key={q.id} className="space-y-2">
              <p className="font-medium">{q.questionText}</p>
              {q.answers.map(a => (
                <label key={a.id} className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name={`q-${q.id}`}
                    value={a.id}
                    checked={responses[q.id] === a.id}
                    onChange={() => handleSelect(q.id, a.id)}
                  />
                  <span>{a.text}</span>
                </label>
              ))}
              {submitted && (
                <p className="text-sm text-muted-foreground">
                  {q.answers.find(a => a.id === responses[q.id])?.isCorrect ? '✔️ Helyes' : '❌ Helytelen'}
                </p>
              )}
            </div>
          ))}
        </div>
        {!submitted ? (
          <Button className="mt-4" onClick={handleSubmit}>Eredmény</Button>
        ) : (
          <Button variant="ghost" className="mt-4" onClick={onClose}>Bezárás</Button>
        )}
      </DialogContent>
    </Dialog>
  )
} 