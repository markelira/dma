import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { httpsCallable } from 'firebase/functions'
import { functions } from '@/lib/firebase'

// ============================================
// Types
// ============================================

interface CompanyEmployee {
  id: string
  email: string
  firstName: string
  lastName: string
  fullName: string
  jobTitle?: string
  status: 'invited' | 'active' | 'left'
  invitedAt?: string
  inviteAcceptedAt?: string
  enrolledMasterclasses?: { masterclassId: string; enrolledAt: string }[]
}

interface CompanyDashboardData {
  company: {
    id: string
    name: string
    plan: string
    status: string
    trialEndsAt?: string
  }
  stats: {
    totalEmployees: number
    activeEmployees: number
    invitedEmployees: number
    atRiskCount: number
    completedCourses: number
    averageProgress: number
  }
  employees: Array<{
    id: string
    name: string
    email: string
    status: string
    progress: number
    lastActivity?: string
    daysActive: number
  }>
}

interface CompanyMasterclass {
  id: string
  masterclassId: string
  title: string
  duration?: number
  seats: {
    purchased: number
    used: number
    available: number
  }
  status: 'scheduled' | 'active' | 'completed'
  startDate?: string
  endDate?: string
}

// ============================================
// Employee Management
// ============================================

interface AddEmployeeInput {
  companyId: string
  email: string
  firstName: string
  lastName: string
  jobTitle?: string
}

interface AddEmployeeResponse {
  success: boolean
  employeeId?: string
  message?: string
  error?: string
}

/**
 * Hook for adding/inviting a new employee
 */
export function useAddEmployee() {
  const queryClient = useQueryClient()

  return useMutation<AddEmployeeResponse, Error, AddEmployeeInput>({
    mutationFn: async (data) => {
      const addEmployee = httpsCallable<AddEmployeeInput, AddEmployeeResponse>(
        functions,
        'addEmployee'
      )

      const result = await addEmployee(data)

      if (!result.data.success) {
        throw new Error(result.data.error || 'Nem sikerült meghívni az alkalmazottat')
      }

      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['company-employees'] })
    },
  })
}

/**
 * Hook for getting company dashboard data (includes employees)
 */
export function useCompanyDashboard(companyId: string | undefined) {
  return useQuery<CompanyDashboardData, Error>({
    queryKey: ['company-dashboard', companyId],
    queryFn: async () => {
      if (!companyId) throw new Error('Company ID required')

      const getCompanyDashboard = httpsCallable<{ companyId: string }, { success: boolean; data?: CompanyDashboardData; error?: string }>(
        functions,
        'getCompanyDashboard'
      )

      const result = await getCompanyDashboard({ companyId })

      if (!result.data.success || !result.data.data) {
        throw new Error(result.data.error || 'Nem sikerült lekérni az adatokat')
      }

      return result.data.data
    },
    enabled: !!companyId,
    staleTime: 1 * 60 * 1000, // 1 minute
  })
}

// ============================================
// Reminder & Reports
// ============================================

interface SendReminderInput {
  companyId: string
  employeeId: string
  masterclassId: string
}

interface SendReminderResponse {
  success: boolean
  message?: string
  error?: string
}

/**
 * Hook for sending reminder to at-risk employee
 */
export function useSendReminder() {
  const queryClient = useQueryClient()

  return useMutation<SendReminderResponse, Error, SendReminderInput>({
    mutationFn: async (data) => {
      const sendEmployeeReminder = httpsCallable<SendReminderInput, SendReminderResponse>(
        functions,
        'sendEmployeeReminder'
      )

      const result = await sendEmployeeReminder(data)

      if (!result.data.success) {
        throw new Error(result.data.error || 'Nem sikerült elküldeni az emlékeztetőt')
      }

      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-dashboard'] })
    },
  })
}

interface GenerateReportInput {
  companyId: string
  masterclassId?: string
}

interface GenerateReportResponse {
  success: boolean
  downloadUrl?: string
  filename?: string
  error?: string
}

/**
 * Hook for generating CSV progress report
 */
export function useGenerateCSVReport() {
  return useMutation<GenerateReportResponse, Error, GenerateReportInput>({
    mutationFn: async (data) => {
      const generateCSVReport = httpsCallable<GenerateReportInput, GenerateReportResponse>(
        functions,
        'generateCSVReport'
      )

      const result = await generateCSVReport(data)

      if (!result.data.success) {
        throw new Error(result.data.error || 'Nem sikerült létrehozni a riportot')
      }

      return result.data
    },
  })
}

// ============================================
// Masterclass Management
// ============================================

interface GetMasterclassesResponse {
  success: boolean
  masterclasses?: CompanyMasterclass[]
  error?: string
}

/**
 * Hook for fetching company's purchased masterclasses
 */
export function useCompanyMasterclasses(companyId: string | undefined) {
  return useQuery<CompanyMasterclass[], Error>({
    queryKey: ['company-masterclasses', companyId],
    queryFn: async () => {
      if (!companyId) return []

      const getCompanyMasterclasses = httpsCallable<{ companyId: string }, GetMasterclassesResponse>(
        functions,
        'getCompanyMasterclasses'
      )

      const result = await getCompanyMasterclasses({ companyId })

      if (!result.data.success) {
        throw new Error(result.data.error || 'Nem sikerült lekérni a masterclass-okat')
      }

      return result.data.masterclasses || []
    },
    enabled: !!companyId,
    staleTime: 2 * 60 * 1000,
  })
}

interface PurchaseMasterclassInput {
  companyId: string
  masterclassId: string
}

interface PurchaseMasterclassResponse {
  success: boolean
  enrolledCount?: number
  message?: string
  error?: string
}

/**
 * Hook for purchasing a masterclass (auto-enrolls all employees)
 */
export function usePurchaseMasterclass() {
  const queryClient = useQueryClient()

  return useMutation<PurchaseMasterclassResponse, Error, PurchaseMasterclassInput>({
    mutationFn: async (data) => {
      const purchaseCompanyMasterclass = httpsCallable<PurchaseMasterclassInput, PurchaseMasterclassResponse>(
        functions,
        'purchaseCompanyMasterclass'
      )

      const result = await purchaseCompanyMasterclass(data)

      if (!result.data.success) {
        throw new Error(result.data.error || 'Nem sikerült megvásárolni a masterclass-t')
      }

      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-masterclasses'] })
      queryClient.invalidateQueries({ queryKey: ['company-dashboard'] })
    },
  })
}

interface AssignMasterclassInput {
  companyId: string
  employeeId: string
  masterclassId: string
}

interface AssignMasterclassResponse {
  success: boolean
  message?: string
  error?: string
}

/**
 * Hook for assigning employee to masterclass
 */
export function useAssignMasterclass() {
  const queryClient = useQueryClient()

  return useMutation<AssignMasterclassResponse, Error, AssignMasterclassInput>({
    mutationFn: async (data) => {
      const assignEmployeeToMasterclass = httpsCallable<AssignMasterclassInput, AssignMasterclassResponse>(
        functions,
        'assignEmployeeToMasterclass'
      )

      const result = await assignEmployeeToMasterclass(data)

      if (!result.data.success) {
        throw new Error(result.data.error || 'Nem sikerült hozzárendelni az alkalmazottat')
      }

      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-masterclasses'] })
      queryClient.invalidateQueries({ queryKey: ['company-dashboard'] })
    },
  })
}

/**
 * Hook for unassigning employee from masterclass
 */
export function useUnassignMasterclass() {
  const queryClient = useQueryClient()

  return useMutation<AssignMasterclassResponse, Error, AssignMasterclassInput>({
    mutationFn: async (data) => {
      const unassignEmployeeFromMasterclass = httpsCallable<AssignMasterclassInput, AssignMasterclassResponse>(
        functions,
        'unassignEmployeeFromMasterclass'
      )

      const result = await unassignEmployeeFromMasterclass(data)

      if (!result.data.success) {
        throw new Error(result.data.error || 'Nem sikerült eltávolítani az alkalmazottat')
      }

      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-masterclasses'] })
      queryClient.invalidateQueries({ queryKey: ['company-dashboard'] })
    },
  })
}

// ============================================
// Company Course Enrollment
// ============================================

interface EnrollCompanyInCourseInput {
  companyId: string
  courseId: string
}

interface EnrollCompanyInCourseResponse {
  success: boolean
  enrolledCount?: number
  alreadyEnrolledCount?: number
  message?: string
  error?: string
}

interface CompanyEnrolledCourse {
  id: string
  title: string
  thumbnail?: string
  description?: string
  duration?: string
  lessonCount: number
  enrolledAt: string | null
  employeeCount: number
}

interface GetCompanyEnrolledCoursesResponse {
  success: boolean
  courses?: CompanyEnrolledCourse[]
  error?: string
}

/**
 * Hook for enrolling all company employees in a course
 */
export function useEnrollCompanyInCourse() {
  const queryClient = useQueryClient()

  return useMutation<EnrollCompanyInCourseResponse, Error, EnrollCompanyInCourseInput>({
    mutationFn: async ({ companyId, courseId }) => {
      const enrollCompanyInCourse = httpsCallable<EnrollCompanyInCourseInput, EnrollCompanyInCourseResponse>(
        functions,
        'enrollCompanyInCourse'
      )

      const result = await enrollCompanyInCourse({ companyId, courseId })

      if (!result.data.success) {
        throw new Error(result.data.error || 'Nem sikerült beiratkoztatni a vállalatot')
      }

      return result.data
    },
    onSuccess: () => {
      // Invalidate company enrolled courses
      queryClient.invalidateQueries({ queryKey: ['company-enrolled-courses'] })
    },
  })
}

/**
 * Hook for fetching company's enrolled courses
 */
export function useCompanyEnrolledCourses(companyId: string | undefined) {
  return useQuery<CompanyEnrolledCourse[], Error>({
    queryKey: ['company-enrolled-courses', companyId],
    queryFn: async () => {
      if (!companyId) return []

      const getCompanyEnrolledCourses = httpsCallable<{ companyId: string }, GetCompanyEnrolledCoursesResponse>(
        functions,
        'getCompanyEnrolledCourses'
      )

      const result = await getCompanyEnrolledCourses({ companyId })

      if (!result.data.success) {
        throw new Error(result.data.error || 'Nem sikerült lekérni a kurzusokat')
      }

      return result.data.courses || []
    },
    enabled: !!companyId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

// Note: Trial management is handled by Stripe, not custom functions
