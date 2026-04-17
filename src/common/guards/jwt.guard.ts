import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { jwtConfig } from '../../config/jwt.config';

@Injectable()
export class JwtGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException(
        'Akses ditolak. Harap sertakan token JWT yang valid.',
      );
    }

    try {
      const payload = await this.jwtService.verifyAsync<{
        id: number;
        email: string;
        role: string;
      }>(token, {
        secret: jwtConfig.secret,
      });
      Object.assign(request, { user: payload });
    } catch {
      throw new UnauthorizedException(
        'Token JWT tidak valid atau sudah kadaluarsa.',
      );
    }

    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
