import request from 'supertest';
import express from 'express';
import { getCalendarTasks } from './calendarController';
import { requireAuth } from './authMiddleware';
import CalendarTask from './CalendarTask';
import jwt from 'jsonwebtoken';

const app = express();
app.use(express.json());
app.get('/api/calendar/tasks', requireAuth, getCalendarTasks);

jest.mock('./CalendarTask');
jest.mock('jsonwebtoken');

const AUTH = { Authorization: 'Bearer valid.token' };

beforeEach(() => {
  (jwt.verify as jest.Mock).mockReturnValue({ id: 'user1', username: 'testuser', role: 'User' });
});

// ── GET /api/calendar/tasks ───────────────────────────────────────────────────

describe('GET /api/calendar/tasks', () => {
  it('returns 401 with no token', async () => {
    const res = await request(app).get('/api/calendar/tasks');
    expect(res.status).toBe(401);
  });

  it('returns 200 with tasks for the current week', async () => {
    const mockTasks = [
      { _id: 't1', userId: 'user1', title: 'Task 1', date: new Date().toISOString(), completed: false },
    ];
    const mockSort = jest.fn().mockResolvedValue(mockTasks);
    (CalendarTask.find as jest.Mock).mockReturnValue({ sort: mockSort });

    const res = await request(app).get('/api/calendar/tasks').set(AUTH);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(CalendarTask.find).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user1', date: expect.any(Object) })
    );
  });

  it('returns 200 with tasks for a specific week via ?week param', async () => {
    const mockSort = jest.fn().mockResolvedValue([]);
    (CalendarTask.find as jest.Mock).mockReturnValue({ sort: mockSort });

    const res = await request(app)
      .get('/api/calendar/tasks?week=2026-03-30')
      .set(AUTH);

    expect(res.status).toBe(200);
    // Should scope query to the week containing 2026-03-30 (Mon Mar 30 – Sun Apr 5)
    expect(CalendarTask.find).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user1' })
    );
  });

  it('sorts tasks by date ascending', async () => {
    const mockSort = jest.fn().mockResolvedValue([]);
    (CalendarTask.find as jest.Mock).mockReturnValue({ sort: mockSort });

    await request(app).get('/api/calendar/tasks').set(AUTH);

    expect(mockSort).toHaveBeenCalledWith({ date: 1 });
  });

  it('returns 500 on a database error', async () => {
    (CalendarTask.find as jest.Mock).mockReturnValue({
      sort: jest.fn().mockRejectedValue(new Error('DB error')),
    });

    const res = await request(app).get('/api/calendar/tasks').set(AUTH);

    expect(res.status).toBe(500);
  });
});
