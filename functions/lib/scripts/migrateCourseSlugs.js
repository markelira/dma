"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * One-time migration script: Fix Hungarian course slugs
 *
 * Usage:
 *   npx ts-node --project functions/tsconfig.json functions/src/scripts/migrateCourseSlugs.ts
 *
 * What it does:
 *   1. Fetches all courses from Firestore
 *   2. Re-generates slug from title using the fixed slugify()
 *   3. Stores old slug in legacySlug field
 *   4. Updates slug field with corrected value
 *   5. Checks for slug collisions
 *
 * DRY RUN by default — set DRY_RUN=false to actually write.
 */
const admin = __importStar(require("firebase-admin"));
const slugify_1 = require("../utils/slugify");
// Initialize Firebase Admin
const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
if (serviceAccountPath) {
    const serviceAccount = require(serviceAccountPath);
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });
}
else {
    admin.initializeApp();
}
const firestore = admin.firestore();
const DRY_RUN = process.env.DRY_RUN !== 'false';
async function migrateCourseSlugs() {
    console.log(`\n=== Course Slug Migration ===`);
    console.log(`Mode: ${DRY_RUN ? 'DRY RUN (no writes)' : 'LIVE (writing to Firestore)'}\n`);
    const coursesSnapshot = await firestore.collection('courses').get();
    console.log(`Found ${coursesSnapshot.size} courses\n`);
    const slugMap = new Map(); // newSlug -> [courseId, ...]
    const updates = [];
    for (const doc of coursesSnapshot.docs) {
        const data = doc.data();
        const title = data.title;
        const currentSlug = data.slug || '';
        if (!title) {
            console.log(`  SKIP ${doc.id}: no title`);
            continue;
        }
        const newSlug = (0, slugify_1.slugify)(title);
        if (currentSlug === newSlug) {
            console.log(`  OK   ${doc.id}: "${currentSlug}" (unchanged)`);
            // Track in slugMap even if unchanged
            const existing = slugMap.get(newSlug) || [];
            existing.push(doc.id);
            slugMap.set(newSlug, existing);
            continue;
        }
        console.log(`  FIX  ${doc.id}: "${currentSlug}" -> "${newSlug}"  (title: "${title}")`);
        updates.push({ id: doc.id, title, oldSlug: currentSlug, newSlug });
        const existing = slugMap.get(newSlug) || [];
        existing.push(doc.id);
        slugMap.set(newSlug, existing);
    }
    // Check for collisions
    console.log(`\n=== Collision Check ===`);
    let hasCollisions = false;
    for (const [slug, ids] of slugMap.entries()) {
        if (ids.length > 1) {
            hasCollisions = true;
            console.log(`  COLLISION: "${slug}" -> ${ids.join(', ')}`);
        }
    }
    if (!hasCollisions) {
        console.log('  No collisions detected.');
    }
    // Resolve collisions by appending counter
    const finalUpdates = updates.map((update) => {
        const ids = slugMap.get(update.newSlug) || [];
        if (ids.length > 1) {
            const index = ids.indexOf(update.id);
            if (index > 0) {
                return { ...update, newSlug: `${update.newSlug}-${index + 1}` };
            }
        }
        return update;
    });
    // Summary
    console.log(`\n=== Summary ===`);
    console.log(`Total courses: ${coursesSnapshot.size}`);
    console.log(`Slugs to update: ${finalUpdates.length}`);
    console.log(`Collisions resolved: ${hasCollisions ? 'yes' : 'none'}`);
    if (finalUpdates.length === 0) {
        console.log('\nNo updates needed. All slugs are correct.');
        return;
    }
    if (DRY_RUN) {
        console.log('\n=== DRY RUN — no changes written ===');
        console.log('Run with DRY_RUN=false to apply changes.\n');
        return;
    }
    // Apply updates in batches of 500 (Firestore limit)
    console.log('\n=== Applying Updates ===');
    const batchSize = 500;
    for (let i = 0; i < finalUpdates.length; i += batchSize) {
        const batch = firestore.batch();
        const chunk = finalUpdates.slice(i, i + batchSize);
        for (const update of chunk) {
            const ref = firestore.collection('courses').doc(update.id);
            batch.update(ref, {
                slug: update.newSlug,
                legacySlug: update.oldSlug || null,
            });
        }
        await batch.commit();
        console.log(`  Batch ${Math.floor(i / batchSize) + 1}: Updated ${chunk.length} courses`);
    }
    console.log(`\nMigration complete. ${finalUpdates.length} courses updated.\n`);
}
migrateCourseSlugs().catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
});
//# sourceMappingURL=migrateCourseSlugs.js.map