import mongoose from 'mongoose';

import { DIRECTION_STATUS, DIRECTION_STATUSES } from '../constants.js';

const directionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    status: {
      type: String,
      enum: DIRECTION_STATUSES,
      default: DIRECTION_STATUS.active,
      index: true,
    },
  },
  { timestamps: true },
);

export const Direction = mongoose.model('Direction', directionSchema);
