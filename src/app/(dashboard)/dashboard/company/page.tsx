'use client'

import { useState } from 'react'
import { Users, UserPlus, Mail, Trash2, CheckCircle, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'

/**
 * Company Team Management Page
 *
 * Features:
 * - View team members
 * - Invite new members via email
 * - Remove team members
 * - Team members inherit subscription access
 */

interface TeamMember {
  id: string
  name: string
  email: string
  status: 'active' | 'invited' | 'pending'
  invitedAt: Date
  joinedAt?: Date
}

export default function CompanyPage() {
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteName, setInviteName] = useState('')

  // TODO: Fetch real team data from backend
  const teamMembers: TeamMember[] = [
    {
      id: '1',
      name: 'Kovács János',
      email: 'janos.kovacs@example.com',
      status: 'active',
      invitedAt: new Date('2024-01-15'),
      joinedAt: new Date('2024-01-15')
    },
    {
      id: '2',
      name: 'Nagy Anna',
      email: 'anna.nagy@example.com',
      status: 'active',
      invitedAt: new Date('2024-01-20'),
      joinedAt: new Date('2024-01-21')
    },
    {
      id: '3',
      name: 'Szabó Péter',
      email: 'peter.szabo@example.com',
      status: 'invited',
      invitedAt: new Date('2024-02-01')
    }
  ]

  const handleInvite = () => {
    // TODO: Implement invite logic
    console.log('Inviting:', inviteEmail, inviteName)
    setShowInviteModal(false)
    setInviteEmail('')
    setInviteName('')
  }

  const handleRemove = (memberId: string) => {
    // TODO: Implement remove logic
    console.log('Removing member:', memberId)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-6 lg:px-12 py-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Users className="w-6 h-6 text-primary" />
                <h1 className="text-3xl font-bold text-gray-900">
                  Csapatom
                </h1>
              </div>
              <p className="text-gray-600">
                Hívjon meg csapattagokat, akik automatikusan hozzáférést kapnak az összes tartalomhoz
              </p>
            </div>
            <Button
              onClick={() => setShowInviteModal(true)}
              className="bg-primary hover:bg-primary-hover"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Csapattag meghívása
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 lg:px-12 py-8">
        <div className="max-w-5xl mx-auto space-y-6">

          {/* Subscription Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <CheckCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-semibold text-blue-900 mb-2">
                  Automatikus hozzáférés
                </h3>
                <p className="text-blue-800">
                  Az Ön előfizetésével minden meghívott csapattag automatikusan hozzáfér az összes tartalomhoz.
                  Nincs további díj vagy korlátozás a csapattagok számára.
                </p>
              </div>
            </div>
          </div>

          {/* Team Stats */}
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <p className="text-sm text-gray-600 mb-1">Összes tag</p>
              <p className="text-3xl font-bold text-gray-900">{teamMembers.length}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <p className="text-sm text-gray-600 mb-1">Aktív tagok</p>
              <p className="text-3xl font-bold text-green-600">
                {teamMembers.filter(m => m.status === 'active').length}
              </p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <p className="text-sm text-gray-600 mb-1">Függőben lévő meghívók</p>
              <p className="text-3xl font-bold text-amber-600">
                {teamMembers.filter(m => m.status === 'invited').length}
              </p>
            </div>
          </div>

          {/* Team Members List */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Csapattagok
              </h2>
            </div>

            <div className="divide-y divide-gray-200">
              {teamMembers.map((member) => (
                <div key={member.id} className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-4 flex-1">
                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary-hover flex items-center justify-center text-white font-semibold">
                      {member.name.charAt(0)}
                    </div>

                    {/* Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-semibold text-gray-900">{member.name}</h3>
                        {member.status === 'active' && (
                          <span className="flex items-center gap-1 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                            <CheckCircle className="w-3 h-3" />
                            Aktív
                          </span>
                        )}
                        {member.status === 'invited' && (
                          <span className="flex items-center gap-1 text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full">
                            <Clock className="w-3 h-3" />
                            Meghívva
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{member.email}</p>
                      {member.joinedAt && (
                        <p className="text-xs text-gray-500 mt-1">
                          Csatlakozott: {member.joinedAt.toLocaleDateString('hu-HU')}
                        </p>
                      )}
                      {!member.joinedAt && (
                        <p className="text-xs text-gray-500 mt-1">
                          Meghívva: {member.invitedAt.toLocaleDateString('hu-HU')}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 border-red-200 hover:bg-red-50"
                    onClick={() => handleRemove(member.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>

            {teamMembers.length === 0 && (
              <div className="p-12 text-center">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Még nincs csapattag
                </h3>
                <p className="text-gray-600 mb-6">
                  Kezdje el a csapat építését új tagok meghívásával
                </p>
                <Button
                  onClick={() => setShowInviteModal(true)}
                  className="bg-primary hover:bg-primary-hover"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Első tag meghívása
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Csapattag meghívása
            </h3>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Név
                </label>
                <input
                  type="text"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="Kovács János"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  E-mail cím
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="janos.kovacs@example.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-900">
                  <Mail className="w-4 h-4 inline mr-1" />
                  Küldünk egy meghívó e-mailt erre a címre.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowInviteModal(false)
                  setInviteEmail('')
                  setInviteName('')
                }}
              >
                Mégsem
              </Button>
              <Button
                className="flex-1 bg-primary hover:bg-primary-hover"
                onClick={handleInvite}
                disabled={!inviteEmail || !inviteName}
              >
                Meghívás küldése
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
