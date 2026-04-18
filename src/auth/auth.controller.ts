import { Controller, Post, Body, UseGuards, Request, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody, ApiProperty, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, IsNumber, IsNotEmpty } from 'class-validator';
import { UserService } from '../user/user.service';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { JwtGuard } from '../common/guards/jwt.guard';
import * as Interfaces from '../common/interfaces/request-with-user.interface';

export class LoginDto {
  @ApiProperty({ example: 'yoga@example.com', description: 'Email pengguna' })
  @IsEmail({}, { message: 'Format email tidak valid' })
  email!: string;

  @ApiProperty({ example: 'password123', description: 'Password pengguna' })
  @IsString()
  @MinLength(6, { message: 'Password minimal 6 karakter' })
  password!: string;
}

export class RefreshTokenDto {
  @ApiProperty({ example: 1, description: 'ID pengguna' })
  @IsNumber({}, { message: 'userId harus berupa angka' })
  @IsNotEmpty({ message: 'userId tidak boleh kosong' })
  userId!: number;

  @ApiProperty({ example: 'refresh_token_string', description: 'Refresh token' })
  @IsString({ message: 'refreshToken harus berupa string' })
  @IsNotEmpty({ message: 'refreshToken tidak boleh kosong' })
  refreshToken!: string;
}

export class TokenResponse {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...', description: 'Access token JWT' })
  access_token!: string;

  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...', description: 'Refresh token JWT' })
  refresh_token!: string;
}

@Controller('auth') // Sesuai rubrik: /auth
@ApiTags('Auth')
export class AuthController {
  constructor(private readonly userService: UserService) {}

  @Post('register') // Sesuai rubrik: POST /auth/register
  @ApiOperation({ summary: 'Register user baru' })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'User berhasil dibuat' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Email sudah digunakan' })
  register(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Post('login') // Sesuai rubrik: POST /auth/login
  @ApiOperation({ summary: 'Login untuk mendapatkan JWT token' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: HttpStatus.CREATED, type: TokenResponse, description: 'Login berhasil, kembalikan JWT tokens' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Kredensial tidak valid' })
  login(@Body() loginDto: LoginDto) {
    return this.userService.login(loginDto);
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh JWT token' })
  @ApiBody({ type: RefreshTokenDto })
  @ApiResponse({ status: HttpStatus.CREATED, type: TokenResponse, description: 'Refresh token berhasil, kembalikan JWT tokens baru' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Format JSON tidak valid atau parameter tidak lengkap' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Akses ditolak. Silahkan login kembali.' })
  refresh(@Body() body: RefreshTokenDto) {
    return this.userService.refreshTokens(body.userId, body.refreshToken);
  }

  @UseGuards(JwtGuard)
  @Post('logout')
  @ApiBearerAuth('access-token')
  @ApiOperation({ 
    summary: 'Logout user',
    description: 'Endpoint ini tidak memerlukan request body. Hanya membutuhkan Bearer token di header Authorization.'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Berhasil logout',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Berhasil logout' }
      }
    }
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Token tidak valid' })
  logout(@Request() req: Interfaces.RequestWithUser) {
    return this.userService.logout(req.user.id);
  }
}
