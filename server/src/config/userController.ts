import { Request, Response } from 'express';
import User from './User';
import Course from './Course';
import bcrypt from 'bcryptjs';
import multer from 'multer';

export const registerUser = async (req: Request, res: Response) => {
  try {
    const {username, passwordHash, email} = req.body;

    if (!username || !email || !passwordHash) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const existingUser = await User.findOne({username});
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    const existingEmail = await User.findOne({email});
    if (existingEmail) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(String(req.body.passwordHash), 10);
    const newUser = new User({username, passwordHash: hashedPassword, email});
    await newUser.save();
    res.status(201).json({message: 'User created successfully'});
  } catch (error) {
    res.status(500).json({message: 'Server Error'});
  }
};

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
