import { Request, Response } from 'express';
import User from './User';
import Course from './Course';
import bcrypt from 'bcryptjs';
import multer from 'multer';

/**
 * Creates a new user account and adds it to the database
 * @param req - The request object containing the required data
 * @param res - The response object used to send data to the database
 */
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

export const loginUser = async (req: Request, res: Response) => {
  try{
    const {username, passwordHash} = req.body;
    const user = await User.findOne({username});

    if(!user){ //can't find user
      return res.redirect('login.html?error=1');
    }

    const pwMatch = await bcrypt.compare(passwordHash, user.passwordHash); //check if password matches
    if(!pwMatch){ //if not, redirect to login page with error
      return res.redirect('login.html?error=1');
    }

    // Store only safe, serializable user info (never passwordHash)
    req.session = req.session ?? {};
    req.session.user = { id: String(user._id), username: user.username };
    res.redirect('index.html');
  } catch (error){
    res.status(500).send("Something went wrong. please try again.");
  }
  };

export const loggedUser = (req: Request, res: Response) => {
  const sessionUser = req.session?.user;
  if(sessionUser){
    res.send(sessionUser);
  }else{
    res.json(null);
  }
};

export const logoutUser = (req: Request, res: Response) => {
  if (req.session) {
    req.session.user = undefined;
  }
  res.redirect('index.html');
};

//return all users
export const returnUDB = async (req: Request, res: Response) => {
  try{
    const users = await User.find();
    res.json(users);
  } catch (error){
    res.status(500).send("Error fetching user database.");
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
