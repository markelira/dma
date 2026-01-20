// Remove static generation to allow dynamic course IDs
// This enables any course ID to work, not just pre-built ones

import { Metadata } from 'next'
import { initializeApp, getApps } from 'firebase/app'
import { getFirestore, doc, getDoc, collection, query, where, getDocs, limit } from 'firebase/firestore'
import ClientCourseDetailPage from './ClientCourseDetailPage'

// Firebase config for server-side metadata fetching
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "demo-api-key",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "dmaapp-477d4.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "dmaapp-477d4",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "dmaapp-477d4.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "demo-app-id",
}

// Get or initialize Firebase app for metadata generation
function getMetadataFirestore() {
  let app
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig, 'metadata-app')
  } else {
    // Check if metadata-app exists, otherwise use first app
    app = getApps().find(a => a.name === 'metadata-app') || getApps()[0]
  }
  return getFirestore(app)
}

// Fetch course data for metadata using client SDK
async function getCourseData(courseId: string) {
  try {
    const db = getMetadataFirestore()

    // Try direct lookup first
    const courseRef = doc(db, 'courses', courseId)
    const courseSnap = await getDoc(courseRef)

    if (courseSnap.exists()) {
      return { id: courseSnap.id, ...courseSnap.data() }
    }

    // Try by slug
    const slugQuery = query(
      collection(db, 'courses'),
      where('slug', '==', courseId),
      limit(1)
    )
    const slugSnap = await getDocs(slugQuery)

    if (!slugSnap.empty) {
      const docSnap = slugSnap.docs[0]
      return { id: docSnap.id, ...docSnap.data() }
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