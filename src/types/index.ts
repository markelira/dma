// Common types used throughout the application

// Export team types
export * from './team';

// Role System Types
export type UserRole = 'STUDENT' | 'INSTRUCTOR' | 'ADMIN';

export interface RolePermissions {
  // Course management
  canCreateCourses: boolean;
  canEditOwnCourses: boolean;
  canEditAllCourses: boolean;
  canDeleteCourses: boolean;
  canPublishCourses: boolean;

  // User management
  canViewAllUsers: boolean;
  canEditUserRoles: boolean;
  canDeactivateUsers: boolean;
  canDeleteUsers: boolean;

  // Analytics and reporting
  canViewOwnAnalytics: boolean;
  canViewPlatformAnalytics: boolean;
  canExportData: boolean;

  // Platform administration
  canModifyPlatformSettings: boolean;
  canManagePayments: boolean;
  canAccessAdminPanel: boolean;
  canManageCategories: boolean;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  profilePictureUrl?: string;
  title?: string;
  bio?: string;
  institution?: string;
  credentials?: string[];
  specialties?: string[];

  // Team subscription fields
  teamId?: string; // References the team the user belongs to
  isTeamOwner?: boolean; // True if user owns the team
  subscriptionStatus?: 'active' | 'trialing' | 'past_due' | 'canceled' | 'none';

  // Stripe fields
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;

  createdAt: string;
  updatedAt: string;
  universities?: { university: University }[];
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
}

/**
 * Instructor Role Type
 * Defines the display role of an instructor based on course type context
 * - MENTOR: Used for ACADEMIA, WEBINAR, MASTERCLASS courses
 * - SZEREPLŐ: Used for PODCAST courses
 */
export type InstructorRole = 'MENTOR' | 'SZEREPLŐ';

/**
 * Instructor Role Labels (Hungarian) for UI display
 */
export const INSTRUCTOR_ROLE_LABELS: Record<InstructorRole, string> = {
  MENTOR: 'Mentor',
  SZEREPLŐ: 'Szereplő',
};

/**
 * Target Audience Interface
 * Represents a target audience entity for courses (like categories)
 * Managed through admin dashboard
 */
export interface TargetAudience {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Instructor entity - separate from User accounts
 * Instructors are managed through admin dashboard like categories
 */
export interface Instructor {
  id: string;
  name: string;                    // Required - full display name
  title?: string;                  // Optional - role/position (e.g., "Lead Marketing Instructor")
  bio?: string;                    // Optional - instructor description/background
  profilePictureUrl?: string;      // Optional - instructor photo URL
  role: InstructorRole;            // Required - display role (Mentor/Szereplő)
  createdAt: string;
  updatedAt: string;
}

export interface Module {
  id: string;
  title: string;
  description?: string;
  order: number;
  status: 'DRAFT' | 'PUBLISHED' | 'SOON' | 'ARCHIVED' | 'FREE' | 'PAID';
  lessons: Lesson[];
}

// Lesson type for categorizing lesson content
export type LessonType = 'TEXT' | 'VIDEO' | 'QUIZ' | 'READING' | 'PDF' | 'AUDIO' | 'DOWNLOAD';

export interface Lesson {
  id: string;
  title: string;
  content: string;
  type: LessonType;
  order: number;
  status: 'DRAFT' | 'PUBLISHED' | 'SOON' | 'ARCHIVED';
  videoUrl?: string; // Firebase Storage URL for video OR Mux stream URL
  videoStoragePath?: string; // Storage path reference
  thumbnailUrl?: string; // Firebase Storage URL for thumbnail
  duration?: number;
  createdAt: string;
  updatedAt: string;
  // Mux video fields
  muxAssetId?: string; // Mux asset identifier
  muxPlaybackId?: string; // Mux playback identifier for streaming
  muxUploadId?: string; // Mux upload session ID
  muxStatus?: 'uploading' | 'processing' | 'ready' | 'error'; // Mux processing status
  muxThumbnailUrl?: string; // Mux-generated thumbnail URL
  muxDuration?: number; // Mux-reported duration in seconds
  muxAspectRatio?: string; // Video aspect ratio (e.g., "16:9")
  // NEW: structured quiz object (replaces quizJson string)
  quiz?: LessonQuiz | null;
  // NEW: PDF document URL
  pdfUrl?: string;
  // NEW: Audio file URL
  audioUrl?: string;
  // NEW: File attachments and resources
  resources?: LessonResource[];
  // Additional lesson description field
  description?: string;
  // Learning outcomes/objectives for the lesson
  learningOutcomes?: string[];
}

/**
 * Course Type enum
 * Defines the 4 types of courses in the platform:
 * - ACADEMIA: Long, multi-module video course
 * - WEBINAR: Single-lesson webinar with optional resources
 * - MASTERCLASS: Comprehensive multi-module master course
 * - PODCAST: Single-episode audio/video podcast
 */
export type CourseType = 'ACADEMIA' | 'WEBINAR' | 'MASTERCLASS' | 'PODCAST';

/**
 * Course Type labels in Hungarian for UI display
 */
export const COURSE_TYPE_LABELS: Record<CourseType, string> = {
  ACADEMIA: 'Akadémia',
  WEBINAR: 'Webinár',
  MASTERCLASS: 'Masterclass',
  PODCAST: 'Podcast',
};

/**
 * Course Type descriptions in Hungarian
 */
export const COURSE_TYPE_DESCRIPTIONS: Record<CourseType, string> = {
  ACADEMIA: 'Hosszú, több leckéből álló képzés videókkal',
  WEBINAR: 'Egyszeri, 1 videós alkalom erőforrásokkal',
  MASTERCLASS: 'Átfogó, több modulból álló mestertartalom',
  PODCAST: 'Egyszeri podcast epizód audio- vagy videótartalommal',
};

export interface Course {
  id: string;
  title: string;
  description: string;
  status: 'DRAFT' | 'PUBLISHED' | 'SOON' | 'ARCHIVED' | 'FREE' | 'PAID';

  // NEW: Course type field (required)
  courseType: CourseType;

  /**
   * PREFERRED: Reference to instructor in instructors collection
   * Use this field for all new code. Fetch instructor details from instructors collection using this ID.
   */
  instructorId?: string;

  /**
   * NEW: Support multiple instructors for a course
   * Array of instructor IDs from the instructors collection
   */
  instructorIds?: string[];

  /**
   * @deprecated Use instructorId instead and fetch from instructors collection
   * Legacy: Instructor as nested User object
   */
  instructor?: User;

  category: Category;

  /**
   * NEW: Category IDs (multiple categories support)
   */
  categoryIds?: string[];

  /**
   * NEW: Target Audience IDs (multi-select)
   * References targetAudiences collection
   */
  targetAudienceIds?: string[];

  /**
   * NEW: Flat lessons array (replaces module structure)
   * All course types now use flat lessons instead of modules
   */
  lessons?: Lesson[];

  /**
   * @deprecated Modules are being phased out in favor of flat lessons
   * Kept temporarily for migration compatibility
   */
  modules?: Module[];

  /**
   * NEW: Imported lesson IDs (for MASTERCLASS only)
   * References lessons from other courses that are imported into this masterclass
   * These are shared references, not copies
   */
  importedLessonIds?: string[];

  // NEW: Webinar-specific fields (only used when courseType === 'WEBINAR')
  webinarDate?: string; // ISO timestamp for scheduled webinar
  webinarDuration?: number; // Duration in minutes
  liveStreamUrl?: string; // URL for live webinar session
  recordingAvailable?: boolean; // Whether recording is available post-webinar
  averageRating?: number;
  reviewCount: number;
  enrollmentCount: number;
  thumbnailUrl?: string;
  /** SEO-friendly unique slug */
  slug?: string;
  reviews: Review[];
  createdAt: string;
  updatedAt: string;
  certificateEnabled?: boolean;
  language?: string;
  difficulty?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
  publishDate?: string;
  isPlus?: boolean;
  university?: University;
  instructorUniversity?: {
    name: string;
    logoUrl?: string;
    role?: string;
    slug?: string;
  };
  // Payment-related fields
  price: number;
  originalPrice?: number;
  /**
   * @deprecated Use instructorId and fetch instructor from instructors collection
   * Legacy: Convenience fields for display (alternative to nested instructor object)
   */
  instructorName?: string;
  /**
   * @deprecated Use instructorId and fetch instructor from instructors collection
   */
  instructorImage?: string;
  /**
   * @deprecated Use instructorId and fetch instructor from instructors collection
   */
  instructorTitle?: string;
  /**
   * @deprecated Use instructorId and fetch instructor from instructors collection
   */
  instructorBio?: string;
  // Course metadata
  duration?: string;
  totalLessons?: number;
  level?: string;
  rating?: number;
  enrolledCount?: number;
  thumbnail?: string; // Alternative to thumbnailUrl
  sections?: {
    title: string;
    lessons?: { title: string }[];
  }[];
  /**
   * Content creation date - when the course content was originally recorded/produced
   * Format: ISO date string "YYYY-MM-DD"
   */
  contentCreatedAt?: string;
}

export interface Review {
  id: string;
  user: User;
  course: Course;
  rating: number;
  comment?: string;
  approved: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Quiz {
  id: string;
  title: string;
  questions: Question[];
  passingScore: number;
  timeLimit?: number;
}

export interface Question {
  id: string;
  text: string;
  type: 'multiple-choice' | 'true-false' | 'short-answer';
  options?: string[];
  correctAnswer: string | string[];
  points: number;
}

// NEW TYPES FOR FIRESTORE-STRUCTURED QUIZ ---------------------------
export interface LessonQuizAnswer {
  id: string;
  text: string;
  isCorrect: boolean;
  feedback?: string | null;
  isPrimary?: boolean; // For scenario questions - marks primary vs alternative correct answers
  codePattern?: string; // For code questions - expected code pattern or solution
  explanation?: string; // Detailed explanation for this specific answer
  weight?: number; // For weighted scoring (default 1.0)
}

export interface LessonQuizQuestion {
  id: string;
  questionText: string;
  answers: LessonQuizAnswer[];
  questionType: 'SINGLE' | 'MULTIPLE' | 'SCENARIO' | 'CODE';
  scenarioContent?: string; // only for SCENARIO
  codeBlock?: { code: string; language: string }; // only for CODE
  codeLanguage?: string; // Programming language for code questions
  explanation: string; // mandatory feedback
  points: number; // default 10
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD'; // Question difficulty for adaptive scoring
  partialCreditEnabled?: boolean; // Whether partial credit is allowed for this question
  timeLimit?: number; // Time limit in seconds for this specific question
}

export interface LessonQuiz {
  passingScore: number; // Required percentage to pass (0-100)
  allowRetakes: boolean;
  timeLimitMinutes?: number | null;
  maxAttempts?: number | null; // 0 = unlimited
  questions: LessonQuizQuestion[];
}
// -------------------------------------------------------------------

// NEW: Lesson Resource type for downloadable files
export interface LessonResource {
  id: string;
  title: string;
  description?: string;
  type: 'PDF' | 'DOC' | 'XLS' | 'PPT' | 'ZIP' | 'IMAGE' | 'OTHER';
  url: string;
  size?: number; // in bytes
  mimeType?: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  type: 'course' | 'achievement' | 'system';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
}

export interface ApiError {
  message: string;
  status: number;
  code: string;
  timestamp: string;
  path: string;
  method: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

// API Response Types
export interface ProgressResponse {
  isCompleted: boolean;
}

export interface CourseProgressResponse {
  progressPercentage: number;
}

export interface LessonProgress {
  watchPercentage?: number;
  timeSpent?: number;
  quizScore?: number;
  interactionsCompleted?: number;
  scrollProgress?: number;
}

export interface LessonCompletionStatus {
  isCompleted: boolean;
  completedAt?: string;
}

// Represent a partner university for filtering and branding
export interface University {
  id: string
  name: string
  slug: string
  logoUrl?: string | null
}

// Q&A System Types for Student-Instructor Communication
export interface CourseQuestion {
  id: string;
  courseId: string;
  lessonId?: string; // Optional - can be general course question
  userId: string;
  userName: string;
  userRole: 'STUDENT' | 'INSTRUCTOR' | 'ADMIN';
  title: string;
  content: string;
  status: 'OPEN' | 'ANSWERED' | 'RESOLVED' | 'CLOSED';
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  isPublic: boolean; // Whether other students can see this question
  createdAt: string;
  updatedAt: string;
  replies: CourseQuestionReply[];
  tags?: string[];
  upvotes?: number;
  isInstructorQuestion?: boolean; // Question from instructor to students
}

export interface CourseQuestionReply {
  id: string;
  questionId: string;
  userId: string;
  userName: string;
  userRole: 'STUDENT' | 'INSTRUCTOR' | 'ADMIN';
  content: string;
  isAnswer?: boolean; // Marked as the official answer by instructor
  upvotes?: number;
  createdAt: string;
  updatedAt: string;
  attachments?: QuestionAttachment[];
}

export interface QuestionAttachment {
  id: string;
  name: string;
  url: string;
  size: number;
  mimeType: string;
  uploadedAt: string;
}

// Course State Enum for adaptive UI
export enum CourseState {
  NOT_STARTED = 'not_started',
  ACTIVE_PROGRESS = 'active_progress',
  STALE_PROGRESS = 'stale_progress',
  COMPLETED = 'completed'
}

// User Progress and Dashboard Types
export interface EnrolledCourse {
  courseId: string;
  title: string;
  courseTitle: string; // Alias for component compatibility
  thumbnailUrl?: string;
  totalLessons: number;
  completedLessons: number;
  completionPercentage: number;
  lastAccessedAt: string;
  certificateEarned: boolean;
  certificateId?: string;
  certificateUrl?: string | null;
  estimatedHours: number;
  priorityScore: number;
  estimatedTimeRemaining: string;
  instructorName: string;
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
  category: string;
  // Enhanced fields for MyCoursesSection
  courseState: CourseState;
  daysSinceLastAccess: number;
  nextLesson?: {
    id: string;
    title: string;
    moduleTitle: string;
    estimatedDuration: number;
  } | null;
  completionDate?: string | null;
  enrolledAt: string;
  // Course metadata
  description: string;
  language: string;
  averageRating: number;
  reviewCount: number;
}

export interface UserProgressData {
  success: boolean;
  enrolledCourses: EnrolledCourse[];
  totalCoursesEnrolled: number;
  totalLessonsCompleted: number;
  totalCertificatesEarned: number;
  totalHoursLearned: number;
  coursesInProgress: number;
  coursesCompleted: number;
  overallCompletionRate: number;
}

export interface DashboardStats {
  totalCoursesEnrolled: number;
  totalLessonsCompleted: number;
  totalCertificatesEarned: number;
  totalHoursLearned: number;
  coursesInProgress: number;
  coursesCompleted: number;
  overallCompletionRate: number;
}

export interface PlatformAnalytics {
  activeUsersToday: number;
  newCoursesThisMonth: number;
  averageCompletionRate: number;
  averageRating: number;
  totalEnrollments: number;
  totalUsers: number;
  totalCourses: number;
  totalReviews: number;
  engagementRate: number;
  platformGrowth: string;
}

export interface PlatformAnalyticsResponse {
  success: boolean;
  data: PlatformAnalytics;
  error?: string;
}

// Course Card Component Props
export interface CourseCardProps {
  course: EnrolledCourse;
  onContinue?: (courseId: string) => void;
  onStart?: (courseId: string) => void;
  onViewCertificate?: (certificateUrl: string) => void;
  onRate?: (courseId: string) => void;
  className?: string;
}

// Course Filter Types
export type CourseFilter = 'all' | 'in_progress' | 'completed' | 'not_started';

export interface CourseFilterOption {
  key: CourseFilter;
  label: string;
  count: number;
}

// Activity System Types - Hybrid Architecture
export enum ActivityType {
  // Critical Activities (logged to dedicated collection)
  COURSE_ENROLLED = 'course_enrolled',
  COURSE_COMPLETED = 'course_completed',
  CERTIFICATE_EARNED = 'certificate_earned',
  MILESTONE_REACHED = 'milestone_reached',
  QUIZ_MASTERED = 'quiz_mastered',
  STREAK_ACHIEVED = 'streak_achieved',
  
  // Routine Activities (computed from existing data)
  LESSON_COMPLETED = 'lesson_completed',
  VIDEO_WATCHED = 'video_watched',
  QUIZ_ATTEMPTED = 'quiz_attempted',
  MODULE_FINISHED = 'module_finished',
  LEARNING_SESSION = 'learning_session'
}

export enum ActivityPriority {
  HIGH = 'high',      // Major achievements, milestones
  MEDIUM = 'medium',  // Course progress, completions
  LOW = 'low'         // Daily activities, sessions
}

// Critical Activity (stored in Firestore activities collection)
export interface CriticalActivity {
  id: string;
  userId: string;
  type: ActivityType;
  priority: ActivityPriority;
  title: string;
  description: string;
  courseId?: string;
  courseName?: string;
  lessonId?: string;
  lessonName?: string;
  moduleId?: string;
  moduleName?: string;
  metadata: {
    // Flexible metadata based on activity type
    [key: string]: any;
    completionPercentage?: number;
    streakCount?: number;
    quizScore?: number;
    certificateId?: string;
    milestoneType?: '25%' | '50%' | '75%' | '100%';
  };
  createdAt: string;
}

// Computed Activity (generated from existing data)
export interface ComputedActivity {
  id: string;
  type: ActivityType;
  priority: ActivityPriority;
  title: string;
  description: string;
  courseId?: string;
  courseName?: string;
  lessonId?: string;
  lessonName?: string;
  createdAt: string;
  metadata: {
    [key: string]: any;
    duration?: number;
    progress?: number;
    sessionLength?: number;
  };
}

// Unified Activity interface for RecentActivitySection
export interface Activity {
  id: string;
  type: ActivityType;
  priority: ActivityPriority;
  title: string;
  description: string;
  courseId?: string;
  courseName?: string;
  lessonId?: string;
  lessonName?: string;
  createdAt: string;
  metadata: {
    [key: string]: any;
  };
  isCritical: boolean; // Distinguishes stored vs computed activities
}

// Activity Timeline Data for Dashboard
export interface ActivityTimeline {
  activities: Activity[];
  totalCount: number;
  hasMore: boolean;
  timeRange: 'today' | '7days' | '30days' | 'all';
}

// ============================================================================
// NEW: Dashboard Redesign Types (Phase 1)
// ============================================================================

/**
 * User Preferences - Personalization data for adaptive dashboard
 * Collection: userPreferences
 */
export interface UserPreferences {
  userId: string;
  role?: string; // Job role/title
  interests: string[]; // Category IDs or topic strings
  goals: string[]; // Career goals or learning objectives
  learningStyle: 'visual' | 'reading' | 'interactive' | 'mixed';
  weeklyHoursGoal: number; // Target learning minutes per week
  dailyReminderTime?: string; // HH:mm format (e.g., "19:00")
  dashboardLayout?: 'default' | 'compact' | 'detailed' | 'custom';
  darkMode: boolean;
  notifications: {
    email: boolean;
    push: boolean;
    reminders: boolean;
    achievements: boolean;
    courseUpdates: boolean;
  };
  onboardingCompleted: boolean;
  onboardingCompletedAt?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Learning Streak - Gamification data for daily learning tracking
 * Collection: learningStreaks
 */
export interface LearningStreak {
  userId: string;
  currentStreak: number; // Current consecutive days with activity
  longestStreak: number; // All-time longest streak
  lastActivityDate: string; // ISO date string (YYYY-MM-DD)
  activityCalendar: Record<string, number>; // date (YYYY-MM-DD) -> minutes spent
  streakStartDate: string; // When current streak started
  totalActiveDays: number; // Total days with any activity
  milestones: StreakMilestone[]; // Earned streak milestones
  createdAt: string;
  updatedAt: string;
}

/**
 * Streak Milestone - Achievement for reaching streak goals
 */
export interface StreakMilestone {
  days: number; // Milestone threshold (7, 30, 100, etc.)
  earnedAt: string;
  celebrated: boolean; // Whether user has seen the celebration
}

/**
 * User Achievement - Badge and accomplishment tracking
 * Collection: userAchievements
 */
export interface UserAchievement {
  id: string;
  userId: string;
  achievementId: string; // Reference to achievement definition
  achievementType: 'completion' | 'mastery' | 'engagement' | 'streak' | 'speed' | 'social';
  title: string; // Achievement name (e.g., "First Course Complete")
  description: string; // Achievement description
  iconUrl?: string; // Badge image URL
  iconName?: string; // Icon identifier (e.g., "trophy", "fire", "star")
  tier?: 'bronze' | 'silver' | 'gold' | 'platinum'; // Badge quality level
  earnedAt: string;
  notificationSent: boolean;
  celebrated: boolean; // Whether user has seen the unlock animation
  metadata: {
    courseId?: string;
    courseName?: string;
    streakDays?: number;
    quizScore?: number;
    completionDays?: number; // Days taken to complete course
    points?: number;
    [key: string]: any;
  };
  createdAt: string;
}

/**
 * Achievement Definition - Template for all possible achievements
 * Collection: achievementDefinitions (admin-managed)
 */
export interface AchievementDefinition {
  id: string;
  type: 'completion' | 'mastery' | 'engagement' | 'streak' | 'speed' | 'social';
  title: string;
  description: string;
  iconName: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  unlockCondition: {
    type: string; // e.g., "course_complete", "streak_days", "quiz_perfect"
    threshold?: number;
    metadata?: Record<string, any>;
  };
  points: number; // XP or gamification points awarded
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Learning Goal - Personal goal tracking for courses and learning hours
 * Collection: learningGoals
 */
export interface LearningGoal {
  id: string;
  userId: string;
  goalType: 'weekly_hours' | 'course_completion' | 'skill_mastery' | 'certificate';
  title: string; // User-defined or auto-generated goal title
  description?: string;
  target: number; // Goal target (minutes for hours, 1 for completion, etc.)
  current: number; // Current progress
  unit: 'minutes' | 'courses' | 'lessons' | 'skills' | 'certificates';
  deadline?: string; // Optional goal deadline (ISO string)
  status: 'active' | 'completed' | 'abandoned' | 'overdue';
  courseId?: string; // For course-specific goals
  courseName?: string;
  reminderEnabled: boolean;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Learning Session - Detailed tracking of individual learning sessions
 * Collection: learningSessions
 */
export interface LearningSession {
  id: string;
  userId: string;
  courseId: string;
  courseName: string;
  lessonId?: string;
  lessonName?: string;
  startTime: string;
  endTime?: string; // null if session is active
  duration: number; // Total minutes in session
  activityType: 'video' | 'reading' | 'quiz' | 'interactive' | 'mixed';
  progressMade: number; // Percentage progress made in this session
  completed: boolean; // Whether session ended normally or was abandoned
  deviceType: 'desktop' | 'mobile' | 'tablet';
  createdAt: string;
  updatedAt: string;
}

/**
 * Course Recommendation - Personalized course suggestions with reasoning
 * Collection: courseRecommendations (generated by Cloud Function)
 */
export interface CourseRecommendation {
  id: string;
  userId: string;
  courseId: string;
  recommendationType: 'collaborative' | 'content_based' | 'trending' | 'skill_gap' | 'career_path';
  score: number; // Recommendation confidence score (0-1)
  reasoning: string; // Human-readable explanation
  metadata: {
    similarUsers?: string[]; // For collaborative filtering
    relatedCourses?: string[]; // For content-based
    skillGap?: string; // For skill-based recommendations
    [key: string]: any;
  };
  dismissed: boolean; // User dismissed this recommendation
  enrolled: boolean; // User enrolled in recommended course
  createdAt: string;
  expiresAt: string; // Recommendations expire after 30 days
}

/**
 * Dashboard Analytics - Pre-computed analytics for fast dashboard loading
 * Collection: dashboardAnalytics (updated daily via Cloud Function)
 */
export interface DashboardAnalytics {
  userId: string;
  totalLearningMinutes: number; // All-time total
  totalLearningHours: number; // Computed from minutes
  learningMinutesThisWeek: number;
  learningMinutesLastWeek: number;
  learningMinutesThisMonth: number;
  learningMinutesLastMonth: number;
  weeklyLearningTrend: number; // Percentage change week-over-week
  monthlyLearningTrend: number;
  averageSessionDuration: number; // Average minutes per session
  totalSessions: number;
  coursesEnrolled: number;
  coursesInProgress: number;
  coursesCompleted: number;
  lessonsCompleted: number;
  certificatesEarned: number;
  achievementsUnlocked: number;
  currentStreak: number;
  longestStreak: number;
  averageQuizScore: number;
  skillsAcquired: string[]; // List of skill categories mastered
  lastCalculatedAt: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Weekly Learning Data - Chart data for learning hours visualization
 */
export interface WeeklyLearningData {
  date: string; // YYYY-MM-DD
  minutes: number;
  label: string; // Day name or formatted date
  isToday?: boolean;
  goalMet?: boolean;
}

/**
 * Chart Data Types for Dashboard Visualizations
 */
export interface LearningHoursChartData {
  timeRange: 'week' | 'month' | 'year';
  data: {
    date: string;
    minutes: number;
    hours: number;
    label: string;
  }[];
  goal?: number; // Weekly goal in minutes
  totalMinutes: number;
  averagePerDay: number;
}

/**
 * Skill Proficiency - Track user's skill levels across categories
 * Collection: skillProficiency
 */
export interface SkillProficiency {
  userId: string;
  skills: Record<string, SkillLevel>; // skillId/categoryId -> proficiency
  lastUpdatedAt: string;
  createdAt: string;
}

export interface SkillLevel {
  name: string; // Skill or category name
  level: number; // 0-100 proficiency
  coursesCompleted: number;
  lessonsCompleted: number;
  lastPracticed: string;
  trend: 'improving' | 'stable' | 'declining';
}

/**
 * Onboarding State - Track user's onboarding progress
 */
export interface OnboardingState {
  currentStep: number;
  totalSteps: number;
  completed: boolean;
  skipped: boolean;
  data: Partial<UserPreferences>;
} 