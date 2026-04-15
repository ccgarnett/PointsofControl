import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';
import { toggleModuleComplete, getUserProgress } from './courseController';
import { requireAuth } from './authMiddleware';
import Course from './Course';
import UserProgress from './UserProgress';

jest.mock('./Course');
jest.mock('./UserProgress');
jest.mock('./User');
jest.mock('./ClickEvent');
jest.mock('jsonwebtoken');

const app = express();
app.use(express.json());
app.get('/api/courses/:courseId/progress', requireAuth, getUserProgress);
app.patch('/api/courses/:courseId/modules/:moduleIndex/complete', requireAuth, toggleModuleComplete);

const VALID_COURSE_ID = new Types.ObjectId().toHexString();
const AUTH = { Authorization: 'Bearer user.token' };

beforeEach(() => {
  jest.clearAllMocks();
  (jwt.verify as jest.Mock).mockReturnValue({ id: 'uid1', username: 'chase', role: 'User' });
});

// ── GET /api/courses/:courseId/progress ────────────────────────────────────────

describe('GET /api/courses/:courseId/progress', () => {
  it('returns 401 without a token', async () => {
    const res = await request(app).get(`/api/courses/${VALID_COURSE_ID}/progress`);
    expect(res.status).toBe(401);
  });

  it('returns completedModules array for authenticated user', async () => {
    (UserProgress.findOne as jest.Mock).mockResolvedValue({ completedModules: [0, 2] });
    const res = await request(app)
      .get(`/api/courses/${VALID_COURSE_ID}/progress`)
      .set(AUTH);
    expect(res.status).toBe(200);
    expect(res.body.completedModules).toEqual([0, 2]);
  });

  it('returns empty array when no progress record exists', async () => {
    (UserProgress.findOne as jest.Mock).mockResolvedValue(null);
    const res = await request(app)
      .get(`/api/courses/${VALID_COURSE_ID}/progress`)
      .set(AUTH);
    expect(res.status).toBe(200);
    expect(res.body.completedModules).toEqual([]);
  });

  it('returns 500 on a database error', async () => {
    (UserProgress.findOne as jest.Mock).mockRejectedValue(new Error('DB error'));
    const res = await request(app)
      .get(`/api/courses/${VALID_COURSE_ID}/progress`)
      .set(AUTH);
    expect(res.status).toBe(500);
  });
});

// ── PATCH /api/courses/:courseId/modules/:moduleIndex/complete ─────────────────

describe('PATCH /api/courses/:courseId/modules/:moduleIndex/complete', () => {
  const mockCourse = {
    _id: VALID_COURSE_ID,
    modules: [
      { title: 'Intro', contentUrl: '/file.pdf', completed: false },
      { title: 'Advanced', contentUrl: '/file2.pdf', completed: false },
    ],
  };

  it('returns 401 without a token', async () => {
    const res = await request(app).patch(`/api/courses/${VALID_COURSE_ID}/modules/0/complete`);
    expect(res.status).toBe(401);
  });

  it('returns 404 when course is not found', async () => {
    (Course.findById as jest.Mock).mockResolvedValue(null);
    const res = await request(app)
      .patch(`/api/courses/${VALID_COURSE_ID}/modules/0/complete`)
      .set(AUTH);
    expect(res.status).toBe(404);
  });

  it('returns 400 for an invalid module index', async () => {
    (Course.findById as jest.Mock).mockResolvedValue(mockCourse);
    const res = await request(app)
      .patch(`/api/courses/${VALID_COURSE_ID}/modules/99/complete`)
      .set(AUTH);
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/invalid module index/i);
  });

  it('marks a module complete (adds to completedModules) when not yet complete', async () => {
    (Course.findById as jest.Mock).mockResolvedValue(mockCourse);
    (UserProgress.findOne as jest.Mock).mockResolvedValue(null); // no prior progress
    (UserProgress.findOneAndUpdate as jest.Mock).mockResolvedValue({ completedModules: [0] });

    const res = await request(app)
      .patch(`/api/courses/${VALID_COURSE_ID}/modules/0/complete`)
      .set(AUTH);

    expect(res.status).toBe(200);
    expect(res.body.completed).toBe(true);
    expect(UserProgress.findOneAndUpdate).toHaveBeenCalledWith(
      { userId: 'uid1', courseId: VALID_COURSE_ID },
      { $addToSet: { completedModules: 0 } },
      expect.objectContaining({ upsert: true, new: true })
    );
  });

  it('unmarks a module (removes from completedModules) when already complete', async () => {
    (Course.findById as jest.Mock).mockResolvedValue(mockCourse);
    (UserProgress.findOne as jest.Mock).mockResolvedValue({ completedModules: [0] });
    (UserProgress.findOneAndUpdate as jest.Mock).mockResolvedValue({ completedModules: [] });

    const res = await request(app)
      .patch(`/api/courses/${VALID_COURSE_ID}/modules/0/complete`)
      .set(AUTH);

    expect(res.status).toBe(200);
    expect(res.body.completed).toBe(false);
    expect(UserProgress.findOneAndUpdate).toHaveBeenCalledWith(
      { userId: 'uid1', courseId: VALID_COURSE_ID },
      { $pull: { completedModules: 0 } },
      expect.objectContaining({ upsert: true, new: true })
    );
  });

  it('returns 500 on a database error', async () => {
    (Course.findById as jest.Mock).mockRejectedValue(new Error('DB error'));
    const res = await request(app)
      .patch(`/api/courses/${VALID_COURSE_ID}/modules/0/complete`)
      .set(AUTH);
    expect(res.status).toBe(500);
  });
});
