import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { PrismaService } from '../prisma/prisma.service';

// Mock PrismaService
const mockPrismaService = {
  $queryRaw: jest.fn(),
  user: {
    count: jest.fn(),
  },
  account: {
    count: jest.fn(),
  },
  transaction: {
    count: jest.fn(),
  },
};

// Mock process object
const originalProcess = { ...process };
let mockProcess: any = {
  env: { npm_package_version: '1.0.0' },
  memoryUsage: jest.fn(),
  uptime: jest.fn(),
  version: 'v18.0.0',
  pid: 12345,
};

describe('HealthController', () => {
  let controller: HealthController;
  let prisma: typeof mockPrismaService;

  beforeEach(async () => {
    // Reset mock process
    mockProcess = {
      env: { npm_package_version: '1.0.0' },
      memoryUsage: jest.fn(),
      uptime: jest.fn(),
      version: 'v18.0.0',
      pid: 12345,
    };

    // Temporarily replace process methods
    (global as any).process = { ...originalProcess, ...mockProcess };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    prisma = module.get(PrismaService);

    // Reset semua mock
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Restore original process
    (global as any).process = originalProcess;
  });

  describe('healthCheck', () => {
    it('should return health status with timestamp and version', async () => {
      const result = await controller.healthCheck();

      expect(result).toEqual({
        status: 'ok',
        timestamp: expect.any(String),
        service: 'RevoBank API',
        version: '1.0.0',
      });
      expect(new Date(result.timestamp).getTime()).toBeGreaterThan(0);
    });

    it('should use default version when npm_package_version is not set', async () => {
      mockProcess.env.npm_package_version = undefined;

      const result = await controller.healthCheck();

      expect(result.version).toBe('0.0.1');
    });
  });

  describe('readiness', () => {
    it('should return ready status when database is connected and memory is OK', async () => {
      prisma.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);
      mockProcess.memoryUsage.mockReturnValue({
        heapUsed: 50 * 1024 * 1024, // 50MB < 100MB
      });

      const result = await controller.readiness();

      expect(result).toEqual({
        status: 'ready',
        timestamp: expect.any(String),
        database: 'connected',
        checks: {
          database: true,
          memory: true, // < 100MB
        },
      });
      expect(prisma.$queryRaw).toHaveBeenCalledWith(['SELECT 1']);
    });

    it('should return not ready status when database query fails', async () => {
      const dbError = new Error('Database connection failed');
      prisma.$queryRaw.mockRejectedValue(dbError);

      await expect(controller.readiness()).rejects.toEqual({
        status: 'not ready',
        timestamp: expect.any(String),
        database: 'disconnected',
        error: 'Database connection failed',
      });
    });

    it('should return memory check false when heap used > 100MB', async () => {
      prisma.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);
      mockProcess.memoryUsage.mockReturnValue({
        heapUsed: 150 * 1024 * 1024, // 150MB > 100MB
      });

      const result = await controller.readiness();

      expect(result.checks.memory).toBe(false);
    });
  });

  describe('liveness', () => {
    it('should return liveness status with system information', () => {
      mockProcess.memoryUsage.mockReturnValue({
        heapUsed: 50 * 1024 * 1024, // 50MB
        heapTotal: 100 * 1024 * 1024, // 100MB
        rss: 200 * 1024 * 1024, // 200MB
      });
      mockProcess.uptime.mockReturnValue(3600); // 1 hour

      const result = controller.liveness();

      expect(result).toEqual({
        status: 'alive',
        timestamp: expect.any(String),
        uptime: '3600s',
        memory: {
          heapUsed: '50MB',
          heapTotal: '100MB',
          rss: '200MB',
        },
        node: {
          version: 'v18.0.0',
          pid: 12345,
        },
      });
    });
  });

  describe('metrics', () => {
    it('should return metrics with database counts and system info', async () => {
      mockProcess.memoryUsage.mockReturnValue({
        heapUsed: 50 * 1024 * 1024, // 50MB
        heapTotal: 100 * 1024 * 1024, // 100MB
        rss: 200 * 1024 * 1024, // 200MB
      });
      mockProcess.uptime.mockReturnValue(7200); // 2 hours

      prisma.user.count.mockResolvedValue(10);
      prisma.account.count.mockResolvedValue(5);
      prisma.transaction.count.mockResolvedValue(100);

      const result = await controller.metrics();

      expect(result).toEqual({
        timestamp: expect.any(String),
        system: {
          uptime: '7200s',
          memory: {
            heapUsed: 50,
            heapTotal: 100,
            rss: 200,
          },
        },
        database: {
          users: 10,
          accounts: 5,
          transactions: 100,
        },
      });
      expect(prisma.user.count).toHaveBeenCalledTimes(1);
      expect(prisma.account.count).toHaveBeenCalledTimes(1);
      expect(prisma.transaction.count).toHaveBeenCalledTimes(1);
    });

    it('should handle database count errors gracefully', async () => {
      mockProcess.memoryUsage.mockReturnValue({
        heapUsed: 50 * 1024 * 1024,
        heapTotal: 100 * 1024 * 1024,
        rss: 200 * 1024 * 1024,
      });
      mockProcess.uptime.mockReturnValue(7200);

      prisma.user.count.mockRejectedValue(new Error('DB error'));
      prisma.account.count.mockResolvedValue(5);
      prisma.transaction.count.mockResolvedValue(100);

      await expect(controller.metrics()).rejects.toThrow('DB error');
    });
  });
});