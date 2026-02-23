import mongoose, {Schema, model, Types, Document} from 'mongoose';

export type UserRole = 'Admin' | 'User';
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
  role: UserRole; 
  enrolledCourses: any[]; // Changed to any[] temporarily to break the recursion link, change to Types.ObjectId[] when applicable
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserDocument extends IUser, Document {}
export type NewUserInput = Omit<IUser, 'createdAt' | 'updatedAt'>;

// 2. Define the schema as a plain object first
// We remove the ": Schema" type here to stop the compiler from pre-calculating depths
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
  enrolledCourses: [{ type: Schema.Types.ObjectId, ref: 'Course' }]
};

const UserSchema = new Schema<IUserDocument>(userSchemaFields, { timestamps: true });

// 3. Export with a forced "any" bridge
export const UserModel = model<IUserDocument>('User', UserSchema);

export async function read(id: string | Types.ObjectId): Promise<IUserDocument | null>{
  return UserModel.findById(id).exec();
}

export async function readAll(): Promise<IUserDocument[]>{
  return UserModel.find().exec();
}

export async function create(newUser: NewUserInput): Promise<IUserDocument>{
  const user = new UserModel(newUser);
  await user.save();
  return user;
}

export async function del(id: string | Types.ObjectId): Promise<IUserDocument | null>{
  return UserModel.findByIdAndDelete(id).exec();
}

export async function deleteAll(): Promise<void>{
  await UserModel.deleteMany().exec();
}

export async function findLogin(username: string): Promise<IUserDocument | null>{
  return UserModel.findOne({username}).exec();
}

//export default UserModel as unknown as mongoose.Model<IUser>;
//module.exports = {create, read, readAll, del, deleteAll, findLogin}
export default UserModel;