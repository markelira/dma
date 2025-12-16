/**
 * Migration Script: Fetch and store Mux video durations
 *
 * This script fetches video durations from the Mux API for all existing lessons
 * that have a muxPlaybackId but no muxDuration stored.
 *
 * Strategy: Look up assets by playbackId (since muxAssetId contains Upload IDs)
 *
 * Usage:
 *   npx tsx scripts/migrate-mux-durations.ts
 *
 * Requirements:
 *   - Firebase Admin credentials (GOOGLE_APPLICATION_CREDENTIALS env var)
 *   - Mux API credentials (MUX_TOKEN_ID, MUX_TOKEN_SECRET env vars)
 */

import { initializeApp, cert, ServiceAccount } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import Mux from '@mux/mux-node';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env.local') });

// Initialize Firebase Admin
const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
if (!serviceAccountPath) {
  console.error('❌ GOOGLE_APPLICATION_CREDENTIALS environment variable not set');
  process.exit(1);
}

// eslint-disable-next-line @typescript-eslint/no-var-requires
const serviceAccount = require(serviceAccountPath) as ServiceAccount;

initializeApp({
  credential: cert(serviceAccount),
});

const firestore = getFirestore();

// Initialize Mux client
const MUX_TOKEN_ID = process.env.MUX_TOKEN_ID;
const MUX_TOKEN_SECRET = process.env.MUX_TOKEN_SECRET;

if (!MUX_TOKEN_ID || !MUX_TOKEN_SECRET) {
  console.error('❌ MUX_TOKEN_ID and MUX_TOKEN_SECRET environment variables required');
  process.exit(1);
}

const mux = new Mux({
  tokenId: MUX_TOKEN_ID,
  tokenSecret: MUX_TOKEN_SECRET,
});

interface MigrationStats {
  totalLessons: number;
  updated: number;
  skipped: number;
  errors: number;
}

const stats: MigrationStats = {
  totalLessons: 0,
  updated: 0,
  skipped: 0,
  errors: 0,
};

// Cache: playbackId -> asset duration
const playbackIdToDuration: Map<string, number> = new Map();

/**
 * Delay helper to avoid Mux API rate limits
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Build a cache of all Mux assets indexed by playbackId
 * This is more efficient than looking up each asset individually
 */
async function buildPlaybackIdCache(): Promise<void> {
  console.log('📦 Building Mux asset cache by playbackId...');

  let page = 1;
  let hasMore = true;
  let totalAssets = 0;

  while (hasMore) {
    try {
      const response = await mux.video.assets.list({ limit: 100, page });
      const assets = response.data || [];

      for (const asset of assets) {
        if (asset.playback_ids && asset.duration) {
          for (const pb of asset.playback_ids) {
            playbackIdToDuration.set(pb.id, asset.duration);
          }
        }
        totalAssets++;
      }

      // Check if there are more pages
      // If we got fewer than 100 results, we've reached the end
      if (assets.length < 100) {
        hasMore = false;
      } else {
        page++;
        await delay(100); // Rate limit between pages
      }
    } catch (error: any) {
      console.error(`  ❌ Error fetching assets page ${page}:`, error.message);
      hasMore = false;
    }
  }

  console.log(`  ✅ Cached ${playbackIdToDuration.size} playback IDs from ${totalAssets} assets\n`);
}

/**
 * Get duration from cache for a given playbackId
 */
function getDurationByPlaybackId(playbackId: string): number | null {
  return playbackIdToDuration.get(playbackId) || null;
}

/**
 * Process a lesson document - fetch duration and update if needed
 */
async function processLesson(
  lessonPath: string,
  lessonData: FirebaseFirestore.DocumentData
): Promise<void> {
  stats.totalLessons++;

  const { muxPlaybackId, muxDuration, title } = lessonData;

  // Skip if no muxPlaybackId
  if (!muxPlaybackId) {
    console.log(`  ⏭️ Skipping "${title || 'Untitled'}" - no muxPlaybackId`);
    stats.skipped++;
    return;
  }

  // Skip if duration already exists
  if (muxDuration && muxDuration > 0) {
    console.log(`  ✅ Already has duration: "${title || 'Untitled'}" (${muxDuration}s)`);
    stats.skipped++;
    return;
  }

  // Get duration from cache (by playbackId)
  const duration = getDurationByPlaybackId(muxPlaybackId);

  if (duration === null) {
    console.log(`  ⚠️ No duration found for "${title || 'Untitled'}" (playbackId: ${muxPlaybackId})`);
    stats.errors++;
    return;
  }

  // Update the lesson document
  try {
    await firestore.doc(lessonPath).update({
      muxDuration: duration,
      updatedAt: new Date().toISOString(),
    });
    console.log(`  ✅ Updated "${title || 'Untitled'}": ${Math.round(duration)}s`);
    stats.updated++;
  } catch (error: any) {
    console.error(`  ❌ Failed to update ${lessonPath}:`, error.message);
    stats.errors++;
  }
}

/**
 * Main migration function
 */
async function migrateMuxDurations(): Promise<void> {
  console.log('🚀 Starting Mux duration migration...\n');

  try {
    // First, build the playbackId -> duration cache from Mux
    await buildPlaybackIdCache();

    // Get all courses
    const coursesSnapshot = await firestore.collection('courses').get();
    console.log(`📚 Found ${coursesSnapshot.size} courses\n`);

    for (const courseDoc of coursesSnapshot.docs) {
      const courseId = courseDoc.id;
      const courseData = courseDoc.data();
      console.log(`\n📖 Processing course: "${courseData.title || courseId}"`);

      // 1) Process FLAT lessons (courses/{courseId}/lessons/{lessonId})
      const flatLessonsSnapshot = await firestore
        .collection('courses')
        .doc(courseId)
        .collection('lessons')
        .get();

      if (flatLessonsSnapshot.size > 0) {
        console.log(`  📋 Found ${flatLessonsSnapshot.size} flat lessons`);
        for (const lessonDoc of flatLessonsSnapshot.docs) {
          const lessonPath = `courses/${courseId}/lessons/${lessonDoc.id}`;
          await processLesson(lessonPath, lessonDoc.data());
        }
      }

      // 2) Process MODULE lessons (courses/{courseId}/modules/{moduleId}/lessons/{lessonId})
      const modulesSnapshot = await firestore
        .collection('courses')
        .doc(courseId)
        .collection('modules')
        .get();

      for (const moduleDoc of modulesSnapshot.docs) {
        const moduleId = moduleDoc.id;
        const moduleData = moduleDoc.data();

        const moduleLessonsSnapshot = await firestore
          .collection('courses')
          .doc(courseId)
          .collection('modules')
          .doc(moduleId)
          .collection('lessons')
          .get();

        if (moduleLessonsSnapshot.size > 0) {
          console.log(`  📋 Found ${moduleLessonsSnapshot.size} lessons in module "${moduleData.title || moduleId}"`);
          for (const lessonDoc of moduleLessonsSnapshot.docs) {
            const lessonPath = `courses/${courseId}/modules/${moduleId}/lessons/${lessonDoc.id}`;
            await processLesson(lessonPath, lessonDoc.data());
          }
        }
      }
    }

    // Print summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 Migration Summary:');
    console.log(`   Total lessons processed: ${stats.totalLessons}`);
    console.log(`   Updated with duration:   ${stats.updated}`);
    console.log(`   Skipped (already had):   ${stats.skipped}`);
    console.log(`   Errors:                  ${stats.errors}`);
    console.log('='.repeat(50));
    console.log('\n✅ Migration complete!');

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migrateMuxDurations().then(() => {
  process.exit(0);
}).catch((error) => {
  console.error('Migration error:', error);
  process.exit(1);
});
