import { PartialType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';

// PartialType membuat semua field di CreateUserDto menjadi opsional otomatis
export class UpdateUserDto extends PartialType(CreateUserDto) {}
