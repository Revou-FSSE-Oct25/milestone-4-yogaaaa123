import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateAccountDto } from './dto/update-account.dto';
import { randomInt } from 'crypto';

@Injectable()
export class AccountService {
  constructor(private prisma: PrismaService) {}

  // 1. CREATE: Buka Rekening Baru
  async create(userId: number) {
    let accountNumber = '';
    let isUnique = false;
    let attempts = 0;
    const MAX_ATTEMPTS = 5;

    // Menghasilkan nomor rekening menggunakan modul standar security (Crypto)
    // dan memastikan bahwa ia belum pernah dipakai (Retry Mechanism)
    while (!isUnique && attempts < MAX_ATTEMPTS) {
      // Menghasilkan angka random 10 digit dengan standar kriptografi
      const randomPart = randomInt(1000000000, 9999999999);
      accountNumber = randomPart.toString();

      const existingData = await this.prisma.account.findUnique({
        where: { accountNumber },
      });

      if (!existingData) {
        isUnique = true;
      }
      attempts++;
    }

    if (!isUnique) {
      throw new Error(
        'Sistem gagal membuat nomor rekening unik. Silakan coba lagi nanti.',
      );
    }

    return this.prisma.account.create({
      data: {
        accountNumber,
        balance: 0,
        userId,
      },
    });
  }

  // 2. LIST: Lihat Semua Rekening Milik User
  async findAll(userId: number) {
    return this.prisma.account.findMany({
      where: { userId },
    });
  }

  // 3. DETAIL: Lihat Satu Rekening
  async findOne(id: number, userId: number) {
    const account = await this.prisma.account.findFirst({
      where: { id, userId },
    });
    if (!account) throw new NotFoundException('Rekening tidak ditemukan');
    return account;
  }

  // 4. UPDATE: Edit Balance Rekening (ADMIN ONLY)
  async update(id: number, userId: number, data: UpdateAccountDto) {
    await this.findOne(id, userId); // Pastikan rekening ada & milik user
    return this.prisma.account.update({
      where: { id },
      data,
    });
  }

  // 5. DELETE: Tutup Rekening
  async remove(id: number, userId: number) {
    await this.findOne(id, userId); // Pastikan rekening ada & milik user
    return this.prisma.account.delete({
      where: { id },
    });
  }
}
