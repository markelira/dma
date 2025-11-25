'use client';

import { CoursePaymentSection } from './CoursePaymentSection';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Clock, 
  Users, 
  Award, 
  BookOpen,
  Star,
  Calendar,
  Globe,
  Download,
  Smartphone
} from 'lucide-react';

interface CourseDetailSidebarProps {
  courseId: string;
  courseTitle: string;
  price?: number;
  originalPrice?: number;
  currency?: string;
  isEnrolled?: boolean;
  enrollmentCount?: number;
  averageRating?: number;
  ratingCount?: number;
  estimatedDuration?: number;
  completionRate?: number;
  difficultyLevel?: 'beginner' | 'intermediate' | 'advanced';
  language?: string;
  lastUpdated?: string;
  instructorName?: string;
  features?: string[];
  includes?: {
    articles?: number;
    videos?: number;
    exercises?: number;
    downloadableResources?: boolean;
    certificate?: boolean;
    lifetimeAccess?: boolean;
    mobileAccess?: boolean;
  };
  requirements?: string[];
  targetAudience?: string[];
  className?: string;
}

export function EnhancedCourseDetailSidebar({
  courseId,
  courseTitle,
  price = 0,
  originalPrice,
  currency = 'HUF',
  isEnrolled = false,
  enrollmentCount,
  averageRating,
  ratingCount,
  estimatedDuration,
  completionRate,
  difficultyLevel = 'beginner',
  language = 'Magyar',
  lastUpdated,
  instructorName,
  features = [],
  includes = {},
  requirements = [],
  targetAudience = [],
  className
}: CourseDetailSidebarProps) {
  
  const formatDuration = (minutes?: number) => {
    if (!minutes) return 'N/A';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}ó ${mins}p` : `${mins}p`;
  };

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'bg-green-100 text-green-800 border-green-200';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'advanced': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getDifficultyLabel = (level: string) => {
    switch (level) {
      case 'beginner': return 'Kezdő';
      case 'intermediate': return 'Haladó';
      case 'advanced': return 'Szakértő';
      default: return level;
    }
  };

  return (
    <div className={className}>
      <div className="space-y-6">
        {/* Payment Section */}
        <CoursePaymentSection
          courseId={courseId}
          courseTitle={courseTitle}
          price={price}
          originalPrice={originalPrice}
          currency={currency}
          isEnrolled={isEnrolled}
          enrollmentCount={enrollmentCount}
          averageRating={averageRating}
          estimatedDuration={estimatedDuration}
          features={features}
          instructorName={instructorName}
          certificateIncluded={includes.certificate}
          lifetimeAccess={includes.lifetimeAccess}
          downloadableResources={includes.downloadableResources}
          mobileAccess={includes.mobileAccess}
        />

        {/* Course Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BookOpen className="w-5 h-5" />
              <span>Tartalom adatok</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <div className="flex items-center space-x-2 text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>Időtartam</span>
                </div>
                <div className="font-medium">{formatDuration(estimatedDuration)}</div>
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center space-x-2 text-muted-foreground">
                  <Users className="w-4 h-4" />
                  <span>Tanulók</span>
                </div>
                <div className="font-medium">
                  {enrollmentCount ? enrollmentCount.toLocaleString() : '0'}
                </div>
              </div>

              {averageRating && (
                <div className="space-y-1">
                  <div className="flex items-center space-x-2 text-muted-foreground">
                    <Star className="w-4 h-4" />
                    <span>Értékelés</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="font-medium">{averageRating.toFixed(1)}</span>
                    <span className="text-yellow-500">★</span>
                    {ratingCount && (
                      <span className="text-muted-foreground text-xs">
                        ({ratingCount})
                      </span>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <div className="flex items-center space-x-2 text-muted-foreground">
                  <Award className="w-4 h-4" />
                  <span>Szint</span>
                </div>
                <Badge className={getDifficultyColor(difficultyLevel)}>
                  {getDifficultyLabel(difficultyLevel)}
                </Badge>
              </div>
            </div>

            {/* Completion Rate */}
            {completionRate !== undefined && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Befejezési arány</span>
                  <span className="font-medium">{completionRate}%</span>
                </div>
                <Progress value={completionRate} className="h-2" />
              </div>
            )}

            {/* Language and Updates */}
            <div className="grid grid-cols-1 gap-2 pt-2 border-t text-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-muted-foreground">
                  <Globe className="w-4 h-4" />
                  <span>Nyelv</span>
                </div>
                <span className="font-medium">{language}</span>
              </div>
              
              {lastUpdated && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>Frissítve</span>
                  </div>
                  <span className="font-medium">
                    {new Date(lastUpdated).toLocaleDateString('hu-HU')}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* What's Included */}
        {Object.keys(includes).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Mit tartalmaz</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {includes.videos && (
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-brand-secondary/10 flex items-center justify-center">
                    <Clock className="w-4 h-4 text-brand-secondary" />
                  </div>
                  <span>{includes.videos} videó lecke</span>
                </div>
              )}
              
              {includes.articles && (
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                    <BookOpen className="w-4 h-4 text-green-600" />
                  </div>
                  <span>{includes.articles} írásos anyag</span>
                </div>
              )}

              {includes.exercises && (
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                    <Award className="w-4 h-4 text-purple-600" />
                  </div>
                  <span>{includes.exercises} gyakorlati feladat</span>
                </div>
              )}

              {includes.downloadableResources && (
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                    <Download className="w-4 h-4 text-orange-600" />
                  </div>
                  <span>Letölthető anyagok</span>
                </div>
              )}

              {includes.mobileAccess && (
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center">
                    <Smartphone className="w-4 h-4 text-pink-600" />
                  </div>
                  <span>Mobil és TV hozzáférés</span>
                </div>
              )}

              {includes.certificate && (
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center">
                    <Award className="w-4 h-4 text-yellow-600" />
                  </div>
                  <span>Befejezési tanúsítvány</span>
                </div>
              )}

              {includes.lifetimeAccess && (
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                    <Clock className="w-4 h-4 text-indigo-600" />
                  </div>
                  <span>Élethosszig tartó hozzáférés</span>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Requirements */}
        {requirements.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Előfeltételek</CardTitle>
              <CardDescription>
                Mi szükséges a tartalom megkezdéséhez
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {requirements.map((requirement, index) => (
                  <li key={index} className="flex items-start space-x-2 text-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground mt-2 flex-shrink-0" />
                    <span>{requirement}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Target Audience */}
        {targetAudience.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Kinek ajánljuk</CardTitle>
              <CardDescription>
                Ez a tartalom ideális az alábbi személyek számára
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {targetAudience.map((audience, index) => (
                  <li key={index} className="flex items-start space-x-2 text-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-brand-secondary/50 mt-2 flex-shrink-0" />
                    <span>{audience}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}