/**
 * Populate targetAudienceIds for courses from CSV mapping
 * Run with: GOOGLE_APPLICATION_CREDENTIALS="" node scripts/populate-target-audiences.js
 *
 * Usage:
 *   DRY_RUN=true node scripts/populate-target-audiences.js   # Preview changes
 *   node scripts/populate-target-audiences.js                  # Execute changes
 */
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'dmaapp-477d4',
  });
}

const firestore = admin.firestore();
const DRY_RUN = process.env.DRY_RUN === 'true';

// CSV Data from /docs/target.csv
const CSV_DATA = `Képzés neve,Kinek szól
Egy jó vezető jellemvonásai | Orgován Katalin - Pátria Nyomda Zrt.,Vezetők
Hatékony csapatmotiváció | DMA ponthu Kft. munkatársaival,"Vezetők, Munkatársak"
A válságkezelés módjai | Markovich Béla - Mapei Kft.,"Vezetők, Munkatársak"
Hogyan árazd be a termékeid? | Káplár Kornél és András - Káplár Fatelep Kft.,Vezetők
Hogyan indíts el egy Google hirdetést?,"Vezetők, Munkatársak"
Hogyan indíts el egy Facebook hirdetést?,"Vezetők, Munkatársak"
Munkatárs megtalálás | Mihályi László - Mihályi Patisserie,Vezetők
Hogyan legyél első a Google-ben?,"Vezetők, Munkatársak"
Hogyan érd el az álmaidat? | Garzó Gabriella - Polgári Agrokémia Kft.,"Vezetők, Munkatársak"
"Hogyan vegyél rá valakit, hogy termeljen?","Vezetők, Munkatársak"
Hogy legyenek motiváltabb munkatársaid? | Barabás Botond - Mag-Log Transport Kft.,"Vezetők, Munkatársak"
Hogyan legyen profi levelezésed?,"Vezetők, Munkatársak"
Hogyan győzz meg egy vevőt?,"Vezetők, Munkatársak"
Mi módon legyen több időd? | Forray Niki - Balloon World Hungary Kft.,"Vezetők, Munkatársak"
Hogyan ösztönözd vezetőid saját maguk képzésére?,Vezetők
Milyen egy professzionális weboldal?,"Vezetők, Munkatársak"
Hogyan tervezd meg a bevételeid?,"Vezetők, Munkatársak"
Érdeklődők lezárása 1 perc alatt,"Vezetők, Munkatársak"
"Hogy zárj le egy értékesítést 1 perc alatt? | Farkas Bálint, Baranyai Örs, Pócs Bálint - Follow Marketing Kft.","Vezetők, Munkatársak"
Hogyan növeld meg a profitod?,Vezetők
Hogyan szervezd ki magad a cégből?,Vezetők
Milyen módon találj meg munkatársakat? | Vasvenszki Zsolt - Manitox Kft.,"Vezetők, Munkatársak"
Hogyan motiváld magad vezetőként?,Vezetők
Hogyan öltöztesd munkatársaid professzionálisan?,Vezetők
Mit tegyél egy generációváltás során?,"Vezetők, Munkatársak"
Miért ne add el a termékeid?,"Vezetők, Munkatársak"
Hogyan emeld az érzelmi szintedet?,"Vezetők, Munkatársak"
Hogyan készíts felmérést?,"Vezetők, Munkatársak"
Érdeklődés felkeltése 3 lépésben,"Vezetők, Munkatársak"
"Mit tegyél, ha kimerült vagy?","Vezetők, Munkatársak"
Hogyan veszik el az idődet a lezáratlan dolgok?,"Vezetők, Munkatársak"
Hogyan készíts álláshirdetést Facebookon?,"Vezetők, Munkatársak"
Miért nem érkezik be soha időben a pénzed?,"Vezetők, Munkatársak"
Miként zárj le gyorsan dolgokat?,"Vezetők, Munkatársak"
Hogy kommunikálj eredményesen?,"Vezetők, Munkatársak"
Miért kellenek Irányelvek az ügyfeleid felé?,"Vezetők, Munkatársak"
Hogyan tartson össze a csapatod?,Vezetők
Hogyan kontrolláld a környezeted?,"Vezetők, Munkatársak"
Hogyan találd meg a saját motivációd?,"Vezetők, Munkatársak"
Hogyan válhat piacvezető a te cégedből?,Vezetők
Miként nézzen ki saját karrieroldalad?,"Vezetők, Munkatársak"
Hogyan lehet motivált az egész csapatod?,Vezetők
Hogyan válj motiválttá?,"Vezetők, Munkatársak"
Miért vezesd be a teljesítménybérezést?,Vezetők
Hogy legyetek vonzó munkahely?,"Vezetők, Munkatársak"
Panaszkezelés mesterfokon: hogy csináld?,"Vezetők, Munkatársak"
Hogyan helyezd szilárd alapokra pénzügyeid és árazásod?,"Vezetők, Munkatársak"
Hogyan készíts Facebook/Instagram posztokat?,"Vezetők, Munkatársak"
Miért írd meg Orientációs folyamatleírásod?,"Vezetők, Munkatársak"
Hogyan írj céges Elveket?,"Vezetők, Munkatársak"
Mi a sikeres értékesítés titka?,"Vezetők, Munkatársak"
"Mit kezdj egy jó szakemberrel, ha rongálja a csapatod?",Vezetők
Miként készíts karriertervezést munkatársaidnak?,Vezetők
Miért is vagy egyedül cégvezetőként?,Vezetők
Mi a különbség a Marketing és a PR között?,"Vezetők, Munkatársak"
Milyen egy jó vezető?,Vezetők
Mi a kulcsa a megfelelő munkatársak felvételének?,"Vezetők, Munkatársak"
Mi a posztjaid sikeres átadásának kulcsa?,"Vezetők, Munkatársak"
Hogyan készítsd el saját szervezeti ábrádat?,Vezetők
"Miként kezeld, ha munkatársaid nincsenek jóban?",Vezetők
A kommunikáció alapjai,"Vezetők, Munkatársak"
Mi a titka a hatékony szervezésnek 2024-ben?,"Vezetők, Munkatársak"
Hogyan használd a Google Drive-ot?,"Vezetők, Munkatársak"
Miért van szükséged napi jelentésre?,"Vezetők, Munkatársak"
Hogyan ismerj fel egy gerinctelen személyt?,"Vezetők, Munkatársak"
Hogyan írj Folyamatleírásokat?,"Vezetők, Munkatársak"
Hogyan írj meg sikeresen egy Elvet?,"Vezetők, Munkatársak"
Mi a titka az új kollégák sikeres pozícióba helyezésének?,Vezetők
Mi a titka a céged küldetésének megalkotásának?,Vezetők
Cégfejlesztési eszközök bevezetése,"Vezetők, Munkatársak"
Hogyan működik a beszerzési igénylés/jóváhagyás?,"Vezetők, Munkatársak"
Hogy maximalizáld Google hirdetéseid eredményét?,"Vezetők, Munkatársak"
Hogyan írj meg hatékonyan egy Folyamatleírást?,"Vezetők, Munkatársak"
Hogy találd meg a megfelelő pozíciót a munkatársaid számára?,Vezetők
Hogyan oszd ki hatékonyan a feladatokat?,Vezetők
Miért ne nézd el a hibákat?,"Vezetők, Munkatársak"
Mi a receptje a hatékony kommunikációnak?,"Vezetők, Munkatársak"
Évtervező: hogyan tervezz meg egy sikeres évet?,Vezetők
Hogyan keltsd fel az érdeklődést 1 perc alatt?,"Vezetők, Munkatársak"
Értékesítés alapjai,"Vezetők, Munkatársak"
PR és marketing kampányok tervezése/kivitelezése,"Vezetők, Munkatársak"
Hogyan tarts gördülékeny meetinget vezetőként?,Vezetők
Hogyan találd meg saját Sündisznó-Elved?,Vezetők
Hogy néz ki egy remek "csali-termék"?,"Vezetők, Munkatársak"
"Vezetői időbeosztás: énidő, család, munka",Vezetők
Egy rendszerezett termelési folyamat felépítése,"Vezetők, Munkatársak"
Teljesítménybérezés: motivál vagy frusztrál?,"Vezetők, Munkatársak"
Hogyan oktasd mesterfokon munkatársaid?,Vezetők
Miért fontos a történetmesélés a marketingben?,"Vezetők, Munkatársak"
Hogyan alkalmazkodj a változó piaci körülményekhez?,Vezetők
Milyen feladatai vannak az ügyvezetésnek?,Vezetők
"Miért pénzégetés a marketinged, és hogyan javíts rajta?","Vezetők, Munkatársak"
Hogyan kezeld a generációs különbségeket?,"Vezetők, Munkatársak"
Hatékony folyamatok: hogy segít egy lendkerék a cégedben?,"Vezetők, Munkatársak"
Egy innovatív vállalkozás alapelemei,"Vezetők, Munkatársak"
Az innovatív gondolkodás titka,"Vezetők, Munkatársak"
A minőségellenőrzés fontossága,"Vezetők, Munkatársak"
Milyen módon válhatsz jóból kiváló céggé?,Vezetők
Miért ne tukmálj egy értékesítés során?,"Vezetők, Munkatársak"
Jeff Bezos kommunikációs módszere,"Vezetők, Munkatársak"
Mitől kitűnő egy HR vezető?,Vezetők
Célravezető kommunikáció a cégen belül,"Vezetők, Munkatársak"
Mikor lehetsz boldog vezetőként?,Vezetők
Egy működő törzsvásárlói rendszer alapjai,"Vezetők, Munkatársak"
Hogyan adj át könnyen elveket a munkatársaidnak?,"Vezetők, Munkatársak"
A hatásos meggyőzés pszichológiája,"Vezetők, Munkatársak"
A korrekció művészete: visszajelzés vezetői szemmel,Vezetők
Miből áll egy hatékony értékesítési rendszer?,"Vezetők, Munkatársak"
Hogyan találd meg személyes küldetésed?,"Vezetők, Munkatársak"
Hogyan építs fel kiváló stratégiát?,Vezetők
Árazástechnika: miért éri meg drágábbnak lenni?,"Vezetők, Munkatársak"
Hogyan motiváld vezetőidet?,Vezetők
Hogyan motiváld munkatársaidat?,"Vezetők, Munkatársak"
Mikor jutalmazz vagy büntess?,"Vezetők, Munkatársak"
A taktikai kiválóság alapelvei,"Vezetők, Munkatársak"
Stratégia és taktika: hogyan előzd meg versenytársaid?,Vezetők
Milyen egy kiemelkedő vezetői stílus?,Vezetők
Hatékonyabb folyamatok: Elon Musk algoritmusa,"Vezetők, Munkatársak"
Mi a kapcsolatépítés 9 alapszabálya?,"Vezetők, Munkatársak"
Hogyan építsd fel saját Vállalati Térképed?,Vezetők
A profi értékesítés alapjai,"Vezetők, Munkatársak"
Milyen marketing eszközök léteznek?,"Vezetők, Munkatársak"
Mit kell tennie egy kiváló pénzügyi vezetőnek?,Vezetők
Pénzügyi alapok: amit nem mondanak el neked,Vezetők
Mi egy jó középvezető feladata?,"Vezetők, Munkatársak"
Miként tervezd meg mindennapi feladataid?,"Vezetők, Munkatársak"
Mire figyelj és mit kérdezz egy állásinterjún?,"Vezetők, Munkatársak"
Miért a megfelelő emberek teszik naggyá a céged?,"Vezetők, Munkatársak"
"Integrálás Elve: 4 lépés, hogy a tanulás működjön","Vezetők, Munkatársak"
Miért és hogyan határozd meg az ideális vásárlód?,"Vezetők, Munkatársak"
Hatékony időgazdálkodás a mindennapokban,"Vezetők, Munkatársak"
Hogyan adj ki egy ajánlatot?,"Vezetők, Munkatársak"
A sikeres jövőkép kialakítása 2026-ra,Vezetők
Vállalati Térkép Expedíció: hogy építs struktúrát 6 szakaszban?,"Vezetők, Munkatársak"
Hogyan égesd bele márkádat ügyfeleid fejébe?,"Vezetők, Munkatársak"
MARKOVICH BÉLA: Jutalmak és Büntetések,"Vezetők, Munkatársak"
BALOGH LEVENTE: Hogy legyél piacvezető?,Vezetők
EGERSZEGI KRISZTIÁN: Hogyan építs fel egy értékesítési rendszert?,"Vezetők, Munkatársak"
BOLYKI BENCE: Egy folyamatfejlesztés első lépései,"Vezetők, Munkatársak"
HAJÓS ISTVÁN: Miért lesz a robotika a jövő rendszere?,"Vezetők, Munkatársak"
GANGEL PÉTER: Mi egy folyamat evolúciója?,"Vezetők, Munkatársak"
KATONA ZSOMBOR és LUCZY MARTIN: Hogyan készül egy átütő shortvideó?,"Vezetők, Munkatársak"
KOVÁCS FERENC: Generációváltás gördülékenyen,Vezetők
KÁPLÁR KORNÉL: Önjáró vállalkozás lépésről lépésre,"Vezetők, Munkatársak"
MIHÁLYI LÁSZLÓ: Hogyan tartsd meg a legjobb szakembereket?,"Vezetők, Munkatársak"
SZABÓ PÉTER: A jövőképed megalkotásának titka,"Vezetők, Munkatársak"
FLESCH TAMÁS: A magyar turizmus építőjének vezetői titkai,"Vezetők, Munkatársak"
GYŐRFI PÁL és HAJÓS ISTVÁN a sikeres kommunikáció titkáról,"Vezetők, Munkatársak"
Fellélegzik a csapat, ha elküldöd a rossz embereket - SEMSEI RUDOLF,"Vezetők, Munkatársak"
Alakíts ki önjáró vállalkozást,"Vezetők, Munkatársak"
Alakíts ki tiszta folyamatokat,"Vezetők, Munkatársak"
Építsd fel a struktúrád,"Vezetők, Munkatársak"
Erősödj meg vezetőként,"Vezetők, Munkatársak"
Előzd meg a konkurenciát,"Vezetők, Munkatársak"
Nyerd vissza az időd,"Vezetők, Munkatársak"
Alakíts ki innovatív gondolkodást,"Vezetők, Munkatársak"
Találd meg a sztárjátékosokat,"Vezetők, Munkatársak"
Hozd tűzbe a csapatodat,"Vezetők, Munkatársak"
Kommunikálj hatékonyan,"Vezetők, Munkatársak"
Építs erős vezetői réteget,"Vezetők, Munkatársak"
Hozz ki többet a marketingből,"Vezetők, Munkatársak"
Vonzd be az új vevőket,"Vezetők, Munkatársak"
Irányítsd a pénzügyeidet,"Vezetők, Munkatársak"
Legyél magabiztos értékesítő,"Vezetők, Munkatársak"
Hozz ki többet az áraidból,"Vezetők, Munkatársak"
Használd a meggyőzés erejét,"Vezetők, Munkatársak"
Alakítsd ki a jövőképed (új akadémiával),"Vezetők, Munkatársak"
Fejlődj jóból kiválóvá,"Vezetők, Munkatársak"
Tedd skálázhatóvá a céged,"Vezetők, Munkatársak"`;

function parseCSV(csvString) {
  const lines = csvString.trim().split('\n');
  const data = [];

  // Skip header
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line === ',') continue;

    // Handle CSV with quotes properly
    let courseName, targetAudience;

    if (line.startsWith('"')) {
      // Line starts with quoted value
      const match = line.match(/^"([^"]+)",(.+)$/);
      if (match) {
        courseName = match[1];
        targetAudience = match[2].replace(/^"|"$/g, '').trim();
      } else {
        continue;
      }
    } else if (line.includes(',"')) {
      // Target audience is quoted
      const firstComma = line.indexOf(',');
      courseName = line.substring(0, firstComma);
      targetAudience = line.substring(firstComma + 1).replace(/^"|"$/g, '').trim();
    } else {
      // Simple case
      const parts = line.split(',');
      if (parts.length >= 2) {
        courseName = parts[0].trim();
        targetAudience = parts.slice(1).join(',').trim();
      } else {
        continue;
      }
    }

    if (courseName && targetAudience) {
      // Clean up course name (remove newlines)
      courseName = courseName.replace(/\n/g, ' ').trim();
      data.push({ courseName, targetAudience });
    }
  }

  return data;
}

function parseTargetAudiences(audienceString) {
  // Parse "Vezetők" or "Vezetők, Munkatársak"
  const audiences = audienceString.split(',').map(a => a.trim());
  return audiences.filter(a => a === 'Vezetők' || a === 'Munkatársak');
}

function normalizeTitle(title) {
  // Normalize for matching: lowercase, remove extra spaces, trim
  return title
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[""]/g, '"')
    .replace(/\n/g, ' ')
    .trim();
}

async function main() {
  console.log('='.repeat(60));
  console.log('Populate targetAudienceIds for Courses');
  console.log(DRY_RUN ? '🔍 DRY RUN MODE - No changes will be made' : '🚀 LIVE MODE - Changes will be applied');
  console.log('='.repeat(60));

  // Step 1: Get targetAudiences collection to map names to IDs
  console.log('\n📋 Fetching targetAudiences collection...');
  const audiencesSnapshot = await firestore.collection('targetAudiences').get();

  const audienceNameToId = {};
  audiencesSnapshot.docs.forEach(doc => {
    const data = doc.data();
    audienceNameToId[data.name] = doc.id;
    console.log(`  - "${data.name}" → ${doc.id}`);
  });

  // Check required audiences exist
  if (!audienceNameToId['Vezetők'] || !audienceNameToId['Munkatársak']) {
    console.error('\n❌ ERROR: Required target audiences not found in collection!');
    console.error('   Please create "Vezetők" and "Munkatársak" in targetAudiences collection first.');
    process.exit(1);
  }

  // Step 2: Get all courses
  console.log('\n📚 Fetching all courses...');
  const coursesSnapshot = await firestore.collection('courses').get();
  console.log(`   Found ${coursesSnapshot.size} courses in database`);

  // Create lookup by normalized title
  const coursesByTitle = {};
  coursesSnapshot.docs.forEach(doc => {
    const data = doc.data();
    const normalizedTitle = normalizeTitle(data.title || '');
    if (!coursesByTitle[normalizedTitle]) {
      coursesByTitle[normalizedTitle] = [];
    }
    coursesByTitle[normalizedTitle].push({
      id: doc.id,
      title: data.title,
      currentTargetAudienceIds: data.targetAudienceIds || [],
    });
  });

  // Step 3: Parse CSV data
  console.log('\n📄 Parsing CSV data...');
  const csvData = parseCSV(CSV_DATA);
  console.log(`   Found ${csvData.length} entries in CSV`);

  // Step 4: Process each CSV entry
  const results = {
    updated: [],
    skipped: [],
    notFound: [],
    errors: [],
  };

  const batch = firestore.batch();
  let batchCount = 0;

  console.log('\n🔄 Processing courses...\n');

  for (const entry of csvData) {
    const normalizedCsvTitle = normalizeTitle(entry.courseName);
    const audiences = parseTargetAudiences(entry.targetAudience);
    const audienceIds = audiences.map(name => audienceNameToId[name]).filter(Boolean);

    if (audienceIds.length === 0) {
      results.errors.push({ courseName: entry.courseName, reason: 'Invalid audience values' });
      continue;
    }

    // Try to find course
    let foundCourse = null;

    // Exact match
    if (coursesByTitle[normalizedCsvTitle]) {
      foundCourse = coursesByTitle[normalizedCsvTitle][0];
    }

    // Partial match (course title contains CSV title or vice versa)
    if (!foundCourse) {
      for (const [title, courses] of Object.entries(coursesByTitle)) {
        if (title.includes(normalizedCsvTitle) || normalizedCsvTitle.includes(title)) {
          foundCourse = courses[0];
          break;
        }
      }
    }

    // Try matching first part before |
    if (!foundCourse && entry.courseName.includes('|')) {
      const firstPart = normalizeTitle(entry.courseName.split('|')[0]);
      for (const [title, courses] of Object.entries(coursesByTitle)) {
        if (title.includes(firstPart) || firstPart.includes(title)) {
          foundCourse = courses[0];
          break;
        }
      }
    }

    // Try matching by significant keywords
    if (!foundCourse) {
      const csvWords = normalizedCsvTitle.split(' ').filter(w => w.length > 4);
      for (const [title, courses] of Object.entries(coursesByTitle)) {
        const matchCount = csvWords.filter(word => title.includes(word)).length;
        if (matchCount >= 3 || (csvWords.length <= 3 && matchCount >= 2)) {
          foundCourse = courses[0];
          break;
        }
      }
    }

    if (!foundCourse) {
      results.notFound.push(entry.courseName);
      console.log(`❌ NOT FOUND: "${entry.courseName}"`);
      continue;
    }

    // Check if already populated
    if (foundCourse.currentTargetAudienceIds.length > 0) {
      results.skipped.push({
        courseName: foundCourse.title,
        existing: foundCourse.currentTargetAudienceIds,
      });
      console.log(`⏭️  SKIPPED (already has data): "${foundCourse.title}"`);
      continue;
    }

    // Add to batch
    const courseRef = firestore.collection('courses').doc(foundCourse.id);
    batch.update(courseRef, {
      targetAudienceIds: audienceIds,
      updatedAt: new Date().toISOString(),
    });
    batchCount++;

    results.updated.push({
      courseName: foundCourse.title,
      courseId: foundCourse.id,
      audienceIds,
      audiences,
    });

    console.log(`✅ MATCHED: "${entry.courseName.substring(0, 50)}..." → "${foundCourse.title.substring(0, 50)}..." [${audiences.join(', ')}]`);

    // Commit batch every 400 operations (Firestore limit is 500)
    if (batchCount >= 400) {
      if (!DRY_RUN) {
        await batch.commit();
        console.log(`\n   Committed batch of ${batchCount} updates`);
      }
      batchCount = 0;
    }
  }

  // Commit remaining
  if (batchCount > 0 && !DRY_RUN) {
    await batch.commit();
    console.log(`\n   Committed final batch of ${batchCount} updates`);
  }

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Updated:   ${results.updated.length} courses`);
  console.log(`⏭️  Skipped:   ${results.skipped.length} courses (already have targetAudienceIds)`);
  console.log(`❌ Not Found: ${results.notFound.length} courses`);
  console.log(`⚠️  Errors:    ${results.errors.length}`);

  if (results.notFound.length > 0) {
    console.log('\n📋 Courses NOT FOUND in database:');
    results.notFound.forEach(name => console.log(`   - ${name}`));
  }

  if (results.errors.length > 0) {
    console.log('\n⚠️  Errors:');
    results.errors.forEach(e => console.log(`   - ${e.courseName}: ${e.reason}`));
  }

  if (DRY_RUN) {
    console.log('\n🔍 DRY RUN COMPLETE - No changes were made');
    console.log('   Run without DRY_RUN=true to apply changes');
  } else {
    console.log('\n🎉 Migration complete!');
  }
}

main()
  .then(() => {
    console.log('\nDone!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Fatal Error:', error);
    process.exit(1);
  });
