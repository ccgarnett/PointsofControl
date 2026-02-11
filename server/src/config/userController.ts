import { Request, Response } from 'express';
import User from './User';
import Course from './Course';
import bcrypt from 'bcryptjs';
import multer from 'multer';

// 1. Export the Multer middleware
export const uploadProfilePicture = multer({ dest: 'uploads/' }).single('picture');

// 2. Export getProfile (Already existing, but ensure it's here)
export const getProfile = async (req: Request, res: Response) => {
  try {
    const user = await User.findOne().populate('enrolledCourses');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// 3. Export updateProfile
export const updateProfile = async (req: Request, res: Response) => {
  try {
    const { name, bio } = req.body;
    const user = await User.findOneAndUpdate({}, { name, bio }, { new: true });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// 4. Export uploadPicture 
export const uploadPicture = async (req: Request, res: Response) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
  res.json({ profilePictureUrl: `/uploads/${req.file.filename}` });
};