import { Request, Response, NextFunction } from 'express'
import { PrismaClient, UserRole, ModuleStatus, LessonStatus } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()

// Zod schema for marking a lesson as complete
const markLessonCompleteSchema = z.object({
  lessonId: z.string().uuid({ message: 'Érvénytelen lecke azonosító.' }),
})

// Mark a lesson as complete
export const markLessonCompleted = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (req.userRole !== UserRole.STUDENT && req.userRole !== UserRole.ADMIN) {
      return res.status(403).json({ message: 'Nincs jogosultsága lecke teljesítésének jelöléséhez.' })
    }

    const validatedData = markLessonCompleteSchema.parse(req.body)
    const { lessonId } = validatedData
    const userId = req.userId

    if (!userId) {
      return res.status(401).json({ message: 'Felhasználói azonosító hiányzik.' })
    }

    // Check if the lesson exists
    const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } })
    if (!lesson) {
      return res.status(404).json({ message: 'A megadott lecke nem található.' })
    }

    // Check if the user is enrolled in the course that contains this lesson
    const module = await prisma.module.findUnique({ where: { id: lesson.moduleId } })
    if (!module) {
        return res.status(404).json({ message: 'A lecke modulja nem található.' });
    }
    const enrollment = await prisma.enrollment.findUnique({
        where: {
            userId_courseId: {
                userId,
                courseId: module.courseId,
            },
        },
    });

    if (!enrollment) {
        return res.status(403).json({ message: 'Nincs feliratkozva erre a kurzusra.' });
    }

    // ENFORCE ACCESS CONTROL FOR LESSON COMPLETION
    if (module.status === ModuleStatus.PAID) {
      // Check for active subscription
      type SubscriptionResult = [{ has_active_subscription: boolean }]
      const activeSubscription = await prisma.$queryRaw<SubscriptionResult>`
        SELECT EXISTS (
          SELECT 1 FROM "Subscription"
          WHERE "userId" = ${userId}
          AND status = 'active'
          AND "currentPeriodEnd" > NOW()
        ) as has_active_subscription
      `
      if (!activeSubscription[0]?.has_active_subscription) {
        return res.status(403).json({ message: 'Fizetős leckét csak aktív előfizetéssel lehet teljesíteni.' })
      }
    } else if (
      lesson.status === LessonStatus.DRAFT ||
      lesson.status === LessonStatus.SOON ||
      lesson.status === LessonStatus.ARCHIVED
    ) {
      if (req.userRole !== UserRole.ADMIN) {
        return res.status(403).json({ message: 'Ez a lecke nem teljesíthető.' })
      }
    }
    // For FREE and PUBLISHED, allow all users

    const progress = await prisma.lessonProgress.upsert({
      where: {
        lessonId_userId: {
          lessonId,
          userId,
        },
      },
      update: { completed: true },
      create: {
        userId,
        lessonId,
        completed: true,
      },
    })

    res.status(200).json({ message: 'Lecke sikeresen teljesítve.', progress })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors })
    }
    next(error)
  }
}

// Get progress for a specific lesson for a user
export const getLessonProgress = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { lessonId } = req.params
    const userId = req.userId // Current user

    if (!userId) {
      return res.status(401).json({ message: 'Felhasználói azonosító hiányzik.' })
    }

    const progress = await prisma.lessonProgress.findUnique({
      where: {
        lessonId_userId: {
          lessonId,
          userId,
        },
      },
    })

    if (!progress) {
      return res.status(200).json({ isCompleted: false, message: 'Lecke még nincs teljesítve.' })
    }

    res.status(200).json({ isCompleted: progress.completed, completedAt: progress.completionTimestamp }) // Changed to 'completionTimestamp'
  } catch (error) {
    next(error)
  }
}

// Get progress for all lessons in a module for a user
export const getModuleProgress = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { moduleId } = req.params
    const userId = req.userId

    if (!userId) {
      return res.status(401).json({ message: 'Felhasználói azonosító hiányzik.' })
    }

    const lessonsInModule = await prisma.lesson.findMany({
      where: { moduleId },
      select: { id: true, title: true, type: true, order: true },
    })

    if (lessonsInModule.length === 0) {
      return res.status(404).json({ message: 'A modul nem található vagy nem tartalmaz leckéket.' })
    }

    const progressRecords = await prisma.lessonProgress.findMany({
      where: {
        userId,
        lessonId: { in: lessonsInModule.map((lesson) => lesson.id) },
      },
    })

    const detailedProgress = lessonsInModule.map((lesson) => {
      const record = progressRecords.find((p) => p.lessonId === lesson.id)
      return {
        lessonId: lesson.id,
        title: lesson.title,
        type: lesson.type,
        order: lesson.order,
        isCompleted: record ? record.completed : false,
        completedAt: record ? record.completionTimestamp : null, // Changed to 'completionTimestamp'
      }
    })

    const completedCount = detailedProgress.filter(p => p.isCompleted).length;
    const totalCount = detailedProgress.length;
    const moduleProgressPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

    res.status(200).json({
        moduleId,
        totalLessons: totalCount,
        completedLessons: completedCount,
        progressPercentage: parseFloat(moduleProgressPercentage.toFixed(2)),
        lessons: detailedProgress,
    });
  } catch (error) {
    next(error)
  }
}

// Get overall progress for a course for a user
export const getCourseProgress = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { courseId } = req.params
    const userId = req.userId

    if (!userId) {
      return res.status(401).json({ message: 'Felhasználói azonosító hiányihk.' })
    }

    const modulesInCourse = await prisma.module.findMany({
      where: { courseId },
      select: { id: true, title: true },
    })

    if (modulesInCourse.length === 0) {
      return res.status(404).json({ message: 'A kurzus nem található vagy nem tartalmaz modulokat.' })
    }

    let totalLessonsInCourse = 0;
    const allLessonIds: string[] = [];

    for (const module of modulesInCourse) {
        const lessons = await prisma.lesson.findMany({
            where: { moduleId: module.id },
            select: { id: true },
        });
        totalLessonsInCourse += lessons.length;
        allLessonIds.push(...lessons.map(l => l.id));
    }

    if (totalLessonsInCourse === 0) {
        return res.status(200).json({ message: 'A kurzus nem tartalmaz leckéket.', totalLessons: 0, completedLessons: 0, progressPercentage: 0 });
    }

    const completedProgressRecords = await prisma.lessonProgress.count({
      where: {
        userId,
        lessonId: { in: allLessonIds },
        completed: true,
      },
    })

    const courseProgressPercentage = (completedProgressRecords / totalLessonsInCourse) * 100;

    res.status(200).json({
      courseId,
      totalLessons: totalLessonsInCourse,
      completedLessons: completedProgressRecords,
      progressPercentage: parseFloat(courseProgressPercentage.toFixed(2)),
    })
  } catch (error) {
    next(error)
  }
}