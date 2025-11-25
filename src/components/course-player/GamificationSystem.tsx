'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { 
  Trophy, 
  Star, 
  Flame, 
  Target, 
  Award, 
  Zap,
  BookOpen,
  Play,
  CheckCircle,
  TrendingUp,
  Calendar,
  Clock,
  Users,
  Medal,
  Crown,
  Sparkles
} from 'lucide-react'
import { toast } from 'sonner'
import { useDemoLearningStats, useDemoAchievements } from '@/lib/demoDataManager'

interface Achievement {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  category: 'progress' | 'engagement' | 'streak' | 'social' | 'special'
  points: number
  earned: boolean
  earnedAt?: Date
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  requirement: string
}

interface LearningStats {
  totalLessonsCompleted: number
  totalHoursLearned: number
  currentStreak: number
  longestStreak: number
  weeklyGoal: number
  weeklyProgress: number
  totalPoints: number
  level: number
  nextLevelPoints: number
}

interface GamificationSystemProps {
  courseId: string
  lessonId: string
  onLessonComplete?: () => void
}

export const GamificationSystem: React.FC<GamificationSystemProps> = ({
  courseId,
  lessonId,
  onLessonComplete
}) => {
  // Use demo data manager for realistic demo experience
  const { stats, updateStats, simulateCompletion } = useDemoLearningStats()
  const { achievements, earnAchievement } = useDemoAchievements()

  // Convert demo achievements to component format
  const convertedAchievements: Achievement[] = achievements.map(a => ({
    id: a.id,
    name: a.name,
    description: a.description,
    icon: getAchievementIcon(a.category),
    category: a.category,
    points: a.points,
    earned: a.earned,
    earnedAt: a.earnedAt,
    rarity: a.rarity,
    requirement: a.requirement
  }))

  const [recentEarned, setRecentEarned] = useState<Achievement | null>(null)

  // Helper function to get achievement icons
  function getAchievementIcon(category: string) {
    switch (category) {
      case 'progress': return <Play className="w-4 h-4" />
      case 'streak': return <Flame className="w-4 h-4" />
      case 'engagement': return <Zap className="w-4 h-4" />
      case 'special': return <Crown className="w-4 h-4" />
      case 'social': return <Users className="w-4 h-4" />
      default: return <Award className="w-4 h-4" />
    }
  }


  // Calculate level progress
  const currentLevelPoints = stats.level * 300
  const levelProgress = ((stats.totalPoints - currentLevelPoints) / (stats.nextLevelPoints - currentLevelPoints)) * 100

  // Get rarity styling
  const getRarityColor = (rarity: Achievement['rarity']) => {
    switch (rarity) {
      case 'common': return 'bg-gray-100 text-gray-700 border-gray-300'
      case 'rare': return 'bg-brand-secondary/10 text-brand-secondary-hover border-brand-secondary/30'
      case 'epic': return 'bg-purple-100 text-purple-700 border-purple-300'
      case 'legendary': return 'bg-yellow-100 text-yellow-700 border-yellow-300'
    }
  }

  const getCategoryIcon = (category: Achievement['category']) => {
    switch (category) {
      case 'progress': return <TrendingUp className="w-3 h-3" />
      case 'engagement': return <Zap className="w-3 h-3" />
      case 'streak': return <Flame className="w-3 h-3" />
      case 'social': return <Users className="w-3 h-3" />
      case 'special': return <Crown className="w-3 h-3" />
    }
  }

  // Achievement earning with demo data integration
  const handleEarnAchievement = (achievementId: string) => {
    const success = earnAchievement(achievementId)
    if (success) {
      const achievement = convertedAchievements.find(a => a.id === achievementId)
      if (achievement) {
        setRecentEarned(achievement)
        
        toast.success(`Új kitüntetés szerzed: ${achievement.name}!`, {
          description: `+${achievement.points} pont`,
          duration: 5000
        })

        // Auto-hide after 5 seconds
        setTimeout(() => setRecentEarned(null), 5000)
      }
    }
  }

  // Simulate lesson completion benefits with demo data
  const handleLessonComplete = () => {
    simulateCompletion()
    
    // Check for achievements after simulation
    if (stats.totalLessonsCompleted >= 5) {
      handleEarnAchievement('fast_learner')
    }
    if (stats.currentStreak >= 7) {
      handleEarnAchievement('week_streak')
    }

    onLessonComplete?.()
  }

  const earnedAchievements = convertedAchievements.filter(a => a.earned)
  const availableAchievements = convertedAchievements.filter(a => !a.earned)

  return (
    <div className="space-y-6">
      {/* Recent Achievement Popup */}
      {recentEarned && (
        <Card className="border-2 border-yellow-400 bg-gradient-to-r from-yellow-50 to-amber-50 animate-pulse">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
                <Trophy className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-yellow-900">Új kitüntetés!</span>
                  <Badge className={getRarityColor(recentEarned.rarity)}>
                    {recentEarned.rarity}
                  </Badge>
                </div>
                <h4 className="font-bold text-gray-900">{recentEarned.name}</h4>
                <p className="text-sm text-gray-600">{recentEarned.description}</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-yellow-600">+{recentEarned.points}</div>
                <div className="text-xs text-gray-500">pont</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Level and Points Overview */}
      <Card className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                <Medal className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Szint {stats.level}</h3>
                <p className="text-indigo-100">Lelkes tanuló</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{stats.totalPoints.toLocaleString()}</div>
              <div className="text-sm text-indigo-200">összes pont</div>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Következő szint</span>
              <span>{stats.nextLevelPoints - stats.totalPoints} pont</span>
            </div>
            <Progress value={levelProgress} className="h-2 bg-white/20" />
          </div>
        </CardContent>
      </Card>

      {/* Learning Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-orange-50 to-red-50 border-orange-200">
          <CardContent className="p-4 text-center">
            <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-3">
              <Flame className="w-6 h-6 text-orange-600" />
            </div>
            <div className="text-2xl font-bold text-orange-700">{stats.currentStreak}</div>
            <div className="text-sm text-orange-600">nap sorozat</div>
            <div className="text-xs text-gray-500 mt-1">Legjobb: {stats.longestStreak}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardContent className="p-4 text-center">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-green-700">{stats.totalLessonsCompleted}</div>
            <div className="text-sm text-green-600">lecke kész</div>
            <div className="text-xs text-gray-500 mt-1">{stats.totalHoursLearned}h tanulás</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-brand-secondary/5 to-cyan-50 border-brand-secondary/20">
          <CardContent className="p-4 text-center">
            <div className="w-12 h-12 rounded-full bg-brand-secondary/10 flex items-center justify-center mx-auto mb-3">
              <Target className="w-6 h-6 text-brand-secondary" />
            </div>
            <div className="text-2xl font-bold text-brand-secondary-hover">{stats.weeklyProgress}/{stats.weeklyGoal}</div>
            <div className="text-sm text-brand-secondary">heti cél</div>
            <Progress value={(stats.weeklyProgress / stats.weeklyGoal) * 100} className="h-1 mt-2" />
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
          <CardContent className="p-4 text-center">
            <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-3">
              <Trophy className="w-6 h-6 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-purple-700">{earnedAchievements.length}</div>
            <div className="text-sm text-purple-600">kitüntetés</div>
            <div className="text-xs text-gray-500 mt-1">{availableAchievements.length} elérhető</div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Achievements */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-600" />
              Legutóbbi kitüntetések
            </h3>
            <Badge className="bg-yellow-100 text-yellow-700">
              {earnedAchievements.length} megszerzett
            </Badge>
          </div>

          <div className="grid gap-3">
            {earnedAchievements.slice(-3).reverse().map(achievement => (
              <div 
                key={achievement.id}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
              >
                <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                  {achievement.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{achievement.name}</span>
                    <Badge variant="outline" className={getRarityColor(achievement.rarity)}>
                      {getCategoryIcon(achievement.category)}
                      {achievement.rarity}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">{achievement.description}</p>
                </div>
                <div className="text-right">
                  <div className="font-bold text-yellow-600">+{achievement.points}</div>
                  <div className="text-xs text-gray-500">
                    {achievement.earnedAt?.toLocaleDateString('hu-HU')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Available Achievements */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Target className="w-5 h-5 text-brand-secondary" />
              Elérhető kitüntetések
            </h3>
            <Badge variant="outline" className="bg-brand-secondary/5 text-brand-secondary-hover">
              {availableAchievements.length} elérhető
            </Badge>
          </div>

          <div className="grid gap-3">
            {availableAchievements.map(achievement => (
              <div 
                key={achievement.id}
                className="flex items-center gap-3 p-3 border-2 border-dashed border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                  {achievement.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-gray-600">{achievement.name}</span>
                    <Badge variant="outline" className={getRarityColor(achievement.rarity)}>
                      {getCategoryIcon(achievement.category)}
                      {achievement.rarity}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-500">{achievement.description}</p>
                  <p className="text-xs text-gray-400 mt-1">Követelmény: {achievement.requirement}</p>
                </div>
                <div className="text-right">
                  <div className="font-bold text-gray-400">+{achievement.points}</div>
                  <div className="text-xs text-gray-400">pont</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Demo Button */}
      <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
        <CardContent className="p-6 text-center">
          <h3 className="text-lg font-bold text-green-900 mb-2">Szimulálás</h3>
          <p className="text-green-700 mb-4">Teszteld a gamifikációs rendszert</p>
          <Button 
            onClick={handleLessonComplete}
            className="bg-green-600 hover:bg-green-700"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Lecke befejezése szimuláció
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}