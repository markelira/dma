// Application-wide constants

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL
    ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/api`
    : process.env.NEXT_PUBLIC_API_BASE_URL || '/api';

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  COURSES: '/courses',
  COURSE_DETAILS: '/courses/:id',
  LESSON: '/courses/:courseId/lessons/:lessonId',
  PROFILE: '/profile',
  SETTINGS: '/settings',
} as const;

export const AUTH_TOKEN_KEY = 'auth_token';

export const NOTIFICATION_TYPES = {
  COURSE: 'course',
  ACHIEVEMENT: 'achievement',
  SYSTEM: 'system',
} as const;

export const USER_ROLES = {
  STUDENT: 'student',
  INSTRUCTOR: 'instructor',
  ADMIN: 'admin',
} as const;

export const LESSON_TYPES = {
  VIDEO: 'video',
  QUIZ: 'quiz',
  ASSIGNMENT: 'assignment',
} as const;

export const QUIZ_TYPES = {
  MULTIPLE_CHOICE: 'multiple-choice',
  TRUE_FALSE: 'true-false',
  SHORT_ANSWER: 'short-answer',
} as const;

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
  },
  COURSES: {
    LIST: '/courses',
    DETAILS: '/courses/:id',
    ENROLL: '/courses/:id/enroll',
    PROGRESS: '/courses/:id/progress',
  },
  LESSONS: {
    DETAILS: '/courses/:courseId/lessons/:lessonId',
    PROGRESS: '/courses/:courseId/lessons/:lessonId/progress',
  },
  USER: {
    PROFILE: '/user/profile',
    SETTINGS: '/user/settings',
    NOTIFICATIONS: '/user/notifications',
  },
  ADMIN: {
    DASHBOARD_STATS: '/dashboard/admin/stats',
  },
} as const;

export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'Please log in to continue.',
  FORBIDDEN: 'You do not have permission to access this resource.',
  NOT_FOUND: 'The requested resource was not found.',
  SERVER_ERROR: 'An unexpected error occurred. Please try again later.',
} as const;

export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Successfully logged in!',
  REGISTER_SUCCESS: 'Registration successful! Welcome to ELIRA.',
  COURSE_ENROLLED: 'Successfully enrolled in course!',
  LESSON_COMPLETED: 'Lesson completed! Great job!',
  PROFILE_UPDATED: 'Profile updated successfully!',
} as const; 