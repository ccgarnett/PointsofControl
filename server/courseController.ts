import { Request, Response } from 'express';
import Course from '../models/Course'; // The model we just built

// GET /api/courses
export const getCourses = async (req: Request, res: Response) => {
  try {
    // 1. Ask Database for all courses
    const courses = await Course.find(); 
    
    // 2. Send the data back to the frontend as JSON
    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};