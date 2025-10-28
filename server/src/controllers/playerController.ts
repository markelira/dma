import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { generateSignedPlayback } from '../services/muxService';

export const getPlayerData = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { courseId } = req.params;
    const userId = req.userId;

    // Fetch course with modules and lessons
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        modules: {
          orderBy: { order: 'asc' },
          include: {
            lessons: {
              orderBy: { order: 'asc' },
              include: {
                progress: userId
                  ? {
                      where: { userId },
                      select: { completed: true },
                    }
                  : false,
              },
            },
          },
        },
      },
    });

    if (!course) return res.status(404).json({ message: 'Kurzus nem található' });

    // Enrollment or free course check (if user authenticated)
    if (userId) {
      const enrollment = await prisma.enrollment.findUnique({
        where: { userId_courseId: { userId, courseId } },
      });
      if (!enrollment && course.status !== 'FREE') {
        return res.status(403).json({ message: 'A kurzus csak beiratkozott felhasználóknak érhető el.' });
      }
    }

    // Optionally sign current lesson playback if query.lessonId provided
    let signedPlaybackUrl: string | null = null;
    const { lessonId } = req.query;
    if (lessonId && typeof lessonId === 'string') {
      // locate lesson playbackId
      const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } });
      const playbackId = (lesson as any)?.muxPlaybackId as string | undefined;
      if (playbackId) {
        signedPlaybackUrl = await generateSignedPlayback(playbackId);
      }
    }

    res.status(200).json({ course, signedPlaybackUrl });
  } catch (err) {
    next(err);
  }
}; 