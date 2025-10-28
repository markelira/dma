'use client'

import { useState } from 'react'
import { motion } from 'motion/react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Bell, BookOpen, Award, Users, TrendingUp, Settings, Check, X, Filter } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { hu } from 'date-fns/locale'
import { brandGradient, glassMorphism } from '@/lib/design-tokens-premium'

/**
 * Notifications Dashboard
 * 
 * User notification center with filtering, marking as read/unread,
 * and different notification types (course updates, achievements, system)
 */

interface Notification {
  id: string
  type: 'course' | 'achievement' | 'system' | 'social'
  title: string
  message: string
  createdAt: string
  isRead: boolean
  actionUrl?: string
  metadata?: Record<string, any>
}

export default function NotificationsPage() {
  const [filter, setFilter] = useState<'all' | 'unread' | 'course' | 'achievement' | 'system'>('all')

  // Mock notifications data - will be replaced with real data
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'course',
      title: 'Új lecke elérhető',
      message: 'A "Modern React fejlesztés" kurzusban új lecke lett közzétéve: "Advanced Hooks"',
      createdAt: '2024-01-15T10:30:00Z',
      isRead: false,
      actionUrl: '/courses/react-advanced/lessons/hooks',
      metadata: { courseId: 'react-advanced', lessonId: 'hooks' }
    },
    {
      id: '2',
      type: 'achievement',
      title: 'Gratulálunk! Új jelvény szerzett',
      message: 'Megszerezte a "Quiz Master" jelvényt 10 tökéletes kvíz eredményért!',
      createdAt: '2024-01-14T16:45:00Z',
      isRead: false,
      metadata: { badgeId: 'quiz-master', points: 250 }
    },
    {
      id: '3',
      type: 'course',
      title: 'Kurzus befejezés közelében',
      message: 'Már csak 2 lecke van hátra a "Digital Marketing alapok" kurzus befejezéséhez!',
      createdAt: '2024-01-14T09:15:00Z',
      isRead: true,
      actionUrl: '/dashboard/my-learning',
      metadata: { courseId: 'digital-marketing', lessonsRemaining: 2 }
    },
    {
      id: '4',
      type: 'system',
      title: 'Platform frissítés',
      message: 'Új funkciók érhetők el! Fedezze fel a továbbfejlesztett tanulási felületet.',
      createdAt: '2024-01-13T12:00:00Z',
      isRead: true,
      metadata: { version: '2.1.0' }
    },
    {
      id: '5',
      type: 'social',
      title: 'Új követő',
      message: 'Kiss Anna mostantól követi Önt a platformon.',
      createdAt: '2024-01-12T14:20:00Z',
      isRead: true,
      metadata: { followerId: 'anna-kiss' }
    }
  ])

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'course':
        return <BookOpen className="w-5 h-5 text-gray-900" />
      case 'achievement':
        return <Award className="w-5 h-5 text-gray-900" />
      case 'system':
        return <Settings className="w-5 h-5 text-gray-600" />
      case 'social':
        return <Users className="w-5 h-5 text-gray-900" />
      default:
        return <Bell className="w-5 h-5 text-gray-600" />
    }
  }

  const getNotificationColor = (type: Notification['type']) => {
    switch (type) {
      case 'course':
        return 'bg-gray-50 border-gray-300'
      case 'achievement':
        return 'bg-gray-50 border-gray-300'
      case 'system':
        return 'bg-gray-50 border-gray-200'
      case 'social':
        return 'bg-gray-50 border-gray-300'
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'all') return true
    if (filter === 'unread') return !notification.isRead
    return notification.type === filter
  })

  const unreadCount = notifications.filter(n => !n.isRead).length

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, isRead: true }
          : notification
      )
    )
  }

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, isRead: true }))
    )
  }

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Gradient Hero Section */}
      <section
        className="relative -mt-20 pt-20 pb-12"
        style={{ background: brandGradient }}
      >
        <div className="container mx-auto px-6 lg:px-12 py-12 relative z-10">
          <motion.div
            className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Left: Title and Description */}
            <div className="flex-1">
              <motion.div
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm mb-4"
                style={{
                  ...glassMorphism.badge,
                  border: '1px solid rgba(255, 255, 255, 0.25)'
                }}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <Bell className="w-4 h-4 text-white" />
                <span className="font-semibold text-white">
                  {unreadCount} Olvasatlan
                </span>
              </motion.div>

              <h1 className="text-4xl lg:text-5xl font-semibold text-white mb-3">
                Értesítések
              </h1>
              <p className="text-white/80 text-lg max-w-2xl">
                Kövesse nyomon a legújabb frissítéseket és eredményeket
              </p>
            </div>

            {/* Right: Mark All Read Button */}
            {unreadCount > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Button
                  onClick={markAllAsRead}
                  className="bg-white/10 hover:bg-white/20 text-white border border-white/25 backdrop-blur-md"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Összes olvasottként jelölése
                </Button>
              </motion.div>
            )}
          </motion.div>
        </div>

        {/* Ambient glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(circle at 50% 30%, rgba(139, 92, 246, 0.08), transparent 70%)'
          }}
        />
      </section>

      {/* Main Content */}
      <div className="container mx-auto px-6 lg:px-12 py-12">
        <div className="max-w-4xl mx-auto space-y-6">

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'all', label: 'Összes', count: notifications.length },
            { key: 'unread', label: 'Olvasatlan', count: unreadCount },
            { key: 'course', label: 'Kurzusok', count: notifications.filter(n => n.type === 'course').length },
            { key: 'achievement', label: 'Eredmények', count: notifications.filter(n => n.type === 'achievement').length },
            { key: 'system', label: 'Rendszer', count: notifications.filter(n => n.type === 'system').length }
          ].map(({ key, label, count }) => (
            <Button
              key={key}
              variant={filter === key ? "default" : "secondary"}
              size="sm"
              onClick={() => setFilter(key as any)}
              className={`flex items-center space-x-2 ${
                filter === key
                  ? 'bg-gray-900 text-white hover:bg-[#466C95] transition-colors'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span>{label}</span>
              <Badge
                variant="secondary"
                className={`ml-1 ${
                  filter === key
                    ? 'bg-gray-800 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {count}
              </Badge>
            </Button>
          ))}
        </div>

        {/* Notifications List */}
        <div className="space-y-3">
          {filteredNotifications.length === 0 ? (
            <Card className="p-12 text-center">
              <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Nincsenek értesítések
              </h3>
              <p className="text-gray-600">
                {filter === 'unread' 
                  ? 'Minden értesítést elolvasott!' 
                  : 'Itt fogja látni a legújabb frissítéseket és eredményeket.'
                }
              </p>
            </Card>
          ) : (
            filteredNotifications.map((notification, index) => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
              >
                <Card
                  className={`transition-all hover:shadow-md ${
                    !notification.isRead
                      ? 'bg-gray-50 border-l-4 border-[#466C95]'
                      : 'border-gray-200'
                  }`}
                >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className={`font-medium ${!notification.isRead ? 'text-gray-900' : 'text-gray-700'}`}>
                            {notification.title}
                          </h3>
                          {!notification.isRead && (
                            <div className="w-2 h-2 bg-[#466C95] rounded-full" />
                          )}
                        </div>
                        <p className="text-gray-600 mb-2">{notification.message}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>
                            {formatDistanceToNow(new Date(notification.createdAt), { 
                              addSuffix: true, 
                              locale: hu 
                            })}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {notification.type === 'course' ? 'Kurzus' :
                             notification.type === 'achievement' ? 'Eredmény' :
                             notification.type === 'system' ? 'Rendszer' : 'Közösségi'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      {!notification.isRead && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => markAsRead(notification.id)}
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteNotification(notification.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  {notification.actionUrl && (
                    <div className="mt-3">
                      <Button size="sm" variant="outline">
                        Megtekintés
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
              </motion.div>
            ))
          )}
        </div>
        </div>
      </div>
    </div>
  )
}