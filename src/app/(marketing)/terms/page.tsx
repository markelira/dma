import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Általános Szerződési Feltételek (ÁSZF) | DMA',
  description: 'A DMA ponthu Kft. általános szerződési feltételei az online oktatási szolgáltatás igénybevételéhez.',
};

export default function TermsPage() {
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
              Általános Szerződési Feltételek (ÁSZF)
            </h1>
            <p className="text-gray-500">
              Utolsó módosítás: 2025. január 1.
            </p>
          </div>

          {/* Content */}
          <div className="prose prose-gray max-w-none">

            {/* 1. Szolgáltató adatai */}
            <section className="mb-12">
              <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mt-12 mb-4">
                1. A Szolgáltató adatai
              </h2>
              <div className="bg-gray-50 rounded-lg p-6">
                <ul className="space-y-2 text-gray-600">
                  <li><strong>Cégnév:</strong> DMA ponthu Kft.</li>
                  <li><strong>Székhely:</strong> 3527 Miskolc, Bajcsy-Zsilinszky Endre utca 17. VI. em.</li>
                  <li><strong>Cégjegyzékszám:</strong> 05 09 012283</li>
                  <li><strong>Nyilvántartó bíróság:</strong> Miskolci Törvényszék Cégbírósága</li>
                  <li><strong>Adószám:</strong> 13512989-2-05</li>
                  <li><strong>Képviselő:</strong> Dienes Martin (ügyvezető)</li>
                  <li><strong>E-mail:</strong> <a href="mailto:info@dma.hu" className="text-blue-600 hover:underline">info@dma.hu</a></li>
                  <li><strong>Telefon:</strong> <a href="tel:+36704218100" className="text-blue-600 hover:underline">+36 70 421 8100</a></li>
                  <li><strong>Weboldal:</strong> <a href="https://dma.hu" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">https://dma.hu</a>, <a href="https://my.dma.hu" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">https://my.dma.hu</a></li>
                  <li><strong>Számlavezető bank:</strong> Erste Bank</li>
                  <li><strong>Bankszámlaszám:</strong> 11600006-00000002-01415845</li>
                  <li><strong>Tárhelyszolgáltató:</strong> Cweb.hu Informatikai Kft. (1173 Budapest, Borsó utca 12-32.)</li>
                </ul>
              </div>
            </section>

            {/* 2. Általános rendelkezések */}
            <section className="mb-12">
              <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mt-12 mb-4">
                2. Általános rendelkezések, hatály
              </h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                Jelen Általános Szerződési Feltételek (a továbbiakban: ÁSZF) a DMA ponthu Kft.
                (a továbbiakban: Szolgáltató) által üzemeltetett dma.hu és my.dma.hu weboldalakon
                (a továbbiakban: Weboldal) elérhető online oktatási szolgáltatások igénybevételének
                feltételeit szabályozzák.
              </p>
              <p className="text-gray-600 leading-relaxed mb-4">
                Az ÁSZF hatálya kiterjed minden olyan természetes és jogi személyre, valamint jogi
                személyiséggel nem rendelkező szervezetre, aki a Weboldalon regisztrál és/vagy a
                Szolgáltató szolgáltatásait igénybe veszi (a továbbiakban: Felhasználó).
              </p>
              <p className="text-gray-600 leading-relaxed mb-4">
                A regisztráció és a szolgáltatás igénybevétele jelen ÁSZF elfogadását jelenti.
                A Felhasználó kijelenti, hogy az ÁSZF-et megismerte és annak rendelkezéseit magára
                nézve kötelezőnek elfogadja.
              </p>
              <p className="text-gray-600 leading-relaxed">
                <strong>Vonatkozó jogszabályok:</strong>
              </p>
              <ul className="list-disc list-inside space-y-1 text-gray-600 mt-2">
                <li>2013. évi V. törvény (Polgári Törvénykönyv)</li>
                <li>2001. évi CVIII. törvény az elektronikus kereskedelmi szolgáltatásokról</li>
                <li>45/2014. (II. 26.) Korm. rendelet a fogyasztó és a vállalkozás közötti szerződések részletes szabályairól</li>
                <li>1997. évi CLV. törvény a fogyasztóvédelemről</li>
                <li>Az Európai Parlament és a Tanács (EU) 2016/679 rendelete (GDPR)</li>
              </ul>
            </section>

            {/* 3. Fogalommeghatározások */}
            <section className="mb-12">
              <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mt-12 mb-4">
                3. Fogalommeghatározások
              </h2>
              <ul className="list-disc list-inside space-y-3 text-gray-600">
                <li><strong>Szolgáltató:</strong> DMA ponthu Kft.</li>
                <li><strong>Felhasználó:</strong> A Weboldalon regisztráló és/vagy szolgáltatást igénybe vevő személy.</li>
                <li><strong>Fogyasztó:</strong> A szakmája, önálló foglalkozása vagy üzleti tevékenysége körén kívül eljáró természetes személy.</li>
                <li><strong>Szolgáltatás:</strong> A Szolgáltató által nyújtott online oktatási tartalom és kapcsolódó szolgáltatások.</li>
                <li><strong>Digitális tartalom:</strong> Digitális formában előállított és szolgáltatott adat (videók, szöveges anyagok, prezentációk, tesztek).</li>
                <li><strong>Előfizetés:</strong> A Szolgáltatás meghatározott időtartamra szóló, ismétlődő díjfizetés ellenében történő igénybevétele.</li>
                <li><strong>Kurzus:</strong> Egy meghatározott témakörben összeállított oktatási anyag, amely modulokból és leckékből áll.</li>
                <li><strong>Tanúsítvány:</strong> A kurzus sikeres elvégzését igazoló elektronikus dokumentum.</li>
              </ul>
            </section>

            {/* 4. A szolgáltatás leírása */}
            <section className="mb-12">
              <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mt-12 mb-4">
                4. A Szolgáltatás leírása
              </h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                A Szolgáltató online oktatási platformot üzemeltet, amely az alábbi szolgáltatásokat nyújtja:
              </p>

              <h3 className="text-lg font-medium text-gray-900 mt-6 mb-2">4.1 Online kurzusok</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-600 mb-4">
                <li>Videó alapú oktatóanyagok</li>
                <li>Írásos tananyagok és prezentációk</li>
                <li>Interaktív tesztek és kvízek</li>
                <li>Letölthető segédanyagok</li>
              </ul>

              <h3 className="text-lg font-medium text-gray-900 mt-6 mb-2">4.2 Előfizetéses modell</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                A Szolgáltatás előfizetéses modellben érhető el. Az előfizetés időtartama és díja
                az aktuális árlista szerint alakul, amely a Weboldalon megtekinthető.
              </p>

              <h3 className="text-lg font-medium text-gray-900 mt-6 mb-2">4.3 Tanúsítványok</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                A kurzusok sikeres elvégzése után a Felhasználó elektronikus tanúsítványt kaphat,
                amely igazolja a megszerzett tudást.
              </p>

              <h3 className="text-lg font-medium text-gray-900 mt-6 mb-2">4.4 A Szolgáltatás elérhetősége</h3>
              <p className="text-gray-600 leading-relaxed">
                A Szolgáltató törekszik a Szolgáltatás folyamatos elérhetőségére, de nem garantálja
                a megszakításmentes működést. Karbantartás vagy technikai problémák esetén a
                Szolgáltatás átmenetileg elérhetetlenné válhat.
              </p>
            </section>

            {/* 5. Regisztráció és szerződéskötés */}
            <section className="mb-12">
              <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mt-12 mb-4">
                5. Regisztráció és szerződéskötés
              </h2>

              <h3 className="text-lg font-medium text-gray-900 mt-6 mb-2">5.1 Regisztráció</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                A Szolgáltatás igénybevételéhez regisztráció szükséges. A regisztráció során a
                Felhasználónak meg kell adnia nevét, e-mail címét, és jelszót kell választania.
              </p>
              <p className="text-gray-600 leading-relaxed mb-4">
                A Felhasználó köteles valós adatokat megadni. A hamis adatok megadásából eredő
                károkért a Szolgáltató nem vállal felelősséget.
              </p>

              <h3 className="text-lg font-medium text-gray-900 mt-6 mb-2">5.2 A szerződés létrejötte</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                A Szolgáltató és a Felhasználó között a szerződés az előfizetés megvásárlásával
                és a fizetés sikeres teljesítésével jön létre. A szerződés elektronikus úton
                kötött, magyar nyelvű szerződésnek minősül.
              </p>
              <p className="text-gray-600 leading-relaxed mb-4">
                A Szolgáltató a sikeres fizetést követően e-mailben visszaigazolást küld a
                Felhasználónak, amely tartalmazza a szerződés főbb feltételeit.
              </p>

              <h3 className="text-lg font-medium text-gray-900 mt-6 mb-2">5.3 Korhatár</h3>
              <p className="text-gray-600 leading-relaxed">
                A Szolgáltatás igénybevételéhez a Felhasználónak betöltött 16. életévvel kell
                rendelkeznie. 16 év alatti személyek csak szülői/gondviselői hozzájárulással
                regisztrálhatnak.
              </p>
            </section>

            {/* 6. Árak és fizetési feltételek */}
            <section className="mb-12">
              <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mt-12 mb-4">
                6. Árak és fizetési feltételek
              </h2>

              <h3 className="text-lg font-medium text-gray-900 mt-6 mb-2">6.1 Árak</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                A Weboldalon feltüntetett árak magyar forintban (HUF) értendők és tartalmazzák
                az általános forgalmi adót (ÁFA). Az aktuális árakat a Weboldal árlistája tartalmazza.
              </p>
              <p className="text-gray-600 leading-relaxed mb-4">
                A Szolgáltató fenntartja a jogot az árak módosítására. Az árváltozás a már megkötött
                szerződéseket nem érinti.
              </p>

              <h3 className="text-lg font-medium text-gray-900 mt-6 mb-2">6.2 Fizetési módok</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                A fizetés az alábbi módokon lehetséges:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-600 mb-4">
                <li>Bankkártyás fizetés (Visa, Mastercard) a Stripe fizetési rendszeren keresztül</li>
                <li>Apple Pay és Google Pay</li>
              </ul>
              <p className="text-gray-600 leading-relaxed mb-4">
                A bankkártyás fizetés biztonságos, titkosított csatornán keresztül történik.
                A Szolgáltató nem tárolja a bankkártya adatokat.
              </p>

              <h3 className="text-lg font-medium text-gray-900 mt-6 mb-2">6.3 Előfizetés megújítása</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                Az előfizetés automatikusan megújul az előfizetési időszak végén, kivéve, ha a
                Felhasználó az előfizetési időszak vége előtt lemondja. A lemondás a
                felhasználói fiók beállításainál lehetséges.
              </p>

              <h3 className="text-lg font-medium text-gray-900 mt-6 mb-2">6.4 Számlázás</h3>
              <p className="text-gray-600 leading-relaxed">
                A Szolgáltató minden sikeres fizetésről elektronikus számlát állít ki, amelyet
                e-mailben küld meg a Felhasználónak. A számla a felhasználói fiókban is elérhető.
              </p>
            </section>

            {/* 7. Elállási jog */}
            <section className="mb-12">
              <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mt-12 mb-4">
                7. Elállási jog
              </h2>

              <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-6">
                <p className="text-gray-700 font-medium">
                  Fontos tájékoztatás a digitális tartalmakra vonatkozó elállási jogról
                </p>
              </div>

              <h3 className="text-lg font-medium text-gray-900 mt-6 mb-2">7.1 Általános elállási jog</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                A 45/2014. (II. 26.) Korm. rendelet értelmében a Fogyasztónak minősülő Felhasználó
                a szerződéstől a szerződés megkötésétől számított 14 napon belül indokolás nélkül
                elállhat.
              </p>

              <h3 className="text-lg font-medium text-gray-900 mt-6 mb-2">7.2 Elállási jog korlátozása digitális tartalom esetén</h3>
              <div className="bg-gray-50 rounded-lg p-6 mb-4">
                <p className="text-gray-700 mb-4">
                  A 45/2014. (II. 26.) Korm. rendelet 29. § (1) bekezdés m) pontja alapján a Fogyasztó
                  <strong> nem gyakorolhatja az elállási jogát</strong> a nem tárgyi adathordozón
                  nyújtott digitális tartalom tekintetében, ha:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-600">
                  <li>a Szolgáltató a Fogyasztó kifejezett, előzetes beleegyezésével kezdte meg a teljesítést, és</li>
                  <li>a Fogyasztó tudomásul vette, hogy a teljesítés megkezdését követően elveszíti elállási jogát.</li>
                </ul>
              </div>
              <p className="text-gray-600 leading-relaxed mb-4">
                A Felhasználó a regisztráció és az előfizetés megvásárlása során kifejezetten
                hozzájárul ahhoz, hogy a Szolgáltató azonnal megkezdje a digitális tartalom
                szolgáltatását, és tudomásul veszi, hogy ezzel elveszíti elállási jogát.
              </p>

              <h3 className="text-lg font-medium text-gray-900 mt-6 mb-2">7.3 Az elállási jog gyakorlása</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                Amennyiben az elállási jog fennáll (a Felhasználó nem kezdte meg a digitális
                tartalom használatát), az elállási szándékot egyértelmű nyilatkozattal kell
                közölni az alábbi elérhetőségek egyikén:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-600 mb-4">
                <li>E-mail: <a href="mailto:info@dma.hu" className="text-blue-600 hover:underline">info@dma.hu</a></li>
                <li>Postacím: 3527 Miskolc, Bajcsy-Zsilinszky Endre utca 17. VI. em.</li>
              </ul>

              <h3 className="text-lg font-medium text-gray-900 mt-6 mb-2">7.4 Elállás esetén a Szolgáltató kötelezettségei</h3>
              <p className="text-gray-600 leading-relaxed">
                Érvényes elállás esetén a Szolgáltató haladéktalanul, de legkésőbb 14 napon belül
                visszatéríti a Felhasználó által fizetett összeget, ugyanazon fizetési módon,
                amelyet a Felhasználó az eredeti ügylet során használt.
              </p>
            </section>

            {/* 8. Szolgáltatás használatának feltételei */}
            <section className="mb-12">
              <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mt-12 mb-4">
                8. A Szolgáltatás használatának feltételei
              </h2>

              <h3 className="text-lg font-medium text-gray-900 mt-6 mb-2">8.1 Felhasználói kötelezettségek</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                A Felhasználó köteles:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-600 mb-4">
                <li>Valós és naprakész adatokat megadni a regisztráció során</li>
                <li>Jelszavát titokban tartani és biztonságosan kezelni</li>
                <li>A Szolgáltatást rendeltetésszerűen használni</li>
                <li>Más Felhasználók jogait és a Szolgáltató érdekeit tiszteletben tartani</li>
              </ul>

              <h3 className="text-lg font-medium text-gray-900 mt-6 mb-2">8.2 Tiltott tevékenységek</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                A Felhasználó számára tilos:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-600 mb-4">
                <li>A tartalmak letöltése, másolása, terjesztése vagy értékesítése</li>
                <li>Fiók megosztása más személyekkel</li>
                <li>A Weboldal biztonsági rendszereinek megkerülése vagy feltörése</li>
                <li>Automatizált eszközök (botok, scriptek) használata</li>
                <li>Más Felhasználók adatainak jogosulatlan megszerzése</li>
                <li>Jogellenes, sértő vagy káros tartalom feltöltése</li>
              </ul>

              <h3 className="text-lg font-medium text-gray-900 mt-6 mb-2">8.3 Szabályszegés következményei</h3>
              <p className="text-gray-600 leading-relaxed">
                A jelen ÁSZF megsértése esetén a Szolgáltató jogosult a Felhasználó fiókját
                felfüggeszteni vagy véglegesen törölni, díjvisszatérítés nélkül.
              </p>
            </section>

            {/* 9. Szellemi tulajdon */}
            <section className="mb-12">
              <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mt-12 mb-4">
                9. Szellemi tulajdon
              </h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                A Weboldalon megjelenő valamennyi tartalom (szövegek, képek, videók, hanganyagok,
                grafikai elemek, logók, szoftverek) a Szolgáltató vagy a jogosult harmadik felek
                szellemi tulajdonát képezik.
              </p>
              <p className="text-gray-600 leading-relaxed mb-4">
                Az előfizetés a tartalmak személyes, nem kereskedelmi célú megtekintésére jogosít.
                A tartalmak letöltése, másolása, módosítása, terjesztése, nyilvános előadása vagy
                bármely más felhasználása a Szolgáltató előzetes írásbeli engedélye nélkül tilos.
              </p>
              <p className="text-gray-600 leading-relaxed">
                A szellemi tulajdonjogok megsértése polgári és büntetőjogi következményekkel járhat.
              </p>
            </section>

            {/* 10. Felelősség korlátozása */}
            <section className="mb-12">
              <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mt-12 mb-4">
                10. Felelősség korlátozása
              </h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                A Szolgáltató mindent megtesz a Szolgáltatás megfelelő minőségéért, de nem garantálja:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-600 mb-4">
                <li>A Szolgáltatás megszakításmentes, hibamentes működését</li>
                <li>A tartalmak teljességét, pontosságát vagy aktualitását</li>
                <li>Meghatározott tanulási eredmények elérését</li>
              </ul>
              <p className="text-gray-600 leading-relaxed mb-4">
                A Szolgáltató nem felel:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-600 mb-4">
                <li>A Felhasználó internetkapcsolatának vagy eszközének hibáiért</li>
                <li>Vis maior eseményekből eredő károkért</li>
                <li>A Felhasználó jelszavának illetéktelen felhasználásából eredő károkért</li>
                <li>Közvetett vagy következményes károkért</li>
              </ul>
              <p className="text-gray-600 leading-relaxed">
                A Szolgáltató felelőssége a Fogyasztóval szemben a vonatkozó jogszabályok szerint
                nem korlátozható. A fenti korlátozások a jogszabályok által megengedett mértékben
                alkalmazandók.
              </p>
            </section>

            {/* 11. Szerződés megszűnése */}
            <section className="mb-12">
              <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mt-12 mb-4">
                11. A szerződés megszűnése, felmondás
              </h2>

              <h3 className="text-lg font-medium text-gray-900 mt-6 mb-2">11.1 Előfizetés lemondása</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                A Felhasználó az előfizetését bármikor lemondhatja a felhasználói fiók beállításainál.
                A lemondás az aktuális előfizetési időszak végéig nem érinti a hozzáférést.
              </p>

              <h3 className="text-lg font-medium text-gray-900 mt-6 mb-2">11.2 Fiók törlése</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                A Felhasználó kérheti fiókja törlését az <a href="mailto:info@dma.hu" className="text-blue-600 hover:underline">info@dma.hu</a> címen.
                A törlés végleges és visszavonhatatlan.
              </p>

              <h3 className="text-lg font-medium text-gray-900 mt-6 mb-2">11.3 Szolgáltató általi felmondás</h3>
              <p className="text-gray-600 leading-relaxed">
                A Szolgáltató jogosult azonnali hatállyal felmondani a szerződést, ha a Felhasználó
                súlyosan megsérti jelen ÁSZF rendelkezéseit.
              </p>
            </section>

            {/* 12. Panaszkezelés */}
            <section className="mb-12">
              <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mt-12 mb-4">
                12. Panaszkezelés
              </h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                A Felhasználó a Szolgáltatással kapcsolatos panaszait az alábbi elérhetőségeken teheti meg:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-600 mb-4">
                <li>E-mail: <a href="mailto:info@dma.hu" className="text-blue-600 hover:underline">info@dma.hu</a></li>
                <li>Telefon: <a href="tel:+36704218100" className="text-blue-600 hover:underline">+36 70 421 8100</a></li>
                <li>Postacím: 3527 Miskolc, Bajcsy-Zsilinszky Endre utca 17. VI. em.</li>
              </ul>
              <p className="text-gray-600 leading-relaxed mb-4">
                A Szolgáltató a panaszt a beérkezéstől számított 30 napon belül kivizsgálja és
                írásban válaszol.
              </p>
              <p className="text-gray-600 leading-relaxed">
                Szóbeli panasz esetén a Szolgáltató jegyzőkönyvet vesz fel, amely tartalmazza a
                panasz leírását, a Szolgáltató álláspontját, és a jegyzőkönyvet a Felhasználónak
                átadja/megküldi.
              </p>
            </section>

            {/* 13. Békéltető testület */}
            <section className="mb-12">
              <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mt-12 mb-4">
                13. Békéltető testület
              </h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                Amennyiben a Szolgáltató és a Fogyasztó közötti vitát nem sikerül tárgyalásos úton
                rendezni, a Fogyasztó békéltető testülethez fordulhat.
              </p>
              <div className="bg-gray-50 rounded-lg p-6 mb-4">
                <p className="text-gray-700 font-medium mb-2">Illetékes békéltető testület:</p>
                <ul className="space-y-1 text-gray-600">
                  <li><strong>Borsod-Abaúj-Zemplén Vármegyei Kereskedelmi és Iparkamara mellett működő Békéltető Testület</strong></li>
                  <li><strong>Cím:</strong> 3525 Miskolc, Szentpáli utca 1.</li>
                  <li><strong>Telefon:</strong> +36 46 501 091</li>
                  <li><strong>E-mail:</strong> bekeltetes@bokik.hu</li>
                </ul>
              </div>
              <p className="text-gray-600 leading-relaxed mb-4">
                A békéltető testületek listája és elérhetőségei megtalálhatók a{' '}
                <a href="https://www.bekeltetes.hu" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
                  www.bekeltetes.hu
                </a>{' '}
                oldalon.
              </p>
              <p className="text-gray-600 leading-relaxed">
                A Szolgáltató a békéltető testületi eljárásban együttműködési kötelezettséggel
                rendelkezik.
              </p>
            </section>

            {/* 14. Online vitarendezési platform */}
            <section className="mb-12">
              <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mt-12 mb-4">
                14. Online vitarendezési platform (ODR)
              </h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                Az Európai Bizottság online vitarendezési platformot (ODR platform) üzemeltet,
                amelyen keresztül az online vásárlásokkal kapcsolatos viták rendezhetők.
              </p>
              <div className="bg-gray-50 rounded-lg p-6 mb-4">
                <p className="text-gray-700">
                  <strong>Az ODR platform elérhetősége:</strong>{' '}
                  <a
                    href="https://ec.europa.eu/consumers/odr"
                    className="text-blue-600 hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    https://ec.europa.eu/consumers/odr
                  </a>
                </p>
              </div>
              <p className="text-gray-600 leading-relaxed">
                Az ODR platform használatához a Szolgáltató e-mail címe:{' '}
                <a href="mailto:info@dma.hu" className="text-blue-600 hover:underline">info@dma.hu</a>
              </p>
            </section>

            {/* 15. Alkalmazandó jog */}
            <section className="mb-12">
              <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mt-12 mb-4">
                15. Alkalmazandó jog és jogviták
              </h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                Jelen ÁSZF-re és az annak alapján létrejövő jogviszonyokra a magyar jog az irányadó.
              </p>
              <p className="text-gray-600 leading-relaxed mb-4">
                A Szolgáltató és a Felhasználó közötti jogvitákban - a békéltető testületi
                eljárás sikertelensége esetén - a magyar bíróságok rendelkeznek joghatósággal.
              </p>
              <p className="text-gray-600 leading-relaxed">
                Fogyasztói jogviták esetén a Fogyasztó lakóhelye vagy tartózkodási helye szerint
                illetékes bíróság is eljárhat.
              </p>
            </section>

            {/* 16. ÁSZF módosítása */}
            <section className="mb-12">
              <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mt-12 mb-4">
                16. Az ÁSZF módosítása
              </h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                A Szolgáltató fenntartja a jogot jelen ÁSZF egyoldalú módosítására. A módosítás
                a Weboldalon történő közzététellel lép hatályba.
              </p>
              <p className="text-gray-600 leading-relaxed mb-4">
                A Szolgáltató a lényeges módosításokról e-mailben értesíti a regisztrált Felhasználókat
                a módosítás hatálybalépését megelőzően legalább 15 nappal.
              </p>
              <p className="text-gray-600 leading-relaxed">
                Ha a Felhasználó a módosítás hatálybalépését követően tovább használja a Szolgáltatást,
                azzal elfogadja a módosított ÁSZF-et.
              </p>
            </section>

            {/* 17. Záró rendelkezések */}
            <section className="mb-12">
              <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mt-12 mb-4">
                17. Záró rendelkezések
              </h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                Jelen ÁSZF rendelkezései elválaszthatók egymástól. Ha valamely rendelkezés
                érvénytelennek vagy végrehajthatatlannak bizonyul, az nem érinti a többi
                rendelkezés érvényességét.
              </p>
              <p className="text-gray-600 leading-relaxed mb-4">
                A Szolgáltató valamely jogának vagy igényének nem gyakorlása nem jelenti az
                adott jogról vagy igényről való lemondást.
              </p>
              <p className="text-gray-600 leading-relaxed">
                Jelen ÁSZF a Szolgáltató és a Felhasználó közötti teljes megállapodást tartalmazza
                a Szolgáltatás igénybevételével kapcsolatban, és hatályon kívül helyez minden
                korábbi megállapodást.
              </p>
            </section>

            {/* Footer info */}
            <section className="mt-16 pt-8 border-t border-gray-200">
              <p className="text-gray-500 text-sm">
                Jelen Általános Szerződési Feltételek 2025. január 1-től hatályosak.
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
