import mongoose, { Schema, Document } from 'mongoose';


export interface IUser extends Document {
  username: string;
  email?: string;
  name?: string;
  age?: number;
  pronouns?: string;
  bio?: string;
  profilePictureUrl?: string;
  passwordHash: string;
  role: 'Admin' | 'User'; // Restricted to the two roles defined 
  enrolledCourses: mongoose.Types.ObjectId[]; 
  createdAt: Date;
}

// 2. Create the Mongoose Schema
const UserSchema: Schema = new Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: false,
    trim: true
  },
  name: {
    type: String,
    required: false,
    trim: true
  },
  age: {
    type: Number,
    required: false
  },
  pronouns: {
    type: String,
    required: false,
    trim: true
  },
  bio: {
    type: String,
    required: false,
    trim: true
  },
  profilePictureUrl: {
    type: String,
    required: false,
    trim: true
  },
  passwordHash: {
    type: String,
    required: true
  
  },
  role: {
    type: String,
    enum: ['Admin', 'User'], // Enforces strict role validation 
    default: 'User'
  },
  enrolledCourses: [{
    type: Schema.Types.ObjectId,
    ref: 'Course' // Links to the "Courses" collection defined in your Data Design 
  }]
}, {
  timestamps: true
});


export default mongoose.model<IUser>('User', UserSchema);