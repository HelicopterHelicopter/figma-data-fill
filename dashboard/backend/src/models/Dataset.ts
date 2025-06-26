import { Schema, model, Document } from 'mongoose';

export interface IDataset extends Document {
  name: string;
  description?: string;
  category?: string;
  data: string[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

const DatasetSchema = new Schema<IDataset>({
  name: {
    type: String,
    required: true,
    maxlength: 100,
    trim: true,
    index: true
  },
  description: {
    type: String,
    maxlength: 500,
    trim: true
  },
  category: {
    type: String,
    maxlength: 100,
    trim: true,
    index: true
  },
  data: {
    type: [String],
    required: true,
    validate: {
      validator: function(arr: string[]) {
        return arr.length > 0;
      },
      message: 'Data array cannot be empty'
    }
  },
  createdBy: {
    type: String,
    required: true,
    default: 'anonymous'
  }
}, {
  timestamps: true, // Automatically adds createdAt and updatedAt
  collection: 'datasets'
});

// Create indexes for better query performance
DatasetSchema.index({ name: 'text', description: 'text' }); // Text search
DatasetSchema.index({ category: 1, name: 1 }); // Category filtering
DatasetSchema.index({ createdAt: -1 }); // Recent datasets first

export const Dataset = model<IDataset>('Dataset', DatasetSchema); 