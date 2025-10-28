"use client"

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  AlertTriangle, 
  RefreshCw, 
  Home, 
  MessageCircle, 
  ChevronDown,
  ChevronUp,
  Bug
} from 'lucide-react'
import { errorHandler, ErrorType, ErrorSeverity, RecoveryAction, executeRecoveryAction } from '@/lib/errorHandler'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  level?: 'page' | 'section' | 'component'
  context?: string
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  showDetails: boolean
  errorId: string
}

export class GlobalErrorBoundary extends Component<Props, State> {
  private retryCount = 0
  private maxRetries = 3

  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
      errorId: ''
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      errorId: `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo })

    // Determine error severity based on boundary level
    const severity = this.props.level === 'page' 
      ? ErrorSeverity.CRITICAL 
      : this.props.level === 'section'
      ? ErrorSeverity.HIGH
      : ErrorSeverity.MEDIUM

    // Handle error through centralized system
    errorHandler.handleError(
      error,
      ErrorType.UNKNOWN,
      severity,
      this.props.context || `ErrorBoundary-${this.props.level}`
    )
  }

  handleRetry = () => {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        showDetails: false
      })
    } else {
      executeRecoveryAction(RecoveryAction.REFRESH)
    }
  }

  handleRecoveryAction = (action: RecoveryAction) => {
    executeRecoveryAction(action, {
      retryFunction: this.handleRetry
    })
  }

  toggleDetails = () => {
    this.setState(prev => ({ showDetails: !prev.showDetails }))
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Different UI based on boundary level
      return this.renderErrorUI()
    }

    return this.props.children
  }

  private renderErrorUI() {
    const { level = 'component' } = this.props
    const { error, errorInfo, showDetails, errorId } = this.state
    
    if (level === 'page') {
      return this.renderPageError()
    }
    
    if (level === 'section') {
      return this.renderSectionError()
    }
    
    return this.renderComponentError()
  }

  private renderPageError() {
    const { error, errorInfo, showDetails, errorId } = this.state
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl border-red-200 shadow-lg">
          <CardHeader className="text-center pb-4">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-red-100 rounded-full">
                <AlertTriangle className="w-12 h-12 text-red-600" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-red-900 mb-2">
              Váratlan hiba történt
            </CardTitle>
            <p className="text-gray-600">
              Az oldal betöltése során hiba lépett fel. Kérjük, próbálja újra vagy lépjen kapcsolatba ügyfélszolgálatunkkal.
            </p>
            <Badge variant="outline" className="mx-auto mt-2 font-mono text-xs">
              Hibaazonosító: {errorId}
            </Badge>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Recovery Actions */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button 
                onClick={this.handleRetry}
                className="flex items-center gap-2"
                disabled={this.retryCount >= this.maxRetries}
              >
                <RefreshCw className="w-4 h-4" />
                Újrapróbálás {this.retryCount > 0 && `(${this.retryCount}/${this.maxRetries})`}
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => this.handleRecoveryAction(RecoveryAction.NAVIGATE_HOME)}
                className="flex items-center gap-2"
              >
                <Home className="w-4 h-4" />
                Főoldal
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => this.handleRecoveryAction(RecoveryAction.CONTACT_SUPPORT)}
                className="flex items-center gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                Segítség
              </Button>
            </div>

            {/* Error Details Toggle */}
            <div className="border-t pt-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={this.toggleDetails}
                className="w-full flex items-center justify-center gap-2 text-gray-500"
              >
                <Bug className="w-4 h-4" />
                Technikai részletek
                {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
              
              {showDetails && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg border font-mono text-sm overflow-auto max-h-64">
                  <div className="space-y-2">
                    <div>
                      <strong>Hiba:</strong> {error?.message}
                    </div>
                    {error?.stack && (
                      <div>
                        <strong>Stack trace:</strong>
                        <pre className="mt-1 text-xs text-gray-600 whitespace-pre-wrap">
                          {error.stack}
                        </pre>
                      </div>
                    )}
                    {errorInfo?.componentStack && (
                      <div>
                        <strong>Component stack:</strong>
                        <pre className="mt-1 text-xs text-gray-600 whitespace-pre-wrap">
                          {errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  private renderSectionError() {
    const { errorId } = this.state
    
    return (
      <Card className="border-orange-200 bg-orange-50">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-orange-100 rounded-full flex-shrink-0">
              <AlertTriangle className="w-6 h-6 text-orange-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-orange-900 mb-2">
                A szakasz betöltése sikertelen
              </h3>
              <p className="text-orange-700 text-sm mb-3">
                Ez a rész jelenleg nem érhető el. Próbálja újra vagy folytassa más tartalommal.
              </p>
              <div className="flex gap-2">
                <Button 
                  size="sm"
                  variant="outline"
                  onClick={this.handleRetry}
                  disabled={this.retryCount >= this.maxRetries}
                  className="border-orange-300 hover:bg-orange-100"
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Újrapróbálás
                </Button>
              </div>
              <Badge variant="outline" className="mt-2 font-mono text-xs">
                {errorId}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  private renderComponentError() {
    return (
      <div className="p-4 border border-yellow-200 bg-yellow-50 rounded-lg">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-yellow-800 text-sm font-medium">
              A komponens betöltése sikertelen
            </p>
            <p className="text-yellow-700 text-xs mt-1">
              Próbálja újra az oldal frissítésével
            </p>
          </div>
          <Button 
            size="sm"
            variant="outline"
            onClick={this.handleRetry}
            disabled={this.retryCount >= this.maxRetries}
            className="border-yellow-300 hover:bg-yellow-100 text-xs"
          >
            <RefreshCw className="w-3 h-3" />
          </Button>
        </div>
      </div>
    )
  }
}

// Convenience wrapper components for different levels
export const PageErrorBoundary: React.FC<{ children: ReactNode; context?: string }> = ({ 
  children, 
  context 
}) => (
  <GlobalErrorBoundary level="page" context={context}>
    {children}
  </GlobalErrorBoundary>
)

export const SectionErrorBoundary: React.FC<{ children: ReactNode; context?: string }> = ({ 
  children, 
  context 
}) => (
  <GlobalErrorBoundary level="section" context={context}>
    {children}
  </GlobalErrorBoundary>
)

export const ComponentErrorBoundary: React.FC<{ 
  children: ReactNode
  context?: string
  fallback?: ReactNode 
}> = ({ children, context, fallback }) => (
  <GlobalErrorBoundary level="component" context={context} fallback={fallback}>
    {children}
  </GlobalErrorBoundary>
)