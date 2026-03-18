import request from 'supertest';
import express from 'express';
import { getPurchaseAnalytics } from './courseController';
import { requireAuth, requireAdmin } from './authMiddleware';
import Course from './Course';
import User from './User';
import jwt from 'jsonwebtoken';

const app = express();
app.use(express.json());
app.get('/api/admin/analytics/purchases', requireAuth, requireAdmin, getPurchaseAnalytics);

jest.mock('./Course');
jest.mock('./User');
jest.mock('jsonwebtoken');

const JWT_SECRET = 'poc_secret_key';

const makeToken = (role: string) => `Bearer valid.token.${role}`;

beforeEach(() => {
  (jwt.verify as jest.Mock).mockImplementation((token: string) => {
    if (token.endsWith('Admin')) return { id: 'uid1', username: 'chase', role: 'Admin' };
    if (token.endsWith('User')) return { id: 'uid2', username: 'bob', role: 'User' };
    throw new Error('invalid');
  });
});

describe('GET /api/admin/analytics/purchases', () => {
  it('returns 401 with no token', async () => {
    const res = await request(app).get('/api/admin/analytics/purchases');
    expect(res.status).toBe(401);
  });

  it('returns 403 for a non-admin user', async () => {
    const res = await request(app)
      .get('/api/admin/analytics/purchases')
      .set('Authorization', makeToken('User'));
    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/forbidden/i);
  });

  it('returns purchase counts and revenue per course for an admin', async () => {
    const mockCourses = [
      { _id: 'c1', courseId: 'POC-101', title: 'Mindset', price: 100 },
      { _id: 'c2', courseId: 'POC-102', title: 'Trading', price: 200 },
    ];
    const mockUsers = [
      { enrolledCourses: ['c1', 'c2'] },
      { enrolledCourses: ['c1'] },
    ];

    (Course.find as jest.Mock).mockResolvedValue(mockCourses);
    (User.find as jest.Mock).mockResolvedValue(mockUsers);

    const res = await request(app)
      .get('/api/admin/analytics/purchases')
      .set('Authorization', makeToken('Admin'));

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);

    const mindset = res.body.find((r: any) => r.courseId === 'POC-101');
    expect(mindset.purchaseCount).toBe(2);
    expect(mindset.totalRevenue).toBe(200);

    const trading = res.body.find((r: any) => r.courseId === 'POC-102');
    expect(trading.purchaseCount).toBe(1);
    expect(trading.totalRevenue).toBe(200);
  });

  it('returns zero purchaseCount for a course with no enrollments', async () => {
    (Course.find as jest.Mock).mockResolvedValue([
      { _id: 'c1', courseId: 'POC-101', title: 'Mindset', price: 100 },
    ]);
    (User.find as jest.Mock).mockResolvedValue([]);

    const res = await request(app)
      .get('/api/admin/analytics/purchases')
      .set('Authorization', makeToken('Admin'));

    expect(res.status).toBe(200);
    expect(res.body[0].purchaseCount).toBe(0);
    expect(res.body[0].totalRevenue).toBe(0);
  });

  it('returns results sorted by purchaseCount descending', async () => {
    (Course.find as jest.Mock).mockResolvedValue([
      { _id: 'c1', courseId: 'POC-101', title: 'A', price: 50 },
      { _id: 'c2', courseId: 'POC-102', title: 'B', price: 50 },
    ]);
    (User.find as jest.Mock).mockResolvedValue([
      { enrolledCourses: ['c2'] },
      { enrolledCourses: ['c2'] },
      { enrolledCourses: ['c1'] },
    ]);

    const res = await request(app)
      .get('/api/admin/analytics/purchases')
      .set('Authorization', makeToken('Admin'));

    expect(res.status).toBe(200);
    expect(res.body[0].courseId).toBe('POC-102');
    expect(res.body[1].courseId).toBe('POC-101');
  });

  it('returns 500 on a server error', async () => {
    (Course.find as jest.Mock).mockRejectedValue(new Error('DB error'));

    const res = await request(app)
      .get('/api/admin/analytics/purchases')
      .set('Authorization', makeToken('Admin'));

    expect(res.status).toBe(500);
  });
});

describe('requireAdmin middleware', () => {
  it('returns 403 when role is missing from token', async () => {
    (jwt.verify as jest.Mock).mockReturnValue({ id: 'uid1', username: 'chase' });
    const res = await request(app)
      .get('/api/admin/analytics/purchases')
      .set('Authorization', 'Bearer some.token');
    expect(res.status).toBe(403);
  });
});
