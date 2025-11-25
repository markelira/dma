"use client"

import React, { useState, useCallback, useEffect, useRef } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, RefreshCw, Info, HelpCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

// Fill-in-the-blank question types
type FillBlankType = 'text_input' | 'dropdown' | 'word_bank' | 'mixed'

interface BlankField {
  id: string
  type: 'input' | 'dropdown'
  position: number // Position in the text
  correctAnswers: string[] // Multiple correct answers allowed
  caseSensitive: boolean
  exactMatch: boolean // If false, partial matching allowed
  placeholder?: string
  options?: string[] // For dropdown type
  wordBankCategory?: string
  hint?: string
  points: number
}

interface WordBankItem {
  id: string
  text: string
  category?: string
  used: boolean
}

interface FillBlankQuestionData {
  id: string
  type: FillBlankType
  questionText: string
  textWithBlanks: string // Text with placeholders like "The {0} is {1}"
  blanks: BlankField[]
  wordBank?: WordBankItem[]
  allowPartialCredit: boolean
  showWordCount: boolean
  caseSensitive: boolean
  showFeedback: boolean
  feedbackText?: string
  explanation?: string
  hints: string[]
}

interface Props {
  question: FillBlankQuestionData
  onAnswer: (answers: Record<string, string>, isCorrect: boolean, score: number) => void
  showFeedback?: boolean
  disabled?: boolean
  className?: string
}

export const FillInBlankQuestion: React.FC<Props> = ({
  question,
  onAnswer,
  showFeedback = false,
  disabled = false,
  className
}) => {
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState(0)
  const [isCorrect, setIsCorrect] = useState(false)
  const [feedback, setFeedback] = useState<string>('')
  const [usedWordBankItems, setUsedWordBankItems] = useState<Set<string>>(new Set())
  const [showHints, setShowHints] = useState<Set<string>>(new Set())
  const [blankResults, setBlankResults] = useState<Record<string, boolean>>({})
  
  const inputRefs = useRef<Record<string, HTMLInputElement>>({})

  // Initialize answers
  useEffect(() => {
    const initialAnswers: Record<string, string> = {}
    question.blanks.forEach(blank => {
      initialAnswers[blank.id] = ''
    })
    setAnswers(initialAnswers)
  }, [question])

  // Handle input change
  const handleInputChange = useCallback((blankId: string, value: string) => {
    if (disabled) return

    setAnswers(prev => ({ ...prev, [blankId]: value }))

    // Update word bank usage
    if (question.wordBank) {
      const newUsedItems = new Set(usedWordBankItems)
      
      // Remove previous usage
      const previousValue = answers[blankId]
      if (previousValue) {
        const previousItem = question.wordBank.find(item => item.text === previousValue)
        if (previousItem) {
          newUsedItems.delete(previousItem.id)
        }
      }
      
      // Add new usage
      if (value) {
        const newItem = question.wordBank.find(item => item.text === value)
        if (newItem) {
          newUsedItems.add(newItem.id)
        }
      }
      
      setUsedWordBankItems(newUsedItems)
    }
  }, [disabled, question.wordBank, answers, usedWordBankItems])

  // Handle word bank selection
  const handleWordBankSelect = useCallback((blankId: string, word: string) => {
    if (disabled) return

    handleInputChange(blankId, word)
  }, [disabled, handleInputChange])

  // Check if answer is correct
  const checkAnswer = useCallback((blankId: string, userAnswer: string): boolean => {
    const blank = question.blanks.find(b => b.id === blankId)
    if (!blank) return false

    const normalizedUserAnswer = blank.caseSensitive ? userAnswer : userAnswer.toLowerCase()
    
    return blank.correctAnswers.some(correct => {
      const normalizedCorrect = blank.caseSensitive ? correct : correct.toLowerCase()
      
      if (blank.exactMatch) {
        return normalizedUserAnswer === normalizedCorrect
      } else {
        // Allow partial matching
        return normalizedUserAnswer.includes(normalizedCorrect) || 
               normalizedCorrect.includes(normalizedUserAnswer)
      }
    })
  }, [question.blanks])

  // Calculate score
  const calculateScore = useCallback(() => {
    let totalPoints = 0
    let earnedPoints = 0
    const results: Record<string, boolean> = {}

    question.blanks.forEach(blank => {
      totalPoints += blank.points
      const isCorrect = checkAnswer(blank.id, answers[blank.id] || '')
      results[blank.id] = isCorrect
      
      if (isCorrect) {
        earnedPoints += blank.points
      }
    })

    const scorePercentage = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0
    const allCorrect = Object.values(results).every(result => result)

    setBlankResults(results)
    return { scorePercentage, allCorrect, results }
  }, [question.blanks, answers, checkAnswer])

  // Submit answer
  const handleSubmit = useCallback(() => {
    const { scorePercentage, allCorrect } = calculateScore()
    
    setScore(scorePercentage)
    setIsCorrect(allCorrect)
    setSubmitted(true)

    // Generate feedback
    if (question.showFeedback) {
      if (allCorrect) {
        setFeedback(question.feedbackText || 'Kiváló! Minden választ helyesen adott meg.')
      } else if (question.allowPartialCredit && scorePercentage > 0) {
        setFeedback(`Részben helyes! ${Math.round(scorePercentage)}% pontot ért el.`)
      } else {
        setFeedback('Próbálja újra! Ellenőrizze a válaszait.')
      }
    }

    onAnswer(answers, allCorrect, scorePercentage)
  }, [calculateScore, question, answers, onAnswer])

  // Reset answers
  const resetAnswers = useCallback(() => {
    if (disabled) return

    const initialAnswers: Record<string, string> = {}
    question.blanks.forEach(blank => {
      initialAnswers[blank.id] = ''
    })
    
    setAnswers(initialAnswers)
    setSubmitted(false)
    setScore(0)
    setIsCorrect(false)
    setFeedback('')
    setUsedWordBankItems(new Set())
    setShowHints(new Set())
    setBlankResults({})
  }, [disabled, question.blanks])

  // Show hint
  const showHint = useCallback((blankId: string) => {
    setShowHints(prev => new Set([...prev, blankId]))
  }, [])

  // Render text with blanks
  const renderTextWithBlanks = () => {
    let text = question.textWithBlanks
    let parts: React.ReactNode[] = []
    let lastIndex = 0

    // Sort blanks by position
    const sortedBlanks = [...question.blanks].sort((a, b) => a.position - b.position)

    sortedBlanks.forEach((blank, index) => {
      const placeholder = `{${blank.position}}`
      const placeholderIndex = text.indexOf(placeholder, lastIndex)
      
      if (placeholderIndex !== -1) {
        // Add text before blank
        if (placeholderIndex > lastIndex) {
          parts.push(text.substring(lastIndex, placeholderIndex))
        }

        // Add blank input
        if (blank.type === 'dropdown' && blank.options) {
          parts.push(
            <DropdownMenu key={blank.id}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline" 
                  size="sm"
                  className={cn(
                    "mx-1 min-w-[100px] h-8",
                    submitted && blankResults[blank.id] === true && "border-green-500 bg-green-50",
                    submitted && blankResults[blank.id] === false && "border-red-500 bg-red-50"
                  )}
                  disabled={disabled}
                >
                  {answers[blank.id] || "Válasszon..."}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {blank.options.map(option => (
                  <DropdownMenuItem
                    key={option}
                    onClick={() => handleInputChange(blank.id, option)}
                  >
                    {option}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )
        } else {
          parts.push(
            <div key={blank.id} className="inline-flex items-center mx-1">
              <Input
                ref={(el) => {
                  if (el) inputRefs.current[blank.id] = el
                }}
                value={answers[blank.id] || ''}
                onChange={(e) => handleInputChange(blank.id, e.target.value)}
                placeholder={blank.placeholder || '___'}
                disabled={disabled}
                className={cn(
                  "w-24 h-8 text-center border-b-2 border-t-0 border-l-0 border-r-0 rounded-none bg-transparent focus:border-brand-secondary",
                  submitted && blankResults[blank.id] === true && "border-green-500 text-green-700",
                  submitted && blankResults[blank.id] === false && "border-red-500 text-red-700"
                )}
              />
              {submitted && (
                blankResults[blank.id] ? (
                  <CheckCircle className="w-4 h-4 text-green-600 ml-1" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-600 ml-1" />
                )
              )}
              {blank.hint && !submitted && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => showHint(blank.id)}
                  className="w-6 h-6 p-0 ml-1"
                >
                  <HelpCircle className="w-3 h-3" />
                </Button>
              )}
            </div>
          )
        }

        lastIndex = placeholderIndex + placeholder.length
      }
    })

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex))
    }

    return parts
  }

  // Get available word bank items
  const getAvailableWordBankItems = (category?: string) => {
    if (!question.wordBank) return []
    
    return question.wordBank.filter(item => 
      (!category || item.category === category) &&
      !usedWordBankItems.has(item.id)
    )
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Question Header */}
      <div className="space-y-2">
        <h3 className="text-lg font-medium">{question.questionText}</h3>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Info className="w-4 h-4" />
            Töltse ki az üres helyeket
          </span>
          {question.showWordCount && (
            <Badge variant="outline">
              {question.blanks.length} üres hely
            </Badge>
          )}
        </div>
      </div>

      {/* Word Bank */}
      {question.wordBank && question.wordBank.length > 0 && (
        <Card className="p-4">
          <h4 className="text-sm font-medium mb-3">Szóbank:</h4>
          <div className="flex flex-wrap gap-2">
            {question.wordBank.map(item => (
              <Button
                key={item.id}
                variant="outline"
                size="sm"
                disabled={disabled || usedWordBankItems.has(item.id)}
                onClick={() => {
                  // Auto-fill first empty blank with matching category
                  const targetBlank = question.blanks.find(blank => 
                    !answers[blank.id] && 
                    (!blank.wordBankCategory || blank.wordBankCategory === item.category)
                  )
                  if (targetBlank) {
                    handleInputChange(targetBlank.id, item.text)
                  }
                }}
                className={cn(
                  "transition-all",
                  usedWordBankItems.has(item.id) && "opacity-50 line-through"
                )}
              >
                {item.text}
                {item.category && (
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {item.category}
                  </Badge>
                )}
              </Button>
            ))}
          </div>
        </Card>
      )}

      {/* Text with Blanks */}
      <Card className="p-6">
        <div className="text-base leading-relaxed">
          {renderTextWithBlanks()}
        </div>
      </Card>

      {/* Hints */}
      {showHints.size > 0 && (
        <Card className="p-4 bg-brand-secondary/5 border-brand-secondary/20">
          <h4 className="text-sm font-medium mb-2 text-brand-secondary-hover">Tippek:</h4>
          {Array.from(showHints).map(blankId => {
            const blank = question.blanks.find(b => b.id === blankId)
            return blank?.hint ? (
              <p key={blankId} className="text-sm text-brand-secondary-hover mb-1">
                • {blank.hint}
              </p>
            ) : null
          })}
        </Card>
      )}

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {!submitted && (
            <Button
              onClick={handleSubmit}
              disabled={disabled || Object.values(answers).every(answer => !answer.trim())}
              className="flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              Ellenőrzés
            </Button>
          )}
          
          <Button
            variant="outline"
            onClick={resetAnswers}
            disabled={disabled}
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Újrakezdés
          </Button>
        </div>

        {submitted && (
          <div className="flex items-center gap-2">
            {isCorrect ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <XCircle className="w-5 h-5 text-red-600" />
            )}
            <span className={cn(
              "font-medium",
              isCorrect ? "text-green-600" : "text-red-600"
            )}>
              {Math.round(score)}%
            </span>
          </div>
        )}
      </div>

      {/* Individual Blank Results */}
      {submitted && (
        <Card className="p-4">
          <h4 className="text-sm font-medium mb-3">Részletes eredmények:</h4>
          <div className="space-y-2">
            {question.blanks.map((blank, index) => (
              <div key={blank.id} className="flex items-center justify-between text-sm">
                <span>Üres hely #{index + 1}:</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                    "{answers[blank.id] || '(üres)'}"
                  </span>
                  {blankResults[blank.id] ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <div className="flex items-center gap-1 text-red-600">
                      <XCircle className="w-4 h-4" />
                      <span className="text-xs">
                        Helyes: {blank.correctAnswers.join(', ')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Feedback */}
      {submitted && showFeedback && feedback && (
        <Card className={cn(
          "p-4",
          isCorrect ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
        )}>
          <p className={cn(
            "text-sm",
            isCorrect ? "text-green-800" : "text-red-800"
          )}>
            {feedback}
          </p>
          {question.explanation && (
            <p className="text-sm text-gray-600 mt-2">
              <strong>Magyarázat:</strong> {question.explanation}
            </p>
          )}
        </Card>
      )}
    </div>
  )
}