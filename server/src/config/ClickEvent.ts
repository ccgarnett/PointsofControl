import mongoose, { Schema, Document } from 'mongoose';

export type ClickEventType = 'enroll_click' | 'pageview';

export interface IClickEvent extends Document {
  courseId: string;
  userId: string | null;
  eventType: ClickEventType;
  createdAt: Date;
}

const ClickEventSchema: Schema = new Schema(
  {
    courseId: { type: String, required: true },
    userId: { type: String, default: null },
    eventType: { type: String, enum: ['enroll_click', 'pageview'], required: true },
  },
  { timestamps: true }
);

export default mongoose.model<IClickEvent>('ClickEvent', ClickEventSchema);
