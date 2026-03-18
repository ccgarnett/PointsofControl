import request from 'supertest';
import express from 'express';
import { reactToMessage, acknowledgeMessage } from './messageController';
import { requireAuth } from './authMiddleware';
import Message from './Message';
import jwt from 'jsonwebtoken';

const app = express();
app.use(express.json());
app.post('/api/messages/:id/react', requireAuth, reactToMessage);
app.post('/api/messages/:id/acknowledge', requireAuth, acknowledgeMessage);

jest.mock('./Message');
jest.mock('jsonwebtoken');

beforeEach(() => {
  (jwt.verify as jest.Mock).mockReturnValue({ id: 'user1', username: 'bob', role: 'User' });
});

const AUTH = { Authorization: 'Bearer valid.token' };

// ── Helpers ────────────────────────────────────────────────────────────────────
const makeMockMsg = (overrides = {}) => ({
  _id: 'msg1',
  content: 'Hello',
  postedBy: 'chase',
  reactions: [] as { userId: string; type: string }[],
  acknowledgedBy: [] as string[],
  save: jest.fn().mockResolvedValue(undefined),
  ...overrides,
});

describe('POST /api/messages/:id/react', () => {
  it('returns 401 with no token', async () => {
    const res = await request(app).post('/api/messages/msg1/react').send({ type: '👍' });
    expect(res.status).toBe(401);
  });

  it('returns 400 for an invalid reaction type', async () => {
    (Message.findById as jest.Mock).mockResolvedValue(makeMockMsg());
    const res = await request(app)
      .post('/api/messages/msg1/react')
      .set(AUTH)
      .send({ type: 'invalid' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/invalid reaction type/i);
  });

  it('returns 404 when message does not exist', async () => {
    (Message.findById as jest.Mock).mockResolvedValue(null);
    const res = await request(app)
      .post('/api/messages/msg1/react')
      .set(AUTH)
      .send({ type: '👍' });
    expect(res.status).toBe(404);
  });

  it('adds a reaction when the user has not yet reacted with that type', async () => {
    const mockMsg = makeMockMsg();
    (Message.findById as jest.Mock).mockResolvedValue(mockMsg);

    const res = await request(app)
      .post('/api/messages/msg1/react')
      .set(AUTH)
      .send({ type: '👍' });

    expect(res.status).toBe(200);
    expect(mockMsg.reactions).toHaveLength(1);
    expect(mockMsg.reactions[0]).toEqual({ userId: 'user1', type: '👍' });
    expect(mockMsg.save).toHaveBeenCalled();
  });

  it('removes the reaction when the user reacts again (toggle off)', async () => {
    const mockMsg = makeMockMsg({
      reactions: [{ userId: 'user1', type: '👍' }],
    });
    (Message.findById as jest.Mock).mockResolvedValue(mockMsg);

    const res = await request(app)
      .post('/api/messages/msg1/react')
      .set(AUTH)
      .send({ type: '👍' });

    expect(res.status).toBe(200);
    expect(mockMsg.reactions).toHaveLength(0);
    expect(mockMsg.save).toHaveBeenCalled();
  });

  it('allows reacting with a different type independently', async () => {
    const mockMsg = makeMockMsg({
      reactions: [{ userId: 'user1', type: '👍' }],
    });
    (Message.findById as jest.Mock).mockResolvedValue(mockMsg);

    await request(app)
      .post('/api/messages/msg1/react')
      .set(AUTH)
      .send({ type: '❤️' });

    expect(mockMsg.reactions).toHaveLength(2);
  });

  it('returns 500 on a server error', async () => {
    (Message.findById as jest.Mock).mockRejectedValue(new Error('DB error'));
    const res = await request(app)
      .post('/api/messages/msg1/react')
      .set(AUTH)
      .send({ type: '👍' });
    expect(res.status).toBe(500);
  });
});

describe('POST /api/messages/:id/acknowledge', () => {
  it('returns 401 with no token', async () => {
    const res = await request(app).post('/api/messages/msg1/acknowledge');
    expect(res.status).toBe(401);
  });

  it('returns 404 when message does not exist', async () => {
    (Message.findById as jest.Mock).mockResolvedValue(null);
    const res = await request(app)
      .post('/api/messages/msg1/acknowledge')
      .set(AUTH);
    expect(res.status).toBe(404);
  });

  it('adds userId to acknowledgedBy on first acknowledge', async () => {
    const mockMsg = makeMockMsg();
    (Message.findById as jest.Mock).mockResolvedValue(mockMsg);

    const res = await request(app)
      .post('/api/messages/msg1/acknowledge')
      .set(AUTH);

    expect(res.status).toBe(200);
    expect(mockMsg.acknowledgedBy).toContain('user1');
    expect(mockMsg.save).toHaveBeenCalled();
  });

  it('is idempotent — does not duplicate if already acknowledged', async () => {
    const mockMsg = makeMockMsg({ acknowledgedBy: ['user1'] });
    (Message.findById as jest.Mock).mockResolvedValue(mockMsg);

    await request(app).post('/api/messages/msg1/acknowledge').set(AUTH);

    expect(mockMsg.acknowledgedBy).toHaveLength(1);
    expect(mockMsg.save).not.toHaveBeenCalled();
  });

  it('returns 500 on a server error', async () => {
    (Message.findById as jest.Mock).mockRejectedValue(new Error('DB error'));
    const res = await request(app)
      .post('/api/messages/msg1/acknowledge')
      .set(AUTH);
    expect(res.status).toBe(500);
  });
});
