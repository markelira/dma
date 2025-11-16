/**
 * Translation hook for course player components
 * Provides Hungarian translations with English fallback
 */

import huTranslations from '@/lib/i18n/hu/course-player.json'
import enTranslations from '@/lib/i18n/en/course-player.json'

type TranslationKey = string

const translations = {
  hu: huTranslations,
  en: enTranslations
}

/**
 * Get nested property from object using dot notation
 * @param obj - Object to traverse
 * @param path - Dot-separated path (e.g., "companion.lessonProgress")
 * @returns Value at path or undefined
 */
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj)
}

/**
 * Get translated string for course player
 * @param key - Translation key (supports dot notation like "companion.lessonProgress")
 * @param replacements - Optional object with placeholder replacements
 * @returns Translated string
 */
export function useTranslation() {
  // Default to Hungarian (as per project requirements)
  const locale = 'hu'

  const t = (key: TranslationKey, replacements?: Record<string, string | number>): string => {
    // Get translation using dot notation for nested keys
    let text = getNestedValue(translations[locale], key) ||
               getNestedValue(translations.en, key) ||
               key

    // Replace placeholders like {count}, {name}, etc.
    if (replacements && typeof text === 'string') {
      Object.entries(replacements).forEach(([placeholder, value]) => {
        text = text.replace(new RegExp(`\\{${placeholder}\\}`, 'g'), String(value))
      })
    }

    return typeof text === 'string' ? text : key
  }

  /**
   * Format duration in minutes to translated string
   * @param minutes - Duration in minutes
   * @returns Translated duration string
   */
  const formatDuration = (minutes: number): string => {
    if (minutes < 1) {
      return t('duration.lessThanMinute')
    }

    if (minutes < 60) {
      return t('duration.minutes', { minutes: Math.round(minutes) })
    }

    const hours = Math.floor(minutes / 60)
    const mins = Math.round(minutes % 60)

    if (mins > 0) {
      return t('duration.hoursMinutes', { hours, minutes: mins })
    }

    return t('duration.hours', { hours })
  }

  return { t, locale, formatDuration }
}
