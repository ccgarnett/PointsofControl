import request from 'supertest';
import express from 'express';
import { createTask, readTask, updateTask, deleteTask, makeArchived, readArchive } from './taskController';
import Task from './Task';

jest.mock('./Task');

const app = express();
app.use(express.json());
app.post('/api/tasks/archive', makeArchived);
app.get('/api/tasks/archive', readArchive);
app.post('/api/tasks', createTask);
app.get('/api/tasks', readTask);
app.patch('/api/tasks/:task_id', updateTask);
app.delete('/api/tasks/:id', deleteTask);

const VALID_USER_ID = '507f1f77bcf86cd799439011';
const VALID_TASK_ID = '507f1f77bcf86cd799439012';

beforeEach(() => {
  jest.clearAllMocks();
});

describe('createTask', () => {
  it('creates a task and returns 201', async () => {
    (Task.create as jest.Mock).mockResolvedValue({
      _id: VALID_TASK_ID,
      description: 'Do the thing',
      completed: false,
    });
    const res = await request(app)
      .post('/api/tasks')
      .query({ user_id: VALID_USER_ID })
      .send({ description: 'Do the thing' });
    expect(res.status).toBe(201);
    expect(res.body.description).toBe('Do the thing');
  });

  it('returns 400 when user_id is missing', async () => {
    const res = await request(app).post('/api/tasks').send({ description: 'Task' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/invalid user id/i);
  });

  it('returns 400 when user_id is invalid', async () => {
    const res = await request(app).post('/api/tasks').query({ user_id: 'bad-id' }).send({ description: 'Task' });
    expect(res.status).toBe(400);
  });

  it('returns 400 when description is missing', async () => {
    const res = await request(app).post('/api/tasks').query({ user_id: VALID_USER_ID }).send({});
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/description required/i);
  });

  it('returns 400 when description is empty string', async () => {
    const res = await request(app).post('/api/tasks').query({ user_id: VALID_USER_ID }).send({ description: '   ' });
    expect(res.status).toBe(400);
  });

  it('returns 500 when Task.create throws', async () => {
    (Task.create as jest.Mock).mockRejectedValue(new Error('DB error'));
    const res = await request(app)
      .post('/api/tasks')
      .query({ user_id: VALID_USER_ID })
      .send({ description: 'Task' });
    expect(res.status).toBe(500);
  });
});

describe('readTask', () => {
  it('returns tasks array for a valid user', async () => {
    (Task.find as jest.Mock).mockReturnValue({ sort: jest.fn().mockResolvedValue([]) });
    const res = await request(app).get('/api/tasks').query({ user_id: VALID_USER_ID });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('returns 400 for invalid user_id', async () => {
    const res = await request(app).get('/api/tasks').query({ user_id: 'bad' });
    expect(res.status).toBe(400);
  });

  it('returns 400 when user_id is missing', async () => {
    const res = await request(app).get('/api/tasks');
    expect(res.status).toBe(400);
  });

  it('returns 500 when Task.find throws', async () => {
    (Task.find as jest.Mock).mockReturnValue({ sort: jest.fn().mockRejectedValue(new Error('DB error')) });
    const res = await request(app).get('/api/tasks').query({ user_id: VALID_USER_ID });
    expect(res.status).toBe(500);
  });
});

describe('updateTask', () => {
  it('updates task description and returns 200', async () => {
    (Task.findOneAndUpdate as jest.Mock).mockResolvedValue({ _id: VALID_TASK_ID, description: 'Updated' });
    const res = await request(app)
      .patch(`/api/tasks/${VALID_TASK_ID}`)
      .query({ user_id: VALID_USER_ID })
      .send({ description: 'Updated' });
    expect(res.status).toBe(200);
    expect(res.body.description).toBe('Updated');
  });

  it('updates completed status', async () => {
    (Task.findOneAndUpdate as jest.Mock).mockResolvedValue({ _id: VALID_TASK_ID, completed: true });
    const res = await request(app)
      .patch(`/api/tasks/${VALID_TASK_ID}`)
      .query({ user_id: VALID_USER_ID })
      .send({ completed: true });
    expect(res.status).toBe(200);
  });

  it('updates archived status', async () => {
    (Task.findOneAndUpdate as jest.Mock).mockResolvedValue({ _id: VALID_TASK_ID, archivedAt: new Date() });
    const res = await request(app)
      .patch(`/api/tasks/${VALID_TASK_ID}`)
      .query({ user_id: VALID_USER_ID })
      .send({ archived: true });
    expect(res.status).toBe(200);
  });

  it('returns 400 for invalid user_id', async () => {
    const res = await request(app)
      .patch(`/api/tasks/${VALID_TASK_ID}`)
      .query({ user_id: 'bad' })
      .send({ description: 'Updated' });
    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid task_id', async () => {
    const res = await request(app)
      .patch('/api/tasks/invalid')
      .query({ user_id: VALID_USER_ID })
      .send({ description: 'Updated' });
    expect(res.status).toBe(400);
  });

  it('returns 400 when no fields are provided', async () => {
    const res = await request(app)
      .patch(`/api/tasks/${VALID_TASK_ID}`)
      .query({ user_id: VALID_USER_ID })
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/no fields to update/i);
  });

  it('returns 400 when description is empty string', async () => {
    const res = await request(app)
      .patch(`/api/tasks/${VALID_TASK_ID}`)
      .query({ user_id: VALID_USER_ID })
      .send({ description: '' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/cannot be empty/i);
  });

  it('returns 404 when task is not found', async () => {
    (Task.findOneAndUpdate as jest.Mock).mockResolvedValue(null);
    const res = await request(app)
      .patch(`/api/tasks/${VALID_TASK_ID}`)
      .query({ user_id: VALID_USER_ID })
      .send({ completed: true });
    expect(res.status).toBe(404);
  });

  it('returns 500 when findOneAndUpdate throws', async () => {
    (Task.findOneAndUpdate as jest.Mock).mockRejectedValue(new Error('DB error'));
    const res = await request(app)
      .patch(`/api/tasks/${VALID_TASK_ID}`)
      .query({ user_id: VALID_USER_ID })
      .send({ completed: true });
    expect(res.status).toBe(500);
  });
});

describe('deleteTask', () => {
  it('returns 400 for invalid user_id', async () => {
    const res = await request(app).delete(`/api/tasks/${VALID_TASK_ID}`).query({ user_id: 'bad' });
    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid task id', async () => {
    const res = await request(app).delete('/api/tasks/invalid-id').query({ user_id: VALID_USER_ID });
    expect(res.status).toBe(400);
  });

  it('returns 400 when user_id is missing', async () => {
    const res = await request(app).delete(`/api/tasks/${VALID_TASK_ID}`);
    expect(res.status).toBe(400);
  });
});

describe('makeArchived', () => {
  it('archives old tasks and returns 200 with archivedCount', async () => {
    (Task.updateMany as jest.Mock).mockResolvedValue({ modifiedCount: 3 });
    const res = await request(app).post('/api/tasks/archive').query({ user_id: VALID_USER_ID });
    expect(res.status).toBe(200);
    expect(res.body.archivedCount).toBe(3);
    expect(res.body.message).toMatch(/archived/i);
  });

  it('returns 400 for invalid user_id', async () => {
    const res = await request(app).post('/api/tasks/archive').query({ user_id: 'bad' });
    expect(res.status).toBe(400);
  });

  it('returns 400 when user_id is missing', async () => {
    const res = await request(app).post('/api/tasks/archive');
    expect(res.status).toBe(400);
  });

  it('returns 500 when updateMany throws', async () => {
    (Task.updateMany as jest.Mock).mockRejectedValue(new Error('DB error'));
    const res = await request(app).post('/api/tasks/archive').query({ user_id: VALID_USER_ID });
    expect(res.status).toBe(500);
  });
});

describe('readArchive', () => {
  it('returns archived tasks for a valid user', async () => {
    (Task.find as jest.Mock).mockReturnValue({ sort: jest.fn().mockResolvedValue([{ _id: VALID_TASK_ID, archivedAt: new Date() }]) });
    const res = await request(app).get('/api/tasks/archive').query({ user_id: VALID_USER_ID });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('returns 400 for invalid user_id', async () => {
    const res = await request(app).get('/api/tasks/archive').query({ user_id: 'bad' });
    expect(res.status).toBe(400);
  });

  it('returns 400 when user_id is missing', async () => {
    const res = await request(app).get('/api/tasks/archive');
    expect(res.status).toBe(400);
  });

  it('returns 500 when Task.find throws', async () => {
    (Task.find as jest.Mock).mockReturnValue({ sort: jest.fn().mockRejectedValue(new Error('DB error')) });
    const res = await request(app).get('/api/tasks/archive').query({ user_id: VALID_USER_ID });
    expect(res.status).toBe(500);
  });
});
