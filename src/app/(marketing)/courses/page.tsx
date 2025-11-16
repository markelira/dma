"use client";

import { useState, useMemo } from "react";
import { useCourses } from "@/hooks/useCourseQueries";
import { CourseCard } from "@/components/course/CourseCard";
import { CourseType, COURSE_TYPE_LABELS, COURSE_TYPE_DESCRIPTIONS } from "@/types";
import { FramerNavbarWrapper } from "@/components/navigation/framer-navbar-wrapper";
import Footer from "@/components/landing-home/ui/footer";
import { BookOpen, Video, GraduationCap, Loader2 } from "lucide-react";

const COURSE_TYPE_ICONS: Record<CourseType, React.ReactNode> = {
  ACADEMIA: <GraduationCap className="w-6 h-6" />,
  WEBINAR: <Video className="w-6 h-6" />,
  MASTERCLASS: <BookOpen className="w-6 h-6" />,
};

export default function CoursesPage() {
  const { data: courses = [], isLoading, error } = useCourses();
  const [selectedType, setSelectedType] = useState<CourseType | "ALL">("ALL");

  // Filter courses by type
  const filteredCourses = useMemo(() => {
    if (selectedType === "ALL") return courses;
    return courses.filter((course) => course.courseType === selectedType);
  }, [courses, selectedType]);

  // Count courses by type
  const courseCounts = useMemo(() => {
    const counts: Record<CourseType, number> = {
      ACADEMIA: 0,
      WEBINAR: 0,
      MASTERCLASS: 0,
    };

    courses.forEach((course) => {
      if (course.courseType) {
        counts[course.courseType]++;
      }
    });

    return counts;
  }, [courses]);

  return (
    <div className="flex min-h-screen flex-col">
      <FramerNavbarWrapper />

      <main className="grow">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-b from-gray-50 to-white py-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                Fedezze fel kurzusainkat
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                Válasszon szakértő oktatóinktól akadémiák, webináriumok és mesterkurzusok közül
              </p>
            </div>
          </div>
        </section>

        {/* Filter Tabs */}
        <section className="sticky top-20 z-40 bg-white border-b border-gray-200 shadow-sm">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex overflow-x-auto scrollbar-hide">
              <button
                onClick={() => setSelectedType("ALL")}
                className={`flex-shrink-0 px-6 py-4 font-semibold transition-colors duration-200 border-b-2 ${
                  selectedType === "ALL"
                    ? "border-teal-600 text-teal-600"
                    : "border-transparent text-gray-600 hover:text-gray-900"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span>Összes</span>
                  <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-gray-100 text-gray-700">
                    {courses.length}
                  </span>
                </div>
              </button>

              {(["ACADEMIA", "WEBINAR", "MASTERCLASS"] as CourseType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={`flex-shrink-0 px-6 py-4 font-semibold transition-colors duration-200 border-b-2 ${
                    selectedType === type
                      ? "border-teal-600 text-teal-600"
                      : "border-transparent text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {COURSE_TYPE_ICONS[type]}
                    <span>{COURSE_TYPE_LABELS[type]}</span>
                    <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-gray-100 text-gray-700">
                      {courseCounts[type]}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Course Type Description */}
        {selectedType !== "ALL" && (
          <section className="bg-teal-50 py-8">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center gap-4 max-w-4xl mx-auto">
                <div className="p-3 bg-white rounded-lg shadow-sm">
                  {COURSE_TYPE_ICONS[selectedType]}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {COURSE_TYPE_LABELS[selectedType]}
                  </h2>
                  <p className="text-gray-600">
                    {COURSE_TYPE_DESCRIPTIONS[selectedType]}
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Courses Grid */}
        <section className="py-12 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <Loader2 className="w-12 h-12 animate-spin text-teal-600 mx-auto mb-4" />
                  <p className="text-gray-600">Kurzusok betöltése...</p>
                </div>
              </div>
            ) : error ? (
              <div className="text-center py-20">
                <div className="text-red-500 mb-4">
                  <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Hiba a kurzusok betöltése során
                </h3>
                <p className="text-gray-600">
                  Kérjük, próbálja újra később
                </p>
              </div>
            ) : filteredCourses.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-gray-400 mb-4">
                  <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Nincsenek elérhető kurzusok
                </h3>
                <p className="text-gray-600">
                  {selectedType === "ALL"
                    ? "Jelenleg nincsenek közzétett kurzusok"
                    : `Jelenleg nincsenek ${COURSE_TYPE_LABELS[selectedType]} típusú kurzusok`
                  }
                </p>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <p className="text-gray-600">
                    {filteredCourses.length} kurzus található
                    {selectedType !== "ALL" && ` a(z) ${COURSE_TYPE_LABELS[selectedType]} kategóriában`}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredCourses.map((course) => (
                    <CourseCard
                      key={course.id}
                      course={course}
                      variant="compact"
                      context="search"
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </section>

        {/* CTA Section */}
        {!isLoading && filteredCourses.length > 0 && (
          <section className="bg-gradient-to-r from-teal-600 to-teal-700 py-16">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center max-w-3xl mx-auto">
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                  Készen áll a tanulásra?
                </h2>
                <p className="text-xl text-teal-100 mb-8">
                  Csatlakozzon több ezer diákunkhoz és kezdje el karrierjének fejlesztését ma
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <a
                    href="/register"
                    className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-teal-600 bg-white hover:bg-gray-50 transition-colors duration-200"
                  >
                    Ingyenes regisztráció
                  </a>
                  <a
                    href="/pricing"
                    className="inline-flex items-center justify-center px-8 py-3 border-2 border-white text-base font-medium rounded-md text-white hover:bg-teal-500 transition-colors duration-200"
                  >
                    Árazás megtekintése
                  </a>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      <Footer border={true} />
    </div>
  );
}
