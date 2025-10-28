import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

interface ChartWrapperProps {
  title: string
  isLoading: boolean
  error: Error | null
  onRetry?: () => void
  children: React.ReactNode
  className?: string
}

export function ChartWrapper({
  title,
  isLoading,
  error,
  onRetry,
  children,
  className = ''
}: ChartWrapperProps) {
  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px]">
            <div className="flex flex-col items-center space-y-2">
              <Spinner size="lg" />
              <p className="text-sm text-muted-foreground">Adatok betöltése...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px]">
            <Alert className="max-w-md">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="mt-2">
                <div className="text-sm text-muted-foreground mb-3">
                  {error.message}
                </div>
                {onRetry && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onRetry}
                    className="w-full"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Újrapróbálkozás
                  </Button>
                )}
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  )
}

// Error boundary component for chart components
interface ChartErrorBoundaryState {
  hasError: boolean
  error?: Error
}

export class ChartErrorBoundary extends React.Component<
  React.PropsWithChildren<{ fallback?: React.ReactNode }>,
  ChartErrorBoundaryState
> {
  constructor(props: React.PropsWithChildren<{ fallback?: React.ReactNode }>) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ChartErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Chart error boundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <Card>
          <CardContent>
            <div className="flex items-center justify-center h-[300px]">
              <Alert className="max-w-md">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Hiba történt a diagram megjelenítése közben.
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => this.setState({ hasError: false })}
                    className="mt-2 w-full"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Újrapróbálkozás
                  </Button>
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
        </Card>
      )
    }

    return this.props.children
  }
} 