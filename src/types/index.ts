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

export interface Module {
  id: string;
  title: string;
  description?: string;
  order: number;
  status: 'DRAFT' | 'PUBLISHED' | 'SOON' | 'ARCHIVED' | 'FREE' | 'PAID';
  lessons: Lesson[];
}

export interface Lesson {
  id: string;
  title: string;
  content: string;
  type: 'TEXT' | 'VIDEO' | 'QUIZ' | 'READING' | 'PDF' | 'AUDIO';
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
}

export interface Course {
  id: string;
  title: string;
  description: string;
  status: 'DRAFT' | 'PUBLISHED' | 'SOON' | 'ARCHIVED' | 'FREE' | 'PAID';
  instructor: User;
  category: Category;
  modules: Module[];
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
  // Convenience fields for display (alternative to nested instructor object)
  instructorName?: string;
  instructorImage?: string;
  instructorTitle?: string;
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