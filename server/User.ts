import mongoose, { Schema, Document } from 'mongoose';


export interface IUser extends Document {
  username: string;
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