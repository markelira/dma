"use client"

import React, { useState } from 'react'
import { CourseTabNavigation } from './CourseTabNavigation'
import { OverviewTab } from './tabs/OverviewTab'
import { CurriculumTab } from './tabs/CurriculumTab'
import { InstructorsTab } from './tabs/InstructorsTab'
import { ReviewsTab } from './tabs/ReviewsTab'
import { FAQTab } from './tabs/FAQTab'
import { CourseSidebar } from './CourseSidebar'
import { RelatedCoursesSection } from './RelatedCoursesSection'
import { CourseCertificatePreview } from './CourseCertificatePreview'

interface CourseDetailLayoutProps {
  courseData: any
  ctaLabel: string
  onCtaClick: () => void
  isEnrolling: boolean
}

type TabType = 'overview' | 'curriculum' | 'instructors' | 'reviews' | 'faq'

export function CourseDetailLayout({ courseData, ctaLabel, onCtaClick, isEnrolling }: CourseDetailLayoutProps) {
  const [activeTab, setActiveTab] = useState<TabType>('overview')

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab courseData={courseData} />
      case 'curriculum':
        return <CurriculumTab courseData={courseData} />
      case 'instructors':
        return <InstructorsTab courseData={courseData} />
      case 'reviews':
        return <ReviewsTab courseData={courseData} />
      case 'faq':
        return <FAQTab courseData={courseData} />
      default:
        return <OverviewTab courseData={courseData} />
    }
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Tab Navigation */}
      <CourseTabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
      
      {/* Main Content Area */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2">
            {renderTabContent()}
          </div>
          
          {/* Right Column - Sidebar */}
          <div className="lg:col-span-1">
            <CourseSidebar 
              courseData={courseData}
              ctaLabel={ctaLabel}
              onCtaClick={onCtaClick}
              isEnrolling={isEnrolling}
            />
          </div>
        </div>
      </div>
      
      {/* Related Courses Section */}
      <RelatedCoursesSection 
        currentCourseId={courseData.id || ''}
        currentCourseCategory={courseData.category?.name}
        currentCourseInstructorId={courseData.instructor?.id}
      />

      {/* Course Certificate Preview */}
      <CourseCertificatePreview 
        courseData={courseData} 
        onCtaClick={onCtaClick}
      />
    </div>
  )
} 