import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Terjadi kesalahan pada server';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      
      // Untuk error 500, hindari membocorkan detail internal
      if (status === HttpStatus.INTERNAL_SERVER_ERROR) {
        message = 'Terjadi kesalahan pada server';
      } else {
        message = typeof exceptionResponse === 'string'
          ? exceptionResponse
          : (exceptionResponse as Record<string, unknown>).message as string || message;
      }
    } else if (exception instanceof Error) {
      this.logger.error(exception.message, exception.stack);
      // Untuk unhandled error, tetap gunakan message generik "Terjadi kesalahan pada server"
    }

    response.status(status).json({ error: message });
  }
}

