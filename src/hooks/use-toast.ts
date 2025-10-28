import { useState, useCallback } from 'react'

export interface Toast {
  id: string
  title?: string
  description?: string
  variant?: 'default' | 'destructive'
  duration?: number
}

interface ToastState {
  toasts: Toast[]
}

const toastState: ToastState = {
  toasts: []
}

const listeners: Set<() => void> = new Set()

const dispatch = (toast: Omit<Toast, 'id'>) => {
  const id = Math.random().toString(36).substr(2, 9)
  const newToast: Toast = { id, ...toast }
  
  toastState.toasts.push(newToast)
  listeners.forEach(listener => listener())
  
  // Auto remove after duration
  setTimeout(() => {
    toastState.toasts = toastState.toasts.filter(t => t.id !== id)
    listeners.forEach(listener => listener())
  }, toast.duration || 5000)
}

export const toast = (toast: Omit<Toast, 'id'>) => {
  dispatch(toast)
}

export const useToast = () => {
  const [, forceUpdate] = useState({})
  
  const refresh = useCallback(() => {
    forceUpdate({})
  }, [])
  
  // Subscribe to toast updates
  listeners.add(refresh)
  
  const dismiss = useCallback((toastId: string) => {
    toastState.toasts = toastState.toasts.filter(t => t.id !== toastId)
    listeners.forEach(listener => listener())
  }, [])
  
  return {
    toasts: toastState.toasts,
    toast: dispatch,
    dismiss
  }
}