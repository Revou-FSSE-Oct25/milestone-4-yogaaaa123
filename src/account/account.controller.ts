import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  UseGuards,
  Request,
  HttpStatus,
} from '@nestjs/common';
import { AccountService } from './account.service';
import { JwtGuard } from '../common/guards/jwt.guard';
import * as Interfaces from '../common/interfaces/request-with-user.interface';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiBody } from '@nestjs/swagger';

@UseGuards(JwtGuard)
@ApiTags('Account')
@ApiBearerAuth('access-token')
@Controller('accounts')
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  @Post()
  @ApiOperation({ summary: 'Buka rekening baru' })
  @ApiResponse({ 
    status: HttpStatus.CREATED, 
    description: 'Rekening berhasil dibuat',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        accountNumber: { type: 'string', example: '1234567890' },
        balance: { type: 'number', example: 0 },
        userId: { type: 'number', example: 1 },
        createdAt: { type: 'string', example: '2026-04-18T22:55:35.123Z' },
        updatedAt: { type: 'string', example: '2026-04-18T22:55:35.123Z' }
      }
    }
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Token tidak valid' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Gagal membuat nomor rekening unik' })
  create(@Request() req: Interfaces.RequestWithUser) {
    return this.accountService.create(req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Lihat semua rekening saya' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Daftar rekening berhasil diambil',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'number', example: 1 },
          accountNumber: { type: 'string', example: '1234567890' },
          balance: { type: 'number', example: 100000 },
          userId: { type: 'number', example: 1 },
          createdAt: { type: 'string', example: '2026-04-18T22:55:35.123Z' },
          updatedAt: { type: 'string', example: '2026-04-18T22:55:35.123Z' }
        }
      }
    }
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Token tidak valid' })
  findAll(@Request() req: Interfaces.RequestWithUser) {
    return this.accountService.findAll(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lihat detail rekening berdasarkan ID' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Detail rekening berhasil diambil',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        accountNumber: { type: 'string', example: '1234567890' },
        balance: { type: 'number', example: 100000 },
        userId: { type: 'number', example: 1 },
        createdAt: { type: 'string', example: '2026-04-18T22:55:35.123Z' },
        updatedAt: { type: 'string', example: '2026-04-18T22:55:35.123Z' }
      }
    }
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Token tidak valid' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Rekening tidak ditemukan' })
  findOne(@Request() req: Interfaces.RequestWithUser, @Param('id') id: string) {
    return this.accountService.findOne(+id, req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Tutup rekening berdasarkan ID' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Rekening berhasil ditutup',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        accountNumber: { type: 'string', example: '1234567890' },
        balance: { type: 'number', example: 0 },
        userId: { type: 'number', example: 1 },
        createdAt: { type: 'string', example: '2026-04-18T22:55:35.123Z' },
        updatedAt: { type: 'string', example: '2026-04-18T22:55:35.123Z' },
        deletedAt: { type: 'string', example: '2026-04-18T22:55:35.123Z' }
      }
    }
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Token tidak valid' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Rekening tidak ditemukan' })
  remove(@Request() req: Interfaces.RequestWithUser, @Param('id') id: string) {
    return this.accountService.remove(+id, req.user.id);
  }
}
