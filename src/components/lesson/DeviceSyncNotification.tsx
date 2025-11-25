"use client"

import React, { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Smartphone, 
  Laptop, 
  Tablet, 
  Monitor,
  RefreshCw as Sync,
  Clock,
  CheckCircle,
  AlertTriangle,
  X
} from 'lucide-react'
import { useDeviceSync, useDeviceInfo, useSyncedLessonProgress } from '@/hooks/useLessonProgress'

interface DeviceSyncNotificationProps {
  lessonId: string
  courseId: string
  onClose?: () => void
  className?: string
}

const getDeviceIcon = (userAgent: string) => {
  if (/Mobile|Android|iPhone|iPad/.test(userAgent)) {
    if (/iPad/.test(userAgent)) return Tablet
    return Smartphone
  }
  if (/Tablet/.test(userAgent)) return Tablet
  return userAgent.includes('Mac') ? Laptop : Monitor
}

const getDeviceType = (userAgent: string): string => {
  if (/iPhone/.test(userAgent)) return 'iPhone'
  if (/iPad/.test(userAgent)) return 'iPad'  
  if (/Android/.test(userAgent)) return 'Android'
  if (/Mac/.test(userAgent)) return 'Mac'
  if (/Windows/.test(userAgent)) return 'Windows'
  return 'Desktop'
}

export const DeviceSyncNotification: React.FC<DeviceSyncNotificationProps> = ({
  lessonId,
  courseId,
  onClose,
  className = ''
}) => {
  const [showNotification, setShowNotification] = useState(false)
  const [lastKnownDevice, setLastKnownDevice] = useState<string | null>(null)
  
  const deviceInfo = useDeviceInfo()
  const deviceSync = useDeviceSync()
  const { data: progressData } = useSyncedLessonProgress(lessonId, courseId)

  // Check if this is a new device
  useEffect(() => {
    if (progressData?.progress && progressData.devices) {
      const currentDeviceId = deviceInfo.deviceId
      const lastDevice = progressData.progress.lastDeviceId
      const hasProgress = progressData.progress.watchPercentage > 0 || progressData.progress.timeSpent > 0

      // Show notification if:
      // 1. User has previous progress
      // 2. Current device is different from last device
      // 3. There are multiple devices in history
      if (hasProgress && lastDevice && lastDevice !== currentDeviceId && progressData.devices.length > 1) {
        setShowNotification(true)
        setLastKnownDevice(lastDevice)
      }
    }
  }, [progressData, deviceInfo.deviceId])

  const handleSyncNow = async () => {
    try {
      await deviceSync.mutateAsync({ courseId })
      setShowNotification(false)
    } catch (error) {
      console.error('Sync failed:', error)
    }
  }

  const handleDismiss = () => {
    setShowNotification(false)
    onClose?.()
  }

  if (!showNotification || !progressData?.progress) {
    return null
  }

  const currentDevice = progressData.devices.find(d => d.id === deviceInfo.deviceId)
  const lastDevice = progressData.devices.find(d => d.id === lastKnownDevice)
  const CurrentDeviceIcon = getDeviceIcon(deviceInfo.userAgent)
  const LastDeviceIcon = lastDevice ? getDeviceIcon(lastDevice.userAgent) : Monitor

  const progressPercentage = progressData.progress.watchPercentage || 0
  const resumePosition = progressData.progress.resumePosition || 0

  return (
    <Card className={`border-brand-secondary/20 bg-brand-secondary/5 shadow-lg ${className}`}>
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-brand-secondary/10 rounded-full">
              <Sync className="w-4 h-4 text-brand-secondary" />
            </div>
            <div>
              <h4 className="font-bold text-brand-secondary-hover">Eszköz váltás észlelve</h4>
              <p className="text-sm text-brand-secondary-hover">
                A haladása szinkronizálásra vár más eszközökkel
              </p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleDismiss}
            className="text-brand-secondary hover:text-brand-secondary-hover"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Device Comparison */}
        <div className="flex items-center justify-between mb-4 p-3 bg-white rounded-lg border">
          <div className="flex items-center gap-3">
            <div className="text-center">
              <div className="p-2 bg-gray-100 rounded-full mb-1">
                <LastDeviceIcon className="w-5 h-5 text-gray-600" />
              </div>
              <div className="text-xs text-gray-600">Előző</div>
              <div className="text-xs font-medium">
                {lastDevice ? getDeviceType(lastDevice.userAgent) : 'Ismeretlen'}
              </div>
            </div>
            <div className="flex-1 flex items-center justify-center">
              <div className="flex items-center gap-2 text-brand-secondary">
                <div className="w-8 border-t border-dashed border-brand-secondary/30"></div>
                <Sync className="w-4 h-4" />
                <div className="w-8 border-t border-dashed border-brand-secondary/30"></div>
              </div>
            </div>
            <div className="text-center">
              <div className="p-2 bg-brand-secondary/10 rounded-full mb-1">
                <CurrentDeviceIcon className="w-5 h-5 text-brand-secondary" />
              </div>
              <div className="text-xs text-brand-secondary">Jelenlegi</div>
              <div className="text-xs font-medium text-brand-secondary-hover">
                {getDeviceType(deviceInfo.userAgent)}
              </div>
            </div>
          </div>
        </div>

        {/* Progress Info */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Mentett haladás:</span>
            <Badge variant="secondary">{Math.round(progressPercentage)}%</Badge>
          </div>
          
          {resumePosition > 0 && (
            <div className="flex items-center gap-2 text-sm text-brand-secondary-hover">
              <Clock className="w-4 h-4" />
              <span>Folytatás: {Math.floor(resumePosition / 60)}:{(resumePosition % 60).toString().padStart(2, '0')}</span>
            </div>
          )}

          <div className="flex items-center gap-2 text-sm text-gray-600">
            <AlertTriangle className="w-4 h-4" />
            <span>{progressData.devices.length} eszköz használatban</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button 
            onClick={handleSyncNow}
            disabled={deviceSync.isPending}
            className="flex-1"
            size="sm"
          >
            {deviceSync.isPending ? (
              <>
                <Sync className="w-4 h-4 mr-2 animate-spin" />
                Szinkronizálás...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Szinkronizálás most
              </>
            )}
          </Button>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleDismiss}
          >
            Később
          </Button>
        </div>

        {deviceSync.isError && (
          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
            Szinkronizálási hiba történt. Kérjük, próbálja újra.
          </div>
        )}
      </div>
    </Card>
  )
}