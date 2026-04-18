import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from './user.service';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

// Mock bcrypt
jest.mock('bcrypt');

// Mock data lokal
enum UserRole {
  CUSTOMER = 'CUSTOMER',
  ADMIN = 'ADMIN'
}

const mockUser = {
  id: 1,
  email: 'test@example.com',
  password: 'hashedPassword123',
  name: 'Test User',
  role: UserRole.CUSTOMER,
  hashedRefreshToken: 'hashedRefreshToken123',
  isActive: true,
  deactivatedAt: null,
  deactivationReason: null,
  reactivatedAt: null,
  reactivationReason: null,
  createdAt: new Date('2024-01-01T00:00:00Z'),
};

const mockAdminUser = {
  ...mockUser,
  id: 2,
  email: 'admin@example.com',
  role: UserRole.ADMIN,
};

const mockCreateUserDto = {
  name: 'New User',
  email: 'new@example.com',
  password: 'password123',
};

const mockLoginDto = {
  email: 'test@example.com',
  password: 'password123',
};

const mockUpdateUserDto = {
  name: 'Updated Name',
  password: 'newpassword123',
};

const mockTokens = {
  access_token: 'mockAccessToken123',
  refresh_token: 'mockRefreshToken123',
};

// Mock PrismaService
const mockPrismaService = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    findMany: jest.fn(),
    delete: jest.fn(),
  },
};

// Mock JwtService
const mockJwtService = {
  signAsync: jest.fn(),
};

describe('UserService', () => {
  let service: UserService;
  let prisma: typeof mockPrismaService;
  let jwtService: typeof mockJwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    prisma = module.get(PrismaService);
    jwtService = module.get(JwtService);

    // Reset semua mock
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should successfully create a new user', async () => {
      // Mock setup
      prisma.user.findUnique.mockResolvedValue(null); // No existing user
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword123');
      prisma.user.create.mockResolvedValue(mockUser);

      const result = await service.create(mockCreateUserDto);

      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
        role: mockUser.role,
        hashedRefreshToken: mockUser.hashedRefreshToken,
        isActive: mockUser.isActive,
        deactivatedAt: mockUser.deactivatedAt,
        deactivationReason: mockUser.deactivationReason,
        reactivatedAt: mockUser.reactivatedAt,
        reactivationReason: mockUser.reactivationReason,
        createdAt: mockUser.createdAt,
      });
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: mockCreateUserDto.email },
      });
      expect(bcrypt.hash).toHaveBeenCalledWith(mockCreateUserDto.password, 12);
      expect(prisma.user.create).toHaveBeenCalled();
    });

    it('should throw ConflictException when email already exists', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser); // Existing user

      await expect(service.create(mockCreateUserDto))
        .rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('should successfully login user and return tokens', async () => {
      // Mock setup
      prisma.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      jwtService.signAsync
        .mockResolvedValueOnce(mockTokens.access_token) // First call for access token
        .mockResolvedValueOnce(mockTokens.refresh_token); // Second call for refresh token
      prisma.user.update.mockResolvedValue(mockUser);

      const result = await service.login(mockLoginDto);

      expect(result).toEqual(mockTokens);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: mockLoginDto.email },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(
        mockLoginDto.password,
        mockUser.password,
      );
      expect(jwtService.signAsync).toHaveBeenCalledTimes(2);
    });

    it('should throw UnauthorizedException when user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.login(mockLoginDto))
        .rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when password is invalid', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(mockLoginDto))
        .rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout', () => {
    const userId = 1;

    it('should successfully logout user', async () => {
      prisma.user.updateMany.mockResolvedValue({ count: 1 });

      const result = await service.logout(userId);

      expect(result).toEqual({ message: 'Berhasil logout' });
      expect(prisma.user.updateMany).toHaveBeenCalledWith({
        where: {
          id: userId,
          hashedRefreshToken: { not: null },
        },
        data: { hashedRefreshToken: null },
      });
    });
  });

  describe('refreshTokens', () => {
    const userId = 1;
    const refreshToken = 'validRefreshToken123';

    it('should successfully refresh tokens', async () => {
      // Mock setup
      const userWithRefreshToken = {
        ...mockUser,
        hashedRefreshToken: 'hashedRefreshToken123',
      };
      prisma.user.findUnique.mockResolvedValue(userWithRefreshToken);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      jwtService.signAsync
        .mockResolvedValueOnce('newAccessToken')
        .mockResolvedValueOnce('newRefreshToken');
      prisma.user.update.mockResolvedValue(userWithRefreshToken);

      const result = await service.refreshTokens(userId, refreshToken);

      expect(result).toEqual({
        access_token: 'newAccessToken',
        refresh_token: 'newRefreshToken',
      });
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(
        refreshToken,
        userWithRefreshToken.hashedRefreshToken,
      );
      expect(jwtService.signAsync).toHaveBeenCalledTimes(2);
    });

    it('should throw ForbiddenException when user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.refreshTokens(userId, refreshToken))
        .rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException when refresh token does not match', async () => {
      const userWithRefreshToken = {
        ...mockUser,
        hashedRefreshToken: 'hashedRefreshToken123',
      };
      prisma.user.findUnique.mockResolvedValue(userWithRefreshToken);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.refreshTokens(userId, refreshToken))
        .rejects.toThrow(ForbiddenException);
    });
  });

  describe('findOne', () => {
    const userId = 1;

    it('should return user profile without sensitive data', async () => {
      const userProfile = {
        id: mockUser.id,
        name: mockUser.name,
        email: mockUser.email,
        role: mockUser.role,
        createdAt: mockUser.createdAt,
      };
      prisma.user.findUnique.mockResolvedValue(userProfile);

      const result = await service.findOne(userId);

      expect(result).toEqual(userProfile);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        },
      });
    });

    it('should throw NotFoundException when user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.findOne(userId))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    const userId = 1;

    it('should successfully update user profile', async () => {
      const updatedUser = {
        id: mockUser.id,
        name: 'Updated Name',
        email: mockUser.email,
        role: mockUser.role,
      };
      
      prisma.user.update.mockResolvedValue(updatedUser);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedNewPassword');

      const result = await service.update(userId, mockUpdateUserDto);

      expect(result).toEqual(updatedUser);
      expect(bcrypt.hash).toHaveBeenCalledWith('newpassword123', 12);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: mockUpdateUserDto,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      });
    });

    it('should update without hashing password if password not provided', async () => {
      const updateDtoWithoutPassword = { name: 'Updated Name' };
      const updatedUser = {
        id: mockUser.id,
        name: 'Updated Name',
        email: mockUser.email,
        role: mockUser.role,
      };
      
      prisma.user.update.mockResolvedValue(updatedUser);

      const result = await service.update(userId, updateDtoWithoutPassword);

      expect(result).toEqual(updatedUser);
      expect(bcrypt.hash).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return all users without sensitive data', async () => {
      const usersList = [
        {
          id: mockUser.id,
          name: mockUser.name,
          email: mockUser.email,
          role: mockUser.role,
        },
        {
          id: mockAdminUser.id,
          name: mockAdminUser.name,
          email: mockAdminUser.email,
          role: mockAdminUser.role,
        },
      ];
      
      prisma.user.findMany.mockResolvedValue(usersList);

      const result = await service.findAll();

      expect(result).toEqual(usersList);
      expect(prisma.user.findMany).toHaveBeenCalledWith({
        select: { id: true, name: true, email: true, role: true },
      });
    });
  });

  describe('remove', () => {
    const userId = 1;

    it('should successfully delete user', async () => {
      prisma.user.delete.mockResolvedValue(mockUser);

      const result = await service.remove(userId);

      expect(result).toEqual(mockUser);
      expect(prisma.user.delete).toHaveBeenCalledWith({
        where: { id: userId },
      });
    });
  });
});