import request from 'supertest';
import express from 'express';
import { forgotPassword, resetPassword } from './authController';
import User from './User';

const app = express();
app.use(express.json());
app.post('/api/auth/forgot-password', forgotPassword);
app.post('/api/auth/reset-password/:token', resetPassword);

jest.mock('./User');

// ── POST /api/auth/forgot-password ────────────────────────────────────────────

describe('POST /api/auth/forgot-password', () => {
  it('returns 200 even when email is not found (no-reveal)', async () => {
    (User.findOne as jest.Mock).mockResolvedValue(null);
    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'unknown@example.com' });
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/if that email exists/i);
  });

  it('returns 200 and sets reset token when email is found', async () => {
    (User.findOne as jest.Mock).mockResolvedValue({ _id: 'uid1', email: 'user@example.com' });
    (User.findByIdAndUpdate as jest.Mock).mockResolvedValue({});
    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'user@example.com' });
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/if that email exists/i);
    expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
      'uid1',
      expect.objectContaining({
        resetPasswordToken: expect.any(String),
        resetPasswordExpires: expect.any(Date),
      })
    );
  });

  it('returns 400 when email field is missing', async () => {
    const res = await request(app).post('/api/auth/forgot-password').send({});
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/email is required/i);
  });

  it('returns 500 on a database error', async () => {
    (User.findOne as jest.Mock).mockRejectedValue(new Error('DB error'));
    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'user@example.com' });
    expect(res.status).toBe(500);
  });
});

// ── POST /api/auth/reset-password/:token ──────────────────────────────────────

describe('POST /api/auth/reset-password/:token', () => {
  it('returns 400 for an invalid or expired token', async () => {
    (User.findOne as jest.Mock).mockResolvedValue(null);
    const res = await request(app)
      .post('/api/auth/reset-password/badtoken')
      .send({ password: 'NewPass@123' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/invalid or expired/i);
  });

  it('returns 200 and resets password for a valid token', async () => {
    (User.findOne as jest.Mock).mockResolvedValue({ _id: 'uid1' });
    (User.findByIdAndUpdate as jest.Mock).mockResolvedValue({});
    const res = await request(app)
      .post('/api/auth/reset-password/validtoken')
      .send({ password: 'NewPass@123' });
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/password reset successful/i);
    expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
      'uid1',
      expect.objectContaining({
        $set: expect.objectContaining({ passwordHash: expect.any(String) }),
        $unset: expect.objectContaining({ resetPasswordToken: 1, resetPasswordExpires: 1 }),
      })
    );
  });

  it('returns 400 when password is missing', async () => {
    const res = await request(app)
      .post('/api/auth/reset-password/sometoken')
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/password is required/i);
  });

  it('returns 500 on a database error', async () => {
    (User.findOne as jest.Mock).mockRejectedValue(new Error('DB error'));
    const res = await request(app)
      .post('/api/auth/reset-password/sometoken')
      .send({ password: 'NewPass@123' });
    expect(res.status).toBe(500);
  });
});
