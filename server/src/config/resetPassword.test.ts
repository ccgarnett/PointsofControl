import request from 'supertest';
import express from 'express';
import User from './User';

jest.mock('./User');

const mockSendMail = jest.fn().mockResolvedValue({ messageId: 'test-id' });
jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({ sendMail: mockSendMail })),
}));

// Import after mocks are set up so the module-level transporter uses the mock
import { forgotPassword, resetPassword } from './authController';

const app = express();
app.use(express.json());
app.post('/api/auth/forgot-password', forgotPassword);
app.post('/api/auth/reset-password/:token', resetPassword);

beforeEach(() => {
  jest.clearAllMocks();
  mockSendMail.mockResolvedValue({ messageId: 'test-id' });
});

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

  it('returns 200, sets reset token, and calls sendMail when email is found', async () => {
    mockSendMail.mockResolvedValue({ messageId: 'test-id' });
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
    // Allow the fire-and-forget sendMail to resolve
    await Promise.resolve();
    expect(mockSendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'user@example.com',
        subject: expect.stringMatching(/password reset/i),
      })
    );
  });

  it('still returns 200 even if sendMail rejects (email failure is best-effort)', async () => {
    mockSendMail.mockRejectedValue(new Error('SMTP error'));
    (User.findOne as jest.Mock).mockResolvedValue({ _id: 'uid1', email: 'user@example.com' });
    (User.findByIdAndUpdate as jest.Mock).mockResolvedValue({});
    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'user@example.com' });
    expect(res.status).toBe(200);
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
