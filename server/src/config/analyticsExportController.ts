import { Request, Response } from 'express';
import Course from './Course';
import User from './User';
import ClickEvent from './ClickEvent';

// ── GET /api/admin/analytics/export/csv ───────────────────────────────────────
export const exportAnalyticsCSV = async (_req: Request, res: Response) => {
  try {
    const [courses, users, events] = await Promise.all([
      Course.find({}, '_id courseId title price'),
      User.find({}, 'enrolledCourses'),
      ClickEvent.find({}, 'courseId eventType userId duration'),
    ]);

    // Build purchase count map
    const purchaseCount: Record<string, number> = {};
    for (const user of users) {
      for (const courseId of user.enrolledCourses) {
        const key = String(courseId);
        purchaseCount[key] = (purchaseCount[key] || 0) + 1;
      }
    }

    const rows: string[] = [
      'Course ID,Title,Price,Enrollments,Revenue,Page Views,Enroll Clicks,Conversion Rate (%),Avg Time on Page (sec)',
    ];

    for (const c of courses) {
      const id = String(c._id);
      const courseEvents = events.filter((e) => e.courseId === id);

      // Unique page views (distinct userId; nulls each count separately)
      const pageviewEvents = courseEvents.filter((e) => e.eventType === 'pageview');
      const seenUsers = new Set<string>();
      let uniquePageviews = 0;
      for (const e of pageviewEvents) {
        if (e.userId == null) {
          uniquePageviews++;
        } else if (!seenUsers.has(String(e.userId))) {
          seenUsers.add(String(e.userId));
          uniquePageviews++;
        }
      }

      const enrollClicks = courseEvents.filter((e) => e.eventType === 'enroll_click').length;
      const conversionRate =
        uniquePageviews > 0 ? Math.round((enrollClicks / uniquePageviews) * 100) : 0;

      const durations = courseEvents
        .filter((e) => e.eventType === 'time_on_page' && typeof e.duration === 'number')
        .map((e) => e.duration as number);
      const avgDuration =
        durations.length > 0
          ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
          : 0;

      const count = purchaseCount[id] || 0;
      const revenue = count * c.price;

      const title = `"${c.title.replace(/"/g, '""')}"`;
      rows.push(
        `${c.courseId},${title},${c.price},${count},${revenue},${uniquePageviews},${enrollClicks},${conversionRate},${avgDuration}`
      );
    }

    const csv = rows.join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="analytics.csv"');
    res.status(200).send(csv);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};
