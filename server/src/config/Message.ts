import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage extends Document {
  content: string;
  postedBy: string;
  reactions: string[];
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema: Schema = new Schema(
  {
    content: { type: String, required: true, trim: true },
    postedBy: { type: String, required: true, trim: true },
    reactions: [{ type: String }],
  },
  { timestamps: true }
);

export default mongoose.model<IMessage>('Message', MessageSchema);
