'use client'

import React from 'react'
import { AnalyticsDashboard } from '@/components/admin/AnalyticsDashboard'

/**
 * Admin Dashboard - Analytics Hub
 *
 * Comprehensive analytics and business metrics dashboard:
 * - Key metrics (users, subscribers, MRR, companies, active today, conversion)
 * - Revenue charts (MRR trend, revenue by plan)
 * - User analytics (growth, breakdown by role, verification status)
 * - Subscription breakdown (individual, team, company, trial, churn)
 * - B2B metrics (companies, employees, masterclass seats)
 * - System status (collapsible)
 */

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Vezérlőpult
        </h1>
        <p className="text-gray-600 mt-2">
          Üzleti metrikák és analytics egy helyen
        </p>
      </div>

      {/* Analytics Dashboard */}
      <AnalyticsDashboard />
    </div>
  )
}
