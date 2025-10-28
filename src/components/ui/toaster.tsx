"use client"

import React from 'react'
import { useToast } from '@/hooks/use-toast'
import { Card } from './card'
import { Button } from './button'
import { X, CheckCircle, AlertTriangle } from 'lucide-react'

export const Toaster: React.FC = () => {
  const { toasts, dismiss } = useToast()

  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {toasts.map((toast) => (
        <Card
          key={toast.id}
          className={`p-4 shadow-lg border-l-4 animate-slide-in ${
            toast.variant === 'destructive'
              ? 'border-l-red-500 bg-red-50 border-red-200'
              : 'border-l-blue-500 bg-blue-50 border-blue-200'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 mt-0.5">
                {toast.variant === 'destructive' ? (
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                ) : (
                  <CheckCircle className="w-5 h-5 text-blue-600" />
                )}
              </div>
              <div className="flex-1">
                {toast.title && (
                  <h4 className={`font-semibold text-sm mb-1 ${
                    toast.variant === 'destructive' ? 'text-red-900' : 'text-blue-900'
                  }`}>
                    {toast.title}
                  </h4>
                )}
                {toast.description && (
                  <p className={`text-sm ${
                    toast.variant === 'destructive' ? 'text-red-700' : 'text-blue-700'
                  }`}>
                    {toast.description}
                  </p>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => dismiss(toast.id)}
              className="h-6 w-6 p-0 hover:bg-transparent"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      ))}
    </div>
  )
}