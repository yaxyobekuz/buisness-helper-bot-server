import mongoose from 'mongoose';

import { APPLICATION_STATUS, APPLICATION_STATUSES } from '../constants.js';

const fileSchema = new mongoose.Schema(
  {
    fileName: { type: String, required: true },
    originalName: { type: String, default: null },
    mimeType: { type: String, default: null },
    size: { type: Number, default: 0 },
  },
  { _id: false },
);

const applicationSchema = new mongoose.Schema(
  {
    number: { type: Number, required: true, unique: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    direction: { type: mongoose.Schema.Types.ObjectId, ref: 'Direction', required: true, index: true },
    content: { type: String, required: true },
    files: { type: [fileSchema], default: [] },
    status: {
      type: String,
      enum: APPLICATION_STATUSES,
      default: APPLICATION_STATUS.new,
      index: true,
    },
  },
  { timestamps: true },
);

export const Application = mongoose.model('Application', applicationSchema);
