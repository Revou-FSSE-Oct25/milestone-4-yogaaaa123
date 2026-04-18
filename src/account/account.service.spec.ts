import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { AccountService } from './account.service';
import { PrismaService } from '../prisma/prisma.service';

// Mock data lokal
const mockAccount = {
  id: 1,
  accountNumber: '1234567890',
  userId: 1,
  balance: 1000000, // 1,000,000 IDR
  isActive: true,
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-01T00:00:00Z'),
};

const mockAccount2 = {
  ...mockAccount,
  id: 2,
  accountNumber: '0987654321',
  userId: 2,
  balance: 500000, // 500,000 IDR
};

const mockUpdateAccountDto = {
  balance: 50000,
};

// Mock PrismaService
const mockPrismaService = {
  account: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    delete: jest.fn(),
  },
  user: {
    select: jest.fn(),
  },
};

// Mock crypto.randomInt
const mockRandomInt = jest.fn();

describe('AccountService', () => {
  let service: AccountService;
  let prisma: typeof mockPrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<AccountService>(AccountService);
    prisma = module.get(PrismaService);

    // Reset semua mock
    jest.clearAllMocks();
  });

  describe('create', () => {
    const userId = 1;

    it('should successfully create a new account with unique account number', async () => {
      // Mock crypto.randomInt to return a fixed value
      const originalRandomInt = require('crypto').randomInt;
      require('crypto').randomInt = jest.fn().mockReturnValue(1234567890);

      prisma.account.findUnique.mockResolvedValue(null); // No existing account
      prisma.account.create.mockResolvedValue({
        ...mockAccount,
        accountNumber: '1234567890',
        userId,
      });

      const result = await service.create(userId);

      expect(result).toEqual({
        ...mockAccount,
        accountNumber: '1234567890',
        userId,
      });
      expect(prisma.account.findUnique).toHaveBeenCalledWith({
        where: { accountNumber: '1234567890' },
      });
      expect(prisma.account.create).toHaveBeenCalledWith({
        data: {
          accountNumber: '1234567890',
          balance: 0,
          userId,
        },
      });

      // Restore original
      require('crypto').randomInt = originalRandomInt;
    });

    it('should retry with different account number if collision occurs', async () => {
      const originalRandomInt = require('crypto').randomInt;
      const mockRandomInt = jest.fn()
        .mockReturnValueOnce(1111111111) // First attempt - collision
        .mockReturnValueOnce(2222222222); // Second attempt - success
      require('crypto').randomInt = mockRandomInt;

      // First call - account exists
      prisma.account.findUnique
        .mockResolvedValueOnce({ id: 99, accountNumber: '1111111111' }) // First collision
        .mockResolvedValueOnce(null); // Second attempt - no account

      prisma.account.create.mockResolvedValue({
        ...mockAccount,
        accountNumber: '2222222222',
        userId,
      });

      const result = await service.create(userId);

      expect(result.accountNumber).toBe('2222222222');
      expect(prisma.account.findUnique).toHaveBeenCalledTimes(2);
      expect(prisma.account.create).toHaveBeenCalledWith({
        data: {
          accountNumber: '2222222222',
          balance: 0,
          userId,
        },
      });

      require('crypto').randomInt = originalRandomInt;
    });

    it('should throw BadRequestException after maximum attempts', async () => {
      const originalRandomInt = require('crypto').randomInt;
      require('crypto').randomInt = jest.fn().mockReturnValue(9999999999);

      // Always return an account (simulating collision every time)
      prisma.account.findUnique.mockResolvedValue({ id: 99, accountNumber: '9999999999' });

      await expect(service.create(userId))
        .rejects.toThrow(BadRequestException);

      expect(prisma.account.findUnique).toHaveBeenCalledTimes(20); // MAX_ATTEMPTS = 20

      require('crypto').randomInt = originalRandomInt;
    });
  });

  describe('findAll', () => {
    const userId = 1;

    it('should return all accounts for user', async () => {
      const userAccounts = [mockAccount, mockAccount2];
      prisma.account.findMany.mockResolvedValue(userAccounts);

      const result = await service.findAll(userId);

      expect(result).toEqual(userAccounts);
      expect(prisma.account.findMany).toHaveBeenCalledWith({
        where: { userId },
      });
    });

    it('should return empty array when user has no accounts', async () => {
      prisma.account.findMany.mockResolvedValue([]);

      const result = await service.findAll(userId);

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    const accountId = 1;
    const userId = 1;

    it('should return account when found and owned by user', async () => {
      prisma.account.findFirst.mockResolvedValue(mockAccount);

      const result = await service.findOne(accountId, userId);

      expect(result).toEqual(mockAccount);
      expect(prisma.account.findFirst).toHaveBeenCalledWith({
        where: { id: accountId, userId },
      });
    });

    it('should throw NotFoundException when account not found', async () => {
      prisma.account.findFirst.mockResolvedValue(null);

      await expect(service.findOne(accountId, userId))
        .rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when account exists but not owned by user', async () => {
      prisma.account.findFirst.mockResolvedValue(null); // Not found with userId filter

      await expect(service.findOne(accountId, 999)) // Different user ID
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    const accountId = 1;
    const userId = 1;

    it('should successfully update account', async () => {
      prisma.account.findFirst.mockResolvedValue(mockAccount);
      prisma.account.update.mockResolvedValue({
        ...mockAccount,
        ...mockUpdateAccountDto,
      });

      const result = await service.update(accountId, userId, mockUpdateAccountDto);

      expect(result).toEqual({
        ...mockAccount,
        ...mockUpdateAccountDto,
      });
      expect(prisma.account.findFirst).toHaveBeenCalledWith({
        where: { id: accountId, userId },
      });
      expect(prisma.account.update).toHaveBeenCalledWith({
        where: { id: accountId },
        data: mockUpdateAccountDto,
      });
    });

    it('should throw NotFoundException when account not found during findOne check', async () => {
      prisma.account.findFirst.mockResolvedValue(null);

      await expect(service.update(accountId, userId, mockUpdateAccountDto))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('adminUpdate', () => {
    const accountId = 1;

    it('should successfully update account as admin', async () => {
      prisma.account.findUnique.mockResolvedValue(mockAccount);
      prisma.account.update.mockResolvedValue({
        ...mockAccount,
        ...mockUpdateAccountDto,
      });

      const result = await service.adminUpdate(accountId, mockUpdateAccountDto);

      expect(result).toEqual({
        ...mockAccount,
        ...mockUpdateAccountDto,
      });
      expect(prisma.account.findUnique).toHaveBeenCalledWith({
        where: { id: accountId },
      });
      expect(prisma.account.update).toHaveBeenCalledWith({
        where: { id: accountId },
        data: mockUpdateAccountDto,
      });
    });

    it('should throw NotFoundException when account not found', async () => {
      prisma.account.findUnique.mockResolvedValue(null);

      await expect(service.adminUpdate(accountId, mockUpdateAccountDto))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('adminFindOne', () => {
    const accountId = 1;

    it('should return account details for admin', async () => {
      prisma.account.findUnique.mockResolvedValue(mockAccount);

      const result = await service.adminFindOne(accountId);

      expect(result).toEqual(mockAccount);
      expect(prisma.account.findUnique).toHaveBeenCalledWith({
        where: { id: accountId },
      });
    });

    it('should throw NotFoundException when account not found', async () => {
      prisma.account.findUnique.mockResolvedValue(null);

      await expect(service.adminFindOne(accountId))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('adminFindAll', () => {
    it('should return all accounts with user details for admin', async () => {
      const accountsWithUsers = [
        {
          ...mockAccount,
          user: {
            id: mockAccount.userId,
            name: 'Test User',
            email: 'test@example.com',
          },
        },
        {
          ...mockAccount2,
          user: {
            id: mockAccount2.userId,
            name: 'Another User',
            email: 'another@example.com',
          },
        },
      ];

      prisma.account.findMany.mockResolvedValue(accountsWithUsers);

      const result = await service.adminFindAll();

      expect(result).toEqual(accountsWithUsers);
      expect(prisma.account.findMany).toHaveBeenCalledWith({
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    });

    it('should return empty array when no accounts exist', async () => {
      prisma.account.findMany.mockResolvedValue([]);

      const result = await service.adminFindAll();

      expect(result).toEqual([]);
    });
  });

  describe('remove', () => {
    const accountId = 1;
    const userId = 1;

    it('should successfully delete account', async () => {
      prisma.account.findFirst.mockResolvedValue(mockAccount);
      prisma.account.delete.mockResolvedValue(mockAccount);

      const result = await service.remove(accountId, userId);

      expect(result).toEqual(mockAccount);
      expect(prisma.account.findFirst).toHaveBeenCalledWith({
        where: { id: accountId, userId },
      });
      expect(prisma.account.delete).toHaveBeenCalledWith({
        where: { id: accountId },
      });
    });

    it('should throw NotFoundException when account not found during findOne check', async () => {
      prisma.account.findFirst.mockResolvedValue(null);

      await expect(service.remove(accountId, userId))
        .rejects.toThrow(NotFoundException);
    });
  });
});