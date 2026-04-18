import { ArgumentsHost, Catch, HttpStatus, Logger, BadRequestException } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { Response } from 'express';
import { JsonWebTokenError } from 'jsonwebtoken';

@Catch(SyntaxError, JsonWebTokenError, BadRequestException)
export class JsonExceptionFilter extends BaseExceptionFilter {
  private readonly logger = new Logger(JsonExceptionFilter.name);

  catch(exception: SyntaxError | JsonWebTokenError | BadRequestException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    this.logger.debug(`JsonExceptionFilter triggered for: ${exception.constructor.name}`);

    let status = HttpStatus.BAD_REQUEST;
    let message = 'Permintaan tidak valid';

    if (exception instanceof SyntaxError) {
      if (exception.message.includes('JSON')) {
        message = 'Format JSON tidak valid. Pastikan struktur JSON benar dan tidak ada kesalahan sintaks.';
      } else {
        message = 'Kesalahan sintaks pada permintaan';
      }
      this.logger.warn(`Kesalahan parsing JSON: ${exception.message}`);
      response.status(status).json({
        statusCode: status,
        message,
        error: 'Bad Request',
      });
      return;
    } else if (exception instanceof JsonWebTokenError) {
      message = 'Token tidak valid atau telah kedaluwarsa';
      status = HttpStatus.UNAUTHORIZED;
      this.logger.warn(`Kesalahan JWT: ${exception.message}`);
      response.status(status).json({
        statusCode: status,
        message,
        error: 'Unauthorized',
      });
      return;
    } else if (exception instanceof BadRequestException) {
      const responseObj = exception.getResponse();
      const originalMessage = typeof responseObj === 'string' ? responseObj : (responseObj as any).message;
      
      if (typeof originalMessage === 'string' && (
        originalMessage.includes('Expected') && 
        (originalMessage.includes('JSON') || originalMessage.includes('property value'))
      )) {
        message = 'Format JSON tidak valid. Pastikan struktur JSON benar dan tidak ada kesalahan sintaks.';
        this.logger.warn(`Kesalahan parsing JSON: ${originalMessage}`);
        response.status(status).json({
          statusCode: status,
          message,
          error: 'Bad Request',
        });
        return;
      } else {
        // Biarkan pesan asli untuk BadRequestException lainnya
        message = originalMessage;
        this.logger.warn(`BadRequestException: ${originalMessage}`);
        // Fall through to default handling
      }
    }

    // For other exceptions, let the base filter handle
    super.catch(exception, host);
  }
}
