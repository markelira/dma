'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  CheckCircle, 
  Clock, 
  Target, 
  TrendingUp, 
  Award, 
  Flame,
  BookOpen,
  Play,
  Trophy,
  Calendar,
  Zap
} from 'lucide-react'

interface EnhancedProgressSystemProps {
  course: any
  modules: any[]
  currentLessonId: string
  flatLessons: any[]
  currentIndex: number
}

export const EnhancedProgressSystem: React.FC<EnhancedProgressSystemProps> = ({
  course,
  modules,
  currentLessonId,
  flatLessons,
  currentIndex
}) => {
  // Calculate progress metrics
  const completedLessons = flatLessons.filter(l => l.progress?.completed).length
  const totalLessons = flatLessons.length
  const overallProgress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0
  
  // Calculate module progress
  const moduleProgress = modules.map(module => {
    const moduleLessons = module.lessons || []
    const completedInModule = moduleLessons.filter((l: any) => l.progress?.completed).length
    const totalInModule = moduleLessons.length
    const progress = totalInModule > 0 ? Math.round((completedInModule / totalInModule) * 100) : 0
    
    return {
      ...module,
      completedLessons: completedInModule,
      totalLessons: totalInModule,
      progress
    }
  })

  // Learning streak simulation (would come from backend)
  const learningStreak = 7
  const weeklyGoal = 5
  const completedThisWeek = 3

  // Estimate remaining time
  const avgLessonDuration = 8 // minutes
  const remainingLessons = totalLessons - completedLessons
  const estimatedTimeRemaining = remainingLessons * avgLessonDuration

  // Achievement badges
  const achievements = [
    { 
      id: 'first_lesson', 
      name: 'Első lépés', 
      earned: completedLessons >= 1,
      icon: <Play className="w-4 h-4" />
    },
    { 
      id: 'quarter_complete', 
      name: 'Negyedrész', 
      earned: overallProgress >= 25,
      icon: <Target className="w-4 h-4" />
    },
    { 
      id: 'halfway', 
      name: 'Félúton', 
      earned: overallProgress >= 50,
      icon: <TrendingUp className="w-4 h-4" />
    },
    { 
      id: 'streak_7', 
      name: '7 napos sorozat', 
      earned: learningStreak >= 7,
      icon: <Flame className="w-4 h-4" />
    }
  ]

  const earnedAchievements = achievements.filter(a => a.earned)

  return (
    <div className="space-y-4">
      {/* Overall Progress Card */}
      <Card className="bg-gradient-to-r from-brand-secondary/5 to-indigo-50 border-brand-secondary/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-brand-secondary" />
              <span className="font-bold text-brand-secondary-hover">Kurzus előrehaladás</span>
            </div>
            <Badge className="bg-brand-secondary/10 text-brand-secondary-hover">
              {completedLessons}/{totalLessons} lecke
            </Badge>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-700">Teljesítve</span>
              <span className="font-medium text-brand-secondary-hover">{overallProgress}%</span>
            </div>
            <Progress value={overallProgress} className="h-3 bg-brand-secondary/10" />
          </div>

          {estimatedTimeRemaining > 0 && (
            <div className="flex items-center gap-2 mt-3 text-sm text-gray-600">
              <Clock className="w-4 h-4" />
              <span>Becsült hátralévő idő: ~{Math.ceil(estimatedTimeRemaining / 60)} óra</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Learning Streak & Goals */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-gradient-to-r from-orange-50 to-red-50 border-orange-200">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <Flame className="w-4 h-4 text-orange-600" />
              <span className="text-sm font-medium text-orange-900">Tanulási sorozat</span>
            </div>
            <div className="text-2xl font-bold text-orange-700">{learningStreak}</div>
            <div className="text-xs text-orange-600">nap egymás után</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-900">Heti cél</span>
            </div>
            <div className="text-2xl font-bold text-green-700">{completedThisWeek}/{weeklyGoal}</div>
            <div className="text-xs text-green-600">lecke a héten</div>
          </CardContent>
        </Card>
      </div>

      {/* Module Progress Breakdown */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-4 h-4 text-gray-600" />
            <span className="font-medium">Modulok áttekintése</span>
          </div>
          
          <div className="space-y-3">
            {moduleProgress.map((module, index) => (
              <div key={module.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900">
                      {index + 1}. {module.title}
                    </span>
                    {module.progress === 100 && (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">
                      {module.completedLessons}/{module.totalLessons}
                    </span>
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${
                        module.progress === 100 
                          ? 'bg-green-50 text-green-700 border-green-200' 
                          : module.progress > 0 
                            ? 'bg-brand-secondary/5 text-brand-secondary-hover border-brand-secondary/20'
                            : 'bg-gray-50 text-gray-600 border-gray-200'
                      }`}
                    >
                      {module.progress}%
                    </Badge>
                  </div>
                </div>
                <Progress 
                  value={module.progress} 
                  className={`h-2 ${
                    module.progress === 100 
                      ? 'bg-green-100' 
                      : module.progress > 0 
                        ? 'bg-brand-secondary/10'
                        : 'bg-gray-100'
                  }`} 
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Achievements */}
      {earnedAchievements.length > 0 && (
        <Card className="bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Trophy className="w-4 h-4 text-amber-600" />
              <span className="font-medium text-amber-900">Elért eredmények</span>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {earnedAchievements.map(achievement => (
                <Badge 
                  key={achievement.id}
                  className="bg-amber-100 text-amber-800 border-amber-300 flex items-center gap-1"
                >
                  {achievement.icon}
                  {achievement.name}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Next Milestone */}
      {overallProgress < 100 && (
        <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-purple-600" />
              <span className="font-medium text-purple-900">Következő mérföldkő</span>
            </div>
            
            <div className="text-sm text-purple-700">
              {overallProgress < 25 && "Fejezd be az első negyedet! Még " + (Math.ceil(totalLessons * 0.25) - completedLessons) + " lecke."}
              {overallProgress >= 25 && overallProgress < 50 && "Félidőhöz közeledel! Még " + (Math.ceil(totalLessons * 0.5) - completedLessons) + " lecke."}
              {overallProgress >= 50 && overallProgress < 75 && "Háromnegyedhez közeledel! Még " + (Math.ceil(totalLessons * 0.75) - completedLessons) + " lecke."}
              {overallProgress >= 75 && "Befejezéshez közeledel! Még " + (totalLessons - completedLessons) + " lecke."}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}