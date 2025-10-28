"use client"

import React from "react"
import { Button } from "@/components/ui/button"

// ErrorBoundary class
export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: any }> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: null }
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error }
  }
  componentDidCatch(error: any, info: any) {
    // Log error in backend-like structure
    if (process.env.NODE_ENV !== 'production') {
      console.error('[FRONTEND ERROR]', {
        error: error?.message || String(error),
        stack: error?.stack,
        info,
        time: new Date().toISOString(),
      })
    }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4">
          <h1 className="text-2xl font-bold mb-4 text-center">Hiba történt az alkalmazásban</h1>
          <p className="mb-4 text-center">Valami elromlott. Kérjük, frissítsd az oldalt vagy próbáld meg később.</p>
          <Button onClick={() => window.location.reload()}>Oldal újratöltése</Button>
          {process.env.NODE_ENV !== 'production' && this.state.error && (
            <pre className="mt-6 text-xs text-red-500 max-w-full overflow-x-auto bg-muted p-2 rounded">
              {this.state.error?.message || String(this.state.error)}
              {this.state.error?.stack}
            </pre>
          )}
        </div>
      )
    }
    return this.props.children
  }
}

// Global unhandled promise rejection handler
if (typeof window !== 'undefined') {
  window.onunhandledrejection = function (event) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[UNHANDLED PROMISE REJECTION]', {
        reason: event.reason,
        time: new Date().toISOString(),
      })
    }
  }
} 