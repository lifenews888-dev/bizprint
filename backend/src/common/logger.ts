import * as winston from 'winston';
import { join } from 'path';

const logDir = join(process.cwd(), 'logs');

export const systemLogger = winston.createLogger({
  level: 'error',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json(),
  ),
  transports: [
    new winston.transports.File({ filename: join(logDir, 'error.log'), level: 'error', maxsize: 5242880, maxFiles: 5 }),
    new winston.transports.File({ filename: join(logDir, 'combined.log'), maxsize: 5242880, maxFiles: 3 }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  systemLogger.add(new winston.transports.Console({
    format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
  }));
}
