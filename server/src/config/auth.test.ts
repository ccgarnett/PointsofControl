import request from 'supertest';
import express from 'express';
import { loginUser, logoutUser } from './userController';
import User from './User';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const app = express();
app.use(express.json());
app.post('/api/users/login', loginUser);
app.post('/api/users/logout', logoutUser);

jest.mock('./User');
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

describe('Auth — loginUser', () => {
  it('returns 400 when username or password is missing', async () => {
    const res = await request(app).post('/api/users/login').send({ username: 'chase' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/required/i);
  });

  it('returns 401 when username is not found', async () => {
    (User.findOne as jest.Mock).mockResolvedValue(null);
    const res = await request(app).post('/api/users/login').send({ username: 'nobody', password: 'pass' });
    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/invalid credentials/i);
  });

  it('returns 401 when password does not match', async () => {
    (User.findOne as jest.Mock).mockResolvedValue({ username: 'chase', passwordHash: 'hashed', role: 'Admin' });
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);
    const res = await request(app).post('/api/users/login').send({ username: 'chase', password: 'wrong' });
    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/invalid credentials/i);
  });

  it('returns token and user on valid credentials', async () => {
    const mockUser = { _id: 'uid1', username: 'chase', passwordHash: 'hashed', role: 'Admin' };
    (User.findOne as jest.Mock).mockResolvedValue(mockUser);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    (jwt.sign as jest.Mock).mockReturnValue('mock.jwt.token');

    const res = await request(app).post('/api/users/login').send({ username: 'chase', password: 'Chase@POC1' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBe('mock.jwt.token');
    expect(res.body.user.username).toBe('chase');
    expect(res.body.user.role).toBe('Admin');
  });

  it('does not include passwordHash in the response', async () => {
    const mockUser = { _id: 'uid1', username: 'chase', passwordHash: 'hashed', role: 'Admin' };
    (User.findOne as jest.Mock).mockResolvedValue(mockUser);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    (jwt.sign as jest.Mock).mockReturnValue('mock.jwt.token');

    const res = await request(app).post('/api/users/login').send({ username: 'chase', password: 'Chase@POC1' });
    expect(res.body.user.passwordHash).toBeUndefined();
  });

  it('returns 500 on a server error', async () => {
    (User.findOne as jest.Mock).mockRejectedValue(new Error('DB error'));
    const res = await request(app).post('/api/users/login').send({ username: 'chase', password: 'pass' });
    expect(res.status).toBe(500);
  });
});

describe('Auth — logoutUser', () => {
  it('returns 200 with a logout message', async () => {
    const res = await request(app).post('/api/users/logout');
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/logged out/i);
  });
});
