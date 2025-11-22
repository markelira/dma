/**
 * Course Type Terminology Configuration
 *
 * Centralized source of truth for all type-specific labels and text
 * used throughout the platform. This enables consistent differentiation
 * between course types (ACADEMIA, WEBINAR, MASTERCLASS, PODCAST).
 */

import { CourseType, COURSE_TYPE_LABELS } from '@/types';

/**
 * Terminology interface for type-specific labels
 */
export interface CourseTypeTerminology {
  /** Single instructor label (e.g., "Mentor", "Szereplő") */
  instructorLabel: string;
  /** Plural instructors label (e.g., "Mentorok", "Szereplők") */
  instructorsLabel: string;
  /** Section header for learning outcomes */
  outcomesLabel: string;
  /** Generic content label */
  contentLabel: string;
  /** Single lesson label (e.g., "Lecke", "Epizód", "Előadás") */
  lessonLabel: string;
  /** Plural lessons label */
  lessonsLabel: string;
  /** Curriculum section header */
  curriculumLabel: string;
  /** Duration format label */
  durationLabel: string;
}

/**
 * Get type-specific terminology for a course type
 */
export function getCourseTypeTerminology(courseType: CourseType): CourseTypeTerminology {
  switch (courseType) {
    case 'PODCAST':
      return {
        instructorLabel: 'Szereplő',
        instructorsLabel: 'Szereplők',
        outcomesLabel: 'Miről szól?',
        contentLabel: 'Tartalom',
        lessonLabel: 'Epizód',
        lessonsLabel: 'Epizódok',
        curriculumLabel: 'Epizódok',
        durationLabel: 'Hossz',
      };

    case 'WEBINAR':
      return {
        instructorLabel: 'Mentor',
        instructorsLabel: 'Mentorok',
        outcomesLabel: 'Mit fogsz megtanulni?',
        contentLabel: 'Tartalom',
        lessonLabel: 'Előadás',
        lessonsLabel: 'Előadások',
        curriculumLabel: 'Előadás',
        durationLabel: 'Időtartam',
      };

    case 'MASTERCLASS':
      return {
        instructorLabel: 'Mentor',
        instructorsLabel: 'Mentorok',
        outcomesLabel: 'Mit fogsz elsajátítani?',
        contentLabel: 'Tartalom',
        lessonLabel: 'Lecke',
        lessonsLabel: 'Leckék',
        curriculumLabel: 'Tananyag',
        durationLabel: 'Időtartam',
      };

    case 'ACADEMIA':
    default:
      return {
        instructorLabel: 'Mentor',
        instructorsLabel: 'Mentorok',
        outcomesLabel: 'Mit fogsz megtanulni?',
        contentLabel: 'Tartalom',
        lessonLabel: 'Lecke',
        lessonsLabel: 'Leckék',
        curriculumLabel: 'Tananyag',
        durationLabel: 'Időtartam',
      };
  }
}

/**
 * Get enrollment button text based on course type and enrollment status
 *
 * @param courseType - The type of course
 * @param isEnrolled - Whether the user is already enrolled
 * @returns Button text (e.g., "Webinár indítása", "Podcast folytatása")
 */
export function getEnrollmentButtonText(
  courseType: CourseType,
  isEnrolled: boolean
): string {
  const typeLabel = COURSE_TYPE_LABELS[courseType];

  if (isEnrolled) {
    return `${typeLabel} folytatása`;
  }

  return `${typeLabel} indítása`;
}

/**
 * Get the "start" action text for a course type
 * Used for CTAs and buttons
 */
export function getStartActionText(courseType: CourseType): string {
  return `${COURSE_TYPE_LABELS[courseType]} indítása`;
}

/**
 * Get the "continue" action text for a course type
 * Used for CTAs and buttons when user is already enrolled
 */
export function getContinueActionText(courseType: CourseType): string {
  return `${COURSE_TYPE_LABELS[courseType]} folytatása`;
}

/**
 * Get the default instructor role for a course type
 * PODCAST uses "SZEREPLŐ", all others use "MENTOR"
 */
export function getDefaultInstructorRole(courseType: CourseType): 'MENTOR' | 'SZEREPLŐ' {
  return courseType === 'PODCAST' ? 'SZEREPLŐ' : 'MENTOR';
}

/**
 * User-facing generic labels
 * Replace "kurzus" with "tartalom" in user-facing contexts
 */
export const GENERIC_LABELS = {
  /** Generic singular content label (replaces "kurzus") */
  content: 'tartalom',
  /** Generic plural content label (replaces "kurzusok") */
  contents: 'tartalmak',
  /** Title case singular */
  Content: 'Tartalom',
  /** Title case plural */
  Contents: 'Tartalmak',
} as const;

/**
 * Navigation and page titles per course type
 */
export const PAGE_TITLES: Record<CourseType, string> = {
  ACADEMIA: 'Akadémia',
  WEBINAR: 'Webinárok',
  MASTERCLASS: 'Masterclass',
  PODCAST: 'Podcastok',
};

/**
 * All content page title (replaces "Kurzusok")
 */
export const ALL_CONTENT_PAGE_TITLE = 'Tartalmak';

/**
 * Dashboard labels for enrolled content
 */
export const DASHBOARD_LABELS = {
  inProgress: 'Folyamatban lévő tartalmak',
  completed: 'Befejezett tartalmak',
  all: 'Összes tartalom',
} as const;

/**
 * Course card labels based on type
 */
export function getCourseCardLabels(courseType: CourseType) {
  const terminology = getCourseTypeTerminology(courseType);

  return {
    lessonsCount: (count: number) =>
      `${count} ${count === 1 ? terminology.lessonLabel.toLowerCase() : terminology.lessonsLabel.toLowerCase()}`,
    instructor: terminology.instructorLabel,
    duration: terminology.durationLabel,
  };
}

/**
 * Get stats bar labels for course listings
 */
export function getStatsBarLabels() {
  return {
    totalContent: 'Tartalom',
    totalContents: 'Tartalmak',
    enrolled: 'Beiratkozott',
    completed: 'Befejezett',
    inProgress: 'Folyamatban',
  };
}

/**
 * Player layout type based on course type
 */
export type PlayerLayoutType = 'netflix' | 'sidebar' | 'masterclass';

/**
 * Get player layout type for a course type
 */
export function getPlayerLayoutType(courseType: CourseType): PlayerLayoutType {
  switch (courseType) {
    case 'WEBINAR':
    case 'PODCAST':
      return 'netflix';
    case 'MASTERCLASS':
      return 'masterclass';
    case 'ACADEMIA':
    default:
      return 'sidebar';
  }
}

/**
 * Check if course type should skip lessons step in wizard
 * WEBINAR and PODCAST typically have single lesson auto-created
 */
export function shouldSkipLessonsStep(courseType: CourseType): boolean {
  return courseType === 'WEBINAR' || courseType === 'PODCAST';
}

/**
 * Check if course type supports lesson import (MASTERCLASS only)
 */
export function supportsLessonImport(courseType: CourseType): boolean {
  return courseType === 'MASTERCLASS';
}
