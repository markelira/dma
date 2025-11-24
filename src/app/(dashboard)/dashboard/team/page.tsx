'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useTeamDashboard, useIsTeamOwner } from '@/hooks/useTeamDashboard'
import { useInviteTeamMember, useRemoveTeamMember, useResendTeamInvite } from '@/hooks/useTeamActions'
import {
  Users,
  UserCheck,
  Mail,
  CreditCard,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock,
  UserMinus,
  RefreshCw,
  Plus,
  X
} from 'lucide-react'
import { motion } from 'motion/react'

// Stat Card Component
function StatCard({
  icon: Icon,
  label,
  value,
  iconColor = 'text-blue-600',
  iconBg = 'bg-blue-50',
  isLoading = false
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string | number
  iconColor?: string
  iconBg?: string
  isLoading?: boolean
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-sm transition-shadow">
      <div className="flex items-center space-x-4">
        <div className={`p-3 rounded-lg ${iconBg}`}>
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>
        <div>
          {isLoading ? (
            <div className="h-8 w-16 bg-gray-200 animate-pulse rounded" />
          ) : (
            <p className="text-2xl font-bold text-gray-900">{value}</p>
          )}
          <p className="text-sm text-gray-600">{label}</p>
        </div>
      </div>
    </div>
  )
}

// Member Status Badge
function StatusBadge({ status }: { status: 'invited' | 'active' | 'removed' }) {
  const config = {
    invited: { label: 'Meghívva', icon: Clock, color: 'bg-yellow-100 text-yellow-800' },
    active: { label: 'Aktív', icon: CheckCircle2, color: 'bg-green-100 text-green-800' },
    removed: { label: 'Eltávolítva', icon: UserMinus, color: 'bg-red-100 text-red-800' },
  }

  const { label, icon: Icon, color } = config[status]

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>
      <Icon className="w-3 h-3 mr-1" />
      {label}
    </span>
  )
}

// Invite Member Modal
function InviteMemberModal({
  isOpen,
  onClose,
  teamId,
}: {
  isOpen: boolean
  onClose: () => void
  teamId: string
}) {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const inviteMutation = useInviteTeamMember()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)

    if (!email || !email.includes('@')) {
      setError('Kérjük, adj meg egy érvényes email címet')
      return
    }

    try {
      await inviteMutation.mutateAsync({ teamId, email })
      setSuccess(true)
      setEmail('')

      // Close modal after 2 seconds
      setTimeout(() => {
        onClose()
        setSuccess(false)
      }, 2000)
    } catch (err: any) {
      if (err.message?.includes('already')) {
        setError('Ez az email cím már meg lett hívva')
      } else if (err.message?.includes('limit') || err.message?.includes('maximum')) {
        setError('Elérted a maximális taglétszámot (10 fő)')
      } else {
        setError(err.message || 'Hiba történt a meghívó küldése során')
      }
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Tag meghívása</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {success ? (
          <div className="text-center py-8">
            <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-900">Meghívó elküldve!</p>
            <p className="text-gray-600 mt-2">A meghívó emailt elküldtük a megadott címre.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email cím
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="munkatars@example.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                disabled={inviteMutation.isPending}
              />
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start">
                <AlertCircle className="w-5 h-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                disabled={inviteMutation.isPending}
              >
                Mégse
              </button>
              <button
                type="submit"
                disabled={inviteMutation.isPending}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center"
              >
                {inviteMutation.isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Küldés...
                  </>
                ) : (
                  'Meghívó küldése'
                )}
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  )
}

export default function TeamDashboardPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const isTeamOwner = useIsTeamOwner()
  const { data: dashboardData, isLoading, error } = useTeamDashboard()

  const [showInviteModal, setShowInviteModal] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const removeMutation = useRemoveTeamMember()
  const resendMutation = useResendTeamInvite()

  // Redirect non-team-owners
  if (!authLoading && !isTeamOwner) {
    router.push('/dashboard')
    return null
  }

  // Loading state
  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Betöltés...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Hiba történt</h2>
          <p className="text-gray-600">{error.message}</p>
        </div>
      </div>
    )
  }

  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Nincs csapat</h2>
          <p className="text-gray-600">Még nem hoztál létre csapatot.</p>
        </div>
      </div>
    )
  }

  const { team, members, stats, subscription } = dashboardData

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Biztosan el szeretnéd távolítani ezt a tagot?')) return

    setActionLoading(memberId)
    try {
      await removeMutation.mutateAsync({ teamId: team.id, memberId })
    } catch (err) {
      console.error('Error removing member:', err)
    } finally {
      setActionLoading(null)
    }
  }

  const handleResendInvite = async (memberId: string) => {
    setActionLoading(memberId)
    try {
      await resendMutation.mutateAsync({ teamId: team.id, memberId })
      alert('Meghívó újraküldve!')
    } catch (err) {
      console.error('Error resending invite:', err)
    } finally {
      setActionLoading(null)
    }
  }

  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('hu-HU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  // Format subscription plan
  const formatPlan = (plan: string) => {
    const plans: Record<string, string> = {
      'monthly': 'Havi',
      '6-month': '6 hónapos',
      '12-month': 'Éves',
    }
    return plans[plan] || plan
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Tim kezelése</h1>
          <p className="text-gray-600 mt-1">Kezeld a csapatod tagjait és előfizetésedet</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={Users}
            label="Összes tag"
            value={stats.totalMembers}
            iconColor="text-blue-600"
            iconBg="bg-blue-50"
            isLoading={isLoading}
          />
          <StatCard
            icon={UserCheck}
            label="Aktív tag"
            value={stats.activeMembers}
            iconColor="text-green-600"
            iconBg="bg-green-50"
            isLoading={isLoading}
          />
          <StatCard
            icon={Mail}
            label="Meghívott"
            value={stats.invitedMembers}
            iconColor="text-yellow-600"
            iconBg="bg-yellow-50"
            isLoading={isLoading}
          />
          <StatCard
            icon={CreditCard}
            label="Előfizetés"
            value={subscription.isActive ? 'Aktív' : 'Inaktív'}
            iconColor={subscription.isActive ? 'text-green-600' : 'text-red-600'}
            iconBg={subscription.isActive ? 'bg-green-50' : 'bg-red-50'}
            isLoading={isLoading}
          />
        </div>

        {/* Subscription Info */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Előfizetés információ</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-500">Csomag</p>
              <p className="font-medium text-gray-900">{formatPlan(subscription.plan)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Státusz</p>
              <p className={`font-medium ${subscription.isActive ? 'text-green-600' : 'text-red-600'}`}>
                {subscription.isActive ? 'Aktív' : 'Inaktív'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Lejár</p>
              <p className="font-medium text-gray-900">{formatDate(subscription.endDate)}</p>
            </div>
          </div>
        </div>

        {/* Members Section */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Csapattagok</h2>
            <button
              onClick={() => setShowInviteModal(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5 mr-2" />
              Tag meghívása
            </button>
          </div>

          {/* Members Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Név
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Státusz
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Csatlakozott
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Műveletek
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {members.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                      Még nincsenek csapattagok. Hívj meg valakit!
                    </td>
                  </tr>
                ) : (
                  members.map((member) => (
                    <tr key={member.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Mail className="w-4 h-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900">{member.email}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">{member.name || '-'}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={member.status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {member.status === 'active' ? formatDate(member.joinedAt) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end space-x-2">
                          {member.status === 'invited' && (
                            <button
                              onClick={() => handleResendInvite(member.id)}
                              disabled={actionLoading === member.id}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                              title="Meghívó újraküldése"
                            >
                              {actionLoading === member.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <RefreshCw className="w-4 h-4" />
                              )}
                            </button>
                          )}
                          <button
                            onClick={() => handleRemoveMember(member.id)}
                            disabled={actionLoading === member.id}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                            title="Tag eltávolítása"
                          >
                            {actionLoading === member.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <UserMinus className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Member Limit Info */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              <span className="font-medium">{stats.totalMembers}/10</span> tag meghívva
            </p>
          </div>
        </div>
      </div>

      {/* Invite Modal */}
      <InviteMemberModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        teamId={team.id}
      />
    </div>
  )
}
