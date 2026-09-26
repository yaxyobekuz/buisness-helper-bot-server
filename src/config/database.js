import mongoose from 'mongoose';

import { env } from './env.js';
import { logger } from '../utils/logger.js';

mongoose.set('strictQuery', true);

mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB ulanishi uzildi');
});

mongoose.connection.on('reconnected', () => {
  logger.info('MongoDB ulanishi tiklandi');
});

mongoose.connection.on('error', (error) => {
  logger.error('MongoDB xatosi:', error.message);
});

export async function connectDatabase() {
  await mongoose.connect(env.mongodbUri, {
    serverSelectionTimeoutMS: 10_000,
  });

  logger.info(`MongoDB ulandi: ${mongoose.connection.name}`);
}

export async function disconnectDatabase() {
  await mongoose.connection.close();
  logger.info('MongoDB ulanishi yopildi');
}

export { mongoose };
