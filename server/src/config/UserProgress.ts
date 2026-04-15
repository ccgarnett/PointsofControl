import mongoose, { Schema, Document } from 'mongoose';

export interface IUserProgress extends Document {
  userId: string;
  courseId: string;
  completedModules: number[];
}

const UserProgressSchema: Schema = new Schema(
  {
    userId: { type: String, required: true },
    courseId: { type: String, required: true },
    completedModules: [{ type: Number }],
  },
  { timestamps: true }
);

UserProgressSchema.index({ userId: 1, courseId: 1 }, { unique: true });

export default mongoose.model<IUserProgress>('UserProgress', UserProgressSchema);
