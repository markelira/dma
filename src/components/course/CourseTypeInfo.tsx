'use client';

import React from 'react';
import { Calendar, Radio, Video, GraduationCap, Award, Mic, Star, Building2 } from 'lucide-react';
import { motion } from 'motion/react';
import { CourseType } from '@/types';

interface CourseTypeInfoProps {
  courseType?: CourseType;
  webinarDate?: string | Date;
  liveStreamUrl?: string;
  recordingAvailable?: boolean;
  university?: string;
  certificateEnabled?: boolean;
  isPlus?: boolean;
  darkMode?: boolean;
}

export function CourseTypeInfo({
  courseType,
  webinarDate,
  liveStreamUrl,
  recordingAvailable,
  university,
  certificateEnabled,
  isPlus,
  darkMode = true
}: CourseTypeInfoProps) {
  // Format webinar date
  const formatWebinarDate = (date?: string | Date) => {
    if (!date) return null;
    try {
      const d = typeof date === 'string' ? new Date(date) : date;
      return d.toLocaleDateString('hu-HU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return null;
    }
  };

  // Check if webinar is upcoming
  const isUpcoming = (date?: string | Date) => {
    if (!date) return false;
    try {
      const d = typeof date === 'string' ? new Date(date) : date;
      return d > new Date();
    } catch {
      return false;
    }
  };

  const containerClass = darkMode
    ? 'py-4 border-b border-gray-800'
    : 'py-4 border-b border-gray-200';

  const textClass = darkMode ? 'text-gray-300' : 'text-gray-700';
  const mutedClass = darkMode ? 'text-gray-500' : 'text-gray-500';
  const labelClass = darkMode ? 'text-gray-400' : 'text-gray-600';

  // WEBINAR type info
  if (courseType === 'WEBINAR') {
    const formattedDate = formatWebinarDate(webinarDate);
    const upcoming = isUpcoming(webinarDate);

    if (!formattedDate && !liveStreamUrl && !recordingAvailable) return null;

    return (
      <motion.div
        className={containerClass}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <div className="flex flex-wrap items-center gap-4 md:gap-6">
          {/* Webinar Date */}
          {formattedDate && (
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-purple-400" />
              <span className={`text-sm ${textClass}`}>{formattedDate}</span>
              {upcoming && (
                <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs font-medium rounded-full border border-purple-500/30">
                  Közelgő
                </span>
              )}
            </div>
          )}

          {/* Live Status */}
          {liveStreamUrl && upcoming && (
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-red-500 animate-pulse" />
              <span className="text-sm text-red-400 font-medium">Élő közvetítés</span>
            </div>
          )}

          {/* Recording Available */}
          {recordingAvailable && !upcoming && (
            <div className="flex items-center gap-2">
              <Video className="w-4 h-4 text-green-400" />
              <span className="text-sm text-green-400">Felvétel elérhető</span>
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  // ACADEMIA type info
  if (courseType === 'ACADEMIA') {
    if (!university && !certificateEnabled) return null;

    return (
      <motion.div
        className={containerClass}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <div className="flex flex-wrap items-center gap-4 md:gap-6">
          {/* University */}
          {university && (
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-400" />
              <span className={`text-sm ${textClass}`}>{university}</span>
            </div>
          )}

          {/* Academic Certificate */}
          {certificateEnabled && (
            <div className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-blue-400">Akkreditált képzés</span>
            </div>
          )}

          {/* Plus Badge */}
          {isPlus && (
            <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs font-medium rounded-full border border-blue-500/30">
              PLUS
            </span>
          )}
        </div>
      </motion.div>
    );
  }

  // MASTERCLASS type info
  if (courseType === 'MASTERCLASS') {
    return (
      <motion.div
        className={containerClass}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <div className="flex flex-wrap items-center gap-4 md:gap-6">
          {/* Expert Badge */}
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-400" />
            <span className="text-sm text-amber-400 font-medium">Szakértői kurzus</span>
          </div>

          {/* Certificate if available */}
          {certificateEnabled && (
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-400" />
              <span className={`text-sm ${textClass}`}>Tanúsítvány</span>
            </div>
          )}

          {/* Plus Badge */}
          {isPlus && (
            <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs font-medium rounded-full border border-amber-500/30">
              PLUS
            </span>
          )}
        </div>
      </motion.div>
    );
  }

  // PODCAST type info
  if (courseType === 'PODCAST') {
    return (
      <motion.div
        className={containerClass}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <div className="flex flex-wrap items-center gap-4 md:gap-6">
          {/* Podcast Badge */}
          <div className="flex items-center gap-2">
            <Mic className="w-4 h-4 text-green-400" />
            <span className="text-sm text-green-400 font-medium">Podcast sorozat</span>
          </div>

          {/* Listen Anywhere */}
          <span className={`text-sm ${mutedClass}`}>Hallgasd bárhol, bármikor</span>
        </div>
      </motion.div>
    );
  }

  return null;
}
