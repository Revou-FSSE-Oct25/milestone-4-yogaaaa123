import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger, // 1. Tambahkan Logger di sini
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TransactionService {
  // 2. Inisialisasi Logger khusus untuk class ini
  private readonly logger = new Logger(TransactionService.name);

  constructor(private prisma: PrismaService) {}

  // ==========================================
  // 1. FITUR DEPOSIT (SETOR TUNAI)
  // ==========================================
  async deposit(
    userId: number,
    accountNumber: string,
    amount: number,
    idempotencyKey?: string,
  ) {
    this.logger.log(
      `[DEPOSIT] Memulai deposit Rp${amount} ke rekening ${accountNumber}`,
    );

    try {
      if (amount <= 0)
        throw new BadRequestException('Jumlah setor tunai harus lebih dari 0');

      // [FIX NO.1] Pindah ke Interactive Transaction untuk menjaga integritas db
      const result = await this.prisma.$transaction(async (tx) => {
        const account = await tx.account.findFirst({
          where: { accountNumber, userId },
        });

        if (!account)
          throw new NotFoundException(
            'Rekening tidak ditemukan atau bukan milikmu',
          );

        const updatedAccount = await tx.account.update({
          where: { id: account.id },
          data: { balance: { increment: amount } },
        });

        const txRecord = await tx.transaction.create({
          data: {
            type: 'DEPOSIT',
            amount,
            destinationId: account.id,
            idempotencyKey,
          },
        });

        return { updatedAccount, txRecord };
      });

      this.logger.log(
        `[DEPOSIT] ✅ Berhasil. Saldo baru ${accountNumber}: Rp${Number(result.updatedAccount.balance)}`,
      );
      return {
        message: 'Deposit berhasil!',
        // [FIX NO.2] Casting ke Number() krn Decimal type dari object return Prisma
        newBalance: Number(result.updatedAccount.balance),
        transaction_id: result.txRecord.id,
      };
    } catch (error) {
      this.logger.error(`[DEPOSIT] ❌ Gagal: ${(error as Error).message}`);
      throw error;
    }
  }

  // ==========================================
  // 2. FITUR WITHDRAW (TARIK TUNAI)
  // ==========================================
  async withdraw(
    userId: number,
    accountNumber: string,
    amount: number,
    idempotencyKey?: string,
  ) {
    this.logger.log(
      `[WITHDRAW] Memulai penarikan Rp${amount} dari rekening ${accountNumber}`,
    );

    try {
      if (amount <= 0)
        throw new BadRequestException('Jumlah tarik tunai harus lebih dari 0');

      // [FIX NO.1] Menggunakan Interactive Transaction
      const result = await this.prisma.$transaction(async (tx) => {
        const account = await tx.account.findFirst({
          where: { accountNumber, userId },
        });

        if (!account)
          throw new NotFoundException(
            'Rekening tidak ditemukan atau bukan milikmu',
          );

        // Validasi balance di service layer sebagai defensive programming
        const currentBalance = Number(account.balance);
        if (currentBalance < amount) {
          throw new BadRequestException('Saldo tidak mencukupi untuk melakukan penarikan');
        }

        const updatedResult = await tx.account.updateMany({
          where: {
            id: account.id,
            balance: { gte: amount }, // Validasi saldo di DB level langsung
          },
          data: { balance: { decrement: amount } },
        });

        if (updatedResult.count === 0) {
          throw new BadRequestException(
            'Saldo tidak mencukupi atau Request bertabrakan!',
          );
        }

        // Fetch back current account after updated to get latest balance
        const updatedAccount = await tx.account.findUnique({
          where: { id: account.id },
        });

        const txRecord = await tx.transaction.create({
          data: {
            type: 'WITHDRAW',
            amount,
            sourceId: account.id,
            idempotencyKey,
          },
        });

        return { updatedAccount, txRecord };
      });

      this.logger.log(
        `[WITHDRAW] ✅ Berhasil. Sisa saldo ${accountNumber}: Rp${Number(result.updatedAccount?.balance)}`,
      );
      return {
        message: 'Tarik tunai berhasil!',
        newBalance: Number(result.updatedAccount?.balance),
        transaction_id: result.txRecord.id,
      };
    } catch (error) {
      this.logger.error(`[WITHDRAW] ❌ Gagal: ${(error as Error).message}`);
      throw error;
    }
  }

  // ==========================================
  // 3. FITUR TRANSFER
  // ==========================================
  async transfer(
    userId: number,
    fromAccountNumber: string,
    toAccountNumber: string,
    amount: number,
    idempotencyKey?: string,
  ) {
    this.logger.log(
      `[TRANSFER] Mencoba kirim Rp${amount} dari [${fromAccountNumber}] ke [${toAccountNumber}]`,
    );

    try {
      if (amount <= 0)
        throw new BadRequestException('Jumlah transfer harus lebih dari 0');
      if (fromAccountNumber === toAccountNumber)
        throw new BadRequestException(
          'Tidak bisa transfer ke rekening yang sama',
        );

      const result = await this.prisma.$transaction(async (tx) => {
        const sourceAccount = await tx.account.findFirst({
          where: { accountNumber: fromAccountNumber, userId },
        });
        if (!sourceAccount)
          throw new NotFoundException(
            'Rekening sumber tidak ditemukan/bukan milikmu',
          );

        const destinationAccount = await tx.account.findUnique({
          where: { accountNumber: toAccountNumber },
        });
        if (!destinationAccount)
          throw new NotFoundException('Rekening tujuan tidak ditemukan');

        // [FIX NO.1] Kurangi saldo secara Atomic dan hindari Race Condition
        const updatedSourceCount = await tx.account.updateMany({
          where: {
            id: sourceAccount.id,
            balance: { gte: amount }, // Pastikan balance source >= amount di Query Level
          },
          data: { balance: { decrement: amount } },
        });

        if (updatedSourceCount.count === 0) {
          throw new BadRequestException(
            'Saldo tidak mencukupi untuk transfer!',
          );
        }

        await tx.account.update({
          where: { id: destinationAccount.id },
          data: { balance: { increment: amount } },
        });

        const txRecord = await tx.transaction.create({
          data: {
            type: 'TRANSFER',
            amount,
            sourceId: sourceAccount.id,
            destinationId: destinationAccount.id,
            idempotencyKey,
          },
        });

        const updatedSource = await tx.account.findUnique({
          where: { id: sourceAccount.id },
        });

        return { updatedSource, txRecord };
      });

      this.logger.log(
        `[TRANSFER] ✅ Sukses! Transaksi ID: ${result.txRecord.id}`,
      );
      return {
        message: 'Transfer berhasil dikirim!',
        sisaSaldo: Number(result.updatedSource?.balance),
        transaction_id: result.txRecord.id,
      };
    } catch (error) {
      this.logger.error(
        `[TRANSFER] ❌ Gagal dari [${fromAccountNumber}]: ${(error as Error).message}`,
      );
      throw error;
    }
  }

  // ==========================================
  // 4. FITUR RIWAYAT TRANSAKSI (GET ALL)
  // ==========================================
  async findAll(userId: number, page: number = 1, limit: number = 10) {
    this.logger.log(`[HISTORY] User ${userId} melihat riwayat transaksi`);
    const skip = (page - 1) * limit;

    const [total, data] = await this.prisma.$transaction([
      this.prisma.transaction.count({
        where: {
          OR: [
            { source: { userId: userId } },
            { destination: { userId: userId } },
          ],
        },
      }),
      this.prisma.transaction.findMany({
        where: {
          OR: [
            { source: { userId: userId } },
            { destination: { userId: userId } },
          ],
        },
        include: {
          source: { select: { accountNumber: true } },
          destination: { select: { accountNumber: true } },
        },
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
      data,
    };
  }

  // ==========================================
  // 4.5. FITUR RIWAYAT SEMUA (ADMIN ONLY)
  // ==========================================
  async findAllAdmin(page: number = 1, limit: number = 10) {
    this.logger.log(`[ADMIN] Melihat seluruh histori riwayat transaksi`);
    const skip = (page - 1) * limit;

    const [total, data] = await this.prisma.$transaction([
      this.prisma.transaction.count(),
      this.prisma.transaction.findMany({
        include: {
          source: { select: { accountNumber: true } },
          destination: { select: { accountNumber: true } },
        },
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
      data,
    };
  }

  // ==========================================
  // 5. FITUR DETAIL TRANSAKSI (GET BY ID)
  // ==========================================
  async findOne(id: number, userId: number) {
    this.logger.log(`[DETAIL] Melihat detail transaksi ID: ${id}`);
    const transaction = await this.prisma.transaction.findFirst({
      where: {
        id: id,
        OR: [
          { source: { userId: userId } },
          { destination: { userId: userId } },
        ],
      },
      include: {
        source: { select: { accountNumber: true } },
        destination: { select: { accountNumber: true } },
      },
    });

    if (!transaction) {
      this.logger.warn(
        `[DETAIL] Transaksi ID: ${id} tidak ditemukan untuk User: ${userId}`,
      );
      throw new NotFoundException(
        'Transaksi tidak ditemukan atau Anda tidak memiliki akses.',
      );
    }
    return transaction;
  }
}
