import { ArgumentsHost, Catch, HttpStatus, Logger } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { Prisma } from '@prisma/client';
import { Response } from 'express';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaClientExceptionFilter extends BaseExceptionFilter {
  private readonly logger = new Logger(PrismaClientExceptionFilter.name);

  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    switch (exception.code) {
      case 'P2002': {
        // Unique Constraint Violation
        const status = HttpStatus.CONFLICT;
        const targetMeta = exception.meta?.target as
          | string
          | string[]
          | undefined;
        const target = Array.isArray(targetMeta)
          ? targetMeta.join(', ')
          : targetMeta || 'Data';

        this.logger.warn(
          `Konflik Data (P2002): Target [${target}] sudah digunakan.`,
        );

        response.status(status).json({
          statusCode: status,
          message: `Konflik Data: ${target} sudah digunakan atau terdaftar.`,
        });
        break;
      }
      case 'P2025': {
        // Record Not Found
        const status = HttpStatus.NOT_FOUND;

        this.logger.warn(`Record Not Found (P2025): ${exception.message}`);

        response.status(status).json({
          statusCode: status,
          message:
            'Record (Rekening/Data) yang dicari tidak ditemukan atau kondisi saldo tidak memenuhi syarat.',
        });
        break;
      }
      default:
        // Default (Melempar ke handler bawaan NestJS)
        super.catch(exception, host);
        break;
    }
  }
}
