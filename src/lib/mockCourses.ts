import { Course } from '@/types';

// Complete mock courses data for development mode
export const mockCourses: Course[] = [
  {
    id: 'TRfv3TEqlIbXEdalMvEq',
    title: 'React Fejlesztés Alapjai', 
    slug: 'react-fejlesztes-alapjai',
    description: 'Tanulj meg React alkalmazásokat fejleszteni a kezdetektől.',
    price: 0,
    originalPrice: 0,
    duration: '8 óra',
    level: 'Kezdő',
    thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400',
    thumbnailUrl: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400',
    instructorName: 'Kiss János',
    instructorImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100',
    instructorTitle: 'Senior Frontend Fejlesztő',
    instructorBio: 'Tapasztalt React fejlesztő több mint 5 év tapasztalattal.',
    instructor: {
      id: 'instructor-1',
      firstName: 'Kiss',
      lastName: 'János',
      email: 'kiss.janos@example.com',
      role: 'INSTRUCTOR',
      profilePictureUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100',
      title: 'Senior Frontend Fejlesztő',
      bio: 'Tapasztalt React fejlesztő több mint 5 év tapasztalattal.'
    },
    category: {
      id: 'cat-1',
      name: 'Programozás',
      slug: 'programozas',
      description: 'Programozási kurzusok'
    },
    modules: [
      {
        id: 'mod-1',
        title: 'React alapok',
        description: 'React alapok és komponensek',
        order: 1,
        status: 'PUBLISHED',
        lessons: [
          { 
            id: 'lesson-1', 
            title: 'Mi a React?',
            content: 'React bevezető lecke',
            type: 'VIDEO',
            order: 1,
            status: 'PUBLISHED',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          { 
            id: 'lesson-2', 
            title: 'Komponensek létrehozása',
            content: 'React komponensek készítése',
            type: 'VIDEO',
            order: 2,
            status: 'PUBLISHED',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ]
      },
      {
        id: 'mod-2', 
        title: 'State management',
        description: 'React state kezelés',
        order: 2,
        status: 'PUBLISHED',
        lessons: [
          { 
            id: 'lesson-3', 
            title: 'useState hook',
            content: 'useState hook használata',
            type: 'VIDEO',
            order: 1,
            status: 'PUBLISHED',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          { 
            id: 'lesson-4', 
            title: 'useEffect hook',
            content: 'useEffect hook használata',
            type: 'VIDEO',
            order: 2,
            status: 'PUBLISHED',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ]
      }
    ],
    reviews: [],
    enrolledCount: 1250,
    reviewCount: 89,
    averageRating: 4.8,
    rating: 4.8,
    totalLessons: 24,
    universityId: 'uni-1',
    status: 'PUBLISHED' as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'course-2',
    title: 'Digital Marketing Stratégiák',
    slug: 'digital-marketing-strategiak', 
    description: 'Hatékony online marketing kampányok tervezése és kivitelezése.',
    price: 24900,
    duration: '6 óra',
    level: 'Középhaladó',
    thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400',
    thumbnailUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400',
    instructorName: 'Nagy Petra',
    instructorImage: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100',
    instructorTitle: 'Marketing Szakértő',
    instructorBio: 'Tapasztalt marketing szakember 8 év tapasztalattal.',
    instructor: {
      id: 'instructor-2',
      firstName: 'Nagy',
      lastName: 'Petra',
      email: 'nagy.petra@example.com',
      role: 'INSTRUCTOR',
      profilePictureUrl: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100',
      title: 'Marketing Szakértő',
      bio: 'Tapasztalt marketing szakember 8 év tapasztalattal.'
    },
    category: {
      id: 'cat-2',
      name: 'Marketing',
      slug: 'marketing',
      description: 'Marketing kurzusok'
    },
    modules: [
      {
        id: 'mod-3',
        title: 'Marketing alapok',
        description: 'Digital marketing alapismeretek',
        order: 1,
        status: 'PUBLISHED',
        lessons: [
          { 
            id: 'lesson-5', 
            title: 'Mi a marketing?',
            content: 'Marketing bevezető',
            type: 'VIDEO',
            order: 1,
            status: 'PUBLISHED',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          { 
            id: 'lesson-6', 
            title: 'Célcsoport meghatározás',
            content: 'Célcsoport elemzés',
            type: 'VIDEO',
            order: 2,
            status: 'PUBLISHED',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ]
      }
    ],
    reviews: [],
    enrolledCount: 890,
    reviewCount: 45,
    averageRating: 4.6,
    rating: 4.6,
    totalLessons: 18,
    universityId: 'uni-2',
    status: 'PUBLISHED' as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'course-3',
    title: 'Data Science Python-nal',
    slug: 'data-science-python-nal',
    description: 'Adatelemzés és gépi tanulás Python programozási nyelvvel.',
    price: 34900,
    originalPrice: 44900,
    duration: '12 óra',
    level: 'Haladó',
    thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400',
    thumbnailUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400',
    instructorName: 'Szabó Márk',
    instructorImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
    instructorTitle: 'Data Scientist',
    instructorBio: 'Adattudománnyal foglalkozó szakértő, aki segít megérteni a Python adatelemzést.',
    instructor: {
      id: 'instructor-3',
      firstName: 'Szabó',
      lastName: 'Márk',
      email: 'szabo.mark@example.com',
      role: 'INSTRUCTOR',
      profilePictureUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
      title: 'Data Scientist',
      bio: 'Adattudománnyal foglalkozó szakértő, aki segít megérteni a Python adatelemzést.'
    },
    category: {
      id: 'cat-3',
      name: 'Adattudomány',
      slug: 'adattudomany',
      description: 'Data Science kurzusok'
    },
    modules: [
      {
        id: 'mod-5',
        title: 'Python alapok adatelemzéshez',
        description: 'Python programozás data science-hez',
        order: 1,
        status: 'PUBLISHED',
        lessons: [
          { 
            id: 'lesson-9', 
            title: 'Python és pandas',
            content: 'Pandas könyvtár használata',
            type: 'VIDEO',
            order: 1,
            status: 'PUBLISHED',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          { 
            id: 'lesson-10', 
            title: 'NumPy használata',
            content: 'NumPy könyvtár alapok',
            type: 'VIDEO',
            order: 2,
            status: 'PUBLISHED',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ]
      },
      {
        id: 'mod-6', 
        title: 'Gépi tanulás alapok',
        description: 'Machine Learning bevezető',
        order: 2,
        status: 'PUBLISHED',
        lessons: [
          { 
            id: 'lesson-11', 
            title: 'Supervised learning',
            content: 'Felügyelt tanulás alapjai',
            type: 'VIDEO',
            order: 1,
            status: 'PUBLISHED',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          { 
            id: 'lesson-12', 
            title: 'Unsupervised learning',
            content: 'Felügyelet nélküli tanulás',
            type: 'VIDEO',
            order: 2,
            status: 'PUBLISHED',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ]
      }
    ],
    reviews: [],
    enrolledCount: 567,
    reviewCount: 34,
    averageRating: 4.9,
    rating: 4.9,
    totalLessons: 36,
    universityId: 'uni-1',
    status: 'PUBLISHED' as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'course-4',
    title: 'UX/UI Design Alapok',
    slug: 'ux-ui-design-alapok',
    description: 'Felhasználóközpontú dizájn és interface tervezés alapjai.',
    price: 27900,
    duration: '9 óra',
    level: 'Kezdő',
    thumbnail: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400',
    thumbnailUrl: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400',
    instructorName: 'Tóth Anna',
    instructorImage: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100',
    instructorTitle: 'UX Designer',
    instructorBio: 'Tapasztalt UX/UI designer, aki segít létrehozni felhasználóbarát interfészeket.',
    instructor: {
      id: 'instructor-4',
      firstName: 'Tóth',
      lastName: 'Anna',
      email: 'toth.anna@example.com',
      role: 'INSTRUCTOR',
      profilePictureUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100',
      title: 'UX Designer',
      bio: 'Tapasztalt UX/UI designer, aki segít létrehozni felhasználóbarát interfészeket.'
    },
    category: {
      id: 'cat-4',
      name: 'Design',
      slug: 'design',
      description: 'Design kurzusok'
    },
    modules: [
      {
        id: 'mod-7',
        title: 'UX alapok',
        description: 'User Experience tervezés alapjai',
        order: 1,
        status: 'PUBLISHED',
        lessons: [
          { 
            id: 'lesson-13', 
            title: 'User research',
            content: 'Felhasználói kutatás módszerek',
            type: 'VIDEO',
            order: 1,
            status: 'PUBLISHED',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          { 
            id: 'lesson-14', 
            title: 'Wireframing',
            content: 'Wireframe készítés technikák',
            type: 'VIDEO',
            order: 2,
            status: 'PUBLISHED',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ]
      },
      {
        id: 'mod-8', 
        title: 'UI design',
        description: 'User Interface tervezés',
        order: 2,
        status: 'PUBLISHED',
        lessons: [
          { 
            id: 'lesson-15', 
            title: 'Visual design principles',
            content: 'Vizuális tervezési alapelvek',
            type: 'VIDEO',
            order: 1,
            status: 'PUBLISHED',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          { 
            id: 'lesson-16', 
            title: 'Prototyping',
            content: 'Prototípus készítés',
            type: 'VIDEO',
            order: 2,
            status: 'PUBLISHED',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ]
      }
    ],
    reviews: [],
    enrolledCount: 923,
    reviewCount: 67,
    averageRating: 4.7,
    rating: 4.7,
    totalLessons: 21,
    universityId: 'uni-3',
    status: 'PUBLISHED' as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'course-5',
    title: 'Project Management Essentials',
    slug: 'project-management-essentials',
    description: 'Projekt vezetési alapok és agilis módszertanok.',
    price: 22900,
    duration: '7 óra',
    level: 'Középhaladó',
    thumbnail: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400',
    thumbnailUrl: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400',
    instructorName: 'Varga László',
    instructorImage: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100',
    instructorTitle: 'Project Manager',
    instructorBio: 'Tapasztalt projektmenedzser, aki segít hatékony projekt irányításban.',
    instructor: {
      id: 'instructor-5',
      firstName: 'Varga',
      lastName: 'László',
      email: 'varga.laszlo@example.com',
      role: 'INSTRUCTOR',
      profilePictureUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100',
      title: 'Project Manager',
      bio: 'Tapasztalt projektmenedzser, aki segít hatékony projekt irányításban.'
    },
    category: {
      id: 'cat-5',
      name: 'Vezetés',
      slug: 'vezetes',
      description: 'Vezetési kurzusok'
    },
    modules: [
      {
        id: 'mod-9',
        title: 'Projektmenedzsment alapok',
        description: 'Projekt vezetés alapjai',
        order: 1,
        status: 'PUBLISHED',
        lessons: [
          { 
            id: 'lesson-17', 
            title: 'Projekt tervezés',
            content: 'Projekt tervezési módszerek',
            type: 'VIDEO',
            order: 1,
            status: 'PUBLISHED',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          { 
            id: 'lesson-18', 
            title: 'Kockázatkezelés',
            content: 'Projekt kockázatok kezelése',
            type: 'VIDEO',
            order: 2,
            status: 'PUBLISHED',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ]
      },
      {
        id: 'mod-10', 
        title: 'Agilis módszertanok',
        description: 'Agile projektmenedzsment',
        order: 2,
        status: 'PUBLISHED',
        lessons: [
          { 
            id: 'lesson-19', 
            title: 'Scrum alapok',
            content: 'Scrum keretrendszer megértése',
            type: 'VIDEO',
            order: 1,
            status: 'PUBLISHED',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          { 
            id: 'lesson-20', 
            title: 'Kanban használata',
            content: 'Kanban tábla kezelése',
            type: 'VIDEO',
            order: 2,
            status: 'PUBLISHED',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ]
      }
    ],
    reviews: [],
    enrolledCount: 1456,
    reviewCount: 78,
    averageRating: 4.5,
    rating: 4.5,
    totalLessons: 16,
    universityId: 'uni-2',
    status: 'PUBLISHED' as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'course-6',
    title: 'Cybersecurity Alapok',
    slug: 'cybersecurity-alapok',
    description: 'Információbiztonság és kibervédelem alapjai.',
    price: 31900,
    duration: '10 óra',
    level: 'Középhaladó',
    thumbnail: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=400',
    thumbnailUrl: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=400',
    instructorName: 'Kovács Gábor',
    instructorImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100',
    instructorTitle: 'Security Specialist',
    instructorBio: 'Kiberbiztonsági szakértő, aki segít megérteni a modern fenyegetéseket.',
    instructor: {
      id: 'instructor-6',
      firstName: 'Kovács',
      lastName: 'Gábor',
      email: 'kovacs.gabor@example.com',
      role: 'INSTRUCTOR',
      profilePictureUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100',
      title: 'Security Specialist',
      bio: 'Kiberbiztonsági szakértő, aki segít megérteni a modern fenyegetéseket.'
    },
    category: {
      id: 'cat-6',
      name: 'IT Biztonság',
      slug: 'it-biztonsag',
      description: 'IT biztonsági kurzusok'
    },
    modules: [
      {
        id: 'mod-11',
        title: 'Információbiztonság alapok',
        description: 'IT biztonság alapismeretek',
        order: 1,
        status: 'PUBLISHED',
        lessons: [
          { 
            id: 'lesson-21', 
            title: 'Biztonsági alapelvek',
            content: 'Információbiztonság alapjai',
            type: 'VIDEO',
            order: 1,
            status: 'PUBLISHED',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          { 
            id: 'lesson-22', 
            title: 'Fenyegetések azonosítása',
            content: 'Biztonsági fenyegetések felismerése',
            type: 'VIDEO',
            order: 2,
            status: 'PUBLISHED',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ]
      },
      {
        id: 'mod-12', 
        title: 'Kibervédelem',
        description: 'Kibertámadások elleni védelem',
        order: 2,
        status: 'PUBLISHED',
        lessons: [
          { 
            id: 'lesson-23', 
            title: 'Hálózati biztonság',
            content: 'Hálózatok védelme',
            type: 'VIDEO',
            order: 1,
            status: 'PUBLISHED',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          { 
            id: 'lesson-24', 
            title: 'Incidenskezelés',
            content: 'Biztonsági incidensek kezelése',
            type: 'VIDEO',
            order: 2,
            status: 'PUBLISHED',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ]
      }
    ],
    reviews: [],
    enrolledCount: 678,
    reviewCount: 54,
    averageRating: 4.8,
    rating: 4.8,
    totalLessons: 28,
    universityId: 'uni-1',
    status: 'PUBLISHED' as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];