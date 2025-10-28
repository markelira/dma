/* eslint-disable */
// @ts-nocheck

import { Request, Response, NextFunction } from 'express'
import { PrismaClient, UserRole } from '@prisma/client'
import { z } from 'zod'
import prisma from '../utils/prisma';

const prisma = new PrismaClient()

// Zod schema for updating user profile
const updateUserProfileSchema = z.object({
  firstName: z.string().min(1, { message: 'A keresztnév kötelező.' }).optional(),
  lastName: z.string().min(1, { message: 'A vezetéknév kötelező.' }).optional(),
  email: z.string().email({ message: 'Érvénytelen e-mail formátum.' }).optional(),
  interests: z.array(z.string()).optional(),
  experienceLevel: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT']).optional(),
  learningGoals: z.array(z.string()).optional(),
  learningPreference: z.enum(['SELF_PACED', 'STRUCTURED', 'GROUP', 'MENTOR']).optional(),
  weeklyAvailability: z.string().optional(),
  profilePictureUrl: z.string().url().optional(),
})

// Zod schema for updating user role (admin only)
const updateUserRoleSchema = z.object({
  role: z.nativeEnum(UserRole, { message: 'Érvénytelen felhasználói szerepkör.' }),
})

// Get a user by ID
export const getUserById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!user) {
      return res.status(404).json({ message: 'Felhasználó nem található.' })
    }

    // Allow user to view their own profile, or admin to view any profile
    if (req.userId !== user.id && req.userRole !== UserRole.ADMIN) {
      return res.status(403).json({ message: 'Nincs jogosultsága ehhez a művelethez.' })
    }

    res.status(200).json({ user })
  } catch (error) {
    next(error)
  }
}

// Update user profile
export const updateUserProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params

    // User can only update their own profile unless they are an ADMIN
    if (req.userId !== id && req.userRole !== UserRole.ADMIN) {
      return res.status(403).json({ message: 'Nincs jogosultsága ehhez a művelethez.' })
    }

    const validatedData = updateUserProfileSchema.parse(req.body)

    const updatedUser = await prisma.user.update({
      where: { id },
      data: validatedData,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    res.status(200).json({ message: 'Profil sikeresen frissítve.', user: updatedUser })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors })
    }
    next(error)
  }
}

// Get all users (Admin only)
export const getAllUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // RBAC: This is handled by middleware in userRoutes, but an explicit check here too.
    if (req.userRole !== UserRole.ADMIN) {
      return res.status(403).json({ message: 'Nincs elegendő jogosultsága ehhez a művelethez.' })
    }

    const users = await prisma.user.findMany({
      select: { id: true, firstName: true, lastName: true, email: true, role: true, createdAt: true, updatedAt: true },
    })

    res.status(200).json({ users })
  } catch (error) {
    next(error)
  }
}

// Update user role (Admin only)
export const updateUserRole = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const validatedData = updateUserRoleSchema.parse(req.body)
    const { role } = validatedData

    // RBAC: This is handled by middleware in userRoutes, but an explicit check here too.
    if (req.userRole !== UserRole.ADMIN) {
      return res.status(403).json({ message: 'Nincs elegendő jogosultsága ehhez a művelethez.' })
    }

    // Update user role in database
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { role },
      select: { id: true, firstName: true, lastName: true, email: true, role: true, createdAt: true, updatedAt: true },
    })

    // Update Firebase custom claims (best-effort)
    try {
      const { auth } = require('../utils/firebaseAdmin')
      await auth.setCustomUserClaims(id, { role })
    } catch (firebaseErr) {
      console.warn('updateUserRole: failed to set Firebase custom claims, continuing.', firebaseErr)
    }

    res.status(200).json({ message: `Felhasználó szerepköre sikeresen frissítve ${role}-ra.`, user: updatedUser })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors })
    }
    next(error)
  }
}

// Delete user (Admin only)
export const deleteUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params

    // RBAC: This is handled by middleware in userRoutes, but an explicit check here too.
    if (req.userRole !== UserRole.ADMIN) {
      return res.status(403).json({ message: 'Nincs elegendő jogosultsága ehhez a művelethez.' })
    }

    await prisma.user.delete({
      where: { id },
    })

    res.status(200).json({ message: 'Felhasználó sikeresen törölve.' })
  } catch (error) {
    next(error)
  }
}

export const getCurrentUserProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Nincs autentikációs token megadva.' });
    }
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!user) {
      return res.status(404).json({ message: 'Felhasználó nem található.' });
    }
    res.status(200).json({ user });
  } catch (error) {
    next(error);
  }
};

export const getStudentDashboardCourses = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Nincs autentikációs token megadva.' });
    }
    // Get all enrollments for the user
    const enrollments = await prisma.enrollment.findMany({
      where: { userId },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            description: true,
            status: true,
            instructor: { select: { id: true, firstName: true, lastName: true, email: true } },
            category: { select: { id: true, name: true } },
          },
        },
      },
    });
    // For each enrollment, get progress summary
    const courseProgress = await prisma.lessonProgress.groupBy({
      by: ['userId'],
      where: { userId },
      _count: { id: true, completed: true },
    });
    // Map courseId to progress %
    const progressMap: Record<string, number> = {};
    courseProgress.forEach(p => {
      const total = p._count.id;
      const completed = p._count.completed || 0;
      progressMap[p.userId] = total > 0 ? Math.round((completed / total) * 100) : 0;
    });
    // Build response
    const dashboardCourses = enrollments.map(enrollment => {
      const course = enrollment.course;
      return {
        courseId: course.id,
        title: course.title,
        description: course.description,
        status: course.status,
        instructor: course.instructor,
        category: course.category,
        progress: progressMap[course.id] || 0,
        enrolledAt: enrollment.createdAt,
      };
    });
    res.status(200).json({ courses: dashboardCourses });
  } catch (error) {
    next(error);
  }
};

export const getStudentDashboardProgress = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Nincs autentikációs token megadva.' });
    }
    // Get all enrollments
    const enrollments = await prisma.enrollment.findMany({ where: { userId }, select: { courseId: true } });
    const courseIds = enrollments.map(e => e.courseId);
    // Get progress for all courses
    const progress = await prisma.lessonProgress.findMany({ where: { userId, lesson: { module: { courseId: { in: courseIds } } } }, orderBy: { updatedAt: 'desc' } });
    // Calculate overall progress (average % complete across all courses)
    const courseProgressMap: Record<string, { completed: number; total: number }> = {};
    progress.forEach(p => {
      if (!courseProgressMap[p.courseId]) courseProgressMap[p.courseId] = { completed: 0, total: 0 };
      courseProgressMap[p.courseId].total++;
      if (p.completed) courseProgressMap[p.courseId].completed++;
    });
    const progressPercentages = Object.values(courseProgressMap).map(cp => cp.total > 0 ? cp.completed / cp.total : 0);
    const overallProgress = progressPercentages.length > 0 ? Math.round((progressPercentages.reduce((a, b) => a + b, 0) / progressPercentages.length) * 100) : 0;
    // Recent activity: last 5 lessons/quizzes
    const recentLessons = progress.slice(0, 5).map(p => ({ lessonId: p.lessonId, completed: p.completed, updatedAt: p.updatedAt }));
    // Quiz results summary: last 5 quiz attempts
    const quizAttempts = await prisma.userQuizAttempt.findMany({
      where: { userId },
      include: {
        quiz: { select: { title: true, lesson: { select: { title: true } } } },
      },
      orderBy: { startedAt: 'desc' },
      take: 5,
    });
    const quizResults = quizAttempts.map(a => ({
      quizTitle: a.quiz.title,
      lessonTitle: a.quiz.lesson.title,
      score: a.score,
      startedAt: a.startedAt,
      completedAt: a.completedAt,
      passed: a.passed,
    }));
    res.status(200).json({
      overallProgress,
      recentLessons,
      quizResults,
    });
  } catch (error) {
    next(error);
  }
};

export const getStudentDashboardRecommendations = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Nincs autentikációs token megadva.' });
    }
    // Get user interests and enrolled courses
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { experienceLevel: true } });
    const myEnrollments = await prisma.enrollment.findMany({ where: { userId }, select: { courseId: true } });
    const myCourseIds = myEnrollments.map(e => e.courseId);
    let recommendedCourses = [];
    if (user && user.experienceLevel && user.experienceLevel.length > 0) {
      // Find courses where title, description, or category matches any interest
      recommendedCourses = await prisma.course.findMany({
        where: {
          id: { notIn: myCourseIds },
          status: 'PUBLISHED',
          OR: [
            { title: { in: user.experienceLevel, mode: 'insensitive' } },
            { description: { in: user.experienceLevel, mode: 'insensitive' } },
            { category: { name: { in: user.experienceLevel, mode: 'insensitive' } } },
          ],
        },
        take: 5,
        select: {
          id: true,
          title: true,
          description: true,
          instructor: { select: { id: true, firstName: true, lastName: true } },
          category: { select: { id: true, name: true } },
        },
      });
    }
    // Fallback: popular courses
    if (!recommendedCourses || recommendedCourses.length === 0) {
      recommendedCourses = await prisma.course.findMany({
        where: { id: { notIn: myCourseIds }, status: 'PUBLISHED' },
        orderBy: {
          enrollments: { _count: 'desc' },
        },
        take: 5,
        select: {
          id: true,
          title: true,
          description: true,
          instructor: { select: { id: true, firstName: true, lastName: true } },
          category: { select: { id: true, name: true } },
        },
      });
    }
    res.status(200).json({ recommendations: recommendedCourses });
  } catch (error) {
    next(error);
  }
};

export const getStudentDashboardAggregate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Nincs autentikációs token megadva.' });
    }
    // Profile
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    // Enrolled courses with progress
    const enrollments = await prisma.enrollment.findMany({
      where: { userId },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            description: true,
            status: true,
            instructor: { select: { id: true, firstName: true, lastName: true, email: true } },
            category: { select: { id: true, name: true } },
          },
        },
      },
    });
    // Progress summary
    const progress = await prisma.lessonProgress.findMany({ where: { userId }, orderBy: { updatedAt: 'desc' } });
    const courseProgressMap: Record<string, { completed: number; total: number }> = {};
    progress.forEach(p => {
      if (!courseProgressMap[p.courseId]) courseProgressMap[p.courseId] = { completed: 0, total: 0 };
      courseProgressMap[p.courseId].total++;
      if (p.completed) courseProgressMap[p.courseId].completed++;
    });
    const dashboardCourses = enrollments.map(enrollment => {
      const course = enrollment.course;
      const cp = courseProgressMap[course.id] || { completed: 0, total: 0 };
      const progressPercent = cp.total > 0 ? Math.round((cp.completed / cp.total) * 100) : 0;
      return {
        courseId: course.id,
        title: course.title,
        description: course.description,
        status: course.status,
        instructor: course.instructor,
        category: course.category,
        progress: progressPercent,
        enrolledAt: enrollment.createdAt,
      };
    });
    // Overall progress
    const progressPercentages = Object.values(courseProgressMap).map(cp => cp.total > 0 ? cp.completed / cp.total : 0);
    const overallProgress = progressPercentages.length > 0 ? Math.round((progressPercentages.reduce((a, b) => a + b, 0) / progressPercentages.length) * 100) : 0;
    // Recent activity
    const recentLessons = progress.slice(0, 5).map(p => ({ lessonId: p.lessonId, completed: p.completed, updatedAt: p.updatedAt }));
    // Quiz results summary
    const quizAttempts = await prisma.userQuizAttempt.findMany({
      where: { userId },
      include: {
        quiz: { select: { title: true, lesson: { select: { title: true } } } },
      },
      orderBy: { startedAt: 'desc' },
      take: 5,
    });
    const quizResults = quizAttempts.map(a => ({
      quizTitle: a.quiz.title,
      lessonTitle: a.quiz.lesson.title,
      score: a.score,
      startedAt: a.startedAt,
      completedAt: a.completedAt,
      passed: a.passed,
    }));
    // Recommendations (top 5 popular courses not enrolled)
    const myCourseIds = enrollments.map(e => e.courseId);
    const recommendations = await prisma.course.findMany({
      where: { id: { notIn: myCourseIds }, status: 'PUBLISHED' },
      orderBy: {
        enrollments: { _count: 'desc' },
      },
      take: 5,
      select: {
        id: true,
        title: true,
        description: true,
        instructor: { select: { id: true, firstName: true, lastName: true } },
        category: { select: { id: true, name: true } },
      },
    });
    res.status(200).json({
      user,
      courses: dashboardCourses,
      overallProgress,
      recentLessons,
      quizResults,
      recommendations,
    });
  } catch (error) {
    next(error);
  }
};

export const getUserNotifications = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Nincs autentikációs token megadva.' });
    }
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    res.status(200).json({ notifications });
  } catch (error) {
    next(error);
  }
};

export const markNotificationsRead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Nincs autentikációs token megadva.' });
    }
    const { ids } = req.body; // array of notification IDs
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'Nincs megadva értesítés azonosító.' });
    }
    await prisma.notification.updateMany({
      where: { userId, id: { in: ids } },
      data: { read: true },
    });
    res.status(200).json({ message: 'Értesítések olvasottnak jelölve.' });
  } catch (error) {
    next(error);
  }
};

export const getMyReviews = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Nincs autentikációs token megadva.' });
    }
    const reviews = await prisma.review.findMany({
      where: { userId },
      include: {
        course: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.status(200).json({ reviews });
  } catch (error) {
    next(error);
  }
};

export const getMyDiscussions = async (req: Request, res: Response, next: NextFunction) => {
  // Placeholder: implement if discussion/forum is added
  res.status(200).json({ discussions: [] });
};

export const getMyCertificates = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Nincs autentikációs token megadva.' });
    }
    const certificates = await prisma.certificate.findMany({
      where: { userId },
      include: {
        course: { select: { id: true, title: true } },
      },
      orderBy: { issuedAt: 'desc' },
    });
    res.status(200).json({ certificates });
  } catch (error) {
    next(error);
  }
};

export const generateCertificate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId;
    const { courseId } = req.body;
    if (!userId || !courseId) {
      return res.status(400).json({ message: 'Felhasználói azonosító vagy kurzus azonosító hiányzik.' });
    }
    
    // Import certificate service dynamically to avoid circular dependencies
    const { certificateService } = await import('../utils/certificateService');
    
    try {
      const certificateUrl = await certificateService.generateCertificate(userId, courseId);
      res.status(201).json({ 
        message: 'Tanúsítvány sikeresen generálva!',
        downloadUrl: certificateUrl 
      });
    } catch (error: any) {
      if (error.message.includes('already exists')) {
        return res.status(409).json({ message: 'Ehhez a kurzushoz már ki lett állítva tanúsítvány.' });
      } else if (error.message.includes('not fully completed')) {
        return res.status(400).json({ message: 'A kurzus még nincs teljesen befejezve.' });
      } else if (error.message.includes('Course not found')) {
        return res.status(404).json({ message: 'Kurzus nem található.' });
      }
      throw error;
    }
  } catch (error) {
    next(error);
  }
};

export const getAdminDashboardStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Total counts
    const [userCount, courseCount, enrollmentCount, reviewCount, certificateCount] = await Promise.all([
      prisma.user.count(),
      prisma.course.count(),
      prisma.enrollment.count(),
      prisma.review.count(),
      prisma.certificate.count(),
    ]);
    // Recent activity
    const recentUsers = await prisma.user.findMany({ orderBy: { createdAt: 'desc' }, take: 5, select: { id: true, email: true, firstName: true, lastName: true, createdAt: true, role: true } });
    const recentEnrollments = await prisma.enrollment.findMany({ orderBy: { createdAt: 'desc' }, take: 5, include: { user: { select: { id: true, email: true } }, course: { select: { id: true, title: true } } } });
    const recentReviews = await prisma.review.findMany({ orderBy: { createdAt: 'desc' }, take: 5, include: { user: { select: { id: true, email: true } }, course: { select: { id: true, title: true } } } });
    // Top courses by enrollments
    const topCoursesByEnrollments = await prisma.course.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: { enrollments: { _count: 'desc' } },
      take: 5,
      select: { id: true, title: true, enrollments: true },
    });
    // Top courses by average rating
    const topCoursesByRatings = await prisma.course.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: { reviews: { _avg: { rating: 'desc' } } },
      take: 5,
      select: { id: true, title: true, reviews: true },
    });
    res.status(200).json({
      stats: {
        userCount,
        courseCount,
        enrollmentCount,
        reviewCount,
        certificateCount,
      },
      recent: {
        users: recentUsers,
        enrollments: recentEnrollments,
        reviews: recentReviews,
      },
      topCourses: {
        byEnrollments: topCoursesByEnrollments,
        byRatings: topCoursesByRatings,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getAllUsersAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { search = '', role, limit = 20, offset = 0 } = req.query as any;
    const where: any = {};
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (role) where.role = role;
    where.deleted = false;
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip: Number(offset),
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        select: { id: true, email: true, firstName: true, lastName: true, role: true, createdAt: true, updatedAt: true },
      }),
      prisma.user.count({ where }),
    ]);
    res.status(200).json({ users, total });
  } catch (error) {
    next(error);
  }
};

export const updateUserRoleAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { role },
      select: { id: true, email: true, firstName: true, lastName: true, role: true, createdAt: true, updatedAt: true },
    });
    res.status(200).json({ message: 'Szerepkör frissítve.', user: updatedUser });
  } catch (error) {
    next(error);
  }
};

export const deactivateUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await prisma.user.update({ where: { id }, data: { deleted: true } });
    res.status(200).json({ message: 'Felhasználó deaktiválva.' });
  } catch (error) {
    next(error);
  }
};

export const getAdminDashboardSettings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Fetch site-wide settings (e.g., from a settings table or config)
    const settings = await prisma.settings.findFirst();
    res.status(200).json({ settings });
  } catch (error) {
    next(error);
  }
};

export const reactivateUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await prisma.user.update({ where: { id }, data: { deleted: false } });
    res.status(200).json({ message: 'Felhasználó újraaktiválva.' });
  } catch (error) {
    next(error);
  }
};

export const getUserDetailsAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        deleted: true,
        interests: true,
        experienceLevel: true,
        learningGoals: true,
        learningPreference: true,
        weeklyAvailability: true,
        profilePictureUrl: true,
        enrollments: {
          include: {
            course: {
              select: {
                id: true,
                title: true,
                status: true,
                category: { select: { id: true, name: true } },
              },
            },
          },
        },
        reviews: {
          include: {
            course: { select: { id: true, title: true } },
          },
        },
        certificates: {
          include: {
            course: { select: { id: true, title: true } },
          },
        },
      },
    });
    if (!user) return res.status(404).json({ message: 'Felhasználó nem található.' });
    res.status(200).json({ user });
  } catch (error) {
    next(error);
  }
};

export const getUserProgress = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Fetch user's lesson progress
    const lessonProgress = await prisma.lessonProgress.findMany({
      where: { userId },
      include: {
        lesson: {
          select: {
            id: true,
            title: true,
            module: {
              select: {
                id: true,
                course: {
                  select: {
                    id: true,
                    title: true,
                    thumbnailUrl: true,
                    modules: {
                      select: {
                        lessons: {
                          select: {
                            id: true
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    // Calculate progress per course
    const courseProgressMap = new Map();
    lessonProgress.forEach(({ lesson, completed, updatedAt }) => {
      const course = lesson.module.course;
      const courseId = course.id;
      // Calculate total lessons for this course
      const totalLessons = course.modules.reduce((sum, module) => sum + module.lessons.length, 0);
      if (!courseProgressMap.has(courseId)) {
        courseProgressMap.set(courseId, {
          courseId,
          title: course.title,
          thumbnailUrl: course.thumbnailUrl,
          totalLessons,
          completedLessons: 0,
          lastAccessedAt: updatedAt,
          certificateEarned: false,
        });
      }
      const courseProgress = courseProgressMap.get(courseId);
      if (completed) {
        courseProgress.completedLessons += 1;
      }
      if (updatedAt > courseProgress.lastAccessedAt) {
        courseProgress.lastAccessedAt = updatedAt;
      }
    });

    // Fetch certificates
    const certificates = await prisma.certificate.findMany({
      where: { userId },
      select: { courseName: true, id: true },
    });
    certificates.forEach(({ courseName, id }) => {
      // Find course by name since Certificate doesn't have courseId
      const courseEntry = Array.from(courseProgressMap.entries()).find(([_, course]) => course.title === courseName);
      if (courseEntry) {
        const [courseId, courseProgress] = courseEntry;
        courseProgress.certificateEarned = true;
        courseProgress.certificateId = id;
      }
    });

    // Prepare response data
    const enrolledCourses = Array.from(courseProgressMap.values()).map(course => ({
      ...course,
      completionPercentage: course.totalLessons > 0 ? (course.completedLessons / course.totalLessons) * 100 : 0,
    }));

    const totalCoursesEnrolled = enrolledCourses.length;
    const totalLessonsCompleted = enrolledCourses.reduce((sum, course) => sum + course.completedLessons, 0);
    const totalCertificatesEarned = certificates.length;

    // Recent activity
    const recentActivity = lessonProgress
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, 5)
      .map(({ lesson, updatedAt }) => ({
        lessonId: lesson.id,
        lessonTitle: lesson.title,
        courseTitle: lesson.module.course.title,
        lastAccessedAt: updatedAt,
      }));

    res.status(200).json({
      enrolledCourses,
      totalCoursesEnrolled,
      totalLessonsCompleted,
      totalCertificatesEarned,
      recentActivity,
    });
  } catch (error) {
    next(error);
  }
};

// List users (optionally filter by role)
export const listUsers = async (req: Request, res: Response) => {
  try {
    const role = req.query.role as string | undefined;
    const where: any = {};
    if (role) where.role = role.toUpperCase();

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        role: true,
        email: true,
      },
      orderBy: { firstName: 'asc' },
    });

    res.json(role ? { users } : { users });
  } catch (err) {
    console.error('listUsers error', err);
    res.status(500).json({ message: 'Felhasználók lekérdezése sikertelen' });
  }
};