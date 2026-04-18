import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { UserService } from '../user/user.service';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { JwtGuard } from '../common/guards/jwt.guard';

// Mock UserService
const mockUserService = {
  create: jest.fn(),
  login: jest.fn(),
  refreshTokens: jest.fn(),
  logout: jest.fn(),
};

// Mock JwtService
const mockJwtService = {
  verifyAsync: jest.fn(),
  signAsync: jest.fn(),
};

// Mock JwtGuard
const mockJwtGuard = {
  canActivate: jest.fn().mockReturnValue(true),
};

describe('AuthController', () => {
  let controller: AuthController;
  let userService: typeof mockUserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: UserService, useValue: mockUserService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: JwtGuard, useValue: mockJwtGuard },
      ],
    })
      .overrideGuard(JwtGuard)
      .useValue(mockJwtGuard)
      .compile();

    controller = module.get<AuthController>(AuthController);
    userService = module.get(UserService);

    // Reset semua mock
    jest.clearAllMocks();
  });

  describe('register', () => {
    const mockCreateUserDto: CreateUserDto = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    };

    const mockCreatedUser = {
      id: 1,
      name: 'Test User',
      email: 'test@example.com',
      role: 'CUSTOMER',
      createdAt: new Date('2024-01-01T00:00:00Z'),
    };

    it('should successfully register a new user', async () => {
      userService.create.mockResolvedValue(mockCreatedUser);

      const result = await controller.register(mockCreateUserDto);

      expect(result).toEqual(mockCreatedUser);
      expect(userService.create).toHaveBeenCalledWith(mockCreateUserDto);
    });

    it('should throw ConflictException when email already exists', async () => {
      userService.create.mockRejectedValue(new ConflictException('Email sudah digunakan'));

      await expect(controller.register(mockCreateUserDto))
        .rejects.toThrow(ConflictException);
      
      expect(userService.create).toHaveBeenCalledWith(mockCreateUserDto);
    });
  });

  describe('login', () => {
    const mockLoginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    const mockTokens = {
      access_token: 'mockAccessToken123',
      refresh_token: 'mockRefreshToken123',
    };

    it('should successfully login user', async () => {
      userService.login.mockResolvedValue(mockTokens);

      const result = await controller.login(mockLoginDto);

      expect(result).toEqual(mockTokens);
      expect(userService.login).toHaveBeenCalledWith(mockLoginDto);
    });

    it('should throw UnauthorizedException when credentials are invalid', async () => {
      userService.login.mockRejectedValue(new UnauthorizedException('Email atau password salah'));

      await expect(controller.login(mockLoginDto))
        .rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refresh', () => {
    const mockRefreshTokenDto = {
      userId: 1,
      refreshToken: 'validRefreshToken123',
    };

    const mockNewTokens = {
      access_token: 'newAccessToken123',
      refresh_token: 'newRefreshToken123',
    };

    it('should successfully refresh tokens', async () => {
      userService.refreshTokens.mockResolvedValue(mockNewTokens);

      const result = await controller.refresh(mockRefreshTokenDto);

      expect(result).toEqual(mockNewTokens);
      expect(userService.refreshTokens).toHaveBeenCalledWith(
        mockRefreshTokenDto.userId,
        mockRefreshTokenDto.refreshToken,
      );
    });

    it('should throw ForbiddenException when refresh token is invalid', async () => {
      userService.refreshTokens.mockRejectedValue(new ForbiddenException('Token tidak valid'));

      await expect(controller.refresh(mockRefreshTokenDto))
        .rejects.toThrow(ForbiddenException);
    });
  });

  describe('logout', () => {
    const mockUserId = 1;

    it('should successfully logout user', async () => {
      const mockLogoutResponse = { message: 'Berhasil logout' };
      userService.logout.mockResolvedValue(mockLogoutResponse);

      // Create minimal mock for RequestWithUser
      const mockRequestWithUser: any = {
        user: {
          id: mockUserId,
          email: 'test@example.com',
          role: 'CUSTOMER',
        },
      };

      const result = await controller.logout(mockRequestWithUser);

      expect(result).toEqual(mockLogoutResponse);
      expect(userService.logout).toHaveBeenCalledWith(mockUserId);
    });
  });
});