import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { JwtGuard } from '../common/guards/jwt.guard';
import * as Interfaces from '../common/interfaces/request-with-user.interface';

@Controller('auth') // Sesuai rubrik: /auth
export class AuthController {
  constructor(private readonly userService: UserService) {}

  @Post('register') // Sesuai rubrik: POST /auth/register
  register(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Post('login') // Sesuai rubrik: POST /auth/login
  login(@Body() loginDto: { email: string; password: string }) {
    return this.userService.login(loginDto);
  }

  @Post('refresh')
  refresh(@Body() body: { userId: number; refreshToken: string }) {
    return this.userService.refreshTokens(body.userId, body.refreshToken);
  }

  @UseGuards(JwtGuard)
  @Post('logout')
  logout(@Request() req: Interfaces.RequestWithUser) {
    return this.userService.logout(req.user.id);
  }
}
