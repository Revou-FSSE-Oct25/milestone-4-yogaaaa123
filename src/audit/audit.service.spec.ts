import { Test, TestingModule } from '@nestjs/testing';
import { AuditService, AuditLogData } from './audit.service';
import { PrismaService } from '../prisma/prisma.service';

// Manual enums karena @prisma/client mungkin tidak mengekspor enums secara langsung
enum AuditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  VIEW = 'VIEW',
  DEACTIVATE = 'DEACTIVATE',
  REACTIVATE = 'REACTIVATE'
}

enum EntityType {
  USER = 'USER',
  ACCOUNT = 'ACCOUNT',
  TRANSACTION = 'TRANSACTION'
}

// Mock PrismaService
const mockPrismaService = {
  auditLog: {
    create: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
  },
};

describe('AuditService', () => {
  let service: AuditService;
  let prisma: typeof mockPrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<AuditService>(AuditService);
    prisma = module.get(PrismaService);

    // Reset semua mock
    jest.clearAllMocks();
  });

  describe('logAuditEvent', () => {
    const mockAuditData: AuditLogData = {
      action: AuditAction.CREATE,
      entityType: EntityType.USER,
      entityId: 1,
      adminId: 2,
      adminEmail: 'admin@example.com',
      oldData: null,
      newData: { name: 'Test User', email: 'test@example.com' },
      ipAddress: '127.0.0.1',
      userAgent: 'Mozilla/5.0',
    };

    it('should successfully log audit event', async () => {
      prisma.auditLog.create.mockResolvedValue({
        id: 1,
        ...mockAuditData,
        createdAt: new Date(),
      });

      await service.logAuditEvent(mockAuditData);

      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          action: mockAuditData.action,
          entityType: mockAuditData.entityType,
          entityId: mockAuditData.entityId,
          adminId: mockAuditData.adminId,
          adminEmail: mockAuditData.adminEmail,
          oldData: null,
          newData: JSON.parse(JSON.stringify(mockAuditData.newData)),
          ipAddress: mockAuditData.ipAddress,
          userAgent: mockAuditData.userAgent,
        },
      });
    });

    it('should handle JSON.stringify for complex objects', async () => {
      const complexData = {
        ...mockAuditData,
        oldData: { nested: { value: 'old' } },
        newData: { nested: { value: 'new' } },
      };

      prisma.auditLog.create.mockResolvedValue({
        id: 1,
        ...complexData,
        createdAt: new Date(),
      });

      await service.logAuditEvent(complexData);

      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          action: complexData.action,
          entityType: complexData.entityType,
          entityId: complexData.entityId,
          adminId: complexData.adminId,
          adminEmail: complexData.adminEmail,
          oldData: JSON.parse(JSON.stringify(complexData.oldData)),
          newData: JSON.parse(JSON.stringify(complexData.newData)),
          ipAddress: complexData.ipAddress,
          userAgent: complexData.userAgent,
        },
      });
    });

    it('should not throw error when audit logging fails', async () => {
      prisma.auditLog.create.mockRejectedValue(new Error('Database error'));

      // Should not throw error
      await expect(service.logAuditEvent(mockAuditData)).resolves.not.toThrow();
    });
  });

  describe('getAuditLogs', () => {
    const page = 1;
    const limit = 10;

    it('should return paginated audit logs', async () => {
      const mockAuditLogs = [
        {
          id: 1,
          action: AuditAction.CREATE,
          entityType: EntityType.USER,
          entityId: 1,
          adminId: 2,
          adminEmail: 'admin@example.com',
          createdAt: new Date('2024-01-01T00:00:00Z'),
        },
        {
          id: 2,
          action: AuditAction.UPDATE,
          entityType: EntityType.ACCOUNT,
          entityId: 1,
          adminId: 2,
          adminEmail: 'admin@example.com',
          createdAt: new Date('2024-01-02T00:00:00Z'),
        },
      ];

      const mockCount = 2;

      prisma.auditLog.findMany.mockResolvedValue(mockAuditLogs);
      prisma.auditLog.count.mockResolvedValue(mockCount);

      const result = await service.getAuditLogs(page, limit);

      expect(result).toEqual({
        meta: {
          total: mockCount,
          page,
          limit,
          totalPages: Math.ceil(mockCount / limit),
        },
        data: mockAuditLogs,
      });
      expect(prisma.auditLog.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      });
      expect(prisma.auditLog.count).toHaveBeenCalledWith({ where: {} });
    });

    it('should return empty array when no audit logs', async () => {
      prisma.auditLog.findMany.mockResolvedValue([]);
      prisma.auditLog.count.mockResolvedValue(0);

      const result = await service.getAuditLogs(page, limit);

      expect(result).toEqual({
        meta: {
          total: 0,
          page,
          limit,
          totalPages: 0,
        },
        data: [],
      });
    });

    it('should accept optional action and entityType filters', async () => {
      const action = AuditAction.CREATE;
      const entityType = EntityType.USER;

      prisma.auditLog.findMany.mockResolvedValue([]);
      prisma.auditLog.count.mockResolvedValue(0);

      await service.getAuditLogs(page, limit, { action, entityType });

      expect(prisma.auditLog.findMany).toHaveBeenCalledWith({
        where: {
          action,
          entityType,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      });
      expect(prisma.auditLog.count).toHaveBeenCalledWith({
        where: {
          action,
          entityType,
        },
      });
    });
  });
});