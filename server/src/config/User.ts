import { Schema, model, Types, HydratedDocument } from 'mongoose';

export type UserRole = 'Admin' | 'User';

export interface IUser {
  username: string;
  email?: string;
  name?: string;
  age?: number;
  pronouns?: string;
  bio?: string;
  profilePictureUrl?: string;
  passwordHash: string;
  role: UserRole;
  enrolledCourses: Types.ObjectId[];
  is_active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// IUserDocument is the hydrated Mongoose document — derived from the model,
// not by manually extending Document (which triggers TS2589).
export type IUserDocument = HydratedDocument<IUser>;
export type NewUserInput = Omit<IUser, 'createdAt' | 'updatedAt' | 'is_active'>;

const userSchemaFields: Record<keyof Omit<IUser, 'createdAt' | 'updatedAt'>, any> = {
  username: { type: String, required: true, unique: true, trim: true },
  email: { type: String, required: false, trim: true },
  name: { type: String, required: false, trim: true },
  age: { type: Number, required: false },
  pronouns: { type: String, required: false, trim: true },
  bio: { type: String, required: false, trim: true },
  profilePictureUrl: { type: String, required: false, trim: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['Admin', 'User'], default: 'User' },
  enrolledCourses: [{ type: Schema.Types.ObjectId, ref: 'Course' }],
  is_active: { type: Boolean, default: true },
};

// Schema and model both use the plain IUser interface — Mongoose v6+ pattern.
const UserSchema = new Schema<IUser>(userSchemaFields as any, { timestamps: true });

export const UserModel = model<IUser>('User', UserSchema);

export async function read(id: string | Types.ObjectId): Promise<IUserDocument | null> {
  return UserModel.findById(id).exec();
}

export async function readAll(): Promise<IUserDocument[]> {
  return UserModel.find().exec();
}

export async function create(newUser: NewUserInput): Promise<IUserDocument> {
  const user = new UserModel(newUser);
  await user.save();
  return user;
}

export async function del(id: string | Types.ObjectId): Promise<IUserDocument | null> {
  return UserModel.findByIdAndDelete(id).exec();
}

export async function deleteAll(): Promise<void> {
  await UserModel.deleteMany().exec();
}

export async function findLogin(username: string): Promise<IUserDocument | null> {
  return UserModel.findOne({ username }).exec();
}

export default UserModel;
