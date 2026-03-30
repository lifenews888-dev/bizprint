import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { SystemService } from '../../system/system.service';
import { systemLogger } from '../logger';

// Global Socket.IO server reference (set from main.ts)
let _io: any = null;
export function setSocketServer(io: any) { _io = io; }

@Catch()
export class ErrorLoggerFilter implements ExceptionFilter {
  private readonly logger = new Logger('ErrorLogger');

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest();
    const response = ctx.getResponse();

    const status = exception instanceof HttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const message = exception?.message || 'Internal server error';

    // Log 500+ errors → memory + file + socket
    if (status >= 500) {
      const stack = exception?.stack || '';
      const errorEntry = {
        level: 'error',
        message,
        stack: stack.slice(0, 2000),
        endpoint: request?.url,
        method: request?.method,
        status_code: status,
        user_id: request?.user?.id,
        ip: request?.ip,
      };

      // 1. In-memory log (Admin API)
      SystemService.logError(errorEntry);

      // 2. Winston file log
      systemLogger.error(message, { ...errorEntry, stack });

      // 3. Real-time push to admin via Socket.IO
      if (_io) {
        _io.to('admin').emit('system_error', {
          ...errorEntry,
          id: Date.now().toString(36),
          created_at: new Date().toISOString(),
        });
      }

      this.logger.error(`${request?.method} ${request?.url} → ${status}: ${message}`);
    }

    response.status(status).json({
      statusCode: status,
      message,
      error: exception?.name || 'Error',
      timestamp: new Date().toISOString(),
    });
  }
}
