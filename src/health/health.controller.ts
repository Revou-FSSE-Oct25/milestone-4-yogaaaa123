import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'Basic health check' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  @ApiResponse({ status: 503, description: 'Service is unhealthy' })
  async healthCheck() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'RevoBank API',
      version: process.env.npm_package_version || '0.0.1',
    };
  }

  @Get('ready')
  @ApiOperation({ summary: 'Readiness probe' })
  @ApiResponse({ status: 200, description: 'Service is ready to accept traffic' })
  @ApiResponse({ status: 503, description: 'Service is not ready' })
  async readiness() {
    try {
      // Check database connection
      await this.prisma.$queryRaw`SELECT 1`;
      
      return {
        status: 'ready',
        timestamp: new Date().toISOString(),
        database: 'connected',
        checks: {
          database: true,
          memory: process.memoryUsage().heapUsed < 100 * 1024 * 1024, // < 100MB
        },
      };
    } catch (error) {
      throw {
        status: 'not ready',
        timestamp: new Date().toISOString(),
        database: 'disconnected',
        error: (error as Error).message,
      };
    }
  }

  @Get('live')
  @ApiOperation({ summary: 'Liveness probe' })
  @ApiResponse({ status: 200, description: 'Service is alive' })
  @ApiResponse({ status: 503, description: 'Service is not alive' })
  liveness() {
    const memoryUsage = process.memoryUsage();
    const uptime = process.uptime();

    return {
      status: 'alive',
      timestamp: new Date().toISOString(),
      uptime: `${Math.floor(uptime)}s`,
      memory: {
        heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
        rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
      },
      node: {
        version: process.version,
        pid: process.pid,
      },
    };
  }

  @Get('metrics')
  @ApiOperation({ summary: 'Basic metrics' })
  @ApiResponse({ status: 200, description: 'Service metrics' })
  async metrics() {
    const memoryUsage = process.memoryUsage();
    const uptime = process.uptime();

    // Get some basic database metrics
    const [userCount, accountCount, transactionCount] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.account.count(),
      this.prisma.transaction.count(),
    ]);

    return {
      timestamp: new Date().toISOString(),
      system: {
        uptime: `${Math.floor(uptime)}s`,
        memory: {
          heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
          heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
          rss: Math.round(memoryUsage.rss / 1024 / 1024),
        },
      },
      database: {
        users: userCount,
        accounts: accountCount,
        transactions: transactionCount,
      },
    };
  }
}