import React from 'react'
import { Container } from '@/components/layout/container'

// Általános segédfüggvény a fejléc címére
const Heading: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h2 className="heading-2 text-primary text-center mb-8">{children}</h2>
)

// 1. Hero szakasz
export const HeroSectionPlaceholder = () => (
  <section id="hero" className="py-24 bg-gradient-to-br from-primary/10 to-purple-50">
    <Container className="text-center">
      <Heading>[Hős szakasz]</Heading>
      <p className="text-muted max-w-2xl mx-auto">Ide kerül majd a fő értékajánlat, CTA és tartalom meta.</p>
    </Container>
  </section>
)

// 2. Tanulási eredmények
export const OutcomesSectionPlaceholder = () => (
  <section id="eredmenyek" className="py-24 bg-white">
    <Container className="text-center">
      <Heading>Mit fogsz elsajátítani?</Heading>
      <p className="text-muted">[Tanulási eredmények & bullet list]</p>
    </Container>
  </section>
)

// 3. Célcsoport
export const AudienceSectionPlaceholder = () => (
  <section id="celcsoport" className="py-24 bg-gray-50">
    <Container className="text-center">
      <Heading>Neked ajánljuk</Heading>
      <p className="text-muted">[Igen / Nem listák]</p>
    </Container>
  </section>
)

// 4. Bemutatkozó videó
export const VideoSectionPlaceholder = () => (
  <section id="bemutatkozo-video" className="py-24 bg-white">
    <Container className="text-center">
      <Heading>Tartalomról röviden</Heading>
      <div className="aspect-video bg-gray-200 flex items-center justify-center rounded-lg">
        <span className="text-gray-500">[Videó lejátszó]</span>
      </div>
    </Container>
  </section>
)

// 5. Tanterv
export const CurriculumSectionPlaceholder = () => (
  <section id="tanterv" className="py-24 bg-white">
    <Container>
      <Heading>Tanterv áttekintése</Heading>
      <p className="text-muted text-center">[Modulok & leckék]</p>
    </Container>
  </section>
)

// 6. Oktató bemutatása
export const InstructorSectionPlaceholder = () => (
  <section id="oktato" className="py-24 bg-gray-50">
    <Container className="text-center">
      <Heading>Találkozz az oktatóval</Heading>
      <p className="text-muted">[Oktató bemutatása]</p>
    </Container>
  </section>
)

// 7. Hallgatói vélemények
export const TestimonialsSectionPlaceholder = () => (
  <section id="velemenyek" className="py-24 bg-white">
    <Container className="text-center">
      <Heading>Hallgatói vélemények</Heading>
      <p className="text-muted">[Testimonial karusszel]</p>
    </Container>
  </section>
)

// 8. Vállalati ajánlat
export const B2BSectionPlaceholder = () => (
  <section id="vallalati-elonyok" className="py-24 bg-gradient-to-r from-emerald-50 to-teal-50">
    <Container className="text-center">
      <Heading>Tanuljatok csapatban</Heading>
      <p className="text-muted">[B2B ajánlat & kapcsolatfelvétel]</p>
    </Container>
  </section>
)

// 9. Árazás
export const PricingSectionPlaceholder = () => (
  <section id="arazas" className="py-24 bg-white">
    <Container className="text-center">
      <Heading>Ár & csomagok</Heading>
      <p className="text-muted">[Ár-összehasonlító táblázat]</p>
    </Container>
  </section>
)

// 10. Gyakori kérdések
export const FAQSectionPlaceholder = () => (
  <section id="gyik" className="py-24 bg-gray-50">
    <Container>
      <Heading>Gyakori kérdések</Heading>
      <p className="text-muted text-center">[Összehajtható Q&A]</p>
    </Container>
  </section>
)

// 11. Kapcsolódó tartalmak
export const RelatedCoursesSectionPlaceholder = () => (
  <section id="kapcsolodo-tartalmak" className="py-24 bg-white">
    <Container>
      <Heading>Kapcsolódó tartalmak</Heading>
      <p className="text-muted text-center">[Carousel tartalomkártyákkal]</p>
    </Container>
  </section>
)

// 12. Lábléc CTA
export const FooterCTASectionPlaceholder = () => (
  <section id="lablec-cta" className="py-32 bg-primary text-white text-center">
    <Container>
      <h2 className="heading-2 mb-6">Készen állsz a fejlődésre?</h2>
      <button className="mt-4 px-8 py-3 bg-white text-primary font-semibold rounded-full shadow hover:shadow-lg transition">
        Csatlakozom
      </button>
    </Container>
  </section>
)

// Összesített export a kényelemért
export const CourseDetailSkeletonSections = {
  HeroSectionPlaceholder,
  OutcomesSectionPlaceholder,
  AudienceSectionPlaceholder,
  VideoSectionPlaceholder,
  CurriculumSectionPlaceholder,
  InstructorSectionPlaceholder,
  TestimonialsSectionPlaceholder,
  B2BSectionPlaceholder,
  PricingSectionPlaceholder,
  FAQSectionPlaceholder,
  RelatedCoursesSectionPlaceholder,
  FooterCTASectionPlaceholder,
} 