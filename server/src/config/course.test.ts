import request from 'supertest';
import express from 'express';
import { getCourses, createCourse } from './courseController';
import Course from './Course';

const app = express();
app.use(express.json());
app.get('/api/courses', getCourses);
app.post('/api/courses', createCourse);

// FIXED: Using direct path because files are in the same folder
jest.mock('./Course');

describe('Course Controller', () => {
  it('should return all courses with a 200 status (U1)', async () => {
    const mockData = [{ title: 'Intro to Mindset', price: 99 }];
    (Course.find as jest.Mock).mockResolvedValue(mockData);

    const res = await request(app).get('/api/courses');
    expect(res.status).toBe(200);
    expect(res.body).toEqual(mockData);
  });

  it('should create a course successfully (A6)', async () => {
    const newCourse = { courseId: '1', title: 'Test Course', price: 10 };
    (Course.create as jest.Mock).mockResolvedValue(newCourse);

    const res = await request(app).post('/api/courses').send(newCourse);
    expect(res.status).toBe(201);
    expect(res.body.title).toBe('Test Course');
  });

  it('should handle server errors (Line 10 coverage)', async () => {
    (Course.find as jest.Mock).mockRejectedValue(new Error('DB Error'));
    const res = await request(app).get('/api/courses');
    expect(res.status).toBe(500);
  });
});