/**
 * Seed Categories Script
 * Adds default categories to Firestore
 */

const admin = require('firebase-admin');
const serviceAccount = require('../dma-67ab7-firebase-adminsdk-w44uk-e80a8fc03d.json');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

const categories = [
  {
    name: 'Üzleti és Menedzsment',
    slug: 'uzleti-es-menedzsment',
    description: 'Üzleti vezetés, stratégia, projektmenedzsment',
    icon: '💼',
    order: 1,
    active: true
  },
  {
    name: 'Marketing és Értékesítés',
    slug: 'marketing-es-ertekesites',
    description: 'Digitális marketing, közösségi média, értékesítési technikák',
    icon: '📈',
    order: 2,
    active: true
  },
  {
    name: 'Programozás és Fejlesztés',
    slug: 'programozas-es-fejlesztes',
    description: 'Webfejlesztés, mobilappok, szoftverfejlesztés',
    icon: '💻',
    order: 3,
    active: true
  },
  {
    name: 'Design és Kreativitás',
    slug: 'design-es-kreativitas',
    description: 'Grafikai tervezés, UX/UI, kreatív alkotás',
    icon: '🎨',
    order: 4,
    active: true
  },
  {
    name: 'Személyes Fejlődés',
    slug: 'szemelyes-fejlodes',
    description: 'Önismeret, kommunikáció, produktivitás',
    icon: '🌱',
    order: 5,
    active: true
  },
  {
    name: 'Pénzügyek és Befektetés',
    slug: 'penzugyek-es-befektetes',
    description: 'Befektetés, vagyonkezelés, pénzügyi tervezés',
    icon: '💰',
    order: 6,
    active: true
  },
  {
    name: 'Egészség és Wellness',
    slug: 'egeszseg-es-wellness',
    description: 'Fitness, táplálkozás, mentális egészség',
    icon: '💪',
    order: 7,
    active: true
  },
  {
    name: 'Nyelvek',
    slug: 'nyelvek',
    description: 'Nyelvtanulás, kommunikáció idegen nyelveken',
    icon: '🌍',
    order: 8,
    active: true
  },
  {
    name: 'Jog és Compliance',
    slug: 'jog-es-compliance',
    description: 'Jogszabályok, adatvédelem, megfelelőség',
    icon: '⚖️',
    order: 9,
    active: true
  },
  {
    name: 'Data Science és AI',
    slug: 'data-science-es-ai',
    description: 'Adatelemzés, gépi tanulás, mesterséges intelligencia',
    icon: '🤖',
    order: 10,
    active: true
  },
  {
    name: 'HR és Toborzás',
    slug: 'hr-es-toborzas',
    description: 'Emberi erőforrás menedzsment, toborzás, onboarding',
    icon: '👥',
    order: 11,
    active: true
  },
  {
    name: 'Fotózás és Videózás',
    slug: 'fotozas-es-videozas',
    description: 'Fotográfia, videókészítés, vágás',
    icon: '📸',
    order: 12,
    active: true
  }
];

async function seedCategories() {
  console.log('🌱 Starting category seeding...');

  try {
    // Check if categories already exist
    const existingCategories = await db.collection('categories').get();

    if (existingCategories.size > 0) {
      console.log(`⚠️  Found ${existingCategories.size} existing categories`);
      console.log('   Do you want to continue? This will add duplicates if categories with same names exist.');
      console.log('   Press Ctrl+C to cancel or wait 5 seconds to continue...');

      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    // Add categories
    for (const category of categories) {
      // Check if category with this slug already exists
      const existing = await db.collection('categories')
        .where('slug', '==', category.slug)
        .limit(1)
        .get();

      if (!existing.empty) {
        console.log(`⏭️  Skipping "${category.name}" - already exists`);
        continue;
      }

      const docRef = await db.collection('categories').add({
        ...category,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log(`✅ Added: ${category.name} (${docRef.id})`);
    }

    console.log('\n🎉 Category seeding completed!');
    console.log(`📊 Total categories in database: ${(await db.collection('categories').get()).size}`);

  } catch (error) {
    console.error('❌ Error seeding categories:', error);
    process.exit(1);
  }

  process.exit(0);
}

seedCategories();
