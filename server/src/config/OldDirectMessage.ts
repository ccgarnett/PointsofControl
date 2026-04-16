import mongoose, {Schema, Document} from "mongoose";

export interface IDirectMessage extends Document{
    senderId: mongoose.Schema.Types.ObjectId; 
    receiverId: mongoose.Schema.Types.ObjectId;
    content: string;
}

const DirectMessageSchema: Schema = new Schema ({
    senderId: {type: mongoose.Schema.Types.ObjectId, ref:"User", required: true},
    receiverId: {type: mongoose.Schema.Types.ObjectId, ref:"User", required: true},
    content: {type: String},
}, {timestamps: true});

export default mongoose.model<IDirectMessage>('directMessage', DirectMessageSchema);
