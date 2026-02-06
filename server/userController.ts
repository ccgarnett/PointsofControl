import bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs';
import { Request, Response } from 'express';
import multer from 'multer';
import User from './User';
import Course from './Course';

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `profile-${Date.now()}${ext}`);
  },
});

export const uploadProfilePicture = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/i.test(file.mimetype);
    cb(null, allowed);
  },
}).single('picture');

// GET /api/users/profile - Returns current user profile with enrolled courses and progress
export const getProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.query.userId as string | undefined;
    let user;

    if (userId) {
      user = await User.findById(userId).populate('enrolledCourses');
    } else {
      user = await User.findOne().populate('enrolledCourses');
    }

    if (!user) {
      const courses = await Course.find().limit(3);
      const passwordHash = await bcrypt.hash('demo123', 10);
      user = await User.create({
        username: 'demo',
        email: 'demo@example.com',
        passwordHash,
        role: 'User',
        enrolledCourses: courses.map((c) => c._id),
      });
      await user.populate('enrolledCourses');
    }

    const courses = await Course.find({ _id: { $in: user.enrolledCourses } });
    const coursesWithProgress = courses.map((c) => {
      const modules = c.modules || [];
      const completed = modules.filter((m: { completed: boolean }) => m.completed).length;
      const progress = modules.length > 0 ? Math.round((completed / modules.length) * 100) : 0;
      return {
        _id: c._id,
        courseId: c.courseId,
        title: c.title,
        description: c.description,
        progress,
        moduleCount: modules.length,
      };
    });

    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      name: user.name,
      age: user.age,
      pronouns: user.pronouns,
      bio: user.bio,
      profilePictureUrl: user.profilePictureUrl,
      role: user.role,
      enrolledCourses: coursesWithProgress,
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// PUT /api/users/profile - Update profile (name, age, pronouns, bio)
export const updateProfile = async (req: Request, res: Response) => {
  try {
    const { name, age, pronouns, bio } = req.body;
    let user = await User.findOne();

    if (!user) {
      const courses = await Course.find().limit(3);
      const passwordHash = await bcrypt.hash('demo123', 10);
      user = await User.create({
        username: 'demo',
        email: 'demo@example.com',
        passwordHash,
        role: 'User',
        enrolledCourses: courses.map((c) => c._id),
      });
    }

    if (name !== undefined) user.name = name;
    if (age !== undefined) user.age = age === '' ? undefined : Number(age);
    if (pronouns !== undefined) user.pronouns = pronouns;
    if (bio !== undefined) user.bio = bio;
    await user.save();

    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      name: user.name,
      age: user.age,
      pronouns: user.pronouns,
      bio: user.bio,
      profilePictureUrl: user.profilePictureUrl,
      role: user.role,
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// POST /api/users/profile/picture - Upload profile picture
export const uploadPicture = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const filename = req.file.filename;
    const profilePictureUrl = `/uploads/${filename}`;

    let user = await User.findOne();
    if (!user) {
      const courses = await Course.find().limit(3);
      const passwordHash = await bcrypt.hash('demo123', 10);
      user = await User.create({
        username: 'demo',
        email: 'demo@example.com',
        passwordHash,
        role: 'User',
        enrolledCourses: courses.map((c) => c._id),
      });
    }

    user.profilePictureUrl = profilePictureUrl;
    await user.save();

    res.json({ profilePictureUrl });
  } catch (error) {
    console.error('Upload picture error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};
