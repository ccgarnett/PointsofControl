import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ICalendarTask extends Document {
  userId: Types.ObjectId;
  title: string;
  description?: string;
  date: Date;
  completed: boolean;
  createdAt: Date;
}

const CalendarTaskSchema = new Schema<ICalendarTask>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    description: { type: String },
    date: { type: Date, required: true },
    completed: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export default mongoose.model<ICalendarTask>('CalendarTask', CalendarTaskSchema);
