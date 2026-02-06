import { Request, Response } from 'express';
import Course from './Course';

// GET /api/courses
export const getCourses = async (req: Request, res: Response) => {
  try {
    const courses = await Course.find();
    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// POST /api/courses - Admin create course (includes video embed support)
export const createCourse = async (req: Request, res: Response) => {
  try {
    const { courseId, title, description, videoEmbedLinks, modules, price } = req.body;

    if (!courseId || !title || price === undefined) {
      return res.status(400).json({ message: 'courseId, title, and price are required' });
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