import { Request, Response } from 'express';
import User from './User';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';

const JWT_SECRET = process.env.JWT_SECRET || 'poc_secret_key';

/**
 * Creates a new user account and adds it to the database
 * @param req - The request object containing the required data
 * @param res - The response object used to send data to the database
 */
export const registerUser = async (req: Request, res: Response) => {
  try {
    const { username, email } = req.body;
    const password = req.body.password || req.body.passwordHash;

    if (!username || !password) {
      return res.status(400).json({ message: 'username and password are required' });
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    const passwordHash = await bcrypt.hash(String(password), 10);
    const newUser = await User.create({ username, passwordHash, email });
    res.status(201).json(newUser);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

export const loginUser = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: 'username and password are required' });
    }
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const pwMatch = await bcrypt.compare(String(password), user.passwordHash);
    if (!pwMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const token = jwt.sign(
      { id: String(user._id), username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.json({ token, user: { id: String(user._id), username: user.username, role: user.role } });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

export const logoutUser = (_req: Request, res: Response) => {
  res.json({ message: 'Logged out' });
};

export const returnUDB = async (req: Request, res: Response) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    res.status(500).send('Error fetching user database.');
  }
};

export const listUsers = async (req: Request, res: Response) => {
  try{
    const users = await User.find({}, 'username name email role createdAt');
    res.json(users);
  }catch{
    res.status(500).json({message: 'Error fetching users'});
  }
};

export const getUserById = async (req: Request, res: Response) => {
  try{
    const user = await User.findById(req.params.id).select('-passwordHash');
    if (!user) return res.status(404).json({message: 'User not found'});
    res.json(user);
  }catch{
    res.status(500).json({message: 'Server Error'});
  }
};

export const updateUserById = async (req: Request, res: Response) => {
  try {
    const { name, bio, role } = req.body;
    const update: Record<string, any> = { name, bio };
    if (role === 'Admin' || role === 'User') update.role = role;
    const user = await User.findByIdAndUpdate(
      req.params.id, update, { new: true }
    ).select('-passwordHash');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch {
    res.status(500).json({ message: 'Server Error' });
  }
};

export const deleteUserById = async (req: Request, res: Response) => {
  try{
    const user = await User.findByIdAndDelete(req.params.id);
    if(!user) return res.status(404).json({message: 'User not found'});
    res.status(204).end();
  }
  catch{res.status(500).json({message: 'Server Error'});}
};

// Export the Multer middleware
export const uploadProfilePicture = multer({ dest: 'uploads/' }).single('picture');

export const getProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.query.userId as string;
    const user = await User.findById(userId).populate('enrolledCourses');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const coursesWithProgress = (user.enrolledCourses as any[]).map((c: any) => {
      const mods = c.modules || [];
      const total = mods.length;
      const completed = mods.filter((m: any) => m.completed).length;
      const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
      return { _id: c._id, courseId: c.courseId, title: c.title, description: c.description, moduleCount: total, progress };
    });

    res.json({ ...user.toObject(), enrolledCourses: coursesWithProgress });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.query.userId as string;
    const { name, age, pronouns, bio } = req.body;
    const user = await User.findByIdAndUpdate(userId, { name, age, pronouns, bio }, { new: true });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

export const uploadPicture = async (req: Request, res: Response) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
  res.json({ profilePictureUrl: `/uploads/${req.file.filename}` });
};
