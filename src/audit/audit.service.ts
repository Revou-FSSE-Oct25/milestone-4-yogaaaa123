import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditAction, EntityType } from '@prisma/client';

export interface AuditLogData {
  action: AuditAction;
  entityType: EntityType;
  entityId?: number;
  adminId: number;
  adminEmail: string;
  oldData?: any;
  newData?: any;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private prisma: PrismaService) {}

  async logAuditEvent(data: AuditLogData): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          action: data.action,
          entityType: data.entityType,
          entityId: data.entityId,
          adminId: data.adminId,
          adminEmail: data.adminEmail,
          oldData: data.oldData ? JSON.parse(JSON.stringify(data.oldData)) : null,
          newData: data.newData ? JSON.parse(JSON.stringify(data.newData)) : null,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
        },
      });

      this.logger.log(
        `[AUDIT] ${data.action} ${data.entityType} ${data.entityId ? `ID: ${data.entityId}` : ''} by Admin: ${data.adminEmail}`,
      );
    } catch (error) {
      this.logger.error(`[AUDIT] Failed to log audit event: ${(error as Error).message}`);
      // Jangan throw error agar operasi utama tetap berjalan
    }
  }

  async getAuditLogs(
    page: number = 1,
    limit: number = 50,
    filters?: {
      action?: string;
      entityType?: string;
      entityId?: number;
      adminId?: number;
      startDate?: Date;
      endDate?: Date;
    },
  ) {
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters?.action) {
      where.action = filters.action;
    }

    if (filters?.entityType) {
      where.entityType = filters.entityType;
    }

    if (filters?.entityId) {
      where.entityId = filters.entityId;
    }

    if (filters?.adminId) {
      where.adminId = filters.adminId;
    }

    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.createdAt.lte = filters.endDate;
      }
    }

    const [total, logs] = await Promise.all([
      this.prisma.auditLog.count({ where }),
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return {
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      data: logs,
    };
  }

  async getAuditLogById(id: number) {
    const log = await this.prisma.auditLog.findUnique({
      where: { id },
    });

    if (!log) {
      throw new Error('Audit log not found');
    }

    return log;
  }
}