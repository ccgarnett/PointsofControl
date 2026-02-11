import mongoose, { Schema, Document } from 'mongoose';

// 1. Define Interface for a Module
// As per the diagram, a Course is made of Modules[cite: 104].
interface IModule {
  title: string;
  contentUrl: string; // URL for the video embed or document
  completed: boolean; // Tracks if the module is done
}

// 2. Define Interface for the Course
export interface ICourse extends Document {
  courseId: string; // Unique ID (e.g., "POC-101") 
  title: string;
  description: string;
  videoEmbedLinks: string[]; // Specific requirement from Data Design 
  modules: IModule[]; // Array of embedded module objects 
  price: number; // Necessary for the "Purchase" feature
  createdAt: Date;
}

// 3. Create the Schema
const CourseSchema: Schema = new Schema({
  courseId: {
    type: String,
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: false
  },
  // "video_embed_links" from spec mapped to CamelCase "videoEmbedLinks"
  videoEmbedLinks: [{
    type: String
  }],
  // Embedded Sub-document for Modules
  modules: [{
    title: { type: String, required: true },
    contentUrl: { type: String, required: true },
    completed: { type: Boolean, default: false }
  }],
  price: {
    type: Number,
    required: true
  }
}, {
  timestamps: true
});

// 4. Export the Model
// Collection name will be 'courses'
export default mongoose.model<ICourse>('Course', CourseSchema);