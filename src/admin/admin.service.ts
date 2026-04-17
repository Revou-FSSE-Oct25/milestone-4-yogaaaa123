import { Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { UserService } from '../user/user.service';
import { AccountService } from '../account/account.service';
import { UpdateUserDto } from '../user/dto/update-user.dto';
import { UpdateAccountDto } from '../account/dto/update-account.dto';

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private userService: UserService,
    private accountService: AccountService,
  ) {}

  async findAllUsers() {
    return this.userService.findAll();
  }

  // get user admin
  async findUserById(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        accounts: {
          select: {
            id: true,
            accountNumber: true,
            balance: true,
            createdAt: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User tidak ditemukan');
    }

    return user;
  }

  // Update user by ID (for admin)
  async updateUser(id: number, updateUserDto: UpdateUserDto) {
    // Jika user ingin update password, kita harus hash lagi
    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    return this.prisma.user.update({
      where: { id },
      data: updateUserDto,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });
  }

  // Delete user by ID (for admin)
  async removeUser(id: number) {
    return this.userService.remove(id);
  }

  // Get all accounts (for admin)
  async findAllAccounts() {
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

  // Get account by ID (for admin - tanpa filter userId)
  async findAccountById(id: number) {
    const account = await this.prisma.account.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        sentTrans: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            type: true,
            amount: true,
            destinationId: true,
            createdAt: true,
          },
        },
        receivedTrans: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            type: true,
            amount: true,
            sourceId: true,
            createdAt: true,
          },
        },
      },
    });

    if (!account) {
      throw new NotFoundException('Rekening tidak ditemukan');
    }

    return account;
  }

  // Update account by ID (for admin - tanpa filter userId)
  async updateAccount(id: number, data: UpdateAccountDto) {
    const account = await this.prisma.account.findUnique({
      where: { id },
    });

    if (!account) {
      throw new NotFoundException('Rekening tidak ditemukan');
    }

    return this.prisma.account.update({
      where: { id },
      data,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  // Delete account by ID (for admin - tanpa filter userId)
  async removeAccount(id: number) {
    // Cek apakah rekening ada
    const account = await this.prisma.account.findUnique({
      where: { id },
    });

    if (!account) {
      throw new NotFoundException('Rekening tidak ditemukan');
    }

    return this.prisma.account.delete({
      where: { id },
    });
  }

  // Get all transactions (for admin)
  async findAllTransactions() {
    return this.prisma.transaction.findMany({
      include: {
        source: {
          select: {
            id: true,
            accountNumber: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        destination: {
          select: {
            id: true,
            accountNumber: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 100, //limit untuk performance
    });
  }

  // Get transaction by ID (for admin)
  async findTransactionById(id: number) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id },
      include: {
        source: {
          select: {
            id: true,
            accountNumber: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        destination: {
          select: {
            id: true,
            accountNumber: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!transaction) {
      throw new NotFoundException('Transaksi tidak ditemukan');
    }

    return transaction;
  }
}
