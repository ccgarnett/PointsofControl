import { Response } from 'express';
import { AuthRequest } from './authMiddleware';
import CalendarTask from './CalendarTask';

function getWeekRange(dateStr?: string): { start: Date; end: Date } {
  const base = dateStr ? new Date(dateStr) : new Date();
  const day = base.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(base);
  monday.setDate(base.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return { start: monday, end: sunday };
}

// ── GET /api/calendar/tasks ───────────────────────────────────────────────────
// Protected — returns tasks for the logged-in user for the given week.
// Query param: ?week=YYYY-MM-DD (any date in the target week; defaults to current week)
export const getCalendarTasks = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { week } = req.query as { week?: string };
    const { start, end } = getWeekRange(week);

    const tasks = await CalendarTask.find({
      userId,
      date: { $gte: start, $lte: end },
    }).sort({ date: 1 });

    res.json(tasks);
  } catch {
    res.status(500).json({ message: 'Server Error' });
  }
};
