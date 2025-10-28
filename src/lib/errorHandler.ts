/**
 * Centralized Error Handling System for DMA Platform
 * Provides consistent error handling, logging, and user feedback
 */

import { toast } from '@/hooks/use-toast'

// Error types for better categorization
export enum ErrorType {
  NETWORK = 'NETWORK',
  AUTHENTICATION = 'AUTHENTICATION', 
  AUTHORIZATION = 'AUTHORIZATION',
  VALIDATION = 'VALIDATION',
  VIDEO_PLAYBACK = 'VIDEO_PLAYBACK',
  QUIZ_SUBMISSION = 'QUIZ_SUBMISSION',
  FILE_UPLOAD = 'FILE_UPLOAD',
  DATABASE = 'DATABASE',
  UNKNOWN = 'UNKNOWN'
}

// Error severity levels
export enum ErrorSeverity {
  LOW = 'LOW',       // Minor issues, don't interrupt user flow
  MEDIUM = 'MEDIUM', // Noticeable issues, show notification
  HIGH = 'HIGH',     // Critical issues, require immediate attention
  CRITICAL = 'CRITICAL' // System failures, show error page
}

// Recovery action types
export enum RecoveryAction {
  RETRY = 'RETRY',
  REFRESH = 'REFRESH', 
  RELOAD_PAGE = 'RELOAD_PAGE',
  NAVIGATE_HOME = 'NAVIGATE_HOME',
  CONTACT_SUPPORT = 'CONTACT_SUPPORT',
  TRY_ALTERNATIVE = 'TRY_ALTERNATIVE',
  NONE = 'NONE'
}

// Structured error interface
export interface AppError {
  type: ErrorType
  severity: ErrorSeverity
  message: string
  userMessage: string // Hungarian message for users
  code?: string
  details?: Record<string, any>
  recoveryActions?: RecoveryAction[]
  timestamp: Date
  userId?: string
  sessionId?: string
  component?: string
  stack?: string
}

// Error context for logging
export interface ErrorContext {
  userId?: string
  sessionId?: string
  component?: string
  action?: string
  metadata?: Record<string, any>
  userAgent?: string
  url?: string
}

/**
 * Main error handler class
 */
export class ErrorHandler {
  private static instance: ErrorHandler
  private context: ErrorContext = {}

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler()
    }
    return ErrorHandler.instance
  }

  // Set global context for error reporting
  setContext(context: Partial<ErrorContext>) {
    this.context = { ...this.context, ...context }
  }

  // Create structured error from various inputs
  createError(
    error: Error | string | any,
    type: ErrorType = ErrorType.UNKNOWN,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    component?: string
  ): AppError {
    const timestamp = new Date()
    
    // Extract error information
    let message = 'Ismeretlen hiba történt'
    let stack: string | undefined
    
    if (error instanceof Error) {
      message = error.message
      stack = error.stack
    } else if (typeof error === 'string') {
      message = error
    } else if (error?.message) {
      message = error.message
    }

    // Generate user-friendly message in Hungarian
    const userMessage = this.generateUserMessage(type, message)
    
    // Determine recovery actions
    const recoveryActions = this.getRecoveryActions(type, severity)

    return {
      type,
      severity,
      message,
      userMessage,
      code: error?.code || error?.status?.toString(),
      details: error?.details || error?.response?.data,
      recoveryActions,
      timestamp,
      userId: this.context.userId,
      sessionId: this.context.sessionId,
      component: component || this.context.component,
      stack
    }
  }

  // Handle error with appropriate user feedback
  handleError(
    error: Error | string | any,
    type: ErrorType = ErrorType.UNKNOWN,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    component?: string
  ): AppError {
    const appError = this.createError(error, type, severity, component)
    
    // Log error
    this.logError(appError)
    
    // Show user notification based on severity
    this.showUserFeedback(appError)
    
    // Report to monitoring service (if configured)
    this.reportError(appError)
    
    return appError
  }

  // Generate user-friendly Hungarian messages
  private generateUserMessage(type: ErrorType, originalMessage: string): string {
    const messages: Record<ErrorType, string> = {
      [ErrorType.NETWORK]: 'Hálózati kapcsolat hiba. Kérjük, ellenőrizze az internetkapcsolatát.',
      [ErrorType.AUTHENTICATION]: 'Bejelentkezési hiba. Kérjük, jelentkezzen be újra.',
      [ErrorType.AUTHORIZATION]: 'Nincs jogosultsága ehhez a művelethez.',
      [ErrorType.VALIDATION]: 'Érvénytelen adatok. Kérjük, ellenőrizze a bevitt információkat.',
      [ErrorType.VIDEO_PLAYBACK]: 'Videó lejátszási hiba. Próbálja meg újratölteni az oldalt.',
      [ErrorType.QUIZ_SUBMISSION]: 'A kvíz beküldése sikertelen. Kérjük, próbálja újra.',
      [ErrorType.FILE_UPLOAD]: 'Fájl feltöltési hiba. Ellenőrizze a fájl méretét és formátumát.',
      [ErrorType.DATABASE]: 'Adatbázis hiba. Kérjük, próbálja újra később.',
      [ErrorType.UNKNOWN]: 'Váratlan hiba történt. Kérjük, próbálja újra.'
    }
    
    return messages[type] || messages[ErrorType.UNKNOWN]
  }

  // Determine appropriate recovery actions
  private getRecoveryActions(type: ErrorType, severity: ErrorSeverity): RecoveryAction[] {
    const actionMap: Record<ErrorType, RecoveryAction[]> = {
      [ErrorType.NETWORK]: [RecoveryAction.RETRY, RecoveryAction.REFRESH],
      [ErrorType.AUTHENTICATION]: [RecoveryAction.REFRESH, RecoveryAction.NAVIGATE_HOME],
      [ErrorType.AUTHORIZATION]: [RecoveryAction.NAVIGATE_HOME],
      [ErrorType.VALIDATION]: [RecoveryAction.NONE],
      [ErrorType.VIDEO_PLAYBACK]: [RecoveryAction.RETRY, RecoveryAction.TRY_ALTERNATIVE],
      [ErrorType.QUIZ_SUBMISSION]: [RecoveryAction.RETRY, RecoveryAction.CONTACT_SUPPORT],
      [ErrorType.FILE_UPLOAD]: [RecoveryAction.RETRY, RecoveryAction.TRY_ALTERNATIVE],
      [ErrorType.DATABASE]: [RecoveryAction.RETRY, RecoveryAction.REFRESH],
      [ErrorType.UNKNOWN]: [RecoveryAction.RETRY, RecoveryAction.REFRESH]
    }

    if (severity === ErrorSeverity.CRITICAL) {
      return [RecoveryAction.RELOAD_PAGE, RecoveryAction.CONTACT_SUPPORT]
    }

    return actionMap[type] || [RecoveryAction.RETRY]
  }

  // Log error with context
  private logError(error: AppError) {
    const logData = {
      ...error,
      context: this.context,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      userAgent: typeof window !== 'undefined' ? navigator.userAgent : undefined
    }

    if (error.severity === ErrorSeverity.CRITICAL || error.severity === ErrorSeverity.HIGH) {
      console.error('🚨 ELIRA Error:', logData)
    } else {
      console.warn('⚠️ ELIRA Warning:', logData)
    }
  }

  // Show appropriate user feedback
  private showUserFeedback(error: AppError) {
    if (error.severity === ErrorSeverity.LOW) {
      return // Don't show UI feedback for low severity errors
    }

    const variant = error.severity === ErrorSeverity.HIGH || error.severity === ErrorSeverity.CRITICAL 
      ? 'destructive' : 'default'

    toast({
      title: this.getSeverityTitle(error.severity),
      description: error.userMessage,
      variant,
      duration: error.severity === ErrorSeverity.HIGH ? 8000 : 5000
    })
  }

  // Get severity-appropriate title
  private getSeverityTitle(severity: ErrorSeverity): string {
    const titles: Record<ErrorSeverity, string> = {
      [ErrorSeverity.LOW]: 'Figyelmeztetés',
      [ErrorSeverity.MEDIUM]: 'Hiba történt',
      [ErrorSeverity.HIGH]: 'Kritikus hiba',
      [ErrorSeverity.CRITICAL]: 'Rendszerhiba'
    }
    return titles[severity]
  }

  // Report to external monitoring service (placeholder for Sentry, etc.)
  private reportError(error: AppError) {
    // TODO: Integrate with error monitoring service
    // Example: Sentry.captureException(error)
    
    // For now, just log to console in production
    if (process.env.NODE_ENV === 'production' && error.severity === ErrorSeverity.CRITICAL) {
      console.error('Production Error Report:', error)
    }
  }

  // Utility methods for common error scenarios
  handleNetworkError(error: any, component?: string) {
    return this.handleError(error, ErrorType.NETWORK, ErrorSeverity.MEDIUM, component)
  }

  handleVideoError(error: any, component?: string) {
    return this.handleError(error, ErrorType.VIDEO_PLAYBACK, ErrorSeverity.HIGH, component)
  }

  handleQuizError(error: any, component?: string) {
    return this.handleError(error, ErrorType.QUIZ_SUBMISSION, ErrorSeverity.HIGH, component)
  }

  handleAuthError(error: any, component?: string) {
    return this.handleError(error, ErrorType.AUTHENTICATION, ErrorSeverity.HIGH, component)
  }

  handleValidationError(error: any, component?: string) {
    return this.handleError(error, ErrorType.VALIDATION, ErrorSeverity.LOW, component)
  }
}

// Export singleton instance
export const errorHandler = ErrorHandler.getInstance()

// Helper function for components
export const handleComponentError = (
  error: any,
  type: ErrorType = ErrorType.UNKNOWN,
  component?: string
) => {
  return errorHandler.handleError(error, type, ErrorSeverity.MEDIUM, component)
}

// Recovery action executors
export const executeRecoveryAction = (action: RecoveryAction, context?: any) => {
  switch (action) {
    case RecoveryAction.RETRY:
      if (context?.retryFunction) {
        context.retryFunction()
      } else {
        window.location.reload()
      }
      break
      
    case RecoveryAction.REFRESH:
      window.location.reload()
      break
      
    case RecoveryAction.RELOAD_PAGE:
      window.location.reload()
      break
      
    case RecoveryAction.NAVIGATE_HOME:
      if (typeof window !== 'undefined') {
        window.location.href = '/'
      }
      break
      
    case RecoveryAction.CONTACT_SUPPORT:
      if (typeof window !== 'undefined') {
        window.open('mailto:support@dma.hu?subject=Technikai segítség kérés', '_blank')
      }
      break
      
    case RecoveryAction.TRY_ALTERNATIVE:
      // Context-specific alternative action
      if (context?.alternativeAction) {
        context.alternativeAction()
      }
      break
      
    case RecoveryAction.NONE:
    default:
      // No action needed
      break
  }
}