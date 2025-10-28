/**
 * Demo Data Manager for University Presentation
 * Provides realistic demo data while maintaining Firebase integration patterns
 */

export interface DemoLearningStats {
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

export interface DemoAchievement {
  id: string
  name: string
  description: string
  category: 'progress' | 'engagement' | 'streak' | 'social' | 'special'
  points: number
  earned: boolean
  earnedAt?: Date
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  requirement: string
}

export interface DemoNote {
  id: string
  title: string
  content: string
  timestamp?: number
  tags: string[]
  isBookmark: boolean
  createdAt: Date
  updatedAt: Date
  lessonId: string
}

export interface DemoProgressData {
  courseId: string
  lessonId: string
  percentage: number
  timeSpent: number
  completed: boolean
  lastAccessed: Date
}

class DemoDataManager {
  private static instance: DemoDataManager
  private learningStats: DemoLearningStats
  private achievements: DemoAchievement[]
  private notes: DemoNote[]
  private progressData: Map<string, DemoProgressData>

  private constructor() {
    this.learningStats = this.initializeLearningStats()
    this.achievements = this.initializeAchievements()
    this.notes = this.initializeNotes()
    this.progressData = new Map()
  }

  public static getInstance(): DemoDataManager {
    if (!DemoDataManager.instance) {
      DemoDataManager.instance = new DemoDataManager()
    }
    return DemoDataManager.instance
  }

  // Learning Stats
  private initializeLearningStats(): DemoLearningStats {
    return {
      totalLessonsCompleted: 15,
      totalHoursLearned: 12.5,
      currentStreak: 8,
      longestStreak: 12,
      weeklyGoal: 5,
      weeklyProgress: 4,
      totalPoints: 1750,
      level: 6,
      nextLevelPoints: 2000
    }
  }

  public getLearningStats(): DemoLearningStats {
    return { ...this.learningStats }
  }

  public updateLearningStats(updates: Partial<DemoLearningStats>): void {
    this.learningStats = { ...this.learningStats, ...updates }
  }

  // Achievements
  private initializeAchievements(): DemoAchievement[] {
    return [
      {
        id: 'first_lesson',
        name: 'Első lépés',
        description: 'Befejezted az első leckét',
        category: 'progress',
        points: 50,
        earned: true,
        earnedAt: new Date(Date.now() - 86400000 * 7),
        rarity: 'common',
        requirement: '1 lecke befejezése'
      },
      {
        id: 'week_streak',
        name: 'Egy hetes harcos',
        description: '7 napon keresztül tanultál',
        category: 'streak',
        points: 200,
        earned: true,
        earnedAt: new Date(Date.now() - 86400000 * 1),
        rarity: 'rare',
        requirement: '7 napos tanulási sorozat'
      },
      {
        id: 'fast_learner',
        name: 'Gyors tanuló',
        description: '5 leckét fejeztél be egy nap alatt',
        category: 'engagement',
        points: 150,
        earned: true,
        earnedAt: new Date(Date.now() - 86400000 * 3),
        rarity: 'rare',
        requirement: '5 lecke 1 nap alatt'
      },
      {
        id: 'milestone_25',
        name: 'Negyedrész mester',
        description: '25% befejezve a kurzusból',
        category: 'progress',
        points: 100,
        earned: true,
        earnedAt: new Date(Date.now() - 86400000 * 4),
        rarity: 'common',
        requirement: '25% kurzus befejezése'
      },
      {
        id: 'perfectionist',
        name: 'Perfekcionista',
        description: '10 kvízt teljesítettél 100%-ra',
        category: 'special',
        points: 500,
        earned: false,
        rarity: 'legendary',
        requirement: '10 tökéletes kvíz'
      },
      {
        id: 'note_taker',
        name: 'Jegyzetelő',
        description: '50 jegyzetet készítettél',
        category: 'engagement',
        points: 150,
        earned: false,
        rarity: 'rare',
        requirement: '50 jegyzet készítése'
      }
    ]
  }

  public getAchievements(): DemoAchievement[] {
    return [...this.achievements]
  }

  public earnAchievement(achievementId: string): boolean {
    const achievement = this.achievements.find(a => a.id === achievementId)
    if (achievement && !achievement.earned) {
      achievement.earned = true
      achievement.earnedAt = new Date()
      this.learningStats.totalPoints += achievement.points
      return true
    }
    return false
  }

  // Notes Management
  private initializeNotes(): DemoNote[] {
    return [
      {
        id: '1',
        title: 'Kulcsfogalom',
        content: 'A videóban említett definíció nagyon fontos lesz a vizsgán.',
        timestamp: 125,
        tags: ['fontos', 'definíció', 'vizsga'],
        isBookmark: true,
        createdAt: new Date(Date.now() - 86400000),
        updatedAt: new Date(Date.now() - 86400000),
        lessonId: 'demo-lesson-1'
      },
      {
        id: '2',
        title: 'Gyakorlati példa',
        content: 'Érdekes megközelítés a probléma megoldására. Érdemes ezt a módszert megjegyezni.',
        timestamp: 245,
        tags: ['gyakorlat', 'módszer', 'megoldás'],
        isBookmark: false,
        createdAt: new Date(Date.now() - 3600000),
        updatedAt: new Date(Date.now() - 3600000),
        lessonId: 'demo-lesson-1'
      },
      {
        id: '3',
        title: 'Összegzés',
        content: 'A lecke legfontosabb pontjai: 1) Alapfogalmak 2) Alkalmazási területek 3) Gyakorlati példák',
        tags: ['összegzés', 'fontos'],
        isBookmark: false,
        createdAt: new Date(Date.now() - 1800000),
        updatedAt: new Date(Date.now() - 1800000),
        lessonId: 'demo-lesson-2'
      }
    ]
  }

  public getNotesByLesson(lessonId: string): DemoNote[] {
    return this.notes.filter(note => note.lessonId === lessonId)
  }

  public getAllNotes(): DemoNote[] {
    return [...this.notes]
  }

  public addNote(note: Omit<DemoNote, 'id' | 'createdAt' | 'updatedAt'>): DemoNote {
    const newNote: DemoNote = {
      ...note,
      id: `note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    this.notes.push(newNote)
    
    // Check for note-taking achievement
    if (this.notes.length >= 50) {
      this.earnAchievement('note_taker')
    }
    
    return newNote
  }

  public updateNote(noteId: string, updates: Partial<DemoNote>): boolean {
    const noteIndex = this.notes.findIndex(note => note.id === noteId)
    if (noteIndex !== -1) {
      this.notes[noteIndex] = {
        ...this.notes[noteIndex],
        ...updates,
        updatedAt: new Date()
      }
      return true
    }
    return false
  }

  public deleteNote(noteId: string): boolean {
    const noteIndex = this.notes.findIndex(note => note.id === noteId)
    if (noteIndex !== -1) {
      this.notes.splice(noteIndex, 1)
      return true
    }
    return false
  }

  // Progress Management
  public getProgress(courseId: string, lessonId: string): DemoProgressData | null {
    const key = `${courseId}-${lessonId}`
    return this.progressData.get(key) || null
  }

  public updateProgress(courseId: string, lessonId: string, percentage: number, timeSpent: number): void {
    const key = `${courseId}-${lessonId}`
    const existing = this.progressData.get(key)
    
    const progressData: DemoProgressData = {
      courseId,
      lessonId,
      percentage: Math.max(existing?.percentage || 0, percentage),
      timeSpent: Math.max(existing?.timeSpent || 0, timeSpent),
      completed: percentage >= 90,
      lastAccessed: new Date()
    }
    
    this.progressData.set(key, progressData)
    
    // Update learning stats
    if (progressData.completed && (!existing || !existing.completed)) {
      this.learningStats.totalLessonsCompleted += 1
      this.learningStats.weeklyProgress += 1
      this.learningStats.totalPoints += 25
      
      // Check for achievements
      if (this.learningStats.totalLessonsCompleted >= 5) {
        this.earnAchievement('fast_learner')
      }
    }
    
    this.learningStats.totalHoursLearned = Math.max(
      this.learningStats.totalHoursLearned,
      timeSpent / 3600
    )
  }

  // Demo Utilities
  public simulateLessonCompletion(): void {
    this.learningStats.totalLessonsCompleted += 1
    this.learningStats.totalPoints += 25
    this.learningStats.weeklyProgress += 1
    
    // Simulate streak
    this.learningStats.currentStreak += 1
    if (this.learningStats.currentStreak > this.learningStats.longestStreak) {
      this.learningStats.longestStreak = this.learningStats.currentStreak
    }
  }

  public resetDemoData(): void {
    this.learningStats = this.initializeLearningStats()
    this.achievements = this.initializeAchievements()
    this.notes = this.initializeNotes()
    this.progressData.clear()
  }

  // Export data for Firebase integration (when ready)
  public exportForFirebase() {
    return {
      learningStats: this.learningStats,
      achievements: this.achievements,
      notes: this.notes,
      progressData: Array.from(this.progressData.entries()).map(([key, data]) => ({
        key,
        ...data
      }))
    }
  }
}

export const demoDataManager = DemoDataManager.getInstance()

// Convenience hooks for React components
export const useDemoLearningStats = () => {
  return {
    stats: demoDataManager.getLearningStats(),
    updateStats: (updates: Partial<DemoLearningStats>) => demoDataManager.updateLearningStats(updates),
    simulateCompletion: () => demoDataManager.simulateLessonCompletion()
  }
}

export const useDemoAchievements = () => {
  return {
    achievements: demoDataManager.getAchievements(),
    earnAchievement: (id: string) => demoDataManager.earnAchievement(id)
  }
}

export const useDemoNotes = (lessonId?: string) => {
  return {
    notes: lessonId ? demoDataManager.getNotesByLesson(lessonId) : demoDataManager.getAllNotes(),
    addNote: (note: Omit<DemoNote, 'id' | 'createdAt' | 'updatedAt'>) => demoDataManager.addNote(note),
    updateNote: (id: string, updates: Partial<DemoNote>) => demoDataManager.updateNote(id, updates),
    deleteNote: (id: string) => demoDataManager.deleteNote(id)
  }
}

export const useDemoProgress = (courseId: string, lessonId: string) => {
  return {
    progress: demoDataManager.getProgress(courseId, lessonId),
    updateProgress: (percentage: number, timeSpent: number) => 
      demoDataManager.updateProgress(courseId, lessonId, percentage, timeSpent)
  }
}