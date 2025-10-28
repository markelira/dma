'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CheckoutForm } from '@/components/payment/CheckoutForm';
import { useAuth } from '@/hooks/useAuth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Course } from '@/types';
import { Loader2, ArrowLeft, CheckCircle, Clock, Users, Star, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';

export default function PurchaseCoursePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [alreadyEnrolled, setAlreadyEnrolled] = useState(false);

  useEffect(() => {
    const fetchCourse = async () => {
      if (!params.courseId) return;

      try {
        // In development, use mock data if Firestore fails
        if (process.env.NODE_ENV === 'development') {
          // Try Firestore first
          try {
            const courseDoc = await getDoc(doc(db, 'courses', params.courseId as string));
            if (courseDoc.exists()) {
              const courseData = { id: courseDoc.id, ...courseDoc.data() } as Course;
              setCourse(courseData);
            } else {
              throw new Error('Course not found in Firestore');
            }
          } catch (firestoreError) {
            console.log('Firestore error, using mock data:', firestoreError);
            // Use mock data for development
            const mockCourse: Course = {
              id: params.courseId as string,
              title: `Test Course ${params.courseId}`,
              description: 'Ez egy teszt kurzus fejlesztési célokra.',
              price: 45000,
              thumbnailUrl: 'https://via.placeholder.com/400x300',
              instructor: {
                firstName: 'Teszt',
                lastName: 'Oktató',
                title: 'Senior Developer',
                bio: 'Tapasztalt oktató'
              },
              duration: '10 óra',
              enrollmentCount: 150,
              averageRating: 4.5,
              difficulty: 'BEGINNER',
              modules: [
                { title: 'Bevezető modul', lessons: [{id: '1', title: 'Első lecke'}] },
                { title: 'Haladó modul', lessons: [{id: '2', title: 'Második lecke'}] }
              ],
              certificateEnabled: true
            } as any;
            setCourse(mockCourse);
          }
        } else {
          // Production: only use Firestore
          const courseDoc = await getDoc(doc(db, 'courses', params.courseId as string));
          
          if (!courseDoc.exists()) {
            router.push('/404');
            return;
          }

          const courseData = { id: courseDoc.id, ...courseDoc.data() } as Course;
          setCourse(courseData);
        }

        // Check if already enrolled
        if (user) {
          const enrollmentDoc = await getDoc(
            doc(db, 'enrollments', `${user.uid}_${params.courseId}`)
          );
          setAlreadyEnrolled(enrollmentDoc.exists());
        }

      } catch (error) {
        console.error('Error fetching course:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [params.courseId, user, router]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('hu-HU', {
      style: 'currency',
      currency: 'HUF',
      maximumFractionDigits: 0
    }).format(price);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!course) {
    return null;
  }

  if (alreadyEnrolled) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-4">Már jelentkezett erre a kurzusra!</h1>
          <p className="text-gray-600 mb-8">
            Hozzáférése van a kurzus összes tartalmához.
          </p>
          <Button asChild>
            <Link href={`/courses/${course.id}/learn`}>
              Kurzus folytatása
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  // Helper functions to get instructor info (supports both nested object and convenience fields)
  const getInstructorName = () => {
    return course.instructorName || course.instructor?.firstName + ' ' + course.instructor?.lastName || 'Oktató';
  };

  const getInstructorImage = () => {
    return course.instructorImage || course.instructor?.profilePictureUrl;
  };

  const getInstructorTitle = () => {
    return course.instructorTitle || course.instructor?.title;
  };

  const getInstructorBio = () => {
    return course.instructorBio || course.instructor?.bio;
  };

  // Course features for the checkout form
  const courseFeatures = [
    `${course.totalLessons || course.modules?.reduce((total, module) => total + (module.lessons?.length || 0), 0) || 0} lecke`,
    `${course.duration || '10+ óra'} tartalom`,
    'Tanúsítvány a sikeres elvégzés után',
    'Élethosszig tartó hozzáférés',
    '30 napos pénzvisszafizetési garancia',
    'Letölthető anyagok',
    'Mobil hozzáférés'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Link 
          href={`/courses/${course.id}`}
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Vissza a kurzus oldalra
        </Link>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Course Information - Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Course Header */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h1 className="text-3xl font-bold mb-2">{course.title}</h1>
                    <p className="text-lg text-muted-foreground mb-4">{course.description}</p>
                    
                    {/* Course Stats */}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        {course.duration || '10+ óra'}
                      </div>
                      <div className="flex items-center">
                        <Users className="w-4 h-4 mr-1" />
                        {course.enrolledCount || course.enrollmentCount || 0} hallgató
                      </div>
                      {(course.rating || course.averageRating) && (
                        <div className="flex items-center">
                          <Star className="w-4 h-4 mr-1 fill-yellow-400 text-yellow-400" />
                          {(course.rating || course.averageRating || 0).toFixed(1)}
                        </div>
                      )}
                      <Badge variant="secondary">{course.level || course.difficulty || 'Kezdő'}</Badge>
                    </div>
                  </div>
                  
                  {/* Price Display */}
                  <div className="text-right">
                    <div className="text-3xl font-bold text-primary">
                      {formatPrice(course.price)}
                    </div>
                    {course.originalPrice && course.originalPrice > course.price && (
                      <div className="text-sm text-muted-foreground line-through">
                        {formatPrice(course.originalPrice)}
                      </div>
                    )}
                  </div>
                </div>

                {/* Course Thumbnail */}
                {(course.thumbnail || course.thumbnailUrl) && (
                  <div className="aspect-video rounded-lg overflow-hidden bg-gray-100">
                    <img 
                      src={course.thumbnail || course.thumbnailUrl}
                      alt={course.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* What You'll Learn */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
                  Mit fogsz tanulni?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-3">
                  {courseFeatures.map((feature, index) => (
                    <div key={index} className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Course Content */}
            {(course.sections && course.sections.length > 0) || (course.modules && course.modules.length > 0) ? (
              <Card>
                <CardHeader>
                  <CardTitle>Kurzus tartalma</CardTitle>
                  <CardDescription>
                    {course.totalLessons || course.modules?.reduce((total, module) => total + (module.lessons?.length || 0), 0) || 0} lecke • {course.duration || '10+ óra'} tartalom
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* Show sections if available, otherwise show modules */}
                    {course.sections ? (
                      <>
                        {course.sections.slice(0, 3).map((section, index) => (
                          <div key={index} className="border rounded-lg p-3">
                            <h4 className="font-medium mb-1">{section.title}</h4>
                            <p className="text-sm text-muted-foreground">
                              {section.lessons?.length || 0} lecke
                            </p>
                          </div>
                        ))}
                        {course.sections.length > 3 && (
                          <p className="text-sm text-muted-foreground text-center">
                            +{course.sections.length - 3} további szakasz
                          </p>
                        )}
                      </>
                    ) : (
                      <>
                        {course.modules?.slice(0, 3).map((module, index) => (
                          <div key={index} className="border rounded-lg p-3">
                            <h4 className="font-medium mb-1">{module.title}</h4>
                            <p className="text-sm text-muted-foreground">
                              {module.lessons?.length || 0} lecke
                            </p>
                          </div>
                        ))}
                        {course.modules && course.modules.length > 3 && (
                          <p className="text-sm text-muted-foreground text-center">
                            +{course.modules.length - 3} további modul
                          </p>
                        )}
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : null}

            {/* Instructor */}
            <Card>
              <CardHeader>
                <CardTitle>Oktató</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start space-x-4">
                  {getInstructorImage() ? (
                    <img 
                      src={getInstructorImage()}
                      alt={getInstructorName()}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                      <Users className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1">
                    <h4 className="font-semibold text-lg">{getInstructorName()}</h4>
                    {getInstructorTitle() && (
                      <p className="text-muted-foreground mb-2">{getInstructorTitle()}</p>
                    )}
                    {getInstructorBio() && (
                      <p className="text-sm text-muted-foreground">{getInstructorBio()}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Purchase Section - Right Column */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">
              {/* Purchase Card */}
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Shield className="w-5 h-5 mr-2 text-green-600" />
                    Beiratkozás
                  </CardTitle>
                  <CardDescription>
                    Biztonságos fizetés SSL titkosítással
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {!user ? (
                    <div className="text-center py-6">
                      <p className="text-muted-foreground mb-6">
                        A vásárláshoz jelentkezzen be vagy regisztráljon.
                      </p>
                      <div className="space-y-3">
                        <Button asChild className="w-full">
                          <Link href={`/login?redirect=${encodeURIComponent(`/courses/${course.id}/purchase`)}`}>
                            Bejelentkezés
                          </Link>
                        </Button>
                        <Button asChild variant="outline" className="w-full">
                          <Link href={`/register?redirect=${encodeURIComponent(`/courses/${course.id}/purchase`)}`}>
                            Regisztráció
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <CheckoutForm
                      courseId={course.id}
                      amount={course.price}
                      currency="HUF"
                      description={course.title}
                      mode="payment"
                      features={courseFeatures}
                      onSuccess={() => {
                        router.push(`/payment/success?courseId=${course.id}`);
                      }}
                      onError={(error) => {
                        console.error('Payment error:', error);
                      }}
                    />
                  )}
                </CardContent>
              </Card>

              {/* Money Back Guarantee */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <Shield className="w-8 h-8 text-green-600" />
                    <div>
                      <h4 className="font-semibold text-sm">30 napos garancia</h4>
                      <p className="text-xs text-muted-foreground">
                        Ha nem elégedett, teljes összeget visszatérítjük
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Course Includes */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">A kurzus tartalmazza</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span>Élethosszig tartó hozzáférés</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span>Mobil és asztali hozzáférés</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span>Letölthető anyagok</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span>Befejezési tanúsítvány</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span>30 napos pénzvisszafizetési garancia</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Support Info */}
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-sm text-muted-foreground mb-2">
                    Kérdése van a kurzussal kapcsolatban?
                  </p>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/support">
                      Kapcsolat
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}