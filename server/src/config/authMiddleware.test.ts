import request from 'supertest';
import express from 'express';
import { requireAuth, AuthRequest } from './authMiddleware';
import jwt from 'jsonwebtoken';

jest.mock('jsonwebtoken');

const app = express();
app.use(express.json());
app.get('/protected', requireAuth, (req: AuthRequest, res: any) => {
  res.json({ ok: true, user: req.user });
});

describe('requireAuth middleware', () => {
  it('returns 401 when no Authorization header is present', async () => {
    const res = await request(app).get('/protected');
    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/unauthorized/i);
  });

  it('returns 401 when Authorization header does not start with Bearer', async () => {
    const res = await request(app).get('/protected').set('Authorization', 'Basic abc123');
    expect(res.status).toBe(401);
  });

  it('returns 401 when token is invalid or expired', async () => {
    (jwt.verify as jest.Mock).mockImplementation(() => { throw new Error('invalid token'); });
    const res = await request(app).get('/protected').set('Authorization', 'Bearer badtoken');
    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/invalid/i);
  });

  it('calls next and attaches user payload when token is valid', async () => {
    const payload = { id: 'uid1', username: 'chase', role: 'Admin' };
    (jwt.verify as jest.Mock).mockReturnValue(payload);
    const res = await request(app).get('/protected').set('Authorization', 'Bearer validtoken');
    expect(res.status).toBe(200);
    expect(res.body.user.username).toBe('chase');
    expect(res.body.user.role).toBe('Admin');
  });

  it('attaches the correct user id from the token', async () => {
    (jwt.verify as jest.Mock).mockReturnValue({ id: 'uid42', username: 'jordan', role: 'Admin' });
    const res = await request(app).get('/protected').set('Authorization', 'Bearer sometoken');
    expect(res.body.user.id).toBe('uid42');
  });
});
