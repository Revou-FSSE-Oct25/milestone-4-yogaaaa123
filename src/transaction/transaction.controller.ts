import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
  Param,
  Headers,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'; // 👈 Tambah ini buat dokumentasi
import { TransactionService } from './transaction.service';
import { JwtGuard } from '../common/guards/jwt.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import * as Interfaces from '../common/interfaces/request-with-user.interface';

import { DepositDto } from './dto/deposit.dto';
import { WithdrawDto } from './dto/withdraw.dto';
import { TransferDto } from './dto/transfer.dto';

@ApiTags('Transactions') // 👈 Biar di Swagger rapi dikelompokkan
@ApiBearerAuth('access-token') // 👈 Biar bisa pake token di Swagger
@UseGuards(JwtGuard, RolesGuard)
@Controller('transactions')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Post('deposit')
  @ApiOperation({ summary: 'Setor tunai ke rekening sendiri' })
  deposit(
    @Request() req: Interfaces.RequestWithUser,
    @Body() body: DepositDto,
    @Headers('x-idempotency-key') idempotencyKey?: string,
  ) {
    return this.transactionService.deposit(
      req.user.id,
      body.accountNumber,
      body.amount,
      idempotencyKey,
    );
  }

  @Post('withdraw')
  @ApiOperation({ summary: 'Tarik tunai dari rekening sendiri' })
  withdraw(
    @Request() req: Interfaces.RequestWithUser,
    @Body() body: WithdrawDto,
    @Headers('x-idempotency-key') idempotencyKey?: string,
  ) {
    return this.transactionService.withdraw(
      req.user.id,
      body.accountNumber,
      body.amount,
      idempotencyKey,
    );
  }

  @Post('transfer')
  @ApiOperation({ summary: 'Transfer uang antar rekening' })
  transfer(
    @Request() req: Interfaces.RequestWithUser,
    @Body() body: TransferDto,
    @Headers('x-idempotency-key') idempotencyKey?: string,
  ) {
    return this.transactionService.transfer(
      req.user.id,
      body.fromAccountNumber,
      body.toAccountNumber,
      body.amount,
      idempotencyKey,
    );
  }

  @Get('admin/all')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'ADMIN ONLY: Lihat semua riwayat sistem' })
  findAllForAdmin(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    return this.transactionService.findAllAdmin(+page, +limit);
  }

  @Get()
  @ApiOperation({ summary: 'Lihat semua riwayat transaksi saya' })
  findAll(
    @Request() req: Interfaces.RequestWithUser,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    return this.transactionService.findAll(req.user.id, +page, +limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lihat detail satu transaksi berdasarkan ID' })
  findOne(@Request() req: Interfaces.RequestWithUser, @Param('id') id: string) {
    return this.transactionService.findOne(+id, req.user.id);
  }
}
