import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AccountService } from './account.service';
import { JwtGuard } from '../common/guards/jwt.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import * as Interfaces from '../common/interfaces/request-with-user.interface';
import { UpdateAccountDto } from './dto/update-account.dto';

@UseGuards(JwtGuard)
@Controller('accounts')
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  @Post() // POST /accounts
  create(@Request() req: Interfaces.RequestWithUser) {
    return this.accountService.create(req.user.id);
  }

  @Get() // GET /accounts
  findAll(@Request() req: Interfaces.RequestWithUser) {
    return this.accountService.findAll(req.user.id);
  }

  @Get(':id') // GET /accounts/:id
  findOne(@Request() req: Interfaces.RequestWithUser, @Param('id') id: string) {
    return this.accountService.findOne(+id, req.user.id);
  }

  @Patch(':id') // PATCH /accounts/:id — ADMIN ONLY
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  update(
    @Request() req: Interfaces.RequestWithUser,
    @Param('id') id: string,
    @Body() updateAccountDto: UpdateAccountDto,
  ) {
    return this.accountService.update(+id, req.user.id, updateAccountDto);
  }

  @Delete(':id') // DELETE /accounts/:id
  remove(@Request() req: Interfaces.RequestWithUser, @Param('id') id: string) {
    return this.accountService.remove(+id, req.user.id);
  }
}
