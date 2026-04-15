import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IDirectMessage extends Document {
  userId: Types.ObjectId;   // non-admin user in this conversation
  fromAdmin: boolean;       // true = Jordan sent, false = user sent
  senderUsername: string;
  content: string;
  createdAt: Date;
}

const DirectMessageSchema = new Schema<IDirectMessage>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    fromAdmin: { type: Boolean, required: true, default: false },
    senderUsername: { type: String, required: true },
    content: { type: String, required: true, trim: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

DirectMessageSchema.index({ userId: 1, createdAt: 1 });

export default mongoose.model<IDirectMessage>('DirectMessage', DirectMessageSchema);
