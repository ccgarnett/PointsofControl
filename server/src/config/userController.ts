import { Request, Response } from 'express';
import User from './User';
import bcrypt from 'bcryptjs';
import multer from 'multer';

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
    const { username, passwordHash } = req.body;
    const user = await User.findOne({ username });

    if (!user) {
      return res.redirect('login.html?error=1');
    }

    const pwMatch = await bcrypt.compare(passwordHash, user.passwordHash);
    if (!pwMatch) {
      return res.redirect('login.html?error=1');
    }

    (req as any).session = (req as any).session ?? {};
    (req as any).session.user = { id: String(user._id), username: user.username };
    res.redirect('index.html');
  } catch (error) {
    res.status(500).send('Something went wrong. Please try again.');
  }
};

export const loggedUser = (req: Request, res: Response) => {
  const sessionUser = (req as any).session?.user;
  if (sessionUser) {
    res.send(sessionUser);
  } else {
    res.json(null);
  }
};

export const logoutUser = (req: Request, res: Response) => {
  if ((req as any).session) {
    (req as any).session.user = undefined;
  }
  res.redirect('index.html');
};

export const returnUDB = async (req: Request, res: Response) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    res.status(500).send('Error fetching user database.');
  }
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
