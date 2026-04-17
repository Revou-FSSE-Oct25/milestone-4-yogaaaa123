import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const saltRounds = 10;
  const commonPassword = await bcrypt.hash('password123', saltRounds);

  console.log('Sedang mengisi data awal...');

  await prisma.account.deleteMany({
    where: { accountNumber: { in: ['5122937627', '3029953227'] } },
  });
  await prisma.user.deleteMany({
    where: {
      email: { in: ['admin@revobank.com', 'yoga@revo.com', 'andi@revo.com'] },
    },
  });

  // 1. Admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@revobank.com' },
    update: {},
    create: {
      email: 'admin@revobank.com',
      name: 'Super Admin',
      password: commonPassword,
      role: 'ADMIN',
    },
  });

  // 2. user 1
  const user1 = await prisma.user.upsert({
    where: { email: 'yoga@revo.com' },
    update: {},
    create: {
      email: 'yoga@revo.com',
      name: 'Yoga',
      password: commonPassword,
      role: 'USER',
      accounts: {
        create: {
          accountNumber: '5122937627',
          balance: 10000000,
        },
      },
    },
  });

  // 3. user 2
  const user2 = await prisma.user.upsert({
    where: { email: 'andi@revo.com' },
    update: {},
    create: {
      email: 'andi@revo.com',
      name: 'Andi',
      password: commonPassword,
      role: 'USER',
      accounts: {
        create: {
          accountNumber: '3029953227',
          balance: 5000000,
        },
      },
    },
  });

  console.log({ admin, user1, user2 });
  console.log('✅ Seed data berhasil dibuat!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
