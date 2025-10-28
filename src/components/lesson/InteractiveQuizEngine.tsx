"use client"

import React, { useState, useEffect, useCallback } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ComponentErrorBoundary } from '@/components/error/GlobalErrorBoundary'
import { useQuizErrorHandling } from '@/hooks/useErrorHandling'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Award, 
  RotateCcw, 
  ArrowRight, 
  ArrowLeft,
  Lightbulb,
  Target,
  Timer,
  Brain,
  Trophy,
  AlertCircle,
  AlertTriangle,
  BookOpen,
  Code,
  FileText,
  HelpCircle,
  BarChart3
} from 'lucide-react'
import { LessonQuiz, LessonQuizQuestion, LessonQuizAnswer } from '@/types'

interface QuizState {
  currentQuestionIndex: number
  responses: Record<string, string | string[]>
  timeSpent: number
  questionStartTime: number
  questionTimes: Record<string, number>
  submitted: boolean
  score: number
  passed: boolean
  attemptsUsed: number
}

interface QuizResults {
  totalQuestions: number
  correctAnswers: number
  score: number
  passed: boolean
  timeSpent: number
  questionResults: Array<{
    questionId: string
    correct: boolean
    userAnswer: string | string[]
    correctAnswer: string | string[]
    timeSpent: number
    explanation?: string
    partialScore?: number // Score for this question (0-1)
    feedback?: string // Detailed feedback for this question
    questionType?: string // Type of question for result analysis
  }>
  totalPartialScore?: number // Sum of all partial scores
  averageQuestionTime?: number // Average time per question
  performanceByType?: Record<string, { correct: number; total: number; averageScore: number }> // Performance breakdown by question type
}

interface ResumeContext {
  startQuestion?: number
  showResumeNotification?: boolean
  resumeMessage?: string
}

interface InteractiveQuizEngineProps {
  quiz: LessonQuiz
  open: boolean
  onClose: () => void
  onCompleted: (results: QuizResults) => void
  onPassed: () => void
  lessonTitle?: string
  allowReview?: boolean
  resumeContext?: ResumeContext | null
}

export const InteractiveQuizEngine: React.FC<InteractiveQuizEngineProps> = ({
  quiz,
  open,
  onClose,
  onCompleted,
  onPassed,
  lessonTitle = "Quiz",
  allowReview = true,
  resumeContext = null
}) => {
  // Error handling
  const quizErrorHandling = useQuizErrorHandling(quiz.id, lessonTitle)

  const [quizState, setQuizState] = useState<QuizState>({
    currentQuestionIndex: resumeContext?.startQuestion ? Math.max(0, resumeContext.startQuestion - 1) : 0,
    responses: {},
    timeSpent: 0,
    questionStartTime: Date.now(),
    questionTimes: {},
    submitted: false,
    score: 0,
    passed: false,
    attemptsUsed: 0
  })

  // Load saved progress on mount
  useEffect(() => {
    const savedProgress = quizErrorHandling.loadSavedProgress()
    if (savedProgress && !quizState.submitted) {
      setQuizState(prev => ({
        ...prev,
        ...savedProgress,
        questionStartTime: Date.now() // Reset question timer
      }))
    }
  }, [])

  const [showExplanation, setShowExplanation] = useState(false)
  const [isReviewMode, setIsReviewMode] = useState(false)
  const [timeLeft, setTimeLeft] = useState<number | null>(null)

  const currentQuestion = quiz.questions[quizState.currentQuestionIndex]
  const isLastQuestion = quizState.currentQuestionIndex === quiz.questions.length - 1
  const canRetake = quiz.allowRetakes && (quiz.maxAttempts === null || quizState.attemptsUsed < (quiz.maxAttempts || 0))

  // Timer setup
  useEffect(() => {
    if (quiz.timeLimitMinutes && !quizState.submitted) {
      setTimeLeft(quiz.timeLimitMinutes * 60)
    }
  }, [quiz.timeLimitMinutes, quizState.submitted])

  // Timer countdown
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0 || quizState.submitted) return

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev && prev <= 1) {
          handleAutoSubmit()
          return 0
        }
        return prev ? prev - 1 : 0
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [timeLeft, quizState.submitted])

  // Track time spent on questions
  useEffect(() => {
    const interval = setInterval(() => {
      if (!quizState.submitted) {
        setQuizState(prev => ({
          ...prev,
          timeSpent: prev.timeSpent + 1
        }))
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [quizState.submitted])

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  const handleAnswer = (questionId: string, answer: string | string[]) => {
    setQuizState(prev => ({
      ...prev,
      responses: {
        ...prev.responses,
        [questionId]: answer
      }
    }))
  }

  const handleNextQuestion = () => {
    // Record time spent on current question
    const timeSpent = Math.floor((Date.now() - quizState.questionStartTime) / 1000)
    setQuizState(prev => ({
      ...prev,
      questionTimes: {
        ...prev.questionTimes,
        [currentQuestion.id]: timeSpent
      },
      currentQuestionIndex: prev.currentQuestionIndex + 1,
      questionStartTime: Date.now()
    }))
    setShowExplanation(false)
  }

  const handlePreviousQuestion = () => {
    if (quizState.currentQuestionIndex > 0) {
      setQuizState(prev => ({
        ...prev,
        currentQuestionIndex: prev.currentQuestionIndex - 1,
        questionStartTime: Date.now()
      }))
      setShowExplanation(false)
    }
  }

  // Enhanced auto-grading system with support for all question types
  const gradeQuestion = useCallback((question: LessonQuizQuestion, userAnswer: string | string[]) => {
    const correctAnswers = question.answers.filter(a => a.isCorrect)
    let isCorrect = false
    let partialScore = 0
    let feedback = ''

    switch (question.questionType) {
      case 'SINGLE':
        // Single choice - exact match required
        const correctAnswer = correctAnswers[0]
        isCorrect = userAnswer === correctAnswer?.id
        partialScore = isCorrect ? 1 : 0
        feedback = isCorrect ? 'Helyes válasz!' : `Helyes válasz: ${correctAnswer?.text || 'N/A'}`
        break

      case 'MULTIPLE':
        // Multiple choice - all correct answers must be selected, no incorrect ones
        const userSelections = Array.isArray(userAnswer) ? userAnswer : []
        const correctIds = correctAnswers.map(a => a.id)
        const allCorrectSelected = correctIds.every(id => userSelections.includes(id))
        const noIncorrectSelected = userSelections.every(id => correctIds.includes(id))
        
        isCorrect = allCorrectSelected && noIncorrectSelected
        
        // Partial scoring for multiple choice
        if (isCorrect) {
          partialScore = 1
          feedback = 'Minden helyes választás kiválasztva!'
        } else {
          const correctSelections = userSelections.filter(id => correctIds.includes(id)).length
          const incorrectSelections = userSelections.filter(id => !correctIds.includes(id)).length
          partialScore = Math.max(0, (correctSelections - incorrectSelections) / correctIds.length)
          feedback = `Részlegesen helyes: ${correctSelections}/${correctIds.length} helyes válasz`
        }
        break

      case 'SCENARIO':
        // Scenario-based questions - context-aware grading
        isCorrect = gradeScenarioQuestion(question, userAnswer, correctAnswers)
        partialScore = isCorrect ? 1 : 0
        
        // Enhanced feedback for scenario questions
        if (isCorrect) {
          feedback = 'Kiváló döntés! A forgatókönyv kontextusában helyes választás.'
        } else {
          feedback = `A forgatókönyv alapján a helyes megközelítés: ${correctAnswers[0]?.explanation || 'Lásd a magyarázatot'}`
        }
        break

      case 'CODE':
        // Code questions - pattern matching and logic validation
        const codeGradingResult = gradeCodeQuestion(question, userAnswer as string, correctAnswers)
        isCorrect = codeGradingResult.isCorrect
        partialScore = codeGradingResult.partialScore
        feedback = codeGradingResult.feedback
        break

      default:
        // Fallback to single choice logic
        const fallbackAnswer = correctAnswers[0]
        isCorrect = userAnswer === fallbackAnswer?.id
        partialScore = isCorrect ? 1 : 0
        feedback = isCorrect ? 'Helyes válasz!' : 'Helytelen válasz'
    }

    return {
      isCorrect,
      partialScore,
      feedback,
      correctAnswerIds: correctAnswers.map(a => a.id)
    }
  }, [])

  // Scenario question grading logic
  const gradeScenarioQuestion = useCallback((
    question: LessonQuizQuestion, 
    userAnswer: string | string[], 
    correctAnswers: LessonQuizAnswer[]
  ) => {
    // For scenario questions, we need to consider:
    // 1. The primary correct answer
    // 2. Alternative acceptable answers based on scenario context
    // 3. Partial credit for reasonable but suboptimal choices
    
    const primaryCorrect = correctAnswers.find(a => a.isCorrect && a.isPrimary !== false)
    const alternativeCorrect = correctAnswers.filter(a => a.isCorrect && a.isPrimary === false)
    
    // Check primary answer first
    if (userAnswer === primaryCorrect?.id) {
      return true
    }
    
    // Check alternative correct answers
    if (alternativeCorrect.some(answer => userAnswer === answer.id)) {
      return true
    }
    
    return false
  }, [])

  // Code question grading logic
  const gradeCodeQuestion = useCallback((
    question: LessonQuizQuestion,
    userCode: string,
    correctAnswers: LessonQuizAnswer[]
  ) => {
    if (!userCode || typeof userCode !== 'string') {
      return {
        isCorrect: false,
        partialScore: 0,
        feedback: 'Kód megadása szükséges'
      }
    }

    const normalizedUserCode = normalizeCode(userCode)
    let bestScore = 0
    let feedback = 'Kód elemzés...'
    let isCorrect = false

    // Check against each correct solution
    for (const correctAnswer of correctAnswers) {
      if (!correctAnswer.codePattern && !correctAnswer.text) continue
      
      const expectedPattern = correctAnswer.codePattern || correctAnswer.text
      const score = calculateCodeSimilarity(normalizedUserCode, expectedPattern)
      
      if (score > bestScore) {
        bestScore = score
        
        if (score >= 0.9) {
          isCorrect = true
          feedback = 'Kiváló! A kód megoldás helyes és hatékony.'
        } else if (score >= 0.7) {
          feedback = 'Jó megközelítés, de van helyettesítési lehetőség. Részlegesen helyes.'
        } else if (score >= 0.5) {
          feedback = 'A logika része helyes, de a megvalósítás hiányos.'
        } else {
          feedback = 'A megoldás nem felel meg a követelményeknek. Ellenőrizze a kód logikáját.'
        }
      }
    }

    // Additional syntax and logic checks
    const syntaxIssues = checkCodeSyntax(normalizedUserCode, question.codeLanguage || 'javascript')
    if (syntaxIssues.length > 0 && bestScore > 0.5) {
      bestScore *= 0.8 // Reduce score for syntax issues
      feedback += ` Szintaxis figyelmeztetések: ${syntaxIssues.join(', ')}`
    }

    return {
      isCorrect,
      partialScore: bestScore,
      feedback
    }
  }, [])

  // Code normalization helper
  const normalizeCode = (code: string): string => {
    return code
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/;\s*$/, '') // Remove trailing semicolons
      .trim()
      .toLowerCase()
  }

  // Code similarity calculation using basic pattern matching
  const calculateCodeSimilarity = (userCode: string, expectedPattern: string): number => {
    const normalizedExpected = normalizeCode(expectedPattern)
    
    // Direct match
    if (userCode === normalizedExpected) {
      return 1.0
    }
    
    // Keyword matching
    const expectedKeywords = extractCodeKeywords(normalizedExpected)
    const userKeywords = extractCodeKeywords(userCode)
    const keywordMatch = expectedKeywords.filter(k => userKeywords.includes(k)).length / expectedKeywords.length
    
    // Structure matching (basic)
    const structureMatch = calculateStructureSimilarity(userCode, normalizedExpected)
    
    // Weighted score
    return (keywordMatch * 0.6) + (structureMatch * 0.4)
  }

  // Extract important keywords from code
  const extractCodeKeywords = (code: string): string[] => {
    const keywords = code.match(/\b(function|var|let|const|if|else|for|while|return|class|=>|=|==|===|\+|\-|\*|\/)\b/g) || []
    return [...new Set(keywords)] // Remove duplicates
  }

  // Calculate structural similarity between code snippets
  const calculateStructureSimilarity = (code1: string, code2: string): number => {
    const len1 = code1.length
    const len2 = code2.length
    const maxLen = Math.max(len1, len2)
    
    if (maxLen === 0) return 1.0
    
    // Simple Levenshtein-inspired similarity
    let commonChars = 0
    const minLen = Math.min(len1, len2)
    
    for (let i = 0; i < minLen; i++) {
      if (code1[i] === code2[i]) {
        commonChars++
      }
    }
    
    return commonChars / maxLen
  }

  // Basic syntax checking for common languages
  const checkCodeSyntax = (code: string, language: string): string[] => {
    const issues: string[] = []
    
    switch (language?.toLowerCase()) {
      case 'javascript':
      case 'js':
        // Check for basic JavaScript syntax issues
        if (code.includes('=') && !code.includes('==') && !code.includes('===') && code.includes('if')) {
          issues.push('Összehasonlításnál használjon == vagy === operátort')
        }
        if ((code.match(/\(/g) || []).length !== (code.match(/\)/g) || []).length) {
          issues.push('Nem egyeznek a zárójelek')
        }
        break
      
      case 'python':
        // Basic Python syntax checks
        if (code.includes('\t') && code.includes('    ')) {
          issues.push('Keverd ne a tab és szóköz behúzást')
        }
        break
      
      default:
        // Generic checks
        if ((code.match(/\{/g) || []).length !== (code.match(/\}/g) || []).length) {
          issues.push('Nem egyeznek a kapcsos zárójelek')
        }
    }
    
    return issues
  }

  const calculateResults = useCallback((): QuizResults => {
    let totalScore = 0
    let correctCount = 0
    
    const questionResults = quiz.questions.map(question => {
      const userAnswer = quizState.responses[question.id]
      const gradingResult = gradeQuestion(question, userAnswer)
      
      totalScore += gradingResult.partialScore
      if (gradingResult.isCorrect) correctCount++

      return {
        questionId: question.id,
        correct: gradingResult.isCorrect,
        userAnswer,
        correctAnswer: gradingResult.correctAnswerIds.length === 1 
          ? gradingResult.correctAnswerIds[0]
          : gradingResult.correctAnswerIds,
        timeSpent: quizState.questionTimes[question.id] || 0,
        explanation: question.explanation,
        partialScore: gradingResult.partialScore,
        feedback: gradingResult.feedback
      }
    })

    // Calculate final score with partial credit support
    const score = Math.round((totalScore / quiz.questions.length) * 100)
    const passed = score >= quiz.passingScore

    // Calculate performance metrics by question type
    const performanceByType: Record<string, { correct: number; total: number; averageScore: number }> = {}
    
    quiz.questions.forEach((question, index) => {
      const result = questionResults[index]
      const type = question.questionType
      
      if (!performanceByType[type]) {
        performanceByType[type] = { correct: 0, total: 0, averageScore: 0 }
      }
      
      performanceByType[type].total++
      if (result.correct) {
        performanceByType[type].correct++
      }
      performanceByType[type].averageScore += (result.partialScore || 0)
    })

    // Calculate averages
    Object.keys(performanceByType).forEach(type => {
      performanceByType[type].averageScore /= performanceByType[type].total
    })

    // Calculate average question time
    const totalQuestionTime = Object.values(quizState.questionTimes).reduce((sum, time) => sum + time, 0)
    const averageQuestionTime = totalQuestionTime / quiz.questions.length

    return {
      totalQuestions: quiz.questions.length,
      correctAnswers: correctCount,
      score,
      passed,
      timeSpent: quizState.timeSpent,
      questionResults,
      totalPartialScore: totalScore,
      averageQuestionTime,
      performanceByType
    }
  }, [quiz, quizState, gradeQuestion])

  const handleSubmit = () => {
    try {
      const results = calculateResults()
      
      setQuizState(prev => ({
        ...prev,
        submitted: true,
        score: results.score,
        passed: results.passed,
        attemptsUsed: prev.attemptsUsed + 1
      }))

      // Clear saved progress on successful submission
      quizErrorHandling.clearSavedProgress()
      
      // Call completion callbacks
      onCompleted(results)
      if (results.passed) {
        onPassed()
      }
    } catch (error) {
      // Handle submission error and save progress
      quizErrorHandling.handleQuizError(error, quizState)
    }
  }

  const handleAutoSubmit = () => {
    handleSubmit()
  }

  const handleRetake = () => {
    setQuizState({
      currentQuestionIndex: 0,
      responses: {},
      timeSpent: 0,
      questionStartTime: Date.now(),
      questionTimes: {},
      submitted: false,
      score: 0,
      passed: false,
      attemptsUsed: quizState.attemptsUsed
    })
    setShowExplanation(false)
    setIsReviewMode(false)
    if (quiz.timeLimitMinutes) {
      setTimeLeft(quiz.timeLimitMinutes * 60)
    }
  }

  const renderQuestion = (question: LessonQuizQuestion) => {
    const userAnswer = quizState.responses[question.id]

    return (
      <Card className="w-full">
        <CardContent className="p-6">
          {/* Question Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Badge className="bg-gray-100 text-gray-700">
                {question.questionType === 'SINGLE' && <HelpCircle className="w-3 h-3 mr-1" />}
                {question.questionType === 'MULTIPLE' && <CheckCircle className="w-3 h-3 mr-1" />}
                {question.questionType === 'SCENARIO' && <BookOpen className="w-3 h-3 mr-1" />}
                {question.questionType === 'CODE' && <Code className="w-3 h-3 mr-1" />}
                {question.questionType === 'SINGLE' && 'Egyszeres választás'}
                {question.questionType === 'MULTIPLE' && 'Többszörös választás'}
                {question.questionType === 'SCENARIO' && 'Forgatókönyv'}
                {question.questionType === 'CODE' && 'Kód feladat'}
              </Badge>
              <Badge className="bg-blue-100 text-blue-800">
                {question.points} pont
              </Badge>
            </div>
          </div>

          {/* Scenario Content */}
          {question.scenarioContent && (
            <Card className="mb-4 bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-start space-x-2">
                  <BookOpen className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-blue-800 mb-2">Forgatókönyv</h4>
                    <div className="text-sm text-blue-700 whitespace-pre-wrap">
                      {question.scenarioContent}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Code Block */}
          {question.codeBlock && (
            <Card className="mb-4 bg-gray-50 border-gray-200">
              <CardContent className="p-4">
                <div className="flex items-start space-x-2">
                  <Code className="w-5 h-5 text-gray-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-800">Kód</h4>
                      <Badge className="text-xs bg-gray-200 text-gray-700">
                        {question.codeBlock.language}
                      </Badge>
                    </div>
                    <pre className="text-sm bg-gray-100 p-3 rounded border overflow-x-auto">
                      <code>{question.codeBlock.code}</code>
                    </pre>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Question Text */}
          <h3 className="text-lg font-semibold mb-4 leading-relaxed">
            {question.questionText}
          </h3>

          {/* Answer Options */}
          <div className="space-y-3">
            {question.questionType === 'CODE' ? (
              // Code input textarea
              <div className="space-y-2">
                <Label htmlFor={`code-${question.id}`} className="text-sm font-medium">
                  Írja be a kódot:
                </Label>
                <Textarea
                  id={`code-${question.id}`}
                  placeholder="// Írja ide a kódot..."
                  value={typeof userAnswer === 'string' ? userAnswer : ''}
                  onChange={(e) => handleAnswer(question.id, e.target.value)}
                  disabled={quizState.submitted}
                  className="font-mono text-sm min-h-32 resize-y"
                  rows={6}
                />
                {question.codeLanguage && (
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Code className="w-3 h-3" />
                    <span>Nyelv: {question.codeLanguage}</span>
                  </div>
                )}
                {quizState.submitted && (
                  <div className="mt-2 p-3 bg-gray-50 rounded-lg border">
                    <div className="text-xs text-gray-600 mb-1">Kód elemzés eredménye:</div>
                    <div className="text-sm">
                      {/* Code grading feedback will be shown here */}
                      {quiz.questions.find(q => q.id === question.id) && 
                       (() => {
                         const gradingResult = gradeQuestion(question, userAnswer)
                         return (
                           <div className={`${gradingResult.isCorrect ? 'text-green-700' : 'text-orange-700'}`}>
                             {gradingResult.feedback}
                           </div>
                         )
                       })()
                      }
                    </div>
                  </div>
                )}
              </div>
            ) : question.questionType === 'MULTIPLE' ? (
              // Multiple choice checkboxes
              question.answers.map((answer) => (
                <div key={answer.id} className="flex items-start space-x-3">
                  <Checkbox
                    id={`answer-${answer.id}`}
                    checked={Array.isArray(userAnswer) ? userAnswer.includes(answer.id) : false}
                    onCheckedChange={(checked) => {
                      const currentAnswers = Array.isArray(userAnswer) ? userAnswer : []
                      if (checked) {
                        handleAnswer(question.id, [...currentAnswers, answer.id])
                      } else {
                        handleAnswer(question.id, currentAnswers.filter(id => id !== answer.id))
                      }
                    }}
                    disabled={quizState.submitted}
                  />
                  <Label 
                    htmlFor={`answer-${answer.id}`}
                    className="flex-1 cursor-pointer leading-relaxed"
                  >
                    {answer.text}
                  </Label>
                  {quizState.submitted && answer.isCorrect && (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  )}
                  {quizState.submitted && !answer.isCorrect && Array.isArray(userAnswer) && userAnswer.includes(answer.id) && (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                </div>
              ))
            ) : (
              // Single choice radio buttons
              <RadioGroup
                value={typeof userAnswer === 'string' ? userAnswer : ''}
                onValueChange={(value) => handleAnswer(question.id, value)}
                disabled={quizState.submitted}
              >
                {question.answers.map((answer) => (
                  <div key={answer.id} className="flex items-start space-x-3">
                    <RadioGroupItem
                      value={answer.id}
                      id={`answer-${answer.id}`}
                      disabled={quizState.submitted}
                    />
                    <Label 
                      htmlFor={`answer-${answer.id}`}
                      className="flex-1 cursor-pointer leading-relaxed"
                    >
                      {answer.text}
                    </Label>
                    {quizState.submitted && answer.isCorrect && (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    )}
                    {quizState.submitted && !answer.isCorrect && userAnswer === answer.id && (
                      <XCircle className="w-5 h-5 text-red-500" />
                    )}
                  </div>
                ))}
              </RadioGroup>
            )}
          </div>

          {/* Question Feedback */}
          {quizState.submitted && (
            <div className="mt-4 p-4 rounded-lg border">
              <div className="flex items-start space-x-2">
                <Lightbulb className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-blue-800 mb-2">Magyarázat</h4>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {question.explanation || 'Nincs elérhető magyarázat ehhez a kérdéshez.'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  const renderResults = () => {
    const results = calculateResults()
    
    return (
      <div className="space-y-6">
        {/* Results Header */}
        <Card className={`border-2 ${results.passed ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
          <CardContent className="p-6 text-center">
            <div className="flex justify-center mb-4">
              {results.passed ? (
                <Trophy className="w-16 h-16 text-green-500" />
              ) : (
                <AlertCircle className="w-16 h-16 text-red-500" />
              )}
            </div>
            
            <h2 className="text-2xl font-bold mb-2">
              {results.passed ? 'Gratulálunk!' : 'Próbálja újra!'}
            </h2>
            
            <p className="text-lg mb-2">
              {results.score}% ({results.correctAnswers}/{results.totalQuestions} helyes válasz)
            </p>
            
            {results.totalPartialScore && results.totalPartialScore !== results.correctAnswers && (
              <p className="text-sm text-gray-600 mb-4">
                Részleges pontszám: {(results.totalPartialScore / results.totalQuestions * 100).toFixed(1)}%
              </p>
            )}
            
            <div className="flex justify-center space-x-6 text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <Clock className="w-4 h-4" />
                <span>Időtartam: {formatTime(results.timeSpent)}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Target className="w-4 h-4" />
                <span>Cél: {quiz.passingScore}%</span>
              </div>
              {results.averageQuestionTime && (
                <div className="flex items-center space-x-1">
                  <Timer className="w-4 h-4" />
                  <span>Átlag: {formatTime(results.averageQuestionTime)}/kérdés</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Detailed Results */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5" />
              <span>Részletes eredmények</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {results.questionResults.map((result, index) => {
                const question = quiz.questions.find(q => q.id === result.questionId)
                const hasPartialCredit = result.partialScore && result.partialScore > 0 && result.partialScore < 1
                return (
                  <div key={result.questionId} className="border rounded-lg overflow-hidden">
                    <div className="flex items-center justify-between p-3 bg-gray-50">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          {result.correct ? (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          ) : hasPartialCredit ? (
                            <div className="w-5 h-5 rounded-full bg-orange-100 flex items-center justify-center">
                              <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                            </div>
                          ) : (
                            <XCircle className="w-5 h-5 text-red-500" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="font-medium">Kérdés {index + 1}</p>
                            <div className="flex items-center space-x-2 text-sm">
                              {question?.questionType && (
                                <Badge variant="outline" className="text-xs">
                                  {question.questionType === 'SINGLE' && 'Egyszeres'}
                                  {question.questionType === 'MULTIPLE' && 'Többszörös'}
                                  {question.questionType === 'SCENARIO' && 'Forgatókönyv'}
                                  {question.questionType === 'CODE' && 'Kód'}
                                </Badge>
                              )}
                              {result.partialScore !== undefined && (
                                <Badge className={`text-xs ${
                                  result.partialScore === 1 ? 'bg-green-100 text-green-800' :
                                  result.partialScore > 0.5 ? 'bg-orange-100 text-orange-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {(result.partialScore * 100).toFixed(0)}%
                                </Badge>
                              )}
                              <span className="text-gray-500">
                                {formatTime(result.timeSpent)}
                              </span>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 line-clamp-1 mt-1">
                            {question?.questionText}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Enhanced feedback section */}
                    {result.feedback && (
                      <div className="p-3 border-t bg-white">
                        <div className="flex items-start space-x-2">
                          <Lightbulb className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-blue-800 mb-1">Visszajelzés</p>
                            <p className="text-sm text-gray-700">{result.feedback}</p>
                            
                            {/* Show additional explanation if available */}
                            {result.explanation && result.explanation !== result.feedback && (
                              <div className="mt-2 pt-2 border-t border-gray-100">
                                <p className="text-xs text-gray-600">{result.explanation}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Performance Breakdown by Question Type */}
        {results.performanceByType && Object.keys(results.performanceByType).length > 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="w-5 h-5" />
                <span>Teljesítmény kérdéstípusok szerint</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(results.performanceByType).map(([type, stats]) => (
                  <div key={type} className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="flex justify-center mb-2">
                      {type === 'SINGLE' && <HelpCircle className="w-6 h-6 text-blue-500" />}
                      {type === 'MULTIPLE' && <CheckCircle className="w-6 h-6 text-green-500" />}
                      {type === 'SCENARIO' && <BookOpen className="w-6 h-6 text-purple-500" />}
                      {type === 'CODE' && <Code className="w-6 h-6 text-orange-500" />}
                    </div>
                    <h4 className="font-medium text-sm mb-1">
                      {type === 'SINGLE' && 'Egyszeres'}
                      {type === 'MULTIPLE' && 'Többszörös'}
                      {type === 'SCENARIO' && 'Forgatókönyv'}
                      {type === 'CODE' && 'Kód feladat'}
                    </h4>
                    <div className="text-lg font-bold text-gray-900">
                      {stats.correct}/{stats.total}
                    </div>
                    <div className="text-xs text-gray-500">
                      {(stats.averageScore * 100).toFixed(0)}% átlag
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex justify-center space-x-4">
          {!results.passed && canRetake && (
            <Button onClick={handleRetake} className="px-6">
              <RotateCcw className="w-4 h-4 mr-2" />
              Újrapróbálás
            </Button>
          )}
          
          {allowReview && (
            <Button variant="outline" onClick={() => setIsReviewMode(true)}>
              <FileText className="w-4 h-4 mr-2" />
              Válaszok áttekintése
            </Button>
          )}
          
          <Button variant="outline" onClick={onClose}>
            Bezárás
          </Button>
        </div>
      </div>
    )
  }

  if (!open) return null

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <ComponentErrorBoundary 
          context={`QuizEngine-${quiz.id}`}
          fallback={
            <div className="p-8 text-center">
              <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-red-500" />
              <h3 className="text-xl font-semibold mb-2">Kvíz betöltési hiba</h3>
              <p className="text-gray-600 mb-4">A kvíz jelenleg nem érhető el.</p>
              {quizErrorHandling.progressSaved && (
                <p className="text-sm text-blue-600 mb-4">
                  Az eddig elért haladása mentésre került.
                </p>
              )}
              <Button onClick={onClose}>Bezárás</Button>
            </div>
          }
        >
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{lessonTitle} - Kvíz</span>
            <div className="flex items-center space-x-4 text-sm">
              {timeLeft !== null && !quizState.submitted && (
                <div className="flex items-center space-x-1 text-orange-600">
                  <Timer className="w-4 h-4" />
                  <span>{formatTime(timeLeft)}</span>
                </div>
              )}
              {!quizState.submitted && (
                <div className="flex items-center space-x-1 text-gray-600">
                  <Brain className="w-4 h-4" />
                  <span>{formatTime(quizState.timeSpent)}</span>
                </div>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col h-full">
          {!quizState.submitted ? (
            <>
              {/* Progress Bar */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">
                    Kérdés {quizState.currentQuestionIndex + 1} / {quiz.questions.length}
                  </span>
                  <span className="text-sm text-gray-600">
                    {Math.round(((quizState.currentQuestionIndex + 1) / quiz.questions.length) * 100)}%
                  </span>
                </div>
                <Progress 
                  value={((quizState.currentQuestionIndex + 1) / quiz.questions.length) * 100} 
                  className="h-2"
                />
              </div>

              {/* Question Content */}
              <div className="flex-1 overflow-y-auto">
                {renderQuestion(currentQuestion)}
              </div>

              {/* Navigation */}
              <div className="flex justify-between items-center mt-6 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={handlePreviousQuestion}
                  disabled={quizState.currentQuestionIndex === 0}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Előző
                </Button>

                <div className="text-sm text-gray-500">
                  {Object.keys(quizState.responses).length} / {quiz.questions.length} válaszolva
                </div>

                {isLastQuestion ? (
                  <Button
                    onClick={handleSubmit}
                    disabled={Object.keys(quizState.responses).length === 0}
                    className="px-6"
                  >
                    <Award className="w-4 h-4 mr-2" />
                    Befejezés
                  </Button>
                ) : (
                  <Button
                    onClick={handleNextQuestion}
                    disabled={!quizState.responses[currentQuestion.id]}
                  >
                    Következő
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 overflow-y-auto">
              {renderResults()}
            </div>
          )}
        </div>
        </ComponentErrorBoundary>
      </DialogContent>
    </Dialog>
  )
}