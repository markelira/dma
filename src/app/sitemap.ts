import { MetadataRoute } from 'next'
import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

// Initialize Firebase Admin for server-side sitemap generation
function getAdminFirestore() {
  if (getApps().length === 0) {
    // Use application default credentials in production (Vercel)
    // or service account in development
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      initializeApp({
        credential: cert(process.env.GOOGLE_APPLICATION_CREDENTIALS),
      })
    } else {
      // Use default credentials (works on Vercel with Firebase integration)
      initializeApp({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'dmaapp-477d4',
      })
    }
  }
  return getFirestore()
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://masterclass.dma.hu'

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/courses`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/akademia`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/webinar`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/masterclass`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/podcast`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/register`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
  ]

  // Dynamic course pages
  let coursePages: MetadataRoute.Sitemap = []

  try {
    const db = getAdminFirestore()
    const coursesSnapshot = await db
      .collection('courses')
      .where('status', '==', 'PUBLISHED')
      .get()

    coursePages = coursesSnapshot.docs.map((doc) => {
      const data = doc.data()
      const slug = data.slug || doc.id
      const updatedAt = data.updatedAt?.toDate?.() || new Date()

      return {
        url: `${baseUrl}/courses/${slug}`,
        lastModified: updatedAt,
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      }
    })
  } catch (error) {
    console.error('Error fetching courses for sitemap:', error)
    // Continue with static pages only if Firebase fails
  }

  return [...staticPages, ...coursePages]
}
