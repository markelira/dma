import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Adatvédelmi Tájékoztató | DMA',
  description: 'A DMA ponthu Kft. adatvédelmi tájékoztatója a személyes adatok kezeléséről a GDPR előírásai szerint.',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="container py-12 md:py-16">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-12">
            <Link
              href="/"
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors mb-4 inline-block"
            >
              &larr; Vissza a főoldalra
            </Link>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Adatvédelmi Tájékoztató
            </h1>
            <p className="text-gray-500">
              Utolsó módosítás: 2025. január 1.
            </p>
          </div>

          {/* Content */}
          <div className="prose prose-gray max-w-none">

            {/* 1. Adatkezelő adatai */}
            <section className="mb-12">
              <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mt-12 mb-4">
                1. Az adatkezelő adatai
              </h2>
              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <p className="text-gray-600 leading-relaxed mb-4">
                  Az adatok kezeléséért felelős adatkezelő:
                </p>
                <ul className="space-y-2 text-gray-600">
                  <li><strong>Cégnév:</strong> DMA ponthu Kft.</li>
                  <li><strong>Székhely:</strong> 3527 Miskolc, Bajcsy-Zsilinszky Endre utca 17. VI. em.</li>
                  <li><strong>Cégjegyzékszám:</strong> 05 09 012283</li>
                  <li><strong>Adószám:</strong> 13512989-2-05</li>
                  <li><strong>Képviselő:</strong> Dienes Martin (ügyvezető)</li>
                  <li><strong>E-mail:</strong> <a href="mailto:info@dma.hu" className="text-blue-600 hover:underline">info@dma.hu</a></li>
                  <li><strong>Telefon:</strong> <a href="tel:+36704218100" className="text-blue-600 hover:underline">+36 70 421 8100</a></li>
                  <li><strong>Weboldal:</strong> <a href="https://dma.hu" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">https://dma.hu</a></li>
                </ul>
              </div>
              <p className="text-gray-600 leading-relaxed">
                Az adatkezelő felelős az Ön személyes adatainak biztonságos és jogszerű kezeléséért,
                az adatvédelmi előírásoknak megfelelően.
              </p>
            </section>

            {/* 2. Adatvédelmi tisztviselő */}
            <section className="mb-12">
              <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mt-12 mb-4">
                2. Adatvédelmi tisztviselő
              </h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                Az adatvédelmi kérdésekben kapcsolattartó:
              </p>
              <ul className="space-y-2 text-gray-600 mb-4">
                <li><strong>Név:</strong> Dienes Martin</li>
                <li><strong>Beosztás:</strong> ügyvezető</li>
                <li><strong>E-mail:</strong> <a href="mailto:info@dma.hu" className="text-blue-600 hover:underline">info@dma.hu</a></li>
              </ul>
              <p className="text-gray-600 leading-relaxed">
                Az adatvédelmi tisztviselőhöz bármilyen adatkezeléssel kapcsolatos kérdéssel,
                panasszal vagy joggyakorlással fordulhat.
              </p>
            </section>

            {/* 3. Fogalommeghatározások */}
            <section className="mb-12">
              <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mt-12 mb-4">
                3. Fogalommeghatározások
              </h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                A jelen tájékoztatóban használt fogalmak az Európai Parlament és a Tanács (EU) 2016/679
                rendelete (GDPR) szerinti jelentéssel bírnak:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-600">
                <li><strong>Személyes adat:</strong> azonosított vagy azonosítható természetes személyre vonatkozó bármely információ.</li>
                <li><strong>Adatkezelés:</strong> a személyes adatokon végzett bármely művelet vagy műveletek összessége.</li>
                <li><strong>Adatkezelő:</strong> az a természetes vagy jogi személy, amely a személyes adatok kezelésének céljait és eszközeit meghatározza.</li>
                <li><strong>Adatfeldolgozó:</strong> az a természetes vagy jogi személy, amely az adatkezelő nevében személyes adatokat kezel.</li>
                <li><strong>Érintett:</strong> bármely meghatározott személyes adat alapján azonosított vagy azonosítható természetes személy.</li>
                <li><strong>Hozzájárulás:</strong> az érintett akaratának önkéntes, konkrét és megfelelő tájékoztatáson alapuló egyértelmű kinyilvánítása.</li>
              </ul>
            </section>

            {/* 4. Kezelt adatok köre és célja */}
            <section className="mb-12">
              <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mt-12 mb-4">
                4. A kezelt személyes adatok köre és az adatkezelés célja
              </h2>
              <p className="text-gray-600 leading-relaxed mb-6">
                A DMA ponthu Kft. az Ön személyes adatait meghatározott célokból és kizárólag
                jogszerű keretek között kezeli a GDPR és a vonatkozó magyar jogszabályok szerint.
              </p>

              <h3 className="text-lg font-medium text-gray-900 mt-6 mb-2">4.1 Regisztrációs adatok</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-600 mb-4">
                <li>Teljes név</li>
                <li>E-mail cím</li>
                <li>Jelszó (titkosított formában)</li>
                <li>Telefonszám (opcionális)</li>
              </ul>
              <p className="text-gray-600 leading-relaxed mb-6">
                <strong>Cél:</strong> Felhasználói fiók létrehozása és kezelése, szolgáltatáshoz való hozzáférés biztosítása,
                felhasználó azonosítása, kapcsolattartás.
              </p>

              <h3 className="text-lg font-medium text-gray-900 mt-6 mb-2">4.2 Számlázási adatok</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-600 mb-4">
                <li>Számlázási név</li>
                <li>Számlázási cím</li>
                <li>Adószám (ha van)</li>
                <li>Fizetési tranzakciós azonosítók</li>
              </ul>
              <p className="text-gray-600 leading-relaxed mb-6">
                <strong>Cél:</strong> Előfizetések kezelése, számlázás, jogszabályi kötelezettségek teljesítése
                (számviteli törvény szerinti kötelező adatmegőrzés).
              </p>

              <h3 className="text-lg font-medium text-gray-900 mt-6 mb-2">4.3 Tanulási tevékenység adatai</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-600 mb-4">
                <li>Kurzus beiratkozások</li>
                <li>Lecke haladás (megtekintett videók, befejezett leckék)</li>
                <li>Teszt és kvíz eredmények</li>
                <li>Tanulási idő statisztikák</li>
                <li>Megszerzett tanúsítványok</li>
              </ul>
              <p className="text-gray-600 leading-relaxed mb-6">
                <strong>Cél:</strong> Személyre szabott tanulási élmény biztosítása, haladás követése,
                tanúsítványok kiállítása, szolgáltatás fejlesztése.
              </p>

              <h3 className="text-lg font-medium text-gray-900 mt-6 mb-2">4.4 Technikai adatok</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-600 mb-4">
                <li>IP-cím</li>
                <li>Böngésző típusa és verziója</li>
                <li>Operációs rendszer</li>
                <li>Eszköz típusa</li>
                <li>Látogatás időpontja és időtartama</li>
                <li>Meglátogatott oldalak</li>
              </ul>
              <p className="text-gray-600 leading-relaxed">
                <strong>Cél:</strong> Weboldal működtetése, biztonság garantálása, visszaélések megelőzése,
                statisztikai elemzések, szolgáltatás optimalizálása.
              </p>
            </section>

            {/* 5. Adatkezelés jogalapja */}
            <section className="mb-12">
              <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mt-12 mb-4">
                5. Az adatkezelés jogalapja
              </h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                A személyes adatok kezelése az alábbi jogalapokon történik (GDPR 6. cikk (1) bekezdés):
              </p>
              <ul className="list-disc list-inside space-y-3 text-gray-600">
                <li>
                  <strong>a) Hozzájárulás:</strong> Az érintett hozzájárulását adta személyes adatainak kezeléséhez
                  (pl. hírlevél feliratkozás, marketing kommunikáció).
                </li>
                <li>
                  <strong>b) Szerződés teljesítése:</strong> Az adatkezelés olyan szerződés teljesítéséhez szükséges,
                  amelyben az érintett az egyik fél (pl. előfizetés, szolgáltatás nyújtása).
                </li>
                <li>
                  <strong>c) Jogi kötelezettség:</strong> Az adatkezelés az adatkezelőre vonatkozó jogi kötelezettség
                  teljesítéséhez szükséges (pl. számviteli törvény szerinti adatmegőrzés).
                </li>
                <li>
                  <strong>f) Jogos érdek:</strong> Az adatkezelés az adatkezelő jogos érdekeinek érvényesítéséhez
                  szükséges (pl. csalás megelőzése, szolgáltatás fejlesztése).
                </li>
              </ul>
            </section>

            {/* 6. Adatkezelés időtartama */}
            <section className="mb-12">
              <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mt-12 mb-4">
                6. Az adatkezelés időtartama
              </h2>
              <div className="overflow-x-auto">
                <table className="min-w-full border border-gray-200 rounded-lg overflow-hidden">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Adatkategória</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Megőrzési idő</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    <tr>
                      <td className="px-4 py-3 text-sm text-gray-600">Regisztrációs adatok</td>
                      <td className="px-4 py-3 text-sm text-gray-600">A felhasználói fiók törléséig</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-sm text-gray-600">Számlázási adatok</td>
                      <td className="px-4 py-3 text-sm text-gray-600">8 év (számviteli törvény alapján)</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-sm text-gray-600">Tanulási tevékenység</td>
                      <td className="px-4 py-3 text-sm text-gray-600">A felhasználói fiók törléséig</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-sm text-gray-600">Technikai adatok (logok)</td>
                      <td className="px-4 py-3 text-sm text-gray-600">90 nap</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-sm text-gray-600">Hírlevél feliratkozás</td>
                      <td className="px-4 py-3 text-sm text-gray-600">Leiratkozásig</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-gray-600 leading-relaxed mt-4">
                Az adatmegőrzési idő lejártát követően a személyes adatok véglegesen törlésre kerülnek.
              </p>
            </section>

            {/* 7. Adattovábbítás */}
            <section className="mb-12">
              <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mt-12 mb-4">
                7. Adattovábbítás harmadik feleknek
              </h2>
              <p className="text-gray-600 leading-relaxed mb-6">
                A DMA ponthu Kft. az alábbi adatfeldolgozóknak továbbíthat személyes adatokat a szolgáltatás
                nyújtása érdekében:
              </p>

              <h3 className="text-lg font-medium text-gray-900 mt-6 mb-2">7.1 Fizetési szolgáltató</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-600 mb-4">
                <li><strong>Stripe, Inc.</strong> (USA) - Online fizetések feldolgozása</li>
                <li>Továbbított adatok: név, e-mail, fizetési kártyaadatok</li>
                <li>Adatvédelmi tájékoztató: <a href="https://stripe.com/privacy" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">stripe.com/privacy</a></li>
              </ul>

              <h3 className="text-lg font-medium text-gray-900 mt-6 mb-2">7.2 E-mail szolgáltató</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-600 mb-4">
                <li><strong>SendGrid (Twilio Inc.)</strong> (USA) - E-mail küldés</li>
                <li>Továbbított adatok: név, e-mail cím</li>
                <li>Adatvédelmi tájékoztató: <a href="https://www.twilio.com/legal/privacy" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">twilio.com/legal/privacy</a></li>
              </ul>

              <h3 className="text-lg font-medium text-gray-900 mt-6 mb-2">7.3 Felhőszolgáltató</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-600 mb-4">
                <li><strong>Google Cloud Platform / Firebase</strong> (USA/EU) - Adattárolás, hitelesítés</li>
                <li>Továbbított adatok: minden felhasználói adat</li>
                <li>Adatvédelmi tájékoztató: <a href="https://cloud.google.com/privacy" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">cloud.google.com/privacy</a></li>
              </ul>

              <h3 className="text-lg font-medium text-gray-900 mt-6 mb-2">7.4 Számlázási szolgáltató</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-600 mb-4">
                <li><strong>Szamlazz.hu (KBOSS.hu Kft.)</strong> (Magyarország) - Elektronikus számlázás</li>
                <li>Továbbított adatok: számlázási név, cím, adószám</li>
                <li>Adatvédelmi tájékoztató: <a href="https://www.szamlazz.hu/adatvedelem" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">szamlazz.hu/adatvedelem</a></li>
              </ul>

              <h3 className="text-lg font-medium text-gray-900 mt-6 mb-2">7.5 Tárhelyszolgáltató</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-600 mb-4">
                <li><strong>Cweb.hu Informatikai Kft.</strong></li>
                <li>Cím: 1173 Budapest, Borsó utca 12-32.</li>
              </ul>

              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mt-6">
                <p className="text-gray-700">
                  <strong>Megjegyzés az USA-ba történő adattovábbításról:</strong> Az USA-ba történő adattovábbítás
                  az EU-U.S. Data Privacy Framework alapján történik, amely megfelelő szintű védelmet biztosít
                  az érintettek személyes adatai számára.
                </p>
              </div>
            </section>

            {/* 8. Cookie-k */}
            <section className="mb-12">
              <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mt-12 mb-4">
                8. Cookie-k (sütik) kezelése
              </h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                A weboldalunk cookie-kat (sütiket) használ a felhasználói élmény javítása és a szolgáltatás
                működtetése érdekében.
              </p>

              <h3 className="text-lg font-medium text-gray-900 mt-6 mb-2">8.1 Feltétlenül szükséges cookie-k</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                Ezek a cookie-k elengedhetetlenek a weboldal működéséhez. Ide tartoznak a bejelentkezési
                állapot megőrzése és a biztonsági funkciók. Nem igényelnek hozzájárulást.
              </p>

              <h3 className="text-lg font-medium text-gray-900 mt-6 mb-2">8.2 Funkcionális cookie-k</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                Ezek a cookie-k lehetővé teszik, hogy a weboldal megjegyezze a felhasználó választásait
                (pl. nyelvi beállítások, videó lejátszási pozíció).
              </p>

              <h3 className="text-lg font-medium text-gray-900 mt-6 mb-2">8.3 Analitikai cookie-k</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                Ezek a cookie-k segítenek megérteni, hogyan használják a látogatók a weboldalt,
                anonimizált statisztikák gyűjtésével.
              </p>

              <p className="text-gray-600 leading-relaxed">
                A cookie-k kezeléséről részletesebben a <Link href="/cookies" className="text-blue-600 hover:underline">Cookie szabályzatunkban</Link> olvashat.
              </p>
            </section>

            {/* 9. Érintettek jogai */}
            <section className="mb-12">
              <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mt-12 mb-4">
                9. Az érintettek jogai
              </h2>
              <p className="text-gray-600 leading-relaxed mb-6">
                A GDPR alapján Önnek az alábbi jogai vannak személyes adatai kezelésével kapcsolatban:
              </p>

              <h3 className="text-lg font-medium text-gray-900 mt-6 mb-2">9.1 Hozzáférés joga (GDPR 15. cikk)</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                Ön jogosult tájékoztatást kapni arról, hogy személyes adatainak kezelése folyamatban van-e,
                és ha igen, jogosult hozzáférni a személyes adatokhoz és az adatkezeléssel kapcsolatos információkhoz.
              </p>

              <h3 className="text-lg font-medium text-gray-900 mt-6 mb-2">9.2 Helyesbítés joga (GDPR 16. cikk)</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                Ön jogosult kérni a pontatlan személyes adatok helyesbítését és a hiányos adatok kiegészítését.
              </p>

              <h3 className="text-lg font-medium text-gray-900 mt-6 mb-2">9.3 Törléshez való jog (GDPR 17. cikk)</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                Ön jogosult kérni személyes adatai törlését ("elfeledtetéshez való jog"), ha az adatkezelés
                célja megszűnt, vagy visszavonta hozzájárulását és nincs más jogalap az adatkezelésre.
              </p>

              <h3 className="text-lg font-medium text-gray-900 mt-6 mb-2">9.4 Adatkezelés korlátozásának joga (GDPR 18. cikk)</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                Ön jogosult kérni az adatkezelés korlátozását, ha vitatja az adatok pontosságát,
                vagy az adatkezelés jogellenes, de Ön nem kéri a törlést.
              </p>

              <h3 className="text-lg font-medium text-gray-900 mt-6 mb-2">9.5 Adathordozhatósághoz való jog (GDPR 20. cikk)</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                Ön jogosult az Önre vonatkozó személyes adatokat tagolt, széles körben használt,
                géppel olvasható formátumban megkapni, és ezeket az adatokat egy másik adatkezelőnek továbbítani.
              </p>

              <h3 className="text-lg font-medium text-gray-900 mt-6 mb-2">9.6 Tiltakozás joga (GDPR 21. cikk)</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                Ön jogosult tiltakozni a személyes adatainak jogos érdeken alapuló kezelése ellen.
                Direkt marketing céljára történő adatkezelés esetén a tiltakozási jog korlátozás nélkül gyakorolható.
              </p>

              <h3 className="text-lg font-medium text-gray-900 mt-6 mb-2">9.7 Hozzájárulás visszavonása</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                Ha az adatkezelés az Ön hozzájárulásán alapul, Ön jogosult a hozzájárulást bármikor visszavonni.
                A visszavonás nem érinti a visszavonás előtti adatkezelés jogszerűségét.
              </p>

              <div className="bg-gray-50 rounded-lg p-6 mt-6">
                <p className="text-gray-700 font-medium mb-2">Jogai gyakorlásához forduljon hozzánk:</p>
                <ul className="space-y-1 text-gray-600">
                  <li>E-mail: <a href="mailto:info@dma.hu" className="text-blue-600 hover:underline">info@dma.hu</a></li>
                  <li>Postacím: 3527 Miskolc, Bajcsy-Zsilinszky Endre utca 17. VI. em.</li>
                </ul>
                <p className="text-gray-600 mt-4">
                  Kérésére 30 napon belül válaszolunk. Összetett kérés esetén ez a határidő további 60 nappal meghosszabbítható.
                </p>
              </div>
            </section>

            {/* 10. Jogérvényesítés */}
            <section className="mb-12">
              <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mt-12 mb-4">
                10. Jogorvoslati lehetőségek
              </h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                Ha úgy érzi, hogy személyes adatai kezelése során jogait megsértettük, az alábbi lehetőségek állnak rendelkezésére:
              </p>

              <h3 className="text-lg font-medium text-gray-900 mt-6 mb-2">10.1 Panasz benyújtása az adatkezelőhöz</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                Első lépésként javasoljuk, hogy közvetlenül hozzánk forduljon az <a href="mailto:info@dma.hu" className="text-blue-600 hover:underline">info@dma.hu</a> e-mail címen.
              </p>

              <h3 className="text-lg font-medium text-gray-900 mt-6 mb-2">10.2 Panasz a felügyeleti hatóságnál</h3>
              <div className="bg-gray-50 rounded-lg p-6 mb-4">
                <p className="text-gray-700 font-medium mb-2">Nemzeti Adatvédelmi és Információszabadság Hatóság (NAIH)</p>
                <ul className="space-y-1 text-gray-600">
                  <li><strong>Cím:</strong> 1055 Budapest, Falk Miksa utca 9-11.</li>
                  <li><strong>Postacím:</strong> 1363 Budapest, Pf.: 9.</li>
                  <li><strong>Telefon:</strong> +36 1 391 1400</li>
                  <li><strong>E-mail:</strong> <a href="mailto:ugyfelszolgalat@naih.hu" className="text-blue-600 hover:underline">ugyfelszolgalat@naih.hu</a></li>
                  <li><strong>Weboldal:</strong> <a href="https://www.naih.hu" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">www.naih.hu</a></li>
                </ul>
              </div>

              <h3 className="text-lg font-medium text-gray-900 mt-6 mb-2">10.3 Bírósági jogorvoslat</h3>
              <p className="text-gray-600 leading-relaxed">
                Az érintett a jogainak megsértése esetén bírósághoz fordulhat. A per elbírálása a törvényszék
                hatáskörébe tartozik. A per az érintett választása szerint a lakóhelye vagy tartózkodási helye
                szerinti törvényszék előtt is megindítható.
              </p>
            </section>

            {/* 11. Tájékoztató módosítása */}
            <section className="mb-12">
              <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mt-12 mb-4">
                11. A tájékoztató módosítása
              </h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                A DMA ponthu Kft. fenntartja a jogot, hogy jelen adatvédelmi tájékoztatót bármikor módosítsa.
                A módosításokról a weboldalon keresztül értesítjük a felhasználókat.
              </p>
              <p className="text-gray-600 leading-relaxed mb-4">
                A tájékoztató módosítása esetén a módosított verzió a közzététel napján lép hatályba.
                A szolgáltatás további használatával Ön elfogadja a módosított feltételeket.
              </p>
              <p className="text-gray-600 leading-relaxed">
                Lényeges változás esetén e-mailben is értesítjük regisztrált felhasználóinkat.
              </p>
            </section>

            {/* Footer info */}
            <section className="mt-16 pt-8 border-t border-gray-200">
              <p className="text-gray-500 text-sm">
                Jelen adatvédelmi tájékoztató 2025. január 1-től hatályos.
              </p>
              <p className="text-gray-500 text-sm mt-2">
                DMA ponthu Kft. | 3527 Miskolc, Bajcsy-Zsilinszky Endre utca 17. VI. em.
              </p>
            </section>

          </div>
        </div>
      </div>
    </div>
  );
}
