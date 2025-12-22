// Remove static generation to allow dynamic course IDs
// This enables any course ID to work, not just pre-built ones

import { Metadata } from 'next'
import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import ClientCourseDetailPage from './ClientCourseDetailPage'

// Initialize Firebase Admin for server-side metadata generation
function getAdminFirestore() {
  if (getApps().length === 0) {
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      initializeApp({
        credential: cert(process.env.GOOGLE_APPLICATION_CREDENTIALS),
      })
    } else {
      initializeApp({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'dmaapp-477d4',
      })
    }
  }
  return getFirestore()
}

// Fetch course data for metadata
async function getCourseData(courseId: string) {
  try {
    const db = getAdminFirestore()

    // Try direct lookup first
    const courseDoc = await db.collection('courses').doc(courseId).get()
    if (courseDoc.exists) {
      return { id: courseDoc.id, ...courseDoc.data() }
    }

    // Try by slug
    const slugQuery = await db
      .collection('courses')
      .where('slug', '==', courseId)
      .limit(1)
      .get()

    if (!slugQuery.empty) {
      const doc = slugQuery.docs[0]
      return { id: doc.id, ...doc.data() }
    }

    return null
  } catch (error) {
    console.error('Error fetching course for metadata:', error)
    return null
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ courseId: string }>
}): Promise<Metadata> {
  const { courseId } = await params
  const course = await getCourseData(courseId)

  if (!course) {
    return {
      title: 'Tartalom nem található',
      description: 'A keresett tartalom nem található.',
    }
  }

  const title = course.title || 'DMA Masterclass'
  const description = course.description || course.shortDescription || 'Fedezd fel ezt a tartalmat a DMA Masterclass platformon.'
  const thumbnailUrl = course.thumbnailUrl || course.imageUrl || '/og-image.png'

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      url: `https://masterclass.dma.hu/courses/${course.slug || courseId}`,
      images: [
        {
          url: thumbnailUrl,
          width: 1200,
          height: 630,
          alt: title,
        }
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [thumbnailUrl],
    },
  }
}

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const course = await getCourseData(courseId);

  // Course JSON-LD structured data
  const courseJsonLd = course ? {
    "@context": "https://schema.org",
    "@type": "Course",
    "name": course.title,
    "description": course.description || course.shortDescription,
    "provider": {
      "@type": "Organization",
      "name": "DMA Masterclass",
      "url": "https://masterclass.dma.hu"
    },
    "image": course.thumbnailUrl || course.imageUrl,
    "offers": {
      "@type": "Offer",
      "price": course.price || 0,
      "priceCurrency": "HUF",
      "availability": "https://schema.org/InStock"
    }
  } : null;

  return (
    <>
      {courseJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(courseJsonLd) }}
        />
      )}
      <ClientCourseDetailPage id={courseId} />
    </>
  );
} 