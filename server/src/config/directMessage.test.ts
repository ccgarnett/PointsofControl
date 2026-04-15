import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';
import {
  getUserMessages,
  sendUserMessage,
  listConversations,
  getConversation,
  adminReply,
} from './directMessageController';
import { requireAuth, requireAdmin } from './authMiddleware';
import DirectMessage from './DirectMessage';
import User from './User';

jest.mock('./DirectMessage');
jest.mock('./User');
jest.mock('jsonwebtoken');

const app = express();
app.use(express.json());

app.get('/api/chat/messages', requireAuth, getUserMessages);
app.post('/api/chat/messages', requireAuth, sendUserMessage);
app.get('/api/admin/chat', requireAuth, requireAdmin, listConversations);
app.get('/api/admin/chat/:userId', requireAuth, requireAdmin, getConversation);
app.post('/api/admin/chat/:userId', requireAuth, requireAdmin, adminReply);

const USER_TOKEN = { Authorization: 'Bearer user.token' };
const ADMIN_TOKEN = { Authorization: 'Bearer admin.token' };

const VALID_USER_ID = new Types.ObjectId().toHexString();
const VALID_MSG_ID = new Types.ObjectId().toHexString();

beforeEach(() => {
  jest.clearAllMocks();
  (jwt.verify as jest.Mock).mockImplementation((_token: string) => {
    if (_token === 'admin.token') return { id: VALID_USER_ID, username: 'Jordan', role: 'Admin' };
    return { id: VALID_USER_ID, username: 'testuser', role: 'User' };
  });
});

// ── GET /api/chat/messages ─────────────────────────────────────────────────

describe('GET /api/chat/messages', () => {
  it('returns 401 without a token', async () => {
    const res = await request(app).get('/api/chat/messages');
    expect(res.status).toBe(401);
  });

  it('returns 200 with an array of messages for the authenticated user', async () => {
    const msgs = [
      { _id: VALID_MSG_ID, userId: VALID_USER_ID, fromAdmin: false, senderUsername: 'testuser', content: 'Hello', createdAt: new Date().toISOString() },
    ];
    (DirectMessage.find as jest.Mock).mockReturnValue({ sort: jest.fn().mockResolvedValue(msgs) });

    const res = await request(app).get('/api/chat/messages').set(USER_TOKEN);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(DirectMessage.find).toHaveBeenCalledWith({ userId: VALID_USER_ID });
  });

  it('returns 200 with an empty array when user has no messages', async () => {
    (DirectMessage.find as jest.Mock).mockReturnValue({ sort: jest.fn().mockResolvedValue([]) });
    const res = await request(app).get('/api/chat/messages').set(USER_TOKEN);
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('returns 500 on a database error', async () => {
    (DirectMessage.find as jest.Mock).mockReturnValue({ sort: jest.fn().mockRejectedValue(new Error('DB error')) });
    const res = await request(app).get('/api/chat/messages').set(USER_TOKEN);
    expect(res.status).toBe(500);
  });
});

// ── POST /api/chat/messages ────────────────────────────────────────────────

describe('POST /api/chat/messages', () => {
  it('returns 401 without a token', async () => {
    const res = await request(app).post('/api/chat/messages').send({ content: 'Hi' });
    expect(res.status).toBe(401);
  });

  it('returns 400 when content is missing', async () => {
    const res = await request(app).post('/api/chat/messages').set(USER_TOKEN).send({});
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/content required/i);
  });

  it('returns 400 when content is blank whitespace', async () => {
    const res = await request(app).post('/api/chat/messages').set(USER_TOKEN).send({ content: '   ' });
    expect(res.status).toBe(400);
  });

  it('creates a message and returns 201', async () => {
    const created = {
      _id: VALID_MSG_ID,
      userId: VALID_USER_ID,
      fromAdmin: false,
      senderUsername: 'testuser',
      content: 'Hello Jordan',
      createdAt: new Date().toISOString(),
    };
    (DirectMessage.create as jest.Mock).mockResolvedValue(created);

    const res = await request(app)
      .post('/api/chat/messages')
      .set(USER_TOKEN)
      .send({ content: 'Hello Jordan' });

    expect(res.status).toBe(201);
    expect(res.body.content).toBe('Hello Jordan');
    expect(res.body.fromAdmin).toBe(false);
    expect(DirectMessage.create).toHaveBeenCalledWith(
      expect.objectContaining({ userId: VALID_USER_ID, fromAdmin: false, content: 'Hello Jordan' })
    );
  });

  it('returns 500 on a database error', async () => {
    (DirectMessage.create as jest.Mock).mockRejectedValue(new Error('DB error'));
    const res = await request(app).post('/api/chat/messages').set(USER_TOKEN).send({ content: 'Hi' });
    expect(res.status).toBe(500);
  });
});

// ── GET /api/admin/chat ────────────────────────────────────────────────────

describe('GET /api/admin/chat', () => {
  it('returns 401 without a token', async () => {
    const res = await request(app).get('/api/admin/chat');
    expect(res.status).toBe(401);
  });

  it('returns 403 for a non-admin user', async () => {
    const res = await request(app).get('/api/admin/chat').set(USER_TOKEN);
    expect(res.status).toBe(403);
  });

  it('returns 200 with a list of conversations for admin', async () => {
    const aggResult = [
      { _id: VALID_USER_ID, latestMessage: 'Hi', latestAt: new Date(), latestFromAdmin: false },
    ];
    (DirectMessage.aggregate as jest.Mock).mockResolvedValue(aggResult);
    (User.find as jest.Mock).mockReturnValue({
      select: jest.fn().mockResolvedValue([{ _id: VALID_USER_ID, username: 'testuser' }]),
    });

    const res = await request(app).get('/api/admin/chat').set(ADMIN_TOKEN);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0].username).toBe('testuser');
  });

  it('returns 500 on a database error', async () => {
    (DirectMessage.aggregate as jest.Mock).mockRejectedValue(new Error('DB error'));
    const res = await request(app).get('/api/admin/chat').set(ADMIN_TOKEN);
    expect(res.status).toBe(500);
  });
});

// ── GET /api/admin/chat/:userId ────────────────────────────────────────────

describe('GET /api/admin/chat/:userId', () => {
  it('returns 401 without a token', async () => {
    const res = await request(app).get(`/api/admin/chat/${VALID_USER_ID}`);
    expect(res.status).toBe(401);
  });

  it('returns 403 for a non-admin user', async () => {
    const res = await request(app).get(`/api/admin/chat/${VALID_USER_ID}`).set(USER_TOKEN);
    expect(res.status).toBe(403);
  });

  it('returns 400 for an invalid userId', async () => {
    const res = await request(app).get('/api/admin/chat/not-an-id').set(ADMIN_TOKEN);
    expect(res.status).toBe(400);
  });

  it('returns 200 with conversation messages for a valid userId', async () => {
    const msgs = [
      { _id: VALID_MSG_ID, userId: VALID_USER_ID, fromAdmin: false, content: 'Hello', createdAt: new Date().toISOString() },
    ];
    (DirectMessage.find as jest.Mock).mockReturnValue({ sort: jest.fn().mockResolvedValue(msgs) });

    const res = await request(app).get(`/api/admin/chat/${VALID_USER_ID}`).set(ADMIN_TOKEN);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(DirectMessage.find).toHaveBeenCalledWith({ userId: VALID_USER_ID });
  });

  it('returns 500 on a database error', async () => {
    (DirectMessage.find as jest.Mock).mockReturnValue({ sort: jest.fn().mockRejectedValue(new Error('DB error')) });
    const res = await request(app).get(`/api/admin/chat/${VALID_USER_ID}`).set(ADMIN_TOKEN);
    expect(res.status).toBe(500);
  });
});

// ── POST /api/admin/chat/:userId ───────────────────────────────────────────

describe('POST /api/admin/chat/:userId', () => {
  it('returns 401 without a token', async () => {
    const res = await request(app).post(`/api/admin/chat/${VALID_USER_ID}`).send({ content: 'Hi' });
    expect(res.status).toBe(401);
  });

  it('returns 403 for a non-admin user', async () => {
    const res = await request(app).post(`/api/admin/chat/${VALID_USER_ID}`).set(USER_TOKEN).send({ content: 'Hi' });
    expect(res.status).toBe(403);
  });

  it('returns 400 for an invalid userId', async () => {
    const res = await request(app).post('/api/admin/chat/bad-id').set(ADMIN_TOKEN).send({ content: 'Hi' });
    expect(res.status).toBe(400);
  });

  it('returns 400 when content is missing', async () => {
    const res = await request(app).post(`/api/admin/chat/${VALID_USER_ID}`).set(ADMIN_TOKEN).send({});
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/content required/i);
  });

  it('creates an admin reply and returns 201 with fromAdmin=true', async () => {
    const created = {
      _id: VALID_MSG_ID,
      userId: VALID_USER_ID,
      fromAdmin: true,
      senderUsername: 'Jordan',
      content: 'Great question!',
      createdAt: new Date().toISOString(),
    };
    (DirectMessage.create as jest.Mock).mockResolvedValue(created);

    const res = await request(app)
      .post(`/api/admin/chat/${VALID_USER_ID}`)
      .set(ADMIN_TOKEN)
      .send({ content: 'Great question!' });

    expect(res.status).toBe(201);
    expect(res.body.fromAdmin).toBe(true);
    expect(res.body.content).toBe('Great question!');
    expect(DirectMessage.create).toHaveBeenCalledWith(
      expect.objectContaining({ userId: VALID_USER_ID, fromAdmin: true, content: 'Great question!' })
    );
  });

  it('returns 500 on a database error', async () => {
    (DirectMessage.create as jest.Mock).mockRejectedValue(new Error('DB error'));
    const res = await request(app).post(`/api/admin/chat/${VALID_USER_ID}`).set(ADMIN_TOKEN).send({ content: 'Hi' });
    expect(res.status).toBe(500);
  });
});
