import { useAuth } from './useAuth'

export const useInstructor = () => {
  const { user, isAuthenticated } = useAuth()
  
  const isInstructor = isAuthenticated && (user?.role === 'INSTRUCTOR' || user?.role === 'ADMIN')
  const isAdmin = isAuthenticated && user?.role === 'ADMIN'
  
  return {
    isInstructor,
    isAdmin,
    canManageCourses: isInstructor,
    canAnswerQuestions: isInstructor,
    canModerateContent: isInstructor
  }
}