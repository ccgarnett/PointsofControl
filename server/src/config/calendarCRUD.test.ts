import request from 'supertest';
import express from 'express';
import { Types } from 'mongoose';
import jwt from 'jsonwebtoken';
import {
  createCalendarTask,
  updateCalendarTask,
  deleteCalendarTask,
} from './calendarController';
import { requireAuth } from './authMiddleware';
import CalendarTask from './CalendarTask';

jest.mock('./CalendarTask');
jest.mock('jsonwebtoken');

const app = express();
app.use(express.json());
app.post('/api/calendar/tasks', requireAuth, createCalendarTask);
app.patch('/api/calendar/tasks/:id', requireAuth, updateCalendarTask);
app.delete('/api/calendar/tasks/:id', requireAuth, deleteCalendarTask);

const AUTH = { Authorization: 'Bearer valid.token' };
const USER_ID = new Types.ObjectId().toHexString();
const TASK_ID = new Types.ObjectId().toHexString();

beforeEach(() => {
  jest.clearAllMocks();
  (jwt.verify as jest.Mock).mockReturnValue({ id: USER_ID, username: 'testuser', role: 'User' });
});

// ── POST /api/calendar/tasks ──────────────────────────────────────────────

describe('POST /api/calendar/tasks', () => {
  it('returns 401 without a token', async () => {
    const res = await request(app).post('/api/calendar/tasks').send({ title: 'T', date: '2026-04-14' });
    expect(res.status).toBe(401);
  });

  it('returns 400 when title is missing', async () => {
    const res = await request(app).post('/api/calendar/tasks').set(AUTH).send({ date: '2026-04-14' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/title required/i);
  });

  it('returns 400 when date is missing', async () => {
    const res = await request(app).post('/api/calendar/tasks').set(AUTH).send({ title: 'Workout' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/date required/i);
  });

  it('returns 400 when date is invalid', async () => {
    const res = await request(app).post('/api/calendar/tasks').set(AUTH).send({ title: 'Workout', date: 'not-a-date' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/invalid date/i);
  });

  it('creates a task and returns 201', async () => {
    const created = {
      _id: TASK_ID,
      userId: USER_ID,
      title: 'Workout',
      date: '2026-04-14T00:00:00.000Z',
      completed: false,
    };
    (CalendarTask.create as jest.Mock).mockResolvedValue(created);

    const res = await request(app)
      .post('/api/calendar/tasks')
      .set(AUTH)
      .send({ title: 'Workout', date: '2026-04-14' });

    expect(res.status).toBe(201);
    expect(res.body.title).toBe('Workout');
    expect(CalendarTask.create).toHaveBeenCalledWith(
      expect.objectContaining({ userId: USER_ID, title: 'Workout', completed: false })
    );
  });

  it('stores description when provided', async () => {
    const created = { _id: TASK_ID, userId: USER_ID, title: 'Workout', description: 'Morning run', date: '2026-04-14T00:00:00.000Z', completed: false };
    (CalendarTask.create as jest.Mock).mockResolvedValue(created);

    const res = await request(app)
      .post('/api/calendar/tasks')
      .set(AUTH)
      .send({ title: 'Workout', description: 'Morning run', date: '2026-04-14' });

    expect(res.status).toBe(201);
    expect(CalendarTask.create).toHaveBeenCalledWith(
      expect.objectContaining({ description: 'Morning run' })
    );
  });

  it('returns 500 on a database error', async () => {
    (CalendarTask.create as jest.Mock).mockRejectedValue(new Error('DB error'));
    const res = await request(app).post('/api/calendar/tasks').set(AUTH).send({ title: 'T', date: '2026-04-14' });
    expect(res.status).toBe(500);
  });
});

// ── PATCH /api/calendar/tasks/:id ─────────────────────────────────────────

describe('PATCH /api/calendar/tasks/:id', () => {
  it('returns 401 without a token', async () => {
    const res = await request(app).patch(`/api/calendar/tasks/${TASK_ID}`).send({ title: 'New' });
    expect(res.status).toBe(401);
  });

  it('returns 400 for an invalid task id', async () => {
    const res = await request(app).patch('/api/calendar/tasks/bad-id').set(AUTH).send({ title: 'New' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/invalid task id/i);
  });

  it('returns 400 when no updatable fields are provided', async () => {
    const res = await request(app).patch(`/api/calendar/tasks/${TASK_ID}`).set(AUTH).send({});
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/no fields to update/i);
  });

  it('returns 400 when title is an empty string', async () => {
    const res = await request(app).patch(`/api/calendar/tasks/${TASK_ID}`).set(AUTH).send({ title: '' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/title cannot be empty/i);
  });

  it('returns 404 when the task is not found', async () => {
    (CalendarTask.findOneAndUpdate as jest.Mock).mockResolvedValue(null);
    const res = await request(app).patch(`/api/calendar/tasks/${TASK_ID}`).set(AUTH).send({ title: 'Updated' });
    expect(res.status).toBe(404);
  });

  it('updates the title and returns the task', async () => {
    const updated = { _id: TASK_ID, userId: USER_ID, title: 'Updated', date: '2026-04-14T00:00:00.000Z', completed: false };
    (CalendarTask.findOneAndUpdate as jest.Mock).mockResolvedValue(updated);

    const res = await request(app).patch(`/api/calendar/tasks/${TASK_ID}`).set(AUTH).send({ title: 'Updated' });
    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Updated');
    expect(CalendarTask.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: TASK_ID, userId: USER_ID },
      expect.objectContaining({ title: 'Updated' }),
      { new: true }
    );
  });

  it('toggles completed field', async () => {
    const updated = { _id: TASK_ID, userId: USER_ID, title: 'T', completed: true };
    (CalendarTask.findOneAndUpdate as jest.Mock).mockResolvedValue(updated);

    const res = await request(app).patch(`/api/calendar/tasks/${TASK_ID}`).set(AUTH).send({ completed: true });
    expect(res.status).toBe(200);
    expect(res.body.completed).toBe(true);
  });

  it('returns 400 for an invalid date value', async () => {
    const res = await request(app).patch(`/api/calendar/tasks/${TASK_ID}`).set(AUTH).send({ date: 'bad-date' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/invalid date/i);
  });

  it('returns 500 on a database error', async () => {
    (CalendarTask.findOneAndUpdate as jest.Mock).mockRejectedValue(new Error('DB error'));
    const res = await request(app).patch(`/api/calendar/tasks/${TASK_ID}`).set(AUTH).send({ title: 'T' });
    expect(res.status).toBe(500);
  });
});

// ── DELETE /api/calendar/tasks/:id ────────────────────────────────────────

describe('DELETE /api/calendar/tasks/:id', () => {
  it('returns 401 without a token', async () => {
    const res = await request(app).delete(`/api/calendar/tasks/${TASK_ID}`);
    expect(res.status).toBe(401);
  });

  it('returns 400 for an invalid task id', async () => {
    const res = await request(app).delete('/api/calendar/tasks/bad-id').set(AUTH);
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/invalid task id/i);
  });

  it('returns 404 when the task is not found', async () => {
    (CalendarTask.findOneAndDelete as jest.Mock).mockResolvedValue(null);
    const res = await request(app).delete(`/api/calendar/tasks/${TASK_ID}`).set(AUTH);
    expect(res.status).toBe(404);
  });

  it('deletes the task and returns a success message', async () => {
    (CalendarTask.findOneAndDelete as jest.Mock).mockResolvedValue({ _id: TASK_ID });
    const res = await request(app).delete(`/api/calendar/tasks/${TASK_ID}`).set(AUTH);
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/task deleted/i);
    expect(CalendarTask.findOneAndDelete).toHaveBeenCalledWith({ _id: TASK_ID, userId: USER_ID });
  });

  it('returns 500 on a database error', async () => {
    (CalendarTask.findOneAndDelete as jest.Mock).mockRejectedValue(new Error('DB error'));
    const res = await request(app).delete(`/api/calendar/tasks/${TASK_ID}`).set(AUTH);
    expect(res.status).toBe(500);
  });
});
