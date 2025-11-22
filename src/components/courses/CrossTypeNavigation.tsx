'use client';

import Link from 'next/link';
import { motion } from 'motion/react';
import { ArrowRight, BookOpen, Video, GraduationCap, Mic } from 'lucide-react';

interface CrossTypeNavigationProps {
  currentType: 'WEBINAR' | 'ACADEMIA' | 'MASTERCLASS' | 'PODCAST';
}

const courseTypeConfig = {
  WEBINAR: {
    label: 'Webinárok',
    url: '/webinar',
    icon: Video,
    color: 'purple'
  },
  ACADEMIA: {
    label: 'Akadémia',
    url: '/akadémia',
    icon: BookOpen,
    color: 'blue'
  },
  MASTERCLASS: {
    label: 'Masterclass',
    url: '/masterclass',
    icon: GraduationCap,
    color: 'amber'
  },
  PODCAST: {
    label: 'Podcastok',
    url: '/podcast',
    icon: Mic,
    color: 'green'
  }
};

export function CrossTypeNavigation({ currentType }: CrossTypeNavigationProps) {
  // Get the other two types (not the current one)
  const otherTypes = (Object.keys(courseTypeConfig) as Array<keyof typeof courseTypeConfig>)
    .filter(type => type !== currentType);

  return (
    <div className="container mx-auto px-6 lg:px-12 py-8">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white/40 backdrop-blur-md border border-white/30 rounded-2xl p-6 shadow-lg"
      >
        <div className="text-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Fedezd fel a többi kurzus típust is
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Keresd meg a számodra legmegfelelőbb tanulási formátumot
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {otherTypes.map((type) => {
            const config = courseTypeConfig[type];
            const Icon = config.icon;

            const colorClasses = {
              purple: {
                bg: 'from-purple-500 to-purple-600',
                hover: 'hover:from-purple-600 hover:to-purple-700',
                text: 'text-purple-600'
              },
              blue: {
                bg: 'from-blue-500 to-blue-600',
                hover: 'hover:from-blue-600 hover:to-blue-700',
                text: 'text-blue-600'
              },
              amber: {
                bg: 'from-amber-500 to-amber-600',
                hover: 'hover:from-amber-600 hover:to-amber-700',
                text: 'text-amber-600'
              },
              green: {
                bg: 'from-green-500 to-green-600',
                hover: 'hover:from-green-600 hover:to-green-700',
                text: 'text-green-600'
              }
            }[config.color];

            return (
              <Link
                key={type}
                href={config.url}
                className="group"
              >
                <div className="bg-white/60 backdrop-blur-xl border border-white/40 rounded-xl p-5 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${colorClasses.bg} flex items-center justify-center shadow-md`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h4 className={`text-base font-semibold ${colorClasses.text} group-hover:underline`}>
                          {config.label}
                        </h4>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Böngészd a kurzusokat
                        </p>
                      </div>
                    </div>
                    <ArrowRight className={`w-5 h-5 ${colorClasses.text} group-hover:translate-x-1 transition-transform`} />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
