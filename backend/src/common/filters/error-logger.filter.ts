import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { SystemService } from '../../system/system.service';

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

    // Only log 500+ errors (not 401, 404 etc)
    if (status >= 500) {
      const message = exception?.message || 'Internal server error';
      const stack = exception?.stack || '';

      SystemService.logError({
        level: 'error',
        message,
        stack: stack.slice(0, 2000),
        endpoint: request?.url,
        method: request?.method,
        status_code: status,
        user_id: request?.user?.id,
        ip: request?.ip,
      });

      this.logger.error(`${request?.method} ${request?.url} → ${status}: ${message}`);
    }

    response.status(status).json({
      statusCode: status,
      message: exception?.message || 'Internal server error',
      error: exception?.name || 'Error',
      timestamp: new Date().toISOString(),
    });
  }
}
