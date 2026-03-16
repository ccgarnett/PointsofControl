import request from 'supertest';
import express from 'express';
import { updateUserById, deleteUserById } from './userController';
import User from './User';

const app = express();
app.use(express.json());
app.put('/api/users/:id', updateUserById);
app.delete('/api/users/:id', deleteUserById);

jest.mock('./User');

describe('updateUserById — role update', () => {
  beforeEach(() => jest.clearAllMocks());
  it('updates role to Admin', async () => {
    const updated = { _id: 'uid1', username: 'chase', role: 'Admin' };
    (User.findByIdAndUpdate as jest.Mock).mockReturnValue({
      select: jest.fn().mockResolvedValue(updated),
    });
    const res = await request(app).put('/api/users/uid1').send({ role: 'Admin' });
    expect(res.status).toBe(200);
    expect(res.body.role).toBe('Admin');
  });

  it('updates role to User', async () => {
    const updated = { _id: 'uid1', username: 'chase', role: 'User' };
    (User.findByIdAndUpdate as jest.Mock).mockReturnValue({
      select: jest.fn().mockResolvedValue(updated),
    });
    const res = await request(app).put('/api/users/uid1').send({ role: 'User' });
    expect(res.status).toBe(200);
    expect(res.body.role).toBe('User');
  });

  it('does not apply an invalid role value', async () => {
    const updated = { _id: 'uid1', username: 'chase', role: 'User' };
    (User.findByIdAndUpdate as jest.Mock).mockReturnValue({
      select: jest.fn().mockResolvedValue(updated),
    });
    await request(app).put('/api/users/uid1').send({ role: 'SuperAdmin' });
    const calls = (User.findByIdAndUpdate as jest.Mock).mock.calls;
    const updateArg = calls[calls.length - 1][1];
    expect(updateArg.role).toBeUndefined();
  });

  it('returns 404 when user does not exist', async () => {
    (User.findByIdAndUpdate as jest.Mock).mockReturnValue({
      select: jest.fn().mockResolvedValue(null),
    });
    const res = await request(app).put('/api/users/nonexistent').send({ name: 'Test' });
    expect(res.status).toBe(404);
  });

  it('returns 500 on a database error', async () => {
    (User.findByIdAndUpdate as jest.Mock).mockReturnValue({
      select: jest.fn().mockRejectedValue(new Error('DB error')),
    });
    const res = await request(app).put('/api/users/uid1').send({ name: 'Test' });
    expect(res.status).toBe(500);
  });
});

describe('deleteUserById', () => {
  it('deletes a user and returns 204', async () => {
    (User.findByIdAndDelete as jest.Mock).mockResolvedValue({ _id: 'uid1' });
    const res = await request(app).delete('/api/users/uid1');
    expect(res.status).toBe(204);
  });

  it('returns 404 when user does not exist', async () => {
    (User.findByIdAndDelete as jest.Mock).mockResolvedValue(null);
    const res = await request(app).delete('/api/users/nonexistent');
    expect(res.status).toBe(404);
  });

  it('returns 500 on a database error', async () => {
    (User.findByIdAndDelete as jest.Mock).mockRejectedValue(new Error('DB error'));
    const res = await request(app).delete('/api/users/uid1');
    expect(res.status).toBe(500);
  });
});
