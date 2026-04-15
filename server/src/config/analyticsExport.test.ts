import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import { exportAnalyticsCSV } from './analyticsExportController';
import { requireAuth, requireAdmin } from './authMiddleware';
import Course from './Course';
import User from './User';
import ClickEvent from './ClickEvent';

jest.mock('./Course');
jest.mock('./User');
jest.mock('./ClickEvent');
jest.mock('jsonwebtoken');

const app = express();
app.use(express.json());
app.get('/api/admin/analytics/export/csv', requireAuth, requireAdmin, exportAnalyticsCSV);

const ADMIN_TOKEN = { Authorization: 'Bearer admin.token' };

beforeEach(() => {
  jest.clearAllMocks();
  (jwt.verify as jest.Mock).mockReturnValue({ id: 'u1', username: 'Jordan', role: 'Admin' });
});

describe('GET /api/admin/analytics/export/csv', () => {
  it('returns 401 without a token', async () => {
    const res = await request(app).get('/api/admin/analytics/export/csv');
    expect(res.status).toBe(401);
  });

  it('returns 403 for a non-admin user', async () => {
    (jwt.verify as jest.Mock).mockReturnValue({ id: 'u1', username: 'bob', role: 'User' });
    const res = await request(app)
      .get('/api/admin/analytics/export/csv')
      .set(ADMIN_TOKEN);
    expect(res.status).toBe(403);
  });

  it('returns 200 with text/csv content type', async () => {
    (Course.find as jest.Mock).mockResolvedValue([]);
    (User.find as jest.Mock).mockResolvedValue([]);
    (ClickEvent.find as jest.Mock).mockResolvedValue([]);

    const res = await request(app)
      .get('/api/admin/analytics/export/csv')
      .set(ADMIN_TOKEN);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/csv/);
  });

  it('returns Content-Disposition attachment header', async () => {
    (Course.find as jest.Mock).mockResolvedValue([]);
    (User.find as jest.Mock).mockResolvedValue([]);
    (ClickEvent.find as jest.Mock).mockResolvedValue([]);

    const res = await request(app)
      .get('/api/admin/analytics/export/csv')
      .set(ADMIN_TOKEN);

    expect(res.headers['content-disposition']).toMatch(/attachment/);
    expect(res.headers['content-disposition']).toMatch(/analytics\.csv/);
  });

  it('includes CSV header row', async () => {
    (Course.find as jest.Mock).mockResolvedValue([]);
    (User.find as jest.Mock).mockResolvedValue([]);
    (ClickEvent.find as jest.Mock).mockResolvedValue([]);

    const res = await request(app)
      .get('/api/admin/analytics/export/csv')
      .set(ADMIN_TOKEN);

    expect(res.text).toContain('Course ID,Title,Price,Enrollments,Revenue');
  });

  it('includes a row for each course with correct values', async () => {
    (Course.find as jest.Mock).mockResolvedValue([
      { _id: 'c1', courseId: 'POC-101', title: 'Mindset', price: 100 },
    ]);
    (User.find as jest.Mock).mockResolvedValue([
      { enrolledCourses: ['c1', 'c1'] },
    ]);
    (ClickEvent.find as jest.Mock).mockResolvedValue([
      { courseId: 'c1', eventType: 'pageview', userId: 'u1', duration: undefined },
      { courseId: 'c1', eventType: 'pageview', userId: 'u2', duration: undefined },
      { courseId: 'c1', eventType: 'enroll_click', userId: 'u1', duration: undefined },
      { courseId: 'c1', eventType: 'time_on_page', userId: 'u1', duration: 60 },
    ]);

    const res = await request(app)
      .get('/api/admin/analytics/export/csv')
      .set(ADMIN_TOKEN);

    expect(res.status).toBe(200);
    // 2 enrollments × $100 = $200 revenue; 2 unique pageviews; 1 enroll click; 50% conversion; 60s avg
    expect(res.text).toContain('POC-101');
    expect(res.text).toContain('200'); // revenue
    expect(res.text).toContain('50');  // conversion rate
    expect(res.text).toContain('60');  // avg duration
  });

  it('returns 500 on a database error', async () => {
    (Course.find as jest.Mock).mockRejectedValue(new Error('DB error'));
    const res = await request(app)
      .get('/api/admin/analytics/export/csv')
      .set(ADMIN_TOKEN);
    expect(res.status).toBe(500);
  });
});
