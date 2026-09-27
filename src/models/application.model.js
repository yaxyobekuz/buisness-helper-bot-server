import mongoose from 'mongoose';

import { APPLICATION_STATUS, APPLICATION_STATUSES } from '../constants.js';

const applicationSchema = new mongoose.Schema(
  {
    number: { type: Number, required: true, unique: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    fullName: { type: String, required: true },
    address: { type: String, required: true },
    phone: { type: String, required: true },
    content: { type: String, required: true },

    status: {
      type: String,
      enum: APPLICATION_STATUSES,
      default: APPLICATION_STATUS.new,
      index: true,
    },

    /** Soft delete — to'ldirilgan bo'lsa ariza ro'yxatlarda ko'rinmaydi. */
    deletedAt: { type: Date, default: null, index: true },
    /** Tadbirkor bilan birga o'chirilganmi (tiklashda shuni qaytarish uchun). */
    deletedWithUser: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const Application = mongoose.model('Application', applicationSchema);
