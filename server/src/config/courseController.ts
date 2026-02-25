import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import Course from './Course';

// ─── A3: Multer config for document uploads ───────────────────────────────────
const docStorage = multer.diskStorage({
  destination: (_req: any, _file: any, cb: any) => {
    cb(null, 'uploads/docs');
  },
  filename: (_req: any, file: any, cb: any) => {
    const unique = `${Date.now()}-${file.originalname}`;
    cb(null, unique);
  },
});

const docFilter = (_req: any, file: any, cb: any) => {
  const allowed = ['.pdf', '.doc', '.docx', '.txt'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF, DOC, DOCX, and TXT files are allowed'));
  }
};

export const uploadDocMiddleware = multer({ storage: docStorage, fileFilter: docFilter }).single('document');

// ─── GET /api/courses ─────────────────────────────────────────────────────────
export const getCourses = async (req: Request, res: Response) => {
  try {
    const courses = await Course.find();
    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// ─── POST /api/courses — Admin create course (A13) ───────────────────────────
export const createCourse = async (req: Request, res: Response) => {
  try {
    const { courseId, title, description, videoEmbedLinks, modules, price } = req.body;

    if (!courseId || !title || price === undefined) {
      return res.status(400).json({ message: 'courseId, title, and price are required' });
    }

    const existing = await Course.findOne({ courseId });
    if (existing) {
      return res.status(400).json({ message: 'A course with that courseId already exists' });
    }

    const course = await Course.create({
      courseId,
      title,
      description: description || '',
      videoEmbedLinks: Array.isArray(videoEmbedLinks) ? videoEmbedLinks : [],
      modules: Array.isArray(modules) ? modules : [],
      price: Number(price),
    });

    res.status(201).json(course);
  } catch (error) {
    console.error('Create course error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// ─── DELETE /api/courses/:id — Admin delete course ───────────────────────────
export const deleteCourse = async (req: Request, res: Response) => {
  try {
    const course = await Course.findByIdAndDelete(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// ─── POST /api/courses/:id/docs — Admin upload doc to course module (A3) ─────
export const uploadDoc = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    const moduleTitle = req.body.moduleTitle || req.file.originalname;
    const fileUrl = `/uploads/docs/${req.file.filename}`;

    course.modules.push({ title: moduleTitle, contentUrl: fileUrl, completed: false });
    await course.save();

    res.status(201).json({ message: 'Document uploaded successfully', fileUrl, course });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// ─── PATCH /api/courses/:courseId/modules/:moduleIndex/complete (U9) ──────────
export const toggleModuleComplete = async (req: Request, res: Response) => {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    const index = parseInt(req.params.moduleIndex as string, 10);
    if (isNaN(index) || index < 0 || index >= course.modules.length) {
      return res.status(400).json({ message: 'Invalid module index' });
    }

    course.modules[index].completed = !course.modules[index].completed;
    await course.save();

    res.json({ completed: course.modules[index].completed, course });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// ─── GET /api/analytics/courses — Admin course analytics (A12) ───────────────
export const getCourseAnalytics = async (req: Request, res: Response) => {
  try {
    const courses = await Course.find();

    const analytics = courses
      .map((c) => {
        const total = c.modules.length;
        const completed = c.modules.filter((m) => m.completed).length;
        const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
        return {
          _id: c._id,
          courseId: c.courseId,
          title: c.title,
          totalModules: total,
          completedModules: completed,
          completionRate: rate,
        };
      })
      .sort((a, b) => b.completedModules - a.completedModules);

    res.json(analytics);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};