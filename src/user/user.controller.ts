import {
  Controller,
  Get,
  Patch,
  Delete,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { UserService } from './user.service';
import { JwtGuard } from '../common/guards/jwt.guard';
import { UpdateUserDto } from './dto/update-user.dto';
import * as Interfaces from '../common/interfaces/request-with-user.interface';

@UseGuards(JwtGuard) // 👈 Satpam menjaga semua pintu di dalam UserController
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  // 1. GET PROFILE: GET /user/profile
  @Get('profile')
  async getProfile(@Request() req: Interfaces.RequestWithUser) {
    // Kita panggil service agar dapat data terbaru & ter-sanitasi (tanpa password)
    const user = await this.userService.findOne(req.user.id);
    return {
      message: 'Data profil berhasil diambil',
      data: user,
    };
  }

  // 2. UPDATE PROFILE: PATCH /user/profile
  @Patch('profile')
  async updateProfile(
    @Request() req: Interfaces.RequestWithUser,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    const updatedUser = await this.userService.update(
      req.user.id,
      updateUserDto,
    );
    return {
      message: 'Profil berhasil diperbarui',
      data: updatedUser,
    };
  }

  // 3. DELETE ACCOUNT: DELETE /user
  @Delete()
  async remove(@Request() req: Interfaces.RequestWithUser) {
    await this.userService.remove(req.user.id);
    return { message: 'Akun berhasil dihapus' };
  }
}
