import { Request, Response } from 'express';
import ClickEvent from './ClickEvent';
import Course from './Course';
import User from './User';

function buildDateFilter(req: Request): Record<string, any> {
  const { start, end, period } = req.query as Record<string, string>;

  if (!start && !end && !period) return {};

  let startDate: Date | undefined;
  let endDate: Date | undefined;

  if (period) {
    endDate = new Date();
    switch (period) {
      case 'day':
        startDate = new Date();
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
        break;
    }
  } else {
    if (start) startDate = new Date(start);
    if (end) {
      endDate = new Date(end);
      endDate.setHours(23, 59, 59, 999);
    }
  }

  const filter: Record<string, any> = {};
  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = startDate;
    if (endDate) filter.createdAt.$lte = endDate;
  }
  return filter;
}

// ── GET /api/admin/analytics/courses ─────────────────────────────────────────
// A12: Ordered list of courses by interaction count
// A13: Accepts ?period=day|week|month|year or ?start=YYYY-MM-DD&end=YYYY-MM-DD
export const getCourseInteractionAnalytics = async (req: Request, res: Response) => {
  try {
    const dateFilter = buildDateFilter(req);

    const courses = await Course.find({}, '_id courseId title');
    const events = await ClickEvent.find(dateFilter, 'courseId eventType');
    const users = await User.find({}, 'enrolledCourses');

    const result = courses.map((c) => {
      const idStr = String(c._id);
      const courseEvents = events.filter((e) => e.courseId === idStr);
      const pageViews = courseEvents.filter((e) => e.eventType === 'pageview').length;
      const enrollClicks = courseEvents.filter((e) => e.eventType === 'enroll_click').length;
      const purchases = users.filter((u) =>
        u.enrolledCourses.some((ec) => String(ec) === idStr)
      ).length;
      return {
        courseId: c.courseId,
        courseTitle: c.title,
        pageViews,
        enrollClicks,
        purchases,
        totalInteractions: pageViews + enrollClicks + purchases,
      };
    });

    result.sort((a, b) => b.totalInteractions - a.totalInteractions);
    res.json(result);
  } catch {
    res.status(500).json({ message: 'Server Error' });
  }
};
