import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
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
    const MAX_ATTEMPTS = 20; // Meningkatkan dari 5 ke 20 untuk mengurangi kemungkinan collision


    while (!isUnique && attempts < MAX_ATTEMPTS) {
      const randomPart = randomInt(1000000000, 9999999999);
      accountNumber = randomPart.toString();

      const existingData = await this.prisma.account.findUnique({
        where: { accountNumber },
      });

      if (!existingData) {
        isUnique = true;
        break;
      }
      attempts++;
    }

    if (!isUnique) {
      throw new BadRequestException(
        `Sistem gagal membuat nomor rekening unik setelah ${MAX_ATTEMPTS} percobaan. Silakan coba lagi nanti.`,
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

  // 2. semua rekening punya user
  async findAll(userId: number) {
    return this.prisma.account.findMany({
      where: { userId },
    });
  }

  // 3 Lihat Satu Rekening
  async findOne(id: number, userId: number) {
    const account = await this.prisma.account.findFirst({
      where: { id, userId },
    });
    if (!account) throw new NotFoundException('Rekening tidak ditemukan');
    return account;
  }

  // 4.Edit Rekening
  async update(id: number, userId: number, data: UpdateAccountDto) {
    await this.findOne(id, userId);
    return this.prisma.account.update({
      where: { id },
      data,
    });
  }

  // 6. Update account
  async adminUpdate(id: number, data: UpdateAccountDto) {
    // Cek rekening
    const account = await this.prisma.account.findUnique({
      where: { id },
    });

    if (!account) {
      throw new NotFoundException('Rekening tidak ditemukan');
    }

    return this.prisma.account.update({
      where: { id },
      data,
    });
  }

  // 7. admin
  async adminFindOne(id: number) {
    const account = await this.prisma.account.findUnique({
      where: { id },
    });

    if (!account) {
      throw new NotFoundException('Rekening tidak ditemukan');
    }

    return account;
  }

  // 8. lihat semua rekening
  async adminFindAll() {
    return this.prisma.account.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // 5. hapus rekening
  async remove(id: number, userId: number) {
    await this.findOne(id, userId); // Pastikan rekening ada & milik user
    return this.prisma.account.delete({
      where: { id },
    });
  }
}
