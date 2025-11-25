"use client";

import { useEffect, useRef, useState } from "react";
import { collection, query, where, limit, getDocs, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { PremiumCourseCard } from "@/components/courses/PremiumCourseCard";
import { ChevronLeft, ChevronRight } from "lucide-react";
import AOS from "aos";

interface Course {
  id: string;
  title: string;
  description: string;
  instructorId?: string;
  instructorName?: string;
  category?: string;
  categoryId?: string;
  level: string;
  duration: string;
  rating?: number;
  students?: number;
  enrollmentCount?: number;
  price?: number;
  thumbnailUrl?: string;
  lessons?: number;
  courseType?: 'WEBINAR' | 'ACADEMIA' | 'MASTERCLASS';
  featured?: boolean;
}

interface Instructor {
  id: string;
  name: string;
  title?: string;
  bio?: string;
  profilePictureUrl?: string;
}

export default function FeaturedCoursesCarousel() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  useEffect(() => {
    AOS.init({
      once: true,
      duration: 700,
      easing: "ease-out-cubic",
    });
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch featured courses (or fallback to recent courses if no featured flag)
        const coursesQuery = query(
          collection(db, "courses"),
          orderBy("createdAt", "desc"),
          limit(8)
        );

        const coursesSnapshot = await getDocs(coursesQuery);
        const coursesData = coursesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Course[];

        // Fetch instructors
        const instructorsSnapshot = await getDocs(collection(db, "users"));
        const instructorsData = instructorsSnapshot.docs
          .filter(doc => doc.data().role === "instructor")
          .map(doc => ({
            id: doc.id,
            name: doc.data().name || doc.data().displayName,
            title: doc.data().title,
            bio: doc.data().bio,
            profilePictureUrl: doc.data().profilePictureUrl || doc.data().photoURL,
          })) as Instructor[];

        // Fetch categories
        const categoriesSnapshot = await getDocs(collection(db, "categories"));
        const categoriesData = categoriesSnapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name
        }));

        setCourses(coursesData);
        setInstructors(instructorsData);
        setCategories(categoriesData);
      } catch (error) {
        console.error("Error fetching featured courses:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (scrollRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
        setShowLeftArrow(scrollLeft > 10);
        setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
      }
    };

    const scrollElement = scrollRef.current;
    if (scrollElement) {
      handleScroll();
      scrollElement.addEventListener("scroll", handleScroll);
      return () => scrollElement.removeEventListener("scroll", handleScroll);
    }
  }, [courses]);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 400;
      const newScrollLeft =
        direction === "left"
          ? scrollRef.current.scrollLeft - scrollAmount
          : scrollRef.current.scrollLeft + scrollAmount;

      scrollRef.current.scrollTo({
        left: newScrollLeft,
        behavior: "smooth",
      });
    }
  };

  if (loading) {
    return (
      <section className="relative overflow-hidden bg-gradient-to-br from-[var(--unframer-blue-10)] to-[var(--unframer-beige-10)] py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center">
            <div className="h-12 w-64 mx-auto bg-gray-200 rounded-lg animate-pulse mb-4" />
            <div className="h-6 w-96 mx-auto bg-gray-200 rounded-lg animate-pulse" />
          </div>
        </div>
      </section>
    );
  }

  if (courses.length === 0) {
    return null;
  }

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[var(--unframer-blue-10)] to-[var(--unframer-beige-10)] py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-6">
        {/* Section Header */}
        <div className="mb-12 text-center" data-aos="fade-up">
          <h2 className="mb-4 text-4xl font-bold tracking-tight text-gray-900 md:text-5xl lg:text-6xl">
            Kiemelt kurzusok
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-gray-600 md:text-xl">
            Kezdd el a tanulást a legkedveltebb és leghatékonyabb kurzusainkkal
          </p>
        </div>

        {/* Carousel Container */}
        <div className="relative" data-aos="fade-up" data-aos-delay="100">
          {/* Left Arrow */}
          {showLeftArrow && (
            <button
              onClick={() => scroll("left")}
              className="absolute left-0 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/60 backdrop-blur-xl border border-white/20 p-3 shadow-xl transition-all hover:scale-110 hover:bg-white/80"
              aria-label="Scroll left"
            >
              <ChevronLeft className="h-6 w-6 text-gray-700" />
            </button>
          )}

          {/* Right Arrow */}
          {showRightArrow && (
            <button
              onClick={() => scroll("right")}
              className="absolute right-0 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/60 backdrop-blur-xl border border-white/20 p-3 shadow-xl transition-all hover:scale-110 hover:bg-white/80"
              aria-label="Scroll right"
            >
              <ChevronRight className="h-6 w-6 text-gray-700" />
            </button>
          )}

          {/* Scrollable Container */}
          <div
            ref={scrollRef}
            className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide"
            style={{
              scrollSnapType: "x mandatory",
              WebkitOverflowScrolling: "touch",
            }}
          >
            {courses.map((course, index) => (
              <div
                key={course.id}
                className="flex-shrink-0"
                style={{
                  width: "340px",
                  scrollSnapAlign: "start",
                }}
              >
                <PremiumCourseCard
                  course={course}
                  index={index}
                  categories={categories}
                  instructors={instructors}
                />
              </div>
            ))}
          </div>

          {/* Add scrollbar-hide utility */}
          <style jsx>{`
            .scrollbar-hide::-webkit-scrollbar {
              display: none;
            }
            .scrollbar-hide {
              -ms-overflow-style: none;
              scrollbar-width: none;
            }
          `}</style>
        </div>

        {/* Bottom CTA */}
        <div className="mt-12 text-center" data-aos="fade-up" data-aos-delay="200">
          <a
            href="/courses"
            className="inline-flex items-center rounded-lg bg-gradient-to-r from-brand-secondary to-brand-secondary/50 px-8 py-4 text-lg font-bold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl"
          >
            Összes kurzus megtekintése
            <span className="ml-2">→</span>
          </a>
        </div>
      </div>
    </section>
  );
}
