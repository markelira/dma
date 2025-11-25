"use client"

import React, { useState, useCallback, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  RotateCcw, 
  Play, 
  Pause,
  Volume2,
  ArrowLeft,
  ArrowRight,
  Trophy,
  Target,
  Zap,
  BookOpen
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { DragDropQuestion } from './DragDropQuestion'
import { FillInBlankQuestion } from './FillInBlankQuestion'
import { HotspotQuestion } from './HotspotQuestion'

// Question types
type QuestionType = 'multiple_choice' | 'drag_drop' | 'fill_blank' | 'hotspot' | 'code_challenge' | 'scenario'

// Base question interface
interface BaseQuestion {
  id: string
  type: QuestionType
  title: string
  questionText: string
  points: number
  timeLimit?: number
  difficulty: 'easy' | 'medium' | 'hard'
  tags: string[]
  explanation?: string
  resources?: Array<{
    type: 'video' | 'image' | 'link' | 'document'
    url: string
    title: string
  }>
}

// Multiple choice question
interface MultipleChoiceQuestion extends BaseQuestion {
  type: 'multiple_choice'
  options: Array<{
    id: string
    text: string
    isCorrect: boolean
    feedback?: string
  }>
  allowMultiple: boolean
  randomizeOptions: boolean
}

// Enhanced feedback system
interface ImmediateFeedback {
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  actions?: Array<{
    label: string
    action: () => void
    variant?: 'default' | 'outline' | 'ghost'
  }>
  autoHide?: boolean
  duration?: number
  showResources?: boolean
}

interface QuizAnalytics {
  startTime: number
  endTime?: number
  totalTimeSpent: number
  questionTimeSpent: Record<string, number>
  attempts: Record<string, number>
  hintsUsed: Record<string, number>
  skipCount: number
  correctAnswers: number
  totalQuestions: number
  score: number
  engagementScore: number
  difficultyProgression: Array<{
    questionId: string
    difficulty: string
    correct: boolean
    timeSpent: number
  }>
}

interface Props {
  questions: (MultipleChoiceQuestion | any)[] // Include our custom question types
  title?: string
  description?: string
  passingScore?: number
  allowRetry?: boolean
  showProgress?: boolean
  showTimer?: boolean
  immediateMessages?: boolean
  shuffleQuestions?: boolean
  adaptiveDifficulty?: boolean
  enableAnalytics?: boolean
  onComplete: (analytics: QuizAnalytics) => void
  onProgress?: (progress: number, analytics: QuizAnalytics) => void
  className?: string
}

export const EnhancedQuizEngine: React.FC<Props> = ({
  questions,
  title = "Kvíz",
  description,
  passingScore = 70,
  allowRetry = true,
  showProgress = true,
  showTimer = true,
  immediateMessages = true,
  shuffleQuestions = false,
  adaptiveDifficulty = false,
  enableAnalytics = true,
  onComplete,
  onProgress,
  className
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, any>>({})
  const [feedback, setFeedback] = useState<ImmediateFeedback | null>(null)
  const [isCompleted, setIsCompleted] = useState(false)
  const [startTime] = useState(Date.now())
  const [questionStartTime, setQuestionStartTime] = useState(Date.now())
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null)
  const [isPaused, setIsPaused] = useState(false)
  const [showResults, setShowResults] = useState(false)
  
  // Analytics
  const [analytics, setAnalytics] = useState<QuizAnalytics>({
    startTime: Date.now(),
    totalTimeSpent: 0,
    questionTimeSpent: {},
    attempts: {},
    hintsUsed: {},
    skipCount: 0,
    correctAnswers: 0,
    totalQuestions: questions.length,
    score: 0,
    engagementScore: 0,
    difficultyProgression: []
  })

  // Processed questions (shuffled if needed)
  const [processedQuestions] = useState(() => {
    let processed = [...questions]
    if (shuffleQuestions) {
      processed = processed.sort(() => Math.random() - 0.5)
    }
    return processed
  })

  const currentQuestion = processedQuestions[currentQuestionIndex]

  // Timer effect
  useEffect(() => {
    if (!showTimer || !currentQuestion?.timeLimit || isPaused || isCompleted) return

    setTimeRemaining(currentQuestion.timeLimit * 1000)
    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev === null || prev <= 0) {
          // Time's up - auto submit
          handleTimeUp()
          return 0
        }
        return prev - 1000
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [currentQuestionIndex, isPaused, isCompleted])

  // Analytics tracking
  useEffect(() => {
    if (enableAnalytics) {
      const totalTime = Date.now() - startTime
      setAnalytics(prev => ({
        ...prev,
        totalTimeSpent: totalTime
      }))
    }
  }, [currentQuestionIndex, enableAnalytics, startTime])

  // Handle time up
  const handleTimeUp = useCallback(() => {
    showImmediateFeedback({
      type: 'warning',
      title: 'Idő lejárt!',
      message: 'A kérdés ideje lejárt. Automatikusan a következő kérdésre lépünk.',
      autoHide: true,
      duration: 3000
    })

    // Record analytics
    if (enableAnalytics) {
      const timeSpent = Date.now() - questionStartTime
      setAnalytics(prev => ({
        ...prev,
        questionTimeSpent: {
          ...prev.questionTimeSpent,
          [currentQuestion.id]: timeSpent
        },
        skipCount: prev.skipCount + 1
      }))
    }

    setTimeout(() => {
      nextQuestion()
    }, 3000)
  }, [currentQuestion, questionStartTime, enableAnalytics])

  // Show immediate feedback
  const showImmediateFeedback = useCallback((feedback: ImmediateFeedback) => {
    if (!immediateMessages) return
    
    setFeedback(feedback)
    
    if (feedback.autoHide && feedback.duration) {
      setTimeout(() => {
        setFeedback(null)
      }, feedback.duration)
    }
  }, [immediateMessages])

  // Handle answer submission
  const handleAnswer = useCallback((questionId: string, answer: any, isCorrect: boolean, score: number) => {
    const timeSpent = Date.now() - questionStartTime

    // Update answers
    setAnswers(prev => ({
      ...prev,
      [questionId]: { answer, isCorrect, score, timeSpent }
    }))

    // Update analytics
    if (enableAnalytics) {
      setAnalytics(prev => ({
        ...prev,
        questionTimeSpent: {
          ...prev.questionTimeSpent,
          [questionId]: timeSpent
        },
        attempts: {
          ...prev.attempts,
          [questionId]: (prev.attempts[questionId] || 0) + 1
        },
        correctAnswers: prev.correctAnswers + (isCorrect ? 1 : 0),
        difficultyProgression: [
          ...prev.difficultyProgression,
          {
            questionId,
            difficulty: currentQuestion.difficulty,
            correct: isCorrect,
            timeSpent
          }
        ]
      }))
    }

    // Show immediate feedback
    if (isCorrect) {
      showImmediateFeedback({
        type: 'success',
        title: 'Helyes válasz!',
        message: `Kiváló! ${Math.round(score)}% pontot szerzett erre a kérdésre.`,
        actions: [
          {
            label: 'Következő kérdés',
            action: nextQuestion,
            variant: 'default'
          }
        ],
        autoHide: false,
        showResources: true
      })
    } else {
      showImmediateFeedback({
        type: 'error',
        title: 'Helytelen válasz',
        message: allowRetry 
          ? 'Próbálja újra vagy folytassa a következő kérdéssel.'
          : 'A helyes válasz meg fog jelenni a kvíz végén.',
        actions: allowRetry ? [
          {
            label: 'Újrapróbálás',
            action: () => setFeedback(null),
            variant: 'outline'
          },
          {
            label: 'Következő kérdés',
            action: nextQuestion,
            variant: 'default'
          }
        ] : [
          {
            label: 'Következő kérdés',
            action: nextQuestion,
            variant: 'default'
          }
        ],
        autoHide: false,
        showResources: true
      })
    }

    // Auto-advance after correct answer (with delay)
    if (isCorrect && !feedback) {
      setTimeout(() => {
        nextQuestion()
      }, 2000)
    }
  }, [currentQuestion, questionStartTime, enableAnalytics, allowRetry, feedback, showImmediateFeedback])

  // Next question
  const nextQuestion = useCallback(() => {
    setFeedback(null)
    
    if (currentQuestionIndex < processedQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
      setQuestionStartTime(Date.now())
      setTimeRemaining(null)
    } else {
      completeQuiz()
    }
  }, [currentQuestionIndex, processedQuestions.length])

  // Previous question
  const previousQuestion = useCallback(() => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1)
      setQuestionStartTime(Date.now())
      setTimeRemaining(null)
      setFeedback(null)
    }
  }, [currentQuestionIndex])

  // Complete quiz
  const completeQuiz = useCallback(() => {
    const endTime = Date.now()
    const finalScore = calculateFinalScore()
    
    const finalAnalytics: QuizAnalytics = {
      ...analytics,
      endTime,
      totalTimeSpent: endTime - startTime,
      score: finalScore,
      engagementScore: calculateEngagementScore()
    }

    setAnalytics(finalAnalytics)
    setIsCompleted(true)
    setShowResults(true)
    
    onComplete(finalAnalytics)
  }, [analytics, startTime, onComplete])

  // Calculate final score
  const calculateFinalScore = useCallback(() => {
    const totalPoints = processedQuestions.reduce((sum, q) => sum + q.points, 0)
    const earnedPoints = Object.values(answers).reduce((sum: number, answer: any) => {
      return sum + (answer.score * answer.questionPoints / 100 || 0)
    }, 0)
    
    return totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0
  }, [processedQuestions, answers])

  // Calculate engagement score
  const calculateEngagementScore = useCallback(() => {
    const avgTimePerQuestion = analytics.totalTimeSpent / questions.length
    const completionRate = Object.keys(answers).length / questions.length
    const accuracyRate = analytics.correctAnswers / questions.length
    const consistencyScore = 1 - (analytics.skipCount / questions.length)
    
    return Math.round(
      (completionRate * 30) + 
      (accuracyRate * 40) + 
      (consistencyScore * 20) + 
      (Math.min(avgTimePerQuestion / 60000, 1) * 10) // Time engagement (max 1 min per question)
    )
  }, [analytics, questions.length, answers])

  // Render question based on type
  const renderQuestion = () => {
    if (!currentQuestion) return null

    const commonProps = {
      onAnswer: (answer: any, isCorrect: boolean, score: number) => 
        handleAnswer(currentQuestion.id, answer, isCorrect, score),
      showFeedback: !immediateMessages,
      disabled: !!feedback,
      className: "mb-6"
    }

    switch (currentQuestion.type) {
      case 'multiple_choice':
        return (
          <Card className="p-6">
            <h3 className="text-lg font-medium mb-4">{currentQuestion.questionText}</h3>
            <div className="space-y-3">
              {currentQuestion.options.map((option: any) => (
                <label key={option.id} className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type={currentQuestion.allowMultiple ? "checkbox" : "radio"}
                    name={currentQuestion.allowMultiple ? undefined : `question-${currentQuestion.id}`}
                    className="w-4 h-4"
                    onChange={() => {
                      // Handle multiple choice logic
                      const isCorrect = option.isCorrect
                      const score = isCorrect ? 100 : 0
                      handleAnswer(currentQuestion.id, option.id, isCorrect, score)
                    }}
                  />
                  <span>{option.text}</span>
                </label>
              ))}
            </div>
          </Card>
        )
      
      case 'drag_drop':
        return <DragDropQuestion question={currentQuestion} {...commonProps} />
      
      case 'fill_blank':
        return <FillInBlankQuestion question={currentQuestion} {...commonProps} />
      
      case 'hotspot':
        return <HotspotQuestion question={currentQuestion} {...commonProps} />
      
      default:
        return (
          <Card className="p-6">
            <p className="text-gray-500">Ismeretlen kérdés típus: {currentQuestion.type}</p>
          </Card>
        )
    }
  }

  // Format time
  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  if (showResults) {
    return (
      <div className={cn("space-y-6", className)}>
        {/* Results Header */}
        <Card className="p-6 text-center">
          <div className="flex justify-center mb-4">
            {analytics.score >= passingScore ? (
              <Trophy className="w-16 h-16 text-yellow-500" />
            ) : (
              <Target className="w-16 h-16 text-gray-400" />
            )}
          </div>
          
          <h2 className="text-2xl font-bold mb-2">
            {analytics.score >= passingScore ? 'Gratulálunk!' : 'Kvíz befejezve'}
          </h2>
          
          <p className="text-lg mb-4">
            Végső pontszám: <span className="font-bold text-2xl">{Math.round(analytics.score)}%</span>
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="bg-gray-50 p-3 rounded">
              <div className="font-medium">Helyes válaszok</div>
              <div className="text-xl">{analytics.correctAnswers}/{analytics.totalQuestions}</div>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <div className="font-medium">Eltelt idő</div>
              <div className="text-xl">{formatTime(analytics.totalTimeSpent)}</div>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <div className="font-medium">Elkötelezettség</div>
              <div className="text-xl">{analytics.engagementScore}%</div>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <div className="font-medium">Átlagos idő</div>
              <div className="text-xl">{formatTime(analytics.totalTimeSpent / analytics.totalQuestions)}</div>
            </div>
          </div>
        </Card>

        {/* Detailed Results */}
        <Card className="p-6">
          <h3 className="text-lg font-medium mb-4">Részletes eredmények</h3>
          <div className="space-y-3">
            {processedQuestions.map((question, index) => {
              const answer = answers[question.id]
              return (
                <div key={question.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div className="flex items-center gap-3">
                    {answer?.isCorrect ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600" />
                    )}
                    <div>
                      <div className="font-medium">Kérdés #{index + 1}</div>
                      <div className="text-sm text-gray-600">{question.title}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{Math.round(answer?.score || 0)}%</div>
                    <div className="text-sm text-gray-600">
                      {formatTime(analytics.questionTimeSpent[question.id] || 0)}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>

        {/* Actions */}
        <div className="flex justify-center gap-4">
          {allowRetry && analytics.score < passingScore && (
            <Button onClick={() => window.location.reload()} className="flex items-center gap-2">
              <RotateCcw className="w-4 h-4" />
              Újrapróbálás
            </Button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Quiz Header */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">{title}</h1>
            {description && <p className="text-gray-600 mt-1">{description}</p>}
          </div>
          
          <div className="flex items-center gap-4">
            {showTimer && timeRemaining !== null && (
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span className={cn(
                  "font-mono",
                  timeRemaining < 30000 && "text-red-600 font-bold"
                )}>
                  {formatTime(timeRemaining)}
                </span>
              </div>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPaused(!isPaused)}
              className="flex items-center gap-2"
            >
              {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
              {isPaused ? 'Folytatás' : 'Szünet'}
            </Button>
          </div>
        </div>

        {showProgress && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Kérdés {currentQuestionIndex + 1} / {processedQuestions.length}</span>
              <span>{Math.round(((currentQuestionIndex + 1) / processedQuestions.length) * 100)}%</span>
            </div>
            <Progress value={((currentQuestionIndex + 1) / processedQuestions.length) * 100} />
          </div>
        )}
      </Card>

      {/* Current Question */}
      {!isPaused && renderQuestion()}

      {/* Immediate Feedback */}
      {feedback && (
        <Card className={cn(
          "p-6 border-2",
          feedback.type === 'success' && "border-green-500 bg-green-50",
          feedback.type === 'error' && "border-red-500 bg-red-50",
          feedback.type === 'warning' && "border-yellow-500 bg-yellow-50",
          feedback.type === 'info' && "border-brand-secondary bg-brand-secondary/5"
        )}>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              {feedback.type === 'success' && <CheckCircle className="w-6 h-6 text-green-600" />}
              {feedback.type === 'error' && <XCircle className="w-6 h-6 text-red-600" />}
              {feedback.type === 'warning' && <Clock className="w-6 h-6 text-yellow-600" />}
              {feedback.type === 'info' && <Zap className="w-6 h-6 text-brand-secondary" />}
            </div>
            
            <div className="flex-1">
              <h3 className="font-medium mb-1">{feedback.title}</h3>
              <p className="text-sm mb-4">{feedback.message}</p>
              
              {feedback.showResources && currentQuestion.resources && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium mb-2">További források:</h4>
                  <div className="space-y-1">
                    {currentQuestion.resources.map((resource, index) => (
                      <a
                        key={index}
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-brand-secondary hover:text-brand-secondary-hover"
                      >
                        <BookOpen className="w-4 h-4" />
                        {resource.title}
                      </a>
                    ))}
                  </div>
                </div>
              )}
              
              {feedback.actions && (
                <div className="flex gap-2">
                  {feedback.actions.map((action, index) => (
                    <Button
                      key={index}
                      variant={action.variant || 'default'}
                      size="sm"
                      onClick={action.action}
                    >
                      {action.label}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={previousQuestion}
          disabled={currentQuestionIndex === 0}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Előző
        </Button>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setAnalytics(prev => ({ ...prev, skipCount: prev.skipCount + 1 }))
              nextQuestion()
            }}
          >
            Kihagyás
          </Button>
          
          <Button
            onClick={nextQuestion}
            className="flex items-center gap-2"
          >
            {currentQuestionIndex === processedQuestions.length - 1 ? 'Befejezés' : 'Következő'}
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}