import request from 'supertest';
import express from 'express';
import { logClick, getClickAnalytics, getTimeOnPageAnalytics } from './clickController';
import { requireAuth, requireAdmin } from './authMiddleware';
import ClickEvent from './ClickEvent';
import Course from './Course';
import jwt from 'jsonwebtoken';

const app = express();
app.use(express.json());
app.post('/api/analytics/click', logClick);
app.get('/api/admin/analytics/clicks', requireAuth, requireAdmin, getClickAnalytics);
app.get('/api/admin/analytics/time-on-page', requireAuth, requireAdmin, getTimeOnPageAnalytics);

jest.mock('./ClickEvent');
jest.mock('./Course');
jest.mock('jsonwebtoken');

const ADMIN_AUTH = { Authorization: 'Bearer valid.token' };

beforeEach(() => {
  (jwt.verify as jest.Mock).mockReturnValue({ id: 'user1', username: 'admin', role: 'Admin' });
});

// ── POST /api/analytics/click ──────────────────────────────────────────────────

describe('POST /api/analytics/click', () => {
  it('returns 201 and logs an enroll_click event', async () => {
    (ClickEvent.create as jest.Mock).mockResolvedValue({});
    const res = await request(app)
      .post('/api/analytics/click')
      .send({ courseId: 'c1', userId: 'u1', eventType: 'enroll_click' });
    expect(res.status).toBe(201);
    expect(ClickEvent.create).toHaveBeenCalledWith({ courseId: 'c1', userId: 'u1', eventType: 'enroll_click' });
  });

  it('returns 201 and logs a pageview event with null userId for anonymous', async () => {
    (ClickEvent.create as jest.Mock).mockResolvedValue({});
    const res = await request(app)
      .post('/api/analytics/click')
      .send({ courseId: 'c1', userId: null, eventType: 'pageview' });
    expect(res.status).toBe(201);
    expect(ClickEvent.create).toHaveBeenCalledWith({ courseId: 'c1', userId: null, eventType: 'pageview' });
  });

  it('returns 400 when courseId is missing', async () => {
    const res = await request(app)
      .post('/api/analytics/click')
      .send({ eventType: 'enroll_click' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/courseId and eventType are required/i);
  });

  it('returns 400 when eventType is missing', async () => {
    const res = await request(app)
      .post('/api/analytics/click')
      .send({ courseId: 'c1' });
    expect(res.status).toBe(400);
  });

  it('returns 400 for an invalid eventType', async () => {
    const res = await request(app)
      .post('/api/analytics/click')
      .send({ courseId: 'c1', eventType: 'purchase' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/invalid eventType/i);
  });

  it('returns 500 on a database error', async () => {
    (ClickEvent.create as jest.Mock).mockRejectedValue(new Error('DB error'));
    const res = await request(app)
      .post('/api/analytics/click')
      .send({ courseId: 'c1', eventType: 'enroll_click' });
    expect(res.status).toBe(500);
  });
});

// ── GET /api/admin/analytics/clicks ───────────────────────────────────────────

describe('GET /api/admin/analytics/clicks', () => {
  it('returns 401 with no token', async () => {
    const res = await request(app).get('/api/admin/analytics/clicks');
    expect(res.status).toBe(401);
  });

  it('returns 403 for a non-admin user', async () => {
    (jwt.verify as jest.Mock).mockReturnValue({ id: 'user2', username: 'bob', role: 'User' });
    const res = await request(app)
      .get('/api/admin/analytics/clicks')
      .set(ADMIN_AUTH);
    expect(res.status).toBe(403);
  });

  it('returns 200 with unique pageview counts and conversion rate per course', async () => {
    (Course.find as jest.Mock).mockResolvedValue([
      { _id: 'c1', courseId: 'POC-101', title: 'Mindset 101' },
    ]);
    (ClickEvent.find as jest.Mock).mockResolvedValue([
      // Two pageviews from the same logged-in user — should count as 1
      { courseId: 'c1', eventType: 'pageview', userId: 'u1' },
      { courseId: 'c1', eventType: 'pageview', userId: 'u1' },
      { courseId: 'c1', eventType: 'enroll_click', userId: 'u1' },
    ]);

    const res = await request(app)
      .get('/api/admin/analytics/clicks')
      .set(ADMIN_AUTH);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0]).toMatchObject({
      courseId: 'POC-101',
      title: 'Mindset 101',
      pageviews: 1,      // deduplicated: 2 visits by u1 → 1 unique
      enrollClicks: 1,
      conversionRate: 100,
    });
  });

  it('counts each anonymous (null userId) pageview separately', async () => {
    (Course.find as jest.Mock).mockResolvedValue([
      { _id: 'c1', courseId: 'POC-101', title: 'Mindset 101' },
    ]);
    (ClickEvent.find as jest.Mock).mockResolvedValue([
      { courseId: 'c1', eventType: 'pageview', userId: null },
      { courseId: 'c1', eventType: 'pageview', userId: null },
      { courseId: 'c1', eventType: 'enroll_click', userId: 'u1' },
    ]);

    const res = await request(app)
      .get('/api/admin/analytics/clicks')
      .set(ADMIN_AUTH);

    expect(res.status).toBe(200);
    expect(res.body[0].pageviews).toBe(2); // 2 anonymous visits = 2 (can't deduplicate)
    expect(res.body[0].conversionRate).toBe(50);
  });

  it('returns conversionRate 0 when there are no pageviews', async () => {
    (Course.find as jest.Mock).mockResolvedValue([
      { _id: 'c1', courseId: 'POC-101', title: 'Mindset 101' },
    ]);
    (ClickEvent.find as jest.Mock).mockResolvedValue([]);

    const res = await request(app)
      .get('/api/admin/analytics/clicks')
      .set(ADMIN_AUTH);

    expect(res.status).toBe(200);
    expect(res.body[0].conversionRate).toBe(0);
    expect(res.body[0].enrollClicks).toBe(0);
    expect(res.body[0].pageviews).toBe(0);
  });

  it('returns 500 on a database error', async () => {
    (Course.find as jest.Mock).mockRejectedValue(new Error('DB error'));
    const res = await request(app)
      .get('/api/admin/analytics/clicks')
      .set(ADMIN_AUTH);
    expect(res.status).toBe(500);
  });
});

// ── POST /api/analytics/click — time_on_page ───────────────────────────────────

describe('POST /api/analytics/click — time_on_page event', () => {
  it('returns 201 and stores duration for a time_on_page event', async () => {
    (ClickEvent.create as jest.Mock).mockResolvedValue({});
    const res = await request(app)
      .post('/api/analytics/click')
      .send({ courseId: 'c1', userId: 'u1', eventType: 'time_on_page', duration: 42 });
    expect(res.status).toBe(201);
    expect(ClickEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({ courseId: 'c1', eventType: 'time_on_page', duration: 42 })
    );
  });

  it('does not store duration for non-time_on_page events', async () => {
    (ClickEvent.create as jest.Mock).mockResolvedValue({});
    const res = await request(app)
      .post('/api/analytics/click')
      .send({ courseId: 'c1', eventType: 'pageview', duration: 99 });
    expect(res.status).toBe(201);
    const created = (ClickEvent.create as jest.Mock).mock.calls[0][0];
    expect(created.duration).toBeUndefined();
  });

  it('returns 400 for invalid eventType', async () => {
    const res = await request(app)
      .post('/api/analytics/click')
      .send({ courseId: 'c1', eventType: 'invalid_type' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/invalid eventType/i);
  });
});

// ── GET /api/admin/analytics/time-on-page ─────────────────────────────────────

describe('GET /api/admin/analytics/time-on-page', () => {
  it('returns 401 without a token', async () => {
    const res = await request(app).get('/api/admin/analytics/time-on-page');
    expect(res.status).toBe(401);
  });

  it('returns 403 for a non-admin user', async () => {
    (jwt.verify as jest.Mock).mockReturnValue({ id: 'u1', username: 'bob', role: 'User' });
    const res = await request(app)
      .get('/api/admin/analytics/time-on-page')
      .set(ADMIN_AUTH);
    expect(res.status).toBe(403);
  });

  it('returns 200 with avgDuration and sessionCount per course', async () => {
    (jwt.verify as jest.Mock).mockReturnValue({ id: 'u1', username: 'admin', role: 'Admin' });
    (Course.find as jest.Mock).mockResolvedValue([
      { _id: 'c1', courseId: 'POC-101', title: 'Mindset 101' },
    ]);
    (ClickEvent.find as jest.Mock).mockResolvedValue([
      { courseId: 'c1', duration: 30 },
      { courseId: 'c1', duration: 60 },
    ]);

    const res = await request(app)
      .get('/api/admin/analytics/time-on-page')
      .set(ADMIN_AUTH);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0]).toMatchObject({
      courseId: 'POC-101',
      title: 'Mindset 101',
      avgDuration: 45,
      sessionCount: 2,
    });
  });

  it('returns avgDuration 0 and sessionCount 0 when no time_on_page events exist', async () => {
    (jwt.verify as jest.Mock).mockReturnValue({ id: 'u1', username: 'admin', role: 'Admin' });
    (Course.find as jest.Mock).mockResolvedValue([
      { _id: 'c1', courseId: 'POC-101', title: 'Mindset 101' },
    ]);
    (ClickEvent.find as jest.Mock).mockResolvedValue([]);

    const res = await request(app)
      .get('/api/admin/analytics/time-on-page')
      .set(ADMIN_AUTH);

    expect(res.status).toBe(200);
    expect(res.body[0].avgDuration).toBe(0);
    expect(res.body[0].sessionCount).toBe(0);
  });

  it('returns 500 on a database error', async () => {
    (jwt.verify as jest.Mock).mockReturnValue({ id: 'u1', username: 'admin', role: 'Admin' });
    (Course.find as jest.Mock).mockRejectedValue(new Error('DB error'));
    const res = await request(app)
      .get('/api/admin/analytics/time-on-page')
      .set(ADMIN_AUTH);
    expect(res.status).toBe(500);
  });
});
