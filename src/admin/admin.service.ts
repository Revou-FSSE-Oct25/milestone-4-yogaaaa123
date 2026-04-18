import { Injectable, NotFoundException, Logger, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { UserService } from '../user/user.service';
import { AccountService } from '../account/account.service';
import { UpdateUserDto } from '../user/dto/update-user.dto';
import { UpdateAccountDto } from '../account/dto/update-account.dto';
import { AuditService, AuditLogData } from '../audit/audit.service';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    private prisma: PrismaService,
    private userService: UserService,
    private accountService: AccountService,
    private auditService: AuditService,
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
  async updateUser(
    id: number, 
    updateUserDto: UpdateUserDto,
    adminId: number,
    adminEmail: string,
  ) {
    // Get old user data untuk audit
    const oldUser = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });

    if (!oldUser) {
      throw new NotFoundException('User tidak ditemukan');
    }

    // Jika user ingin update password, kita harus hash lagi
    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 12);
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: updateUserDto,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    // Log audit event
    await this.auditService.logAuditEvent({
      action: 'UPDATE' as any,
      entityType: 'USER' as any,
      entityId: id,
      adminId,
      adminEmail,
      oldData: oldUser,
      newData: updatedUser,
    });

    this.logger.log(`Admin ${adminEmail} updated user ${id}`);

    return updatedUser;
  }

  // Deactivate user by ID (for admin) - instead of delete
  async deactivateUser(
    id: number,
    adminId: number,
    adminEmail: string,
    reason?: string,
  ) {
    // Get user data untuk audit
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, email: true, role: true, isActive: true },
    });

    if (!user) {
      throw new NotFoundException('User tidak ditemukan');
    }

    if (!user.isActive) {
      throw new BadRequestException('User sudah nonaktif');
    }

    // Check if user has accounts with balance > 0
    const accounts = await this.prisma.account.findMany({
      where: { userId: id },
      select: { id: true, accountNumber: true, balance: true },
    });

    const accountsWithBalance = accounts.filter(acc => Number(acc.balance) > 0);
    if (accountsWithBalance.length > 0) {
      throw new BadRequestException(
        `User masih memiliki ${accountsWithBalance.length} rekening dengan saldo > 0. Harus transfer atau tarik dulu.`,
      );
    }

    // Deactivate user (soft delete)
    const deactivatedUser = await this.prisma.user.update({
      where: { id },
      data: {
        isActive: false,
        deactivatedAt: new Date(),
        deactivationReason: reason || 'Deactivated by admin',
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        deactivatedAt: true,
        deactivationReason: true,
      },
    });

    // Also deactivate all user's accounts
    await this.prisma.account.updateMany({
      where: { userId: id },
      data: { isActive: false },
    });

    // Log audit event
    await this.auditService.logAuditEvent({
      action: 'DEACTIVATE' as any,
      entityType: 'USER' as any,
      entityId: id,
      adminId,
      adminEmail,
      oldData: user,
      newData: deactivatedUser,
      metadata: {
        reason,
        accountsDeactivated: accounts.length,
        accountsWithBalance: accountsWithBalance.length,
      },
    });

    this.logger.log(`Admin ${adminEmail} deactivated user ${id} - Reason: ${reason || 'No reason provided'}`);

    return deactivatedUser;
  }

  // Reactivate user by ID (for admin)
  async reactivateUser(
    id: number,
    adminId: number,
    adminEmail: string,
    reason?: string,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, email: true, role: true, isActive: true },
    });

    if (!user) {
      throw new NotFoundException('User tidak ditemukan');
    }

    if (user.isActive) {
      throw new BadRequestException('User sudah aktif');
    }

    const reactivatedUser = await this.prisma.user.update({
      where: { id },
      data: {
        isActive: true,
        reactivatedAt: new Date(),
        reactivationReason: reason || 'Reactivated by admin',
        deactivationReason: null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        reactivatedAt: true,
        reactivationReason: true,
      },
    });

    // Also reactivate all user's accounts
    await this.prisma.account.updateMany({
      where: { userId: id },
      data: { isActive: true },
    });

    // Log audit event
    await this.auditService.logAuditEvent({
      action: 'REACTIVATE' as any,
      entityType: 'USER' as any,
      entityId: id,
      adminId,
      adminEmail,
      oldData: user,
      newData: reactivatedUser,
      metadata: { reason },
    });

    this.logger.log(`Admin ${adminEmail} reactivated user ${id} - Reason: ${reason || 'No reason provided'}`);

    return reactivatedUser;
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
