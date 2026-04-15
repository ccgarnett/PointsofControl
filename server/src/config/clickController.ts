import { Request, Response } from 'express';
import ClickEvent from './ClickEvent';
import Course from './Course';

const VALID_EVENT_TYPES = ['enroll_click', 'pageview', 'time_on_page'];

// ── POST /api/analytics/click ─────────────────────────────────────────────────
export const logClick = async (req: Request, res: Response) => {
  try {
    const { courseId, userId, eventType, duration } = req.body;

    if (!courseId || !eventType) {
      return res.status(400).json({ message: 'courseId and eventType are required' });
    }
    if (!VALID_EVENT_TYPES.includes(eventType)) {
      return res.status(400).json({ message: 'Invalid eventType' });
    }

    const payload: Record<string, unknown> = { courseId, userId: userId || null, eventType };
    if (eventType === 'time_on_page' && typeof duration === 'number') {
      payload.duration = duration;
    }

    await ClickEvent.create(payload);
    res.status(201).json({ message: 'Event logged' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// ── GET /api/admin/analytics/clicks ──────────────────────────────────────────
export const getClickAnalytics = async (_req: Request, res: Response) => {
  try {
    const courses = await Course.find({}, '_id courseId title');
    const events = await ClickEvent.find({}, 'courseId eventType userId');

    const result = courses
      .map((c) => {
        const id = String(c._id);
        const courseEvents = events.filter((e) => e.courseId === id);
        const enrollClicks = courseEvents.filter((e) => e.eventType === 'enroll_click').length;

        // Count unique pageviews: deduplicate logged-in users by userId;
        // anonymous visits (userId === null) each count separately.
        const pageviewEvents = courseEvents.filter((e) => e.eventType === 'pageview');
        const seenUsers = new Set<string>();
        let pageviews = 0;
        for (const e of pageviewEvents) {
          if (e.userId == null) {
            pageviews++;
          } else if (!seenUsers.has(String(e.userId))) {
            seenUsers.add(String(e.userId));
            pageviews++;
          }
        }

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

// ── GET /api/admin/analytics/time-on-page ─────────────────────────────────────
export const getTimeOnPageAnalytics = async (_req: Request, res: Response) => {
  try {
    const courses = await Course.find({}, '_id courseId title');
    const events = await ClickEvent.find({ eventType: 'time_on_page' }, 'courseId duration');

    const result = courses.map((c) => {
      const id = String(c._id);
      const durations = events
        .filter((e) => e.courseId === id && typeof e.duration === 'number')
        .map((e) => e.duration as number);
      const avgDuration =
        durations.length > 0
          ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
          : 0;
      return {
        _id: c._id,
        courseId: c.courseId,
        title: c.title,
        avgDuration,
        sessionCount: durations.length,
      };
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};
