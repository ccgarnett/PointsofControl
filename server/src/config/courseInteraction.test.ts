import request from 'supertest';
import express from 'express';
import { getCourseInteractionAnalytics } from './courseInteractionController';
import { requireAuth, requireAdmin } from './authMiddleware';
import ClickEvent from './ClickEvent';
import Course from './Course';
import User from './User';
import jwt from 'jsonwebtoken';

const app = express();
app.use(express.json());
app.get('/api/admin/analytics/courses', requireAuth, requireAdmin, getCourseInteractionAnalytics);

jest.mock('./ClickEvent');
jest.mock('./Course');
jest.mock('./User');
jest.mock('jsonwebtoken');

const ADMIN_AUTH = { Authorization: 'Bearer valid.token' };

beforeEach(() => {
  (jwt.verify as jest.Mock).mockReturnValue({ id: 'user1', username: 'admin', role: 'Admin' });
});

// ── GET /api/admin/analytics/courses ─────────────────────────────────────────

describe('GET /api/admin/analytics/courses', () => {
  it('returns 401 with no token', async () => {
    const res = await request(app).get('/api/admin/analytics/courses');
    expect(res.status).toBe(401);
  });

  it('returns 403 for a non-admin user', async () => {
    (jwt.verify as jest.Mock).mockReturnValue({ id: 'user2', username: 'bob', role: 'User' });
    const res = await request(app)
      .get('/api/admin/analytics/courses')
      .set(ADMIN_AUTH);
    expect(res.status).toBe(403);
  });

  it('returns 200 with interactions sorted by totalInteractions descending', async () => {
    (Course.find as jest.Mock).mockResolvedValue([
      { _id: 'c1', courseId: 'POC-101', title: 'Mindset 101' },
      { _id: 'c2', courseId: 'POC-102', title: 'Focus 102' },
    ]);
    (ClickEvent.find as jest.Mock).mockResolvedValue([
      { courseId: 'c1', eventType: 'pageview' },
      { courseId: 'c1', eventType: 'enroll_click' },
      { courseId: 'c2', eventType: 'pageview' },
    ]);
    (User.find as jest.Mock).mockResolvedValue([
      { enrolledCourses: ['c1'] },
      { enrolledCourses: ['c1', 'c2'] },
    ]);

    const res = await request(app)
      .get('/api/admin/analytics/courses')
      .set(ADMIN_AUTH);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    // c1: 1 pageView + 1 enrollClick + 2 purchases = 4
    expect(res.body[0].courseId).toBe('POC-101');
    expect(res.body[0].pageViews).toBe(1);
    expect(res.body[0].enrollClicks).toBe(1);
    expect(res.body[0].purchases).toBe(2);
    expect(res.body[0].totalInteractions).toBe(4);
    // c2: 1 pageView + 0 enrollClicks + 1 purchase = 2
    expect(res.body[1].courseId).toBe('POC-102');
    expect(res.body[1].totalInteractions).toBe(2);
  });

  it('returns zero interactions when no events or enrollments exist', async () => {
    (Course.find as jest.Mock).mockResolvedValue([
      { _id: 'c1', courseId: 'POC-101', title: 'Mindset 101' },
    ]);
    (ClickEvent.find as jest.Mock).mockResolvedValue([]);
    (User.find as jest.Mock).mockResolvedValue([]);

    const res = await request(app)
      .get('/api/admin/analytics/courses')
      .set(ADMIN_AUTH);

    expect(res.status).toBe(200);
    expect(res.body[0].pageViews).toBe(0);
    expect(res.body[0].enrollClicks).toBe(0);
    expect(res.body[0].purchases).toBe(0);
    expect(res.body[0].totalInteractions).toBe(0);
  });

  it('passes a createdAt filter to ClickEvent.find when period=week', async () => {
    (Course.find as jest.Mock).mockResolvedValue([]);
    (ClickEvent.find as jest.Mock).mockResolvedValue([]);
    (User.find as jest.Mock).mockResolvedValue([]);

    const res = await request(app)
      .get('/api/admin/analytics/courses?period=week')
      .set(ADMIN_AUTH);

    expect(res.status).toBe(200);
    expect(ClickEvent.find).toHaveBeenCalledWith(
      expect.objectContaining({ createdAt: expect.any(Object) }),
      'courseId eventType'
    );
  });

  it('passes no filter to ClickEvent.find when no params given (all-time)', async () => {
    (Course.find as jest.Mock).mockResolvedValue([]);
    (ClickEvent.find as jest.Mock).mockResolvedValue([]);
    (User.find as jest.Mock).mockResolvedValue([]);

    const res = await request(app)
      .get('/api/admin/analytics/courses')
      .set(ADMIN_AUTH);

    expect(res.status).toBe(200);
    expect(ClickEvent.find).toHaveBeenCalledWith({}, 'courseId eventType');
  });

  it('returns 500 on a database error', async () => {
    (Course.find as jest.Mock).mockRejectedValue(new Error('DB error'));
    const res = await request(app)
      .get('/api/admin/analytics/courses')
      .set(ADMIN_AUTH);
    expect(res.status).toBe(500);
  });
});
