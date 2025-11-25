const admin = require('firebase-admin');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore } = require('firebase-admin/firestore');

// Initialize admin with emulator settings
process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8088';
process.env.FIREBASE_STORAGE_EMULATOR_HOST = 'localhost:9199';

admin.initializeApp({
  projectId: 'dmaapp-477d4'
});

const auth = getAuth();
const db = getFirestore();

// Test users data
const testUsers = [
  {
    email: 'admin@elira.hu',
    password: 'Admin123!',
    displayName: 'Admin Felhasználó',
    role: 'admin',
    emailVerified: true
  },
  {
    email: 'instructor@elira.hu',
    password: 'Instructor123!',
    displayName: 'Oktató Felhasználó',
    role: 'instructor',
    emailVerified: true
  },
  {
    email: 'student@elira.hu',
    password: 'Student123!',
    displayName: 'Tanuló Felhasználó',
    role: 'student',
    emailVerified: true
  },
  {
    email: 'university@elira.hu',
    password: 'University123!',
    displayName: 'Egyetemi Admin',
    role: 'UNIVERSITY_ADMIN',
    emailVerified: true,
    universityId: 'university-1'
  },
  // Company Admin (owner)
  {
    email: 'company@elira.hu',
    password: 'Company123!',
    displayName: 'Vállalati Admin',
    firstName: 'Vállalati',
    lastName: 'Admin',
    role: 'COMPANY_ADMIN',
    emailVerified: true,
    companyId: 'company-test',
    companyRole: 'admin'
  },
  // Company Employee
  {
    email: 'employee@elira.hu',
    password: 'Employee123!',
    displayName: 'Teszt Alkalmazott',
    firstName: 'Teszt',
    lastName: 'Alkalmazott',
    role: 'STUDENT',
    emailVerified: true,
    companyId: 'company-test',
    companyRole: 'employee'
  }
];

// Test company
const testCompany = {
  id: 'company-test',
  name: 'Teszt Vállalat Kft.',
  slug: 'teszt-vallalat',
  billingEmail: 'company@elira.hu',
  plan: 'premium',
  status: 'active',
  industry: 'Technology',
  companySize: '50-200',
  subscriptionStatus: 'active',
};

// Category-specific stock thumbnails from Unsplash
const categoryThumbnails = {
  hr: [
    'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=1200&h=675&fit=crop', // team meeting
    'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=1200&h=675&fit=crop', // professional woman
    'https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200&h=675&fit=crop', // team collaboration
    'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1200&h=675&fit=crop', // office people
    'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=1200&h=675&fit=crop', // interview
    'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=1200&h=675&fit=crop', // presentation
    'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=1200&h=675&fit=crop', // handshake
    'https://images.unsplash.com/photo-1529400971008-f566de0e6dfc?w=1200&h=675&fit=crop', // office desk
    'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1200&h=675&fit=crop', // team work
    'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&h=675&fit=crop', // modern office
  ],
  marketing: [
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&h=675&fit=crop', // analytics
    'https://images.unsplash.com/photo-1432888622747-4eb9a8efeb07?w=1200&h=675&fit=crop', // social media
    'https://images.unsplash.com/photo-1533750349088-cd871a92f312?w=1200&h=675&fit=crop', // marketing
    'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1200&h=675&fit=crop', // strategy meeting
    'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=675&fit=crop', // data dashboard
    'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=1200&h=675&fit=crop', // digital marketing
    'https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=1200&h=675&fit=crop', // charts
    'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=1200&h=675&fit=crop', // content creation
    'https://images.unsplash.com/photo-1542744094-24638eff58bb?w=1200&h=675&fit=crop', // creative team
    'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=1200&h=675&fit=crop', // brand strategy
  ],
  mukodes: [
    'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1200&h=675&fit=crop', // business planning
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200&h=675&fit=crop', // workflow
    'https://images.unsplash.com/photo-1531973576160-7125cd663d86?w=1200&h=675&fit=crop', // operations
    'https://images.unsplash.com/photo-1558403194-611308249627?w=1200&h=675&fit=crop', // logistics
    'https://images.unsplash.com/photo-1553413077-190dd305871c?w=1200&h=675&fit=crop', // warehouse
    'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1200&h=675&fit=crop', // supply chain
    'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1200&h=675&fit=crop', // office work
    'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=1200&h=675&fit=crop', // business process
    'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=1200&h=675&fit=crop', // planning
    'https://images.unsplash.com/photo-1600880292089-90a7e086ee0c?w=1200&h=675&fit=crop', // team planning
  ],
  ertekesites: [
    'https://images.unsplash.com/photo-1556745757-8d76bdb6984b?w=1200&h=675&fit=crop', // sales meeting
    'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=1200&h=675&fit=crop', // sales chart
    'https://images.unsplash.com/photo-1553729459-efe14ef6055d?w=1200&h=675&fit=crop', // money growth
    'https://images.unsplash.com/photo-1573497620053-ea5300f94f21?w=1200&h=675&fit=crop', // sales professional
    'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=1200&h=675&fit=crop', // contract signing
    'https://images.unsplash.com/photo-1559526324-593bc073d938?w=1200&h=675&fit=crop', // business deal
    'https://images.unsplash.com/photo-1552581234-26160f608093?w=1200&h=675&fit=crop', // presentation
    'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1200&h=675&fit=crop', // team selling
    'https://images.unsplash.com/photo-1556761175-b413da4baf72?w=1200&h=675&fit=crop', // negotiation
    'https://images.unsplash.com/photo-1562654501-a0ccc0fc3fb1?w=1200&h=675&fit=crop', // target
  ],
  ugyvezetes: [
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200&h=675&fit=crop', // leadership
    'https://images.unsplash.com/photo-1551836022-deb4988cc6c0?w=1200&h=675&fit=crop', // executive
    'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=1200&h=675&fit=crop', // boardroom
    'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=1200&h=675&fit=crop', // CEO
    'https://images.unsplash.com/photo-1600880292089-90a7e086ee0c?w=1200&h=675&fit=crop', // strategic meeting
    'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=1200&h=675&fit=crop', // business leader
    'https://images.unsplash.com/photo-1556761175-4b46a572b786?w=1200&h=675&fit=crop', // vision
    'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=1200&h=675&fit=crop', // office view
    'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=1200&h=675&fit=crop', // executive office
    'https://images.unsplash.com/photo-1560472355-536de3962603?w=1200&h=675&fit=crop', // decision making
  ],
};

// Helper to generate lesson with Mux-like data
const createLesson = (id, title, description, order, type = 'VIDEO', durationSeconds = 600) => ({
  id,
  title,
  description,
  order,
  type,
  status: 'PUBLISHED',
  durationSeconds,
  muxDuration: durationSeconds,
  muxThumbnailUrl: categoryThumbnails.hr[order % 10],
  muxPlaybackId: `mock-playback-${id}`,
  muxAssetId: `mock-asset-${id}`,
  muxStatus: 'ready',
  content: `Tartalom a(z) "${title}" leckéhez.`,
  learningOutcomes: [
    'Megérted az alapvető koncepciókat',
    'Gyakorlati tudást szerzel',
    'Képes leszel alkalmazni a tanultakat'
  ]
});

// Generate modules for a course
const generateModules = (courseId, moduleCount = 3, lessonsPerModule = 4) => {
  const modules = [];
  for (let m = 1; m <= moduleCount; m++) {
    const lessons = [];
    for (let l = 1; l <= lessonsPerModule; l++) {
      lessons.push(createLesson(
        `${courseId}-m${m}-l${l}`,
        `${m}. modul - ${l}. lecke`,
        `A(z) ${m}. modul ${l}. leckéjének leírása.`,
        l,
        l === lessonsPerModule ? 'QUIZ' : 'VIDEO',
        600 + Math.floor(Math.random() * 600)
      ));
    }
    modules.push({
      id: `${courseId}-module-${m}`,
      title: `${m}. Modul`,
      description: `A kurzus ${m}. modulja`,
      order: m,
      lessons
    });
  }
  return modules;
};

// Categories
const testCategories = [
  {
    id: 'category-hr',
    name: 'HR',
    slug: 'hr',
    description: 'Humán erőforrás menedzsment és toborzás'
  },
  {
    id: 'category-marketing',
    name: 'Marketing',
    slug: 'marketing',
    description: 'Marketing stratégiák és kampányok'
  },
  {
    id: 'category-mukodes',
    name: 'Működés',
    slug: 'mukodes',
    description: 'Üzleti működés és folyamatok'
  },
  {
    id: 'category-ertekesites',
    name: 'Értékesítés',
    slug: 'ertekesites',
    description: 'Értékesítési technikák és stratégiák'
  },
  {
    id: 'category-ugyvezetes',
    name: 'Ügyvezetés',
    slug: 'ugyvezetes',
    description: 'Vezetői készségek és stratégiai gondolkodás'
  }
];

// Target audiences
const testTargetAudiences = [
  {
    id: 'audience-kezdo',
    name: 'Pályakezdők',
    description: 'Frissen végzett szakemberek és karrierkezdők'
  },
  {
    id: 'audience-kozepvezeto',
    name: 'Középvezetők',
    description: 'Csapatvezetők és osztályvezetők'
  },
  {
    id: 'audience-felsovezeto',
    name: 'Felsővezetők',
    description: 'Igazgatók és C-szintű vezetők'
  },
  {
    id: 'audience-vallalkozo',
    name: 'Vállalkozók',
    description: 'Startup alapítók és kisvállalkozók'
  },
  {
    id: 'audience-szakerto',
    name: 'Szakértők',
    description: 'Szakterületi specialisták'
  }
];

// Course templates per category
const courseTemplates = {
  hr: [
    { title: 'Toborzás és Kiválasztás Mesterfokon', type: 'MASTERCLASS', desc: 'Ismerd meg a leghatékonyabb toborzási technikákat és találd meg a legjobb jelölteket.' },
    { title: 'Employer Branding Stratégiák', type: 'WEBINAR', desc: 'Építs erős munkáltatói márkát és vonzd be a tehetségeket.' },
    { title: 'HR Analytics és Adatvezérelt Döntéshozatal', type: 'ACADEMIA', desc: 'Használd az adatokat a HR döntéseid megalapozására.' },
    { title: 'Onboarding Program Tervezés', type: 'MASTERCLASS', desc: 'Készíts hatékony beilleszkedési programot új munkatársaknak.' },
    { title: 'Teljesítményértékelési Rendszerek', type: 'ACADEMIA', desc: 'Építs fel és működtess modern teljesítményértékelési rendszert.' },
    { title: 'Munkajogi Alapismeretek', type: 'WEBINAR', desc: 'A legfontosabb munkajogi szabályok és azok gyakorlati alkalmazása.' },
    { title: 'HR Beszélgetések Podcast', type: 'PODCAST', desc: 'Inspiráló beszélgetések HR vezetőkkel és szakértőkkel.' },
    { title: 'Kompenzáció és Juttatások Tervezése', type: 'MASTERCLASS', desc: 'Alakíts ki versenyképes bérezési és juttatási rendszert.' },
    { title: 'Munkahelyi Wellbeing Program', type: 'ACADEMIA', desc: 'Támogasd a munkavállalók jóllétét és egészségét.' },
    { title: 'Tehetségmenedzsment és Utánpótlás-tervezés', type: 'WEBINAR', desc: 'Azonosítsd és fejleszd a jövő vezetőit.' },
  ],
  marketing: [
    { title: 'Digitális Marketing Alapozó', type: 'ACADEMIA', desc: 'Átfogó képzés a digitális marketing minden területén.' },
    { title: 'Social Media Marketing 2024', type: 'MASTERCLASS', desc: 'A legfrissebb social media trendek és stratégiák.' },
    { title: 'SEO és Tartalommarketing', type: 'WEBINAR', desc: 'Növeld a weboldalad láthatóságát és vonzz több ügyfelet.' },
    { title: 'Google Ads Kampánykezelés', type: 'MASTERCLASS', desc: 'Hozd ki a maximumot a fizetett hirdetéseidből.' },
    { title: 'E-mail Marketing Automatizáció', type: 'ACADEMIA', desc: 'Építs hatékony e-mail marketing rendszert.' },
    { title: 'Marketing Podcast - Trendek és Tippek', type: 'PODCAST', desc: 'Heti marketing hírek és szakértői vélemények.' },
    { title: 'Influencer Marketing Stratégiák', type: 'WEBINAR', desc: 'Működj együtt influencerekkel hatékonyan.' },
    { title: 'Brand Building és Pozicionálás', type: 'MASTERCLASS', desc: 'Építs erős és megkülönböztető márkát.' },
    { title: 'Videó Marketing és YouTube Stratégia', type: 'ACADEMIA', desc: 'Használd ki a videó tartalmak erejét.' },
    { title: 'Marketing Analitika és ROI Mérés', type: 'WEBINAR', desc: 'Mérd és optimalizáld a marketing tevékenységed.' },
  ],
  mukodes: [
    { title: 'Folyamatoptimalizálás Lean Módszerrel', type: 'MASTERCLASS', desc: 'Csökkentsd a pazarlást és növeld a hatékonyságot.' },
    { title: 'Projektmenedzsment Alapok', type: 'ACADEMIA', desc: 'Tanuld meg a projektek sikeres vezetését.' },
    { title: 'Agilis Munkamódszerek', type: 'WEBINAR', desc: 'Ismerd meg a Scrum és Kanban módszertanokat.' },
    { title: 'Supply Chain Management', type: 'MASTERCLASS', desc: 'Optimalizáld az ellátási láncot.' },
    { title: 'Minőségbiztosítás és ISO Szabványok', type: 'ACADEMIA', desc: 'Építs minőségirányítási rendszert.' },
    { title: 'Működési Podcast - Best Practices', type: 'PODCAST', desc: 'Operatív vezetők mesélik el tapasztalataikat.' },
    { title: 'Költségcsökkentési Stratégiák', type: 'WEBINAR', desc: 'Találj hatékony módszereket a költségek csökkentésére.' },
    { title: 'ERP Rendszerek Bevezetése', type: 'MASTERCLASS', desc: 'Sikeres vállalatirányítási rendszer implementáció.' },
    { title: 'Készletgazdálkodás és Logisztika', type: 'ACADEMIA', desc: 'Optimális készletszintek és hatékony logisztika.' },
    { title: 'Business Process Automation', type: 'WEBINAR', desc: 'Automatizáld az ismétlődő üzleti folyamatokat.' },
  ],
  ertekesites: [
    { title: 'B2B Értékesítési Technikák', type: 'MASTERCLASS', desc: 'Sajátítsd el a vállalati értékesítés művészetét.' },
    { title: 'Sales Funnel Optimalizálás', type: 'WEBINAR', desc: 'Növeld a konverziós rátát minden szakaszban.' },
    { title: 'Tárgyalástechnika Mesterfokon', type: 'ACADEMIA', desc: 'Legyél profi tárgyaló és zárd le az üzleteket.' },
    { title: 'CRM Rendszerek Hatékony Használata', type: 'MASTERCLASS', desc: 'Hozd ki a maximumot a CRM rendszeredből.' },
    { title: 'Cold Calling és Prospecting', type: 'WEBINAR', desc: 'Szerezz új ügyfeleket hideg megkeresésekkel.' },
    { title: 'Sales Podcast - Sikertörténetek', type: 'PODCAST', desc: 'Top értékesítők osztják meg titkaikat.' },
    { title: 'Prezentációs Készségek Fejlesztése', type: 'MASTERCLASS', desc: 'Tarts meggyőző sales prezentációkat.' },
    { title: 'Account Management és Ügyfélmegtartás', type: 'ACADEMIA', desc: 'Építs hosszútávú ügyfélkapcsolatokat.' },
    { title: 'Sales Leadership', type: 'WEBINAR', desc: 'Vezess sikeres értékesítési csapatot.' },
    { title: 'Social Selling és LinkedIn', type: 'MASTERCLASS', desc: 'Használd a közösségi médiát értékesítésre.' },
  ],
  ugyvezetes: [
    { title: 'Stratégiai Gondolkodás és Tervezés', type: 'MASTERCLASS', desc: 'Fejleszd a stratégiai szemléletedet.' },
    { title: 'Vezetői Kommunikáció', type: 'ACADEMIA', desc: 'Kommunikálj hatékonyan vezetőként.' },
    { title: 'Változásmenedzsment', type: 'WEBINAR', desc: 'Vezesd a szervezeted a változáson keresztül.' },
    { title: 'Pénzügyi Alapok Vezetőknek', type: 'MASTERCLASS', desc: 'Értsd meg a pénzügyi kimutatásokat és döntéseket.' },
    { title: 'Csapatépítés és Motiváció', type: 'ACADEMIA', desc: 'Építs összetartó és motivált csapatot.' },
    { title: 'CEO Podcast - Vezetői Beszélgetések', type: 'PODCAST', desc: 'Sikeres ügyvezetők osztják meg tapasztalataikat.' },
    { title: 'Döntéshozatal Bizonytalanságban', type: 'WEBINAR', desc: 'Hozz jó döntéseket nehéz helyzetekben.' },
    { title: 'Vállalati Kultúra Fejlesztése', type: 'MASTERCLASS', desc: 'Alakíts ki pozitív és produktív kultúrát.' },
    { title: 'Krízismenedzsment', type: 'ACADEMIA', desc: 'Készülj fel és kezeld a válsághelyzeteket.' },
    { title: 'Digitális Transzformáció Vezetése', type: 'WEBINAR', desc: 'Vezesd a digitális átalakulást a szervezetedben.' },
  ],
};

// Generate all 50 courses
const generateCourses = () => {
  const courses = [];
  const categoryKeys = ['hr', 'marketing', 'mukodes', 'ertekesites', 'ugyvezetes'];
  const categoryIdMap = {
    hr: 'category-hr',
    marketing: 'category-marketing',
    mukodes: 'category-mukodes',
    ertekesites: 'category-ertekesites',
    ugyvezetes: 'category-ugyvezetes',
  };

  categoryKeys.forEach((catKey) => {
    const templates = courseTemplates[catKey];
    const thumbnails = categoryThumbnails[catKey];

    templates.forEach((template, index) => {
      const courseId = `${catKey}-course-${index + 1}`;
      const slug = template.title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

      // Random audience selection (1-2 audiences per course)
      const audienceCount = Math.floor(Math.random() * 2) + 1;
      const shuffledAudiences = [...testTargetAudiences].sort(() => Math.random() - 0.5);
      const selectedAudiences = shuffledAudiences.slice(0, audienceCount).map(a => a.id);

      courses.push({
        id: courseId,
        title: template.title,
        slug,
        description: template.desc,
        courseType: template.type,
        price: 0,
        originalPrice: Math.floor(Math.random() * 100000) + 29900,
        currency: 'HUF',
        instructorId: null,
        categoryIds: [categoryIdMap[catKey]],
        targetAudienceIds: selectedAudiences,
        level: ['Kezdő', 'Középhaladó', 'Haladó'][Math.floor(Math.random() * 3)],
        duration: `${Math.floor(Math.random() * 8) + 2} óra`,
        language: 'Magyar',
        featured: index < 3,
        status: 'PUBLISHED',
        thumbnailUrl: thumbnails[index],
        enrollmentCount: Math.floor(Math.random() * 2000) + 100,
        rating: (Math.random() * 1.5 + 3.5).toFixed(1),
        reviewCount: Math.floor(Math.random() * 200) + 10,
        certificateEnabled: template.type !== 'PODCAST',
        whatYouWillLearn: [
          'Gyakorlati készségeket és technikákat',
          'Azonnali alkalmazható tudást',
          'Szakértői tippeket és trükköket',
          'Valós esettanulmányokat',
        ],
        requirements: [
          'Alapszintű számítógépes ismeretek',
          'Nyitottság az új ismeretekre',
        ],
        targetAudience: [
          'Szakemberek, akik fejlődni szeretnének',
          'Vezetők és döntéshozók',
          'Karrierváltók',
        ],
        modules: generateModules(
          courseId,
          template.type === 'PODCAST' ? 1 : template.type === 'WEBINAR' ? 2 : 4,
          template.type === 'PODCAST' ? 8 : template.type === 'WEBINAR' ? 3 : 5
        ),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });
  });

  return courses;
};

// Test instructors
const testInstructors = [
  {
    id: 'instructor-1',
    name: 'Dr. Kovács Péter',
    title: 'Senior HR Szakértő',
    bio: 'Több mint 15 éves tapasztalat a humán erőforrás menedzsment területén. Korábban multinacionális vállalatok HR igazgatója.',
    profilePictureUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face'
  },
  {
    id: 'instructor-2',
    name: 'Nagy Anna',
    title: 'Marketing Director',
    bio: 'Marketing szakértő több mint 10 éves tapasztalattal a digitális marketing területén. Fortune 500 cégek tanácsadója.',
    profilePictureUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face'
  },
  {
    id: 'instructor-3',
    name: 'Szabó Gábor',
    title: 'Operations Manager',
    bio: 'Folyamatoptimalizálási szakértő, Lean Six Sigma Black Belt. Több mint 20 éves ipari tapasztalat.',
    profilePictureUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face'
  },
  {
    id: 'instructor-4',
    name: 'Tóth Katalin',
    title: 'Sales Executive',
    bio: 'Top értékesítési vezető 15 éves B2B és B2C tapasztalattal. Számos díjnyertes értékesítési kampány vezetője.',
    profilePictureUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop&crop=face'
  },
  {
    id: 'instructor-5',
    name: 'Dr. Horváth László',
    title: 'CEO & Business Coach',
    bio: 'Sikeres vállalkozó és üzleti coach. Több startup alapítója és mentora. Harvard MBA végzettség.',
    profilePictureUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&h=200&fit=crop&crop=face'
  }
];

// Test university
const testUniversity = {
  id: 'university-1',
  name: 'DMA Business School',
  slug: 'dma-business-school',
  description: 'Magyarország vezető üzleti képzési intézménye',
  logo: 'https://via.placeholder.com/200x200/1E40AF/ffffff?text=DMA',
  website: 'https://www.dma.hu',
  contactEmail: 'info@dma.hu',
  settings: {
    allowSelfEnrollment: true,
    requireApproval: false,
    customBranding: true
  },
  departments: ['HR', 'Marketing', 'Működés', 'Értékesítés', 'Ügyvezetés'],
  createdAt: admin.firestore.FieldValue.serverTimestamp()
};

async function seedEmulators() {
  console.log('🌱 Starting to seed emulators with 50 courses (10 per category)...\n');

  try {
    // Create categories first
    console.log('📂 Creating categories...');
    for (const category of testCategories) {
      await db.collection('categories').doc(category.id).set({
        ...category,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log(`✅ Category created: ${category.name}`);
    }

    // Create target audiences
    console.log('\n🎯 Creating target audiences...');
    for (const audience of testTargetAudiences) {
      await db.collection('targetAudiences').doc(audience.id).set({
        ...audience,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log(`✅ Target audience created: ${audience.name}`);
    }

    // Create instructors
    console.log('\n👨‍🏫 Creating instructors...');
    for (const instructor of testInstructors) {
      await db.collection('instructors').doc(instructor.id).set({
        ...instructor,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log(`✅ Instructor created: ${instructor.name}`);
    }

    // Create university
    console.log('\n🏫 Creating university...');
    await db.collection('universities').doc(testUniversity.id).set(testUniversity);
    console.log(`✅ University created: ${testUniversity.name}`);

    // Create company
    console.log('\n🏢 Creating test company...');
    await db.collection('companies').doc(testCompany.id).set({
      ...testCompany,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log(`✅ Company created: ${testCompany.name}`);

    // Create users
    console.log('\n👥 Creating test users...');
    let instructorId = null;
    let companyAdminId = null;
    let companyEmployeeId = null;

    for (const userData of testUsers) {
      try {
        const userRecord = await auth.createUser({
          email: userData.email,
          password: userData.password,
          displayName: userData.displayName,
          emailVerified: userData.emailVerified
        });

        if (userData.role === 'instructor') {
          instructorId = userRecord.uid;
        }
        if (userData.role === 'COMPANY_ADMIN') {
          companyAdminId = userRecord.uid;
        }
        if (userData.companyRole === 'employee') {
          companyEmployeeId = userRecord.uid;
        }

        // Create user document with company fields if applicable
        await db.collection('users').doc(userRecord.uid).set({
          id: userRecord.uid,
          uid: userRecord.uid,
          email: userData.email,
          displayName: userData.displayName,
          firstName: userData.firstName || userData.displayName.split(' ')[0],
          lastName: userData.lastName || userData.displayName.split(' ').slice(1).join(' '),
          role: userData.role,
          universityId: userData.universityId || null,
          companyId: userData.companyId || null,
          companyRole: userData.companyRole || null,
          emailVerified: userData.emailVerified,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          profileCompleted: true,
          isActive: true
        });

        // Create company admin document if this is a company admin
        if (userData.role === 'COMPANY_ADMIN' && userData.companyId) {
          await db.collection('companies').doc(userData.companyId).collection('admins').doc(userRecord.uid).set({
            userId: userRecord.uid,
            companyId: userData.companyId,
            email: userData.email,
            name: userData.displayName,
            role: 'owner',
            permissions: {
              canManageEmployees: true,
              canViewReports: true,
              canManageBilling: true,
              canManageMasterclasses: true
            },
            status: 'active',
            addedBy: userRecord.uid,
            addedAt: admin.firestore.FieldValue.serverTimestamp()
          });
          console.log(`✅ Company admin created for: ${userData.email}`);
        }

        // Create company employee document if this is a company employee
        if (userData.companyRole === 'employee' && userData.companyId) {
          await db.collection('companies').doc(userData.companyId).collection('employees').doc(userRecord.uid).set({
            userId: userRecord.uid,
            firstName: userData.firstName,
            lastName: userData.lastName,
            fullName: userData.displayName,
            email: userData.email,
            jobTitle: 'Tesztelő',
            status: 'active',
            companyId: userData.companyId,
            invitedBy: 'seed-script',
            invitedAt: admin.firestore.FieldValue.serverTimestamp(),
            joinedAt: admin.firestore.FieldValue.serverTimestamp()
          });
          console.log(`✅ Company employee created for: ${userData.email}`);
        }

        console.log(`✅ User created: ${userData.email} (${userData.role})`);
      } catch (error) {
        if (error.code === 'auth/email-already-exists') {
          console.log(`⚠️  User already exists: ${userData.email}`);
          try {
            const existingUser = await auth.getUserByEmail(userData.email);
            await db.collection('users').doc(existingUser.uid).set({
              id: existingUser.uid,
              uid: existingUser.uid,
              email: userData.email,
              displayName: userData.displayName,
              firstName: userData.firstName || userData.displayName.split(' ')[0],
              lastName: userData.lastName || userData.displayName.split(' ').slice(1).join(' '),
              role: userData.role,
              universityId: userData.universityId || null,
              companyId: userData.companyId || null,
              companyRole: userData.companyRole || null,
              emailVerified: userData.emailVerified,
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
              profileCompleted: true,
              isActive: true
            }, { merge: true });
            if (userData.role === 'instructor') {
              instructorId = existingUser.uid;
            }
            if (userData.role === 'COMPANY_ADMIN') {
              companyAdminId = existingUser.uid;
            }
            if (userData.companyRole === 'employee') {
              companyEmployeeId = existingUser.uid;
            }
          } catch (updateError) {
            console.error(`❌ Error updating user ${userData.email}:`, updateError.message);
          }
        } else {
          console.error(`❌ Error creating user ${userData.email}:`, error.message);
        }
      }
    }

    // Generate and create courses
    console.log('\n📚 Creating 50 courses (10 per category)...');
    const testCourses = generateCourses();

    // Assign instructors to courses based on category
    const categoryInstructorMap = {
      'category-hr': 'instructor-1',
      'category-marketing': 'instructor-2',
      'category-mukodes': 'instructor-3',
      'category-ertekesites': 'instructor-4',
      'category-ugyvezetes': 'instructor-5',
    };

    let courseCount = 0;
    for (const course of testCourses) {
      const categoryId = course.categoryIds[0];
      course.instructorId = instructorId;
      course.instructorIds = [categoryInstructorMap[categoryId]];

      await db.collection('courses').doc(course.id).set(course);
      courseCount++;

      const lessonCount = course.modules.reduce((acc, mod) => acc + mod.lessons.length, 0);
      console.log(`✅ [${courseCount}/50] ${course.title}`);
      console.log(`   └─ ${course.modules.length} modules, ${lessonCount} lessons, Category: ${categoryId.replace('category-', '')}`);
    }

    // Create some enrollments
    console.log('\n📝 Creating test enrollments...');
    try {
      const studentUser = await auth.getUserByEmail('student@elira.hu');

      // Enroll in a few courses from different categories
      const enrollmentCourses = ['hr-course-1', 'marketing-course-1', 'ertekesites-course-1'];

      for (const courseId of enrollmentCourses) {
        await db.collection('enrollments').doc(`${studentUser.uid}_${courseId}`).set({
          userId: studentUser.uid,
          courseId: courseId,
          enrolledAt: admin.firestore.FieldValue.serverTimestamp(),
          progress: Math.floor(Math.random() * 60) + 10,
          completedLessons: [],
          currentLessonId: `${courseId}-m1-l1`,
          lastAccessedAt: admin.firestore.FieldValue.serverTimestamp(),
          status: 'active'
        });
        console.log(`✅ Enrollment created for ${courseId}`);
      }
    } catch (err) {
      console.log('⚠️  Could not create enrollments:', err.message);
    }

    console.log('\n✨ Seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log('─────────────────────────────────────');
    console.log(`📂 Categories: ${testCategories.length}`);
    console.log(`🎯 Target Audiences: ${testTargetAudiences.length}`);
    console.log(`👨‍🏫 Instructors: ${testInstructors.length}`);
    console.log(`📚 Courses: ${testCourses.length} (10 per category)`);
    console.log(`👥 Users: ${testUsers.length}`);

    console.log('\n📋 Test credentials:');
    console.log('─────────────────────────────────────');
    testUsers.forEach(user => {
      console.log(`${user.role.toUpperCase()}: ${user.email} / ${user.password}`);
    });

    console.log('\n📂 Categories with courses:');
    console.log('─────────────────────────────────────');
    testCategories.forEach(cat => {
      console.log(`• ${cat.name}: 10 courses`);
    });

  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  }

  process.exit(0);
}

// Run the seeding
seedEmulators();
