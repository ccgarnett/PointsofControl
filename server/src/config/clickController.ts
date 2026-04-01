import { Request, Response } from 'express';
import ClickEvent from './ClickEvent';
import Course from './Course';

const VALID_EVENT_TYPES = ['enroll_click', 'pageview'];

// ── POST /api/analytics/click ─────────────────────────────────────────────────
export const logClick = async (req: Request, res: Response) => {
  try {
    const { courseId, userId, eventType } = req.body;

    if (!courseId || !eventType) {
      return res.status(400).json({ message: 'courseId and eventType are required' });
    }
    if (!VALID_EVENT_TYPES.includes(eventType)) {
      return res.status(400).json({ message: 'Invalid eventType' });
    }

    await ClickEvent.create({ courseId, userId: userId || null, eventType });
    res.status(201).json({ message: 'Event logged' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// ── GET /api/admin/analytics/clicks ──────────────────────────────────────────
export const getClickAnalytics = async (_req: Request, res: Response) => {
  try {
    const courses = await Course.find({}, '_id courseId title');
    const events = await ClickEvent.find({}, 'courseId eventType');

    const result = courses
      .map((c) => {
        const id = String(c._id);
        const courseEvents = events.filter((e) => e.courseId === id);
        const enrollClicks = courseEvents.filter((e) => e.eventType === 'enroll_click').length;
        const pageviews = courseEvents.filter((e) => e.eventType === 'pageview').length;
        const conversionRate = pageviews > 0 ? Math.round((enrollClicks / pageviews) * 100) : 0;
        return {
          _id: c._id,
          courseId: c.courseId,
          title: c.title,
          enrollClicks,
          pageviews,
          conversionRate,
        };
      })
      .sort((a, b) => b.enrollClicks - a.enrollClicks);

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};
