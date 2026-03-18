import mongoose, { Schema, Document } from 'mongoose';

export interface IReaction {
  userId: string;
  type: string;
}

export interface IMessage extends Document {
  content: string;
  postedBy: string;
  reactions: IReaction[];
  acknowledgedBy: string[];
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema: Schema = new Schema(
  {
    content: { type: String, required: true, trim: true },
    postedBy: { type: String, required: true, trim: true },
    reactions: [
      {
        userId: { type: String, required: true },
        type: { type: String, required: true },
      },
    ],
    acknowledgedBy: [{ type: String }],
  },
  { timestamps: true }
);

export default mongoose.model<IMessage>('Message', MessageSchema);
