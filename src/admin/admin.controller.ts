import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtGuard } from '../common/guards/jwt.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UpdateUserDto } from '../user/dto/update-user.dto';
import { UpdateAccountDto } from '../account/dto/update-account.dto';

@UseGuards(JwtGuard, RolesGuard)
@Roles('ADMIN')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  async findAllUsers() {
    const users = await this.adminService.findAllUsers();
    return {
      message: 'Daftar semua user berhasil diambil',
      data: users,
      total: users.length,
    };
  }

  @Get('users/:id')
  async findUserById(@Param('id') id: string) {
    const user = await this.adminService.findUserById(+id);
    return {
      message: 'Data user berhasil diambil',
      data: user,
    };
  }

  @Patch('users/:id')
  async updateUser(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Request() req,
  ) {
    const adminId = req.user.id;
    const adminEmail = req.user.email;
    
    const updatedUser = await this.adminService.updateUser(
      +id, 
      updateUserDto,
      adminId,
      adminEmail,
    );
    return {
      message: 'User berhasil diperbarui',
      data: updatedUser,
    };
  }

  @Post('users/:id/deactivate')
  async deactivateUser(
    @Param('id') id: string,
    @Body() body: { reason?: string },
    @Request() req,
  ) {
    const adminId = req.user.id;
    const adminEmail = req.user.email;
    
    const deactivatedUser = await this.adminService.deactivateUser(
      +id,
      adminId,
      adminEmail,
      body.reason,
    );
    return {
      message: 'User berhasil dinonaktifkan',
      data: deactivatedUser,
    };
  }

  @Post('users/:id/reactivate')
  async reactivateUser(
    @Param('id') id: string,
    @Body() body: { reason?: string },
    @Request() req,
  ) {
    const adminId = req.user.id;
    const adminEmail = req.user.email;
    
    const reactivatedUser = await this.adminService.reactivateUser(
      +id,
      adminId,
      adminEmail,
      body.reason,
    );
    return {
      message: 'User berhasil diaktifkan kembali',
      data: reactivatedUser,
    };
  }

  @Get('accounts')
  async findAllAccounts() {
    const accounts = await this.adminService.findAllAccounts();
    return {
      message: 'Daftar semua rekening berhasil diambil',
      data: accounts,
      total: accounts.length,
    };
  }

  @Get('accounts/:id')
  async findAccountById(@Param('id') id: string) {
    const account = await this.adminService.findAccountById(+id);
    return {
      message: 'Data rekening berhasil diambil',
      data: account,
    };
  }

  @Patch('accounts/:id')
  async updateAccount(
    @Param('id') id: string,
    @Body() updateAccountDto: UpdateAccountDto,
  ) {
    const updatedAccount = await this.adminService.updateAccount(
      +id,
      updateAccountDto,
    );
    return {
      message: 'Rekening berhasil diperbarui',
      data: updatedAccount,
    };
  }

  @Delete('accounts/:id')
  async removeAccount(@Param('id') id: string) {
    await this.adminService.removeAccount(+id);
    return {
      message: 'Rekening berhasil dihapus',
    };
  }

  @Get('transactions')
  async findAllTransactions() {
    const transactions = await this.adminService.findAllTransactions();
    return {
      message: 'Daftar semua transaksi berhasil diambil',
      data: transactions,
      total: transactions.length,
    };
  }

  @Get('transactions/:id')
  async findTransactionById(@Param('id') id: string) {
    const transaction = await this.adminService.findTransactionById(+id);
    return {
      message: 'Data transaksi berhasil diambil',
      data: transaction,
    };
  }

  @Get('dashboard')
  async getDashboard() {
    const [totalUsers, totalAccounts, totalTransactions, recentTransactions] =
      await Promise.all([
        this.adminService.findAllUsers().then((users) => users.length),
        this.adminService.findAllAccounts().then((accounts) => accounts.length),
        this.adminService
          .findAllTransactions()
          .then((transactions) => transactions.length),
        this.adminService.findAllTransactions().then(
          (transactions) => transactions.slice(0, 10), // 10 transaksi terkahir
        ),
      ]);

    const accounts = await this.adminService.findAllAccounts();
    const totalBalance = accounts.reduce((sum, account) => {
      return sum + Number(account.balance);
    }, 0);

    return {
      message: 'Dashboard admin berhasil diambil',
      data: {
        statistics: {
          totalUsers,
          totalAccounts,
          totalTransactions,
          totalBalance,
        },
        recentTransactions,
      },
    };
  }
}
