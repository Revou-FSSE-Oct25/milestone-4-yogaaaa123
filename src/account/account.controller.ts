import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AccountService } from './account.service';
import { JwtGuard } from '../common/guards/jwt.guard';
import * as Interfaces from '../common/interfaces/request-with-user.interface';

@UseGuards(JwtGuard)
@Controller('accounts')
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  @Post()
  create(@Request() req: Interfaces.RequestWithUser) {
    return this.accountService.create(req.user.id);
  }

  @Get()
  findAll(@Request() req: Interfaces.RequestWithUser) {
    return this.accountService.findAll(req.user.id);
  }

  @Get(':id')
  findOne(@Request() req: Interfaces.RequestWithUser, @Param('id') id: string) {
    return this.accountService.findOne(+id, req.user.id);
  }

  @Delete(':id')
  remove(@Request() req: Interfaces.RequestWithUser, @Param('id') id: string) {
    return this.accountService.remove(+id, req.user.id);
  }
}
