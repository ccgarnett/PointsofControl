import mongoose, {Schema, Document, Types} from 'mongoose';

interface ITask extends Document{
    user_id: Types.ObjectId;
    dateKey: string;
    description: string;
    completed: boolean;
    createdAt: Date;
    updatedAt: Date;
    archivedAt?: Date | null;
}

const taskSchema: Schema = new Schema({
    user_id: {type: Schema.Types.ObjectId, ref: 'User', required: true},
    dateKey:{type: String, required: true},
    description:{type: String, required: true},
    completed:{type: Boolean, default: false},
    createdAt:{type: Date, default: Date.now},
    updatedAt:{type: Date, default: Date.now},
    archivedAt:{type: Date, default: null},
}, {timestamps: true}
);

taskSchema.index({user_id: 1, dateKey: 1, archivedAt: 1, createdAt: -1});

export type NewTaskInput = Omit<ITask, 'createdAt' | 'updatedAt' | 'archivedAt'>;
export default mongoose.model<ITask>('Task', taskSchema);