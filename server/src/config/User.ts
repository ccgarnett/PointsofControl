import mongoose from 'mongoose';

// 1. Keep your interface for the rest of the app to use
export interface IUser {
  username: string;
  email?: string;
  name?: string;
  age?: number;
  pronouns?: string;
  bio?: string;
  profilePictureUrl?: string;
  passwordHash: string;
  role: 'Admin' | 'User'; 
  enrolledCourses: any[]; // Changed to any[] temporarily to break the recursion link
  createdAt: Date;
}

// 2. Define the schema as a plain object first
// We remove the ": Schema" type here to stop the compiler from pre-calculating depths
const userSchemaFields = {
  username: { type: String, required: true, unique: true, trim: true },
  email: { type: String, required: false, trim: true },
  name: { type: String, required: false, trim: true },
  age: { type: Number, required: false },
  pronouns: { type: String, required: false, trim: true },
  bio: { type: String, required: false, trim: true },
  profilePictureUrl: { type: String, required: false, trim: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['Admin', 'User'], default: 'User' },
  enrolledCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }]
};

const UserSchema = new mongoose.Schema(userSchemaFields, { timestamps: true });

// 3. Export with a forced "any" bridge
const UserModel = mongoose.model<any>('User', UserSchema);

export default UserModel as unknown as mongoose.Model<IUser>;