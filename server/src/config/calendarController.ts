import { Response } from 'express';
import { Types } from 'mongoose';
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

// ── POST /api/calendar/tasks ──────────────────────────────────────────────────
export const createCalendarTask = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const title = String(req.body?.title || '').trim();
    const description = String(req.body?.description || '').trim() || undefined;
    const dateStr = req.body?.date;
    if (!title) return res.status(400).json({ message: 'title required' });
    if (!dateStr) return res.status(400).json({ message: 'date required' });
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return res.status(400).json({ message: 'invalid date' });
    const task = await CalendarTask.create({ userId, title, description, date, completed: false });
    res.status(201).json(task);
  } catch {
    res.status(500).json({ message: 'Server Error' });
  }
};

// ── PATCH /api/calendar/tasks/:id ────────────────────────────────────────────
export const updateCalendarTask = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const id = String(req.params.id);
    if (!Types.ObjectId.isValid(id)) return res.status(400).json({ message: 'invalid task id' });

    const update: Record<string, unknown> = {};
    if (typeof req.body?.title === 'string') {
      const t = req.body.title.trim();
      if (!t) return res.status(400).json({ message: 'title cannot be empty' });
      update.title = t;
    }
    if (typeof req.body?.description === 'string') update.description = req.body.description;
    if (typeof req.body?.completed === 'boolean') update.completed = req.body.completed;
    if (req.body?.date) {
      const d = new Date(req.body.date);
      if (isNaN(d.getTime())) return res.status(400).json({ message: 'invalid date' });
      update.date = d;
    }
    if (Object.keys(update).length === 0) return res.status(400).json({ message: 'no fields to update' });

    const task = await CalendarTask.findOneAndUpdate({ _id: id, userId }, update, { new: true });
    if (!task) return res.status(404).json({ message: 'task not found' });
    res.json(task);
  } catch {
    res.status(500).json({ message: 'Server Error' });
  }
};

// ── DELETE /api/calendar/tasks/:id ───────────────────────────────────────────
export const deleteCalendarTask = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const id = String(req.params.id);
    if (!Types.ObjectId.isValid(id)) return res.status(400).json({ message: 'invalid task id' });
    const deleted = await CalendarTask.findOneAndDelete({ _id: id, userId });
    if (!deleted) return res.status(404).json({ message: 'task not found' });
    res.json({ message: 'task deleted' });
  } catch {
    res.status(500).json({ message: 'Server Error' });
  }
};
