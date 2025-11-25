"use client";

import { useEffect, useState } from "react";
import { collection, query, limit, getDocs, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { PremiumCourseCard } from "@/components/courses/PremiumCourseCard";

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

export default function FeaturedCoursesGrid() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch recent courses
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
        console.error("Error fetching courses:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <section className="bg-gray-50 py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-12 text-center">
            <div className="mx-auto h-10 w-64 animate-pulse rounded-lg bg-gray-200" />
            <div className="mx-auto mt-4 h-6 w-96 animate-pulse rounded-lg bg-gray-200" />
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-96 animate-pulse rounded-lg bg-gray-200" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (courses.length === 0) {
    return null;
  }

  return (
    <section className="bg-gray-50 py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-6">
        {/* Section Header */}
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold text-gray-900 md:text-4xl">
            Népszerű kurzusok
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-gray-600">
            Fedezd fel a legjobban értékelt és legkedveltebb tanfolyamainkat
          </p>
        </div>

        {/* Courses Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {courses.map((course, index) => (
            <PremiumCourseCard
              key={course.id}
              course={course}
              index={index}
              categories={categories}
              instructors={instructors}
            />
          ))}
        </div>

        {/* View All CTA */}
        <div className="mt-12 text-center">
          <a
            href="/courses"
            className="inline-flex items-center rounded-lg border-2 border-brand-secondary bg-white px-8 py-3 text-base font-bold text-brand-secondary transition-colors hover:bg-brand-secondary/5"
          >
            Összes kurzus megtekintése
          </a>
        </div>
      </div>
    </section>
  );
}
