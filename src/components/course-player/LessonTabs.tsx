"use client"

import React, { useState } from 'react'
import { BookOpen, FileDown, FileText, CheckCircle } from 'lucide-react'
import {
  playerComponents,
  playerColors,
  playerTypography
} from '@/lib/course-player-design-system'
import { useTranslation } from '@/hooks/useTranslation'

interface Lesson {
  id: string
  title: string
  description?: string
  type: string
  resources?: any[]
  content?: string
}

interface LessonTabsProps {
  lesson: Lesson
  learningOutcomes?: string[]
  className?: string
}

type TabType = 'overview' | 'resources' | 'transcript'

export const LessonTabs: React.FC<LessonTabsProps> = ({
  lesson,
  learningOutcomes = [],
  className = ''
}) => {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<TabType>('overview')

  const tabs = [
    { id: 'overview' as TabType, label: t('tabs.overview'), icon: BookOpen },
    { id: 'resources' as TabType, label: t('tabs.resources'), icon: FileDown },
    { id: 'transcript' as TabType, label: t('tabs.transcript'), icon: FileText }
  ]

  return (
    <div className={`bg-white rounded-lg ${className}`}>
      {/* Tab Navigation */}
      <div className={playerComponents.tabsList} role="tablist">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id

          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              aria-controls={`panel-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={`${playerComponents.tabButton} ${
                isActive ? playerComponents.tabButtonActive : ''
              }`}
            >
              <Icon size={16} className="inline mr-2" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div
            role="tabpanel"
            id="panel-overview"
            aria-labelledby="tab-overview"
          >
            <div className="space-y-6">
              {/* Lesson Description */}
              {lesson.description && (
                <div>
                  <h3 className={`${playerTypography.h3} mb-3`}>
                    {t('tabs.aboutLesson')}
                  </h3>
                  <p
                    className={playerTypography.body}
                    style={{ color: playerColors.textSecondary }}
                  >
                    {lesson.description}
                  </p>
                </div>
              )}

              {/* Learning Outcomes */}
              {learningOutcomes.length > 0 && (
                <div>
                  <h3 className={`${playerTypography.h3} mb-3`}>
                    {t('tabs.whatYouWillLearn')}
                  </h3>
                  <ul className="space-y-2">
                    {learningOutcomes.map((outcome, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-3"
                      >
                        <CheckCircle
                          size={20}
                          className="flex-shrink-0 mt-0.5"
                          style={{ color: playerColors.success }}
                        />
                        <span
                          className={playerTypography.body}
                          style={{ color: playerColors.textPrimary }}
                        >
                          {outcome}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Key Concepts */}
              <div>
                <h3 className={`${playerTypography.h3} mb-3`}>
                  {t('tabs.keyConcepts')}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {/* Placeholder for concept tags */}
                  <span className={`${playerComponents.badge} ${playerComponents.badgeBlue}`}>
                    {t('tabs.contentType', { type: lesson.type })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Resources Tab */}
        {activeTab === 'resources' && (
          <div
            role="tabpanel"
            id="panel-resources"
            aria-labelledby="tab-resources"
          >
            {lesson.resources && lesson.resources.length > 0 ? (
              <div className="space-y-3">
                <h3 className={`${playerTypography.h3} mb-4`}>
                  {t('tabs.downloadableResources')}
                </h3>
                {lesson.resources.map((resource: any, index: number) => (
                  <a
                    key={index}
                    href={resource.url}
                    download
                    className={`${playerComponents.card} ${playerComponents.cardHover} p-4 flex items-center justify-between group`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: playerColors.primaryLight }}
                      >
                        <FileDown
                          size={20}
                          style={{ color: playerColors.primary }}
                        />
                      </div>
                      <div>
                        <h4 className={`${playerTypography.label} text-gray-900`}>
                          {resource.title || t('tabs.resource', { index: index + 1 })}
                        </h4>
                        {resource.type && (
                          <p className={playerTypography.caption}>
                            {resource.type}
                          </p>
                        )}
                      </div>
                    </div>
                    <span
                      className={`${playerTypography.bodySmall} font-medium group-hover:text-[#0066CC] transition-colors`}
                      style={{ color: playerColors.primary }}
                    >
                      {t('tabs.download')}
                    </span>
                  </a>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <FileDown
                  size={48}
                  className="mx-auto mb-4"
                  style={{ color: playerColors.textTertiary }}
                />
                <p
                  className={playerTypography.body}
                  style={{ color: playerColors.textSecondary }}
                >
                  {t('tabs.noResources')}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Transcript Tab (Placeholder) */}
        {activeTab === 'transcript' && (
          <div
            role="tabpanel"
            id="panel-transcript"
            aria-labelledby="tab-transcript"
          >
            <div className="text-center py-12">
              <FileText
                size={48}
                className="mx-auto mb-4"
                style={{ color: playerColors.textTertiary }}
              />
              <h3 className={`${playerTypography.h3} mb-2`}>
                {t('tabs.transcriptComingSoon')}
              </h3>
              <p
                className={playerTypography.body}
                style={{ color: playerColors.textSecondary }}
              >
                {t('tabs.transcriptMessage')}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
