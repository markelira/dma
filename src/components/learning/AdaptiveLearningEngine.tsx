"use client"

import React, { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Brain, 
  TrendingUp, 
  Target, 
  Clock, 
  Lightbulb,
  AlertCircle,
  CheckCircle,
  Star,
  Zap,
  BookOpen,
  Video,
  FileText,
  Award,
  BarChart3,
  Settings,
  RefreshCw,
  ArrowRight,
  User,
  Sparkles
} from 'lucide-react'

interface LearningProfile {
  userId: string
  preferredContentType: 'VIDEO' | 'TEXT' | 'READING' | 'QUIZ'
  learningSpeed: 'slow' | 'medium' | 'fast'
  comprehensionLevel: 'beginner' | 'intermediate' | 'advanced'
  attentionSpan: number // in minutes
  optimalSessionLength: number // in minutes
  bestPerformanceTime: 'morning' | 'afternoon' | 'evening' | 'night'
  weakAreas: string[]
  strongAreas: string[]
  motivationStyle: 'achievement' | 'progress' | 'competition' | 'mastery'
  lastUpdated: Date
}

interface LearningRecommendation {
  id: string
  type: 'content' | 'schedule' | 'strategy' | 'review' | 'break'
  title: string
  description: string
  actionText: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  estimatedBenefit: number // 0-100
  estimatedTime: number // in minutes
  confidence: number // 0-100
  reasoning: string
  action: () => void
}

interface LearningAnalytics {
  completionRate: number
  averageSessionTime: number
  quizPerformance: number
  engagementScore: number
  retentionRate: number
  strugglingConcepts: string[]
  masteredConcepts: string[]
  learningVelocity: number
  consistencyScore: number
  focusScore: number
}

interface PersonalizedContent {
  lessonId: string
  adaptations: {
    difficulty: 'easier' | 'normal' | 'harder'
    pace: 'slower' | 'normal' | 'faster'
    examples: 'more' | 'normal' | 'fewer'
    practice: 'more' | 'normal' | 'fewer'
    explanations: 'detailed' | 'normal' | 'brief'
  }
  recommendedOrder: string[]
  suggestedBreaks: number[]
  estimatedTime: number
}

interface AdaptiveLearningEngineProps {
  userId: string
  courseId: string
  currentLessonId: string
  learningProfile: LearningProfile
  learningAnalytics: LearningAnalytics
  onUpdateProfile: (updates: Partial<LearningProfile>) => void
  onApplyRecommendation: (recommendation: LearningRecommendation) => void
  className?: string
}

export const AdaptiveLearningEngine: React.FC<AdaptiveLearningEngineProps> = ({
  userId,
  courseId,
  currentLessonId,
  learningProfile,
  learningAnalytics,
  onUpdateProfile,
  onApplyRecommendation,
  className = ''
}) => {
  const [recommendations, setRecommendations] = useState<LearningRecommendation[]>([])
  const [showDetailedAnalysis, setShowDetailedAnalysis] = useState(false)
  const [isOptimizing, setIsOptimizing] = useState(false)

  // Generate personalized recommendations based on learning data
  const generateRecommendations = useMemo(() => {
    const recs: LearningRecommendation[] = []
    const currentTime = new Date().getHours()

    // Content Type Recommendations
    if (learningAnalytics.engagementScore < 70 && learningProfile.preferredContentType !== 'VIDEO') {
      recs.push({
        id: 'content-type-video',
        type: 'content',
        title: 'Próbáljon videó leckéket',
        description: 'Az elemzések alapján a videó tartalom javíthatja az elkötelezettségét',
        actionText: 'Videó leckékre váltás',
        priority: 'medium',
        estimatedBenefit: 25,
        estimatedTime: 0,
        confidence: 80,
        reasoning: 'A vizuális tanulás növelheti a figyelem és megértés szintjét',
        action: () => onUpdateProfile({ preferredContentType: 'VIDEO' })
      })
    }

    // Session Length Optimization
    if (learningAnalytics.averageSessionTime > learningProfile.optimalSessionLength + 10) {
      recs.push({
        id: 'session-length',
        type: 'schedule',
        title: 'Rövidebb munkamenetek',
        description: 'Túl hosszú munkamenetek csökkenthetik a hatékonyságot',
        actionText: 'Munkamenet hossz optimalizálása',
        priority: 'high',
        estimatedBenefit: 35,
        estimatedTime: 0,
        confidence: 90,
        reasoning: 'A rövidebb, fókuszált alkalmak javítják a megőrzést',
        action: () => onUpdateProfile({ 
          optimalSessionLength: Math.max(15, learningProfile.optimalSessionLength - 5) 
        })
      })
    }

    // Performance Time Recommendations
    const performanceByTime = {
      morning: currentTime >= 6 && currentTime < 12,
      afternoon: currentTime >= 12 && currentTime < 18,
      evening: currentTime >= 18 && currentTime < 22,
      night: currentTime >= 22 || currentTime < 6
    }

    if (!performanceByTime[learningProfile.bestPerformanceTime] && learningAnalytics.focusScore < 60) {
      recs.push({
        id: 'optimal-time',
        type: 'schedule',
        title: 'Optimális tanulási időpont',
        description: `A legjobb teljesítménye ${learningProfile.bestPerformanceTime === 'morning' ? 'reggel' : 
          learningProfile.bestPerformanceTime === 'afternoon' ? 'délután' : 
          learningProfile.bestPerformanceTime === 'evening' ? 'este' : 'éjjel'} van`,
        actionText: 'Emlékeztető beállítása',
        priority: 'medium',
        estimatedBenefit: 20,
        estimatedTime: 0,
        confidence: 75,
        reasoning: 'A biológiai ritmus követése javítja a tanulási eredményeket',
        action: () => console.log('Setting reminder for optimal time')
      })
    }

    // Difficulty Adjustment
    if (learningAnalytics.quizPerformance > 90 && learningProfile.comprehensionLevel === 'beginner') {
      recs.push({
        id: 'increase-difficulty',
        type: 'strategy',
        title: 'Nehezebb tartalom',
        description: 'Kiváló teljesítménye alapján készen áll nagyobb kihívásokra',
        actionText: 'Szint növelése',
        priority: 'medium',
        estimatedBenefit: 30,
        estimatedTime: 0,
        confidence: 85,
        reasoning: 'A megfelelő kihívás szint fenntartja a motivációt és növeli a fejlődést',
        action: () => onUpdateProfile({ comprehensionLevel: 'intermediate' })
      })
    }

    // Review Recommendations
    if (learningAnalytics.retentionRate < 70) {
      recs.push({
        id: 'review-schedule',
        type: 'review',
        title: 'Ismétlés szükséges',
        description: 'A megőrzési arány javítható rendszeres ismétléssel',
        actionText: 'Ismétlési terv készítése',
        priority: 'high',
        estimatedBenefit: 40,
        estimatedTime: 15,
        confidence: 95,
        reasoning: 'A szervezett ismétlés jelentősen javítja a hosszú távú memóriát',
        action: () => console.log('Creating review schedule')
      })
    }

    // Break Recommendations
    if (learningAnalytics.focusScore < 50) {
      recs.push({
        id: 'take-break',
        type: 'break',
        title: 'Szünet javaslat',
        description: 'A fókusz szint alacsony, egy rövid szünet segíthet',
        actionText: '5 perces szünet',
        priority: 'urgent',
        estimatedBenefit: 25,
        estimatedTime: 5,
        confidence: 90,
        reasoning: 'A rendszeres szünetek megakadályozzák a mentális fáradtságot',
        action: () => console.log('Taking a break')
      })
    }

    return recs.sort((a, b) => {
      const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 }
      return priorityOrder[b.priority] - priorityOrder[a.priority]
    })
  }, [learningProfile, learningAnalytics, onUpdateProfile])

  useEffect(() => {
    setRecommendations(generateRecommendations)
  }, [generateRecommendations])

  const optimizeLearningProfile = async () => {
    setIsOptimizing(true)
    
    // Simulate AI optimization process
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Apply optimizations based on analytics
    const optimizations: Partial<LearningProfile> = {}
    
    if (learningAnalytics.averageSessionTime < 20) {
      optimizations.learningSpeed = 'fast'
    } else if (learningAnalytics.averageSessionTime > 45) {
      optimizations.learningSpeed = 'slow'
    }
    
    if (learningAnalytics.quizPerformance > 85) {
      optimizations.comprehensionLevel = 'advanced'
    } else if (learningAnalytics.quizPerformance < 60) {
      optimizations.comprehensionLevel = 'beginner'
    }
    
    onUpdateProfile(optimizations)
    setIsOptimizing(false)
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200'
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-brand-secondary/10 text-brand-secondary-hover border-brand-secondary/20'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case 'VIDEO': return Video
      case 'TEXT': return FileText
      case 'READING': return BookOpen
      case 'QUIZ': return Brain
      default: return FileText
    }
  }

  const formatTime = (minutes: number): string => {
    if (minutes < 60) return `${minutes}p`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}ó ${mins}p`
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* AI Learning Assistant Header */}
      <Card className="bg-gradient-to-r from-purple-50 to-brand-secondary/5 border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Brain className="w-6 h-6 text-purple-600" />
            <span>AI Tanulási Asszisztens</span>
            <Sparkles className="w-5 h-5 text-purple-500" />
          </CardTitle>
          <p className="text-sm text-gray-600">
            Személyre szabott tanulási élmény és intelligens ajánlások
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {Math.round(learningAnalytics.engagementScore)}%
              </div>
              <div className="text-xs text-gray-600">Elkötelezettség</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-brand-secondary">
                {Math.round(learningAnalytics.focusScore)}%
              </div>
              <div className="text-xs text-gray-600">Fókusz</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {Math.round(learningAnalytics.retentionRate)}%
              </div>
              <div className="text-xs text-gray-600">Megőrzés</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {learningAnalytics.learningVelocity.toFixed(1)}x
              </div>
              <div className="text-xs text-gray-600">Sebesség</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Learning Profile Summary */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <User className="w-5 h-5" />
              <span>Tanulási Profil</span>
            </CardTitle>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={optimizeLearningProfile}
              disabled={isOptimizing}
            >
              {isOptimizing ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Zap className="w-4 h-4 mr-2" />
              )}
              {isOptimizing ? 'Optimalizálás...' : 'AI Optimalizálás'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Preferált tartalom:</span>
                <div className="flex items-center space-x-2">
                  {React.createElement(getContentTypeIcon(learningProfile.preferredContentType), {
                    className: 'w-4 h-4'
                  })}
                  <span className="font-medium">
                    {learningProfile.preferredContentType === 'VIDEO' && 'Videó'}
                    {learningProfile.preferredContentType === 'TEXT' && 'Szöveg'}
                    {learningProfile.preferredContentType === 'READING' && 'Olvasmány'}
                    {learningProfile.preferredContentType === 'QUIZ' && 'Kvíz'}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Tanulási sebesség:</span>
                <Badge className={
                  learningProfile.learningSpeed === 'fast' ? 'bg-green-100 text-green-800' :
                  learningProfile.learningSpeed === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-brand-secondary/10 text-brand-secondary-hover'
                }>
                  {learningProfile.learningSpeed === 'fast' && 'Gyors'}
                  {learningProfile.learningSpeed === 'medium' && 'Közepes'}
                  {learningProfile.learningSpeed === 'slow' && 'Lassú'}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Szint:</span>
                <Badge className={
                  learningProfile.comprehensionLevel === 'advanced' ? 'bg-purple-100 text-purple-800' :
                  learningProfile.comprehensionLevel === 'intermediate' ? 'bg-brand-secondary/10 text-brand-secondary-hover' :
                  'bg-green-100 text-green-800'
                }>
                  {learningProfile.comprehensionLevel === 'advanced' && 'Haladó'}
                  {learningProfile.comprehensionLevel === 'intermediate' && 'Középhaladó'}
                  {learningProfile.comprehensionLevel === 'beginner' && 'Kezdő'}
                </Badge>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Optimális munkamenet:</span>
                <span className="font-medium">{formatTime(learningProfile.optimalSessionLength)}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Figyelemtartam:</span>
                <span className="font-medium">{formatTime(learningProfile.attentionSpan)}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Legjobb időpont:</span>
                <span className="font-medium">
                  {learningProfile.bestPerformanceTime === 'morning' && 'Reggel'}
                  {learningProfile.bestPerformanceTime === 'afternoon' && 'Délután'}
                  {learningProfile.bestPerformanceTime === 'evening' && 'Este'}
                  {learningProfile.bestPerformanceTime === 'night' && 'Éjjel'}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Lightbulb className="w-5 h-5 text-yellow-500" />
            <span>Intelligens Ajánlások</span>
            <Badge className="bg-purple-100 text-purple-800">
              AI által generált
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recommendations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Minden rendben! Jelenleg nincsenek ajánlások.</p>
              <p className="text-sm mt-2">Folytassa a tanulást, és az AI folyamatosan optimalizálja az élményt.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recommendations.map((rec) => (
                <Card key={rec.id} className={`border-l-4 ${
                  rec.priority === 'urgent' ? 'border-l-red-500' :
                  rec.priority === 'high' ? 'border-l-orange-500' :
                  rec.priority === 'medium' ? 'border-l-yellow-500' :
                  'border-l-brand-secondary'
                }`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="font-medium">{rec.title}</h4>
                          <Badge className={getPriorityColor(rec.priority)}>
                            {rec.priority === 'urgent' && 'Sürgős'}
                            {rec.priority === 'high' && 'Magas'}
                            {rec.priority === 'medium' && 'Közepes'}
                            {rec.priority === 'low' && 'Alacsony'}
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-3">{rec.description}</p>
                        
                        <div className="flex items-center space-x-4 text-xs text-gray-500 mb-3">
                          <div className="flex items-center space-x-1">
                            <TrendingUp className="w-3 h-3" />
                            <span>+{rec.estimatedBenefit}% javulás</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>{rec.estimatedTime === 0 ? 'Azonnali' : `${rec.estimatedTime}p`}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Target className="w-3 h-3" />
                            <span>{rec.confidence}% bizonyosság</span>
                          </div>
                        </div>
                        
                        <details className="text-xs text-gray-500">
                          <summary className="cursor-pointer hover:text-gray-700">
                            Miért javasoljuk?
                          </summary>
                          <p className="mt-1 pl-4 border-l-2 border-gray-200">{rec.reasoning}</p>
                        </details>
                      </div>
                      
                      <Button 
                        size="sm" 
                        onClick={() => {
                          rec.action()
                          onApplyRecommendation(rec)
                        }}
                        className="ml-4"
                      >
                        {rec.actionText}
                        <ArrowRight className="w-3 h-3 ml-1" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Learning Analytics */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5" />
              <span>Tanulási Elemzések</span>
            </CardTitle>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowDetailedAnalysis(!showDetailedAnalysis)}
            >
              {showDetailedAnalysis ? 'Kevesebb' : 'Részletek'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Strong Areas */}
            <div>
              <h4 className="font-medium mb-3 flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Erős területek</span>
              </h4>
              <div className="space-y-2">
                {learningProfile.strongAreas.length > 0 ? (
                  learningProfile.strongAreas.map((area, index) => (
                    <Badge key={index} className="bg-green-100 text-green-800 mr-2 mb-2">
                      {area}
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">Még nincsenek azonosított erős területek</p>
                )}
              </div>
            </div>

            {/* Weak Areas */}
            <div>
              <h4 className="font-medium mb-3 flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-orange-500" />
                <span>Fejlesztendő területek</span>
              </h4>
              <div className="space-y-2">
                {learningProfile.weakAreas.length > 0 ? (
                  learningProfile.weakAreas.map((area, index) => (
                    <Badge key={index} className="bg-orange-100 text-orange-800 mr-2 mb-2">
                      {area}
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">Kiválóan teljesít minden területen!</p>
                )}
              </div>
            </div>
          </div>

          {showDetailedAnalysis && (
            <div className="mt-6 pt-6 border-t">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Befejezési arány</span>
                    <span className="font-medium">{Math.round(learningAnalytics.completionRate)}%</span>
                  </div>
                  <Progress value={learningAnalytics.completionRate} className="h-2" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Következetesség</span>
                    <span className="font-medium">{Math.round(learningAnalytics.consistencyScore)}%</span>
                  </div>
                  <Progress value={learningAnalytics.consistencyScore} className="h-2" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Kvíz teljesítmény</span>
                    <span className="font-medium">{Math.round(learningAnalytics.quizPerformance)}%</span>
                  </div>
                  <Progress value={learningAnalytics.quizPerformance} className="h-2" />
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}