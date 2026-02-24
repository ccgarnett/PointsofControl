import request from 'supertest';
import express from 'express';
import {
  getCourses,
  createCourse,
  toggleModuleComplete,
  getCourseAnalytics,
  uploadDoc,
} from './courseController';
import {
  getMessages,
  createMessage,
  updateMessage,
  deleteMessage,
} from './messageController';
import Course from './Course';
import Message from './Message';

// ─── Test App Setup ───────────────────────────────────────────────────────────
let mockFile: { filename: string; originalname: string } | null = null;

const app = express();
app.use(express.json());
app.get('/api/courses', getCourses);
app.post('/api/courses', createCourse);
app.patch('/api/courses/:courseId/modules/:moduleIndex/complete', toggleModuleComplete);
app.get('/api/analytics/courses', getCourseAnalytics);
app.post('/api/courses/:id/docs', (req: any, _res: any, next: any) => {
  req.file = mockFile;
  next();
}, uploadDoc);
app.get('/api/messages', getMessages);
app.post('/api/messages', createMessage);
app.put('/api/messages/:id', updateMessage);
app.delete('/api/messages/:id', deleteMessage);

jest.mock('./Course');
jest.mock('./Message');

// ═══════════════════════════════════════════════════════════════════
// A3 — Upload Document to Course
// ═══════════════════════════════════════════════════════════════════
describe('A3 — Upload Document to Course', () => {
  beforeEach(() => { mockFile = null; });

  it('should return 400 when no file is provided', async () => {
    const res = await request(app).post('/api/courses/c1/docs').send({});
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/no file/i);
  });

  it('should return 404 when the course is not found', async () => {
    mockFile = { filename: 'test-123.pdf', originalname: 'test.pdf' };
    (Course.findById as jest.Mock).mockResolvedValue(null);
    const res = await request(app).post('/api/courses/badId/docs').send({});
    expect(res.status).toBe(404);
  });

  it('should add a document module and return 201', async () => {
    mockFile = { filename: 'test-123.pdf', originalname: 'Week1.pdf' };
    const mockCourse = {
      _id: 'c1',
      modules: [],
      save: jest.fn().mockResolvedValue(undefined),
    };
    (Course.findById as jest.Mock).mockResolvedValue(mockCourse);
    const res = await request(app)
      .post('/api/courses/c1/docs')
      .send({ moduleTitle: 'Week 1 Reading' });
    expect(res.status).toBe(201);
    expect(res.body.fileUrl).toContain('test-123.pdf');
  });
});

// ═══════════════════════════════════════════════════════════════════
// A13 — Admin Create Course
// ═══════════════════════════════════════════════════════════════════
describe('A13 — Create Course', () => {
  it('should return 400 when required fields are missing', async () => {
    const res = await request(app).post('/api/courses').send({ title: 'No ID' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/required/i);
  });

  it('should return 400 when courseId already exists', async () => {
    (Course.findOne as jest.Mock).mockResolvedValue({ courseId: 'POC-101' });
    const res = await request(app)
      .post('/api/courses')
      .send({ courseId: 'POC-101', title: 'Duplicate', price: 0 });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/already exists/i);
  });

  it('should create a course and return 201', async () => {
    (Course.findOne as jest.Mock).mockResolvedValue(null);
    const newCourse = { courseId: 'POC-102', title: 'New Course', price: 49 };
    (Course.create as jest.Mock).mockResolvedValue(newCourse);
    const res = await request(app).post('/api/courses').send(newCourse);
    expect(res.status).toBe(201);
    expect(res.body.title).toBe('New Course');
  });
});

// ═══════════════════════════════════════════════════════════════════
// A7 — Dashboard Messages
// ═══════════════════════════════════════════════════════════════════
describe('A7 — Dashboard Messages', () => {
  it('should return all messages with 200', async () => {
    const mockMessages = [{ content: 'Hello clients!', postedBy: 'Jordan' }];
    (Message.find as jest.Mock).mockReturnValue({
      sort: jest.fn().mockResolvedValue(mockMessages),
    });
    const res = await request(app).get('/api/messages');
    expect(res.status).toBe(200);
    expect(res.body).toEqual(mockMessages);
  });

  it('should return 400 when content or postedBy is missing', async () => {
    const res = await request(app).post('/api/messages').send({ content: 'Hi' });
    expect(res.status).toBe(400);
  });

  it('should create a message and return 201', async () => {
    const newMsg = { content: 'New announcement!', postedBy: 'Jordan' };
    (Message.create as jest.Mock).mockResolvedValue({ ...newMsg, _id: 'abc123' });
    const res = await request(app).post('/api/messages').send(newMsg);
    expect(res.status).toBe(201);
    expect(res.body.content).toBe('New announcement!');
  });

  it('should return 404 when updating a non-existent message', async () => {
    (Message.findByIdAndUpdate as jest.Mock).mockResolvedValue(null);
    const res = await request(app)
      .put('/api/messages/nonexistent')
      .send({ content: 'Updated' });
    expect(res.status).toBe(404);
  });

  it('should update a message and return it', async () => {
    const updated = { _id: 'abc123', content: 'Updated!', postedBy: 'Jordan' };
    (Message.findByIdAndUpdate as jest.Mock).mockResolvedValue(updated);
    const res = await request(app)
      .put('/api/messages/abc123')
      .send({ content: 'Updated!' });
    expect(res.status).toBe(200);
    expect(res.body.content).toBe('Updated!');
  });

  it('should return 404 when deleting a non-existent message', async () => {
    (Message.findByIdAndDelete as jest.Mock).mockResolvedValue(null);
    const res = await request(app).delete('/api/messages/ghost');
    expect(res.status).toBe(404);
  });

  it('should delete a message and return confirmation', async () => {
    (Message.findByIdAndDelete as jest.Mock).mockResolvedValue({ _id: 'abc123' });
    const res = await request(app).delete('/api/messages/abc123');
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/deleted/i);
  });
});

// ═══════════════════════════════════════════════════════════════════
// U9 — Lesson Tracking (Toggle Module Complete)
// ═══════════════════════════════════════════════════════════════════
describe('U9 — Lesson Tracking', () => {
  it('should return 404 when course is not found', async () => {
    (Course.findById as jest.Mock).mockResolvedValue(null);
    const res = await request(app).patch('/api/courses/badId/modules/0/complete');
    expect(res.status).toBe(404);
  });

  it('should return 400 for an invalid module index', async () => {
    (Course.findById as jest.Mock).mockResolvedValue({
      modules: [{ title: 'Mod 1', completed: false }],
      save: jest.fn(),
    });
    const res = await request(app).patch('/api/courses/cid/modules/99/complete');
    expect(res.status).toBe(400);
  });

  it('should toggle a module from false to true', async () => {
    const mockCourse = {
      _id: 'cid',
      modules: [{ title: 'Mod 1', completed: false }],
      save: jest.fn().mockResolvedValue(undefined),
    };
    (Course.findById as jest.Mock).mockResolvedValue(mockCourse);
    const res = await request(app).patch('/api/courses/cid/modules/0/complete');
    expect(res.status).toBe(200);
    expect(res.body.completed).toBe(true);
  });

  it('should toggle a module from true to false', async () => {
    const mockCourse = {
      _id: 'cid',
      modules: [{ title: 'Mod 1', completed: true }],
      save: jest.fn().mockResolvedValue(undefined),
    };
    (Course.findById as jest.Mock).mockResolvedValue(mockCourse);
    const res = await request(app).patch('/api/courses/cid/modules/0/complete');
    expect(res.status).toBe(200);
    expect(res.body.completed).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════
// A12 — Course Analytics
// ═══════════════════════════════════════════════════════════════════
describe('A12 — Course Analytics', () => {
  it('should return analytics sorted by completedModules descending', async () => {
    (Course.find as jest.Mock).mockResolvedValue([
      { _id: '1', courseId: 'A', title: 'Alpha', modules: [{ completed: true }, { completed: false }] },
      { _id: '2', courseId: 'B', title: 'Beta', modules: [{ completed: true }, { completed: true }] },
    ]);
    const res = await request(app).get('/api/analytics/courses');
    expect(res.status).toBe(200);
    expect(res.body[0].title).toBe('Beta');
    expect(res.body[1].title).toBe('Alpha');
  });

  it('should calculate completionRate correctly', async () => {
    (Course.find as jest.Mock).mockResolvedValue([
      { _id: '1', courseId: 'A', title: 'Alpha', modules: [{ completed: true }, { completed: false }, { completed: false }, { completed: false }] },
    ]);
    const res = await request(app).get('/api/analytics/courses');
    expect(res.status).toBe(200);
    expect(res.body[0].completionRate).toBe(25);
  });

  it('should return 0% for courses with no modules', async () => {
    (Course.find as jest.Mock).mockResolvedValue([
      { _id: '1', courseId: 'A', title: 'Empty Course', modules: [] },
    ]);
    const res = await request(app).get('/api/analytics/courses');
    expect(res.status).toBe(200);
    expect(res.body[0].completionRate).toBe(0);
    expect(res.body[0].totalModules).toBe(0);
  });
});
