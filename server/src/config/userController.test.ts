import request from 'supertest';
import express from 'express';
import { registerUser, getProfile } from './userController';
import User from './User';
import Course from './Course';
import bcrypt from 'bcryptjs';

const app = express();
app.use(express.json());
app.post('/api/users/register', registerUser);
app.get('/api/users/profile', getProfile);

// FIXED: Using direct paths for models
jest.mock('./User');
jest.mock('./Course');
jest.mock('bcryptjs');

describe('User Controller', () => {
  it('should register successfully (U4 & NFR1)', async () => {
    (User.findOne as jest.Mock).mockResolvedValue(null);
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');
    (User.create as jest.Mock).mockResolvedValue({ _id: '1', username: 'cc' });

    const res = await request(app).post('/api/users/register').send({ username: 'cc', password: '123' });
    expect(res.status).toBe(201);
  });

  it('should fetch profile with progress calculation (U5)', async () => {
    const mockUser = { username: 'cc', enrolledCourses: ['c1'] };
    const mockCourse = { _id: 'c1', title: 'Mindset', modules: [{ completed: true }, { completed: false }] };
    
    (User.findById as jest.Mock).mockReturnValue({
      populate: jest.fn().mockResolvedValue(mockUser)
    });
    (Course.find as jest.Mock).mockResolvedValue([mockCourse]);

    const res = await request(app).get('/api/users/profile?userId=123');
    expect(res.status).toBe(200);
    // Verifies the progress calculation logic in userController.ts
    expect(res.body.enrolledCourses[0].progress).toBe(50); 
  });

  it('should create a new user', async () => {
    (User.findOne as jest.Mock).mockResolvedValue(null);
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');
    (User.create as jest.Mock).mockResolvedValue({ _id: '1', username: 'testuser' });

    const res = await request(app).post('/api/users/register').send({ username: 'testuser', passwordHash: '2468XXII', email: 'name@example.com' });
    expect(res.status).toBe(201);
  });
  
  it('should fail if fields are missing', async () => {
    const res = await request(app).post('/api/users/register').send({});
    expect(res.status).toBe(400);
  });

  it('should fail if username is in database', async () => {
    (User.findOne as jest.Mock).mockResolvedValue({ username: 'testuser' });
    const res = await request(app).post('/api/users/register').send({ username: 'testuser', passwordHash: '2468XXII', email: 'name@example.com' });
    expect(res.status).toBe(400);
  });
});
