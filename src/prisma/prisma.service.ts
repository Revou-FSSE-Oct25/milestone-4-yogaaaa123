import 'dotenv/config';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    // 1. Buat koneksi pool dari library 'pg' menggunakan URL dari .env
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });

    // 2. Bungkus pool tersebut ke dalam adapter Prisma
    const adapter = new PrismaPg(pool);

    // 3. Suapkan adapter tersebut ke PrismaClient
    super({
      adapter,
      log: ['query', 'info', 'warn', 'error'],
    });
  }

  async onModuleInit() {
    await this.$connect();
  }
}
