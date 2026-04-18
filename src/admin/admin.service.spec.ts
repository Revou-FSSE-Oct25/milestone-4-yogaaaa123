import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { AdminService } from './admin.service';
import { PrismaService } from '../prisma/prisma.service';
import { UserService } from '../user/user.service';
import { AccountService } from '../account/account.service';
import { AuditService } from '../audit/audit.service';
import { UpdateUserDto } from '../user/dto/update-user.dto';
import { UpdateAccountDto } from '../account/dto/update-account.dto';

// Mock data lokal
enum UserRole {
  CUSTOMER = 'CUSTOMER',
  ADMIN = 'ADMIN'
}

const mockUser = {
  id: 1,
  name: 'Test User',
  email: 'test@example.com',
  role: UserRole.CUSTOMER,
  createdAt: new Date('2024-01-01T00:00:00Z'),
  isActive: true,
};

const mockAccount = {
  id: 1,
  accountNumber: '1234567890',
  userId: 1,
  balance: 1000000,
  isActive: true,
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-01T00:00:00Z'),
};

// Mock services
const mockPrismaService = {
  user: {
    findUnique: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  },
  account: {
    findUnique: jest.fn(),
    updateMany: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
  },
};

const mockUserService = {
  findAll: jest.fn(),
};

const mockAccountService = {
  adminFindAll: jest.fn(),
  adminFindOne: jest.fn(),
  adminUpdate: jest.fn(),
};

const mockAuditService = {
  logAuditEvent: jest.fn(),
};

describe('AdminService', () => {
  let service: AdminService;
  let prisma: typeof mockPrismaService;
  let userService: typeof mockUserService;
  let accountService: typeof mockAccountService;
  let auditService: typeof mockAuditService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: UserService, useValue: mockUserService },
        { provide: AccountService, useValue: mockAccountService },
        { provide: AuditService, useValue: mockAuditService },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
    prisma = module.get(PrismaService);
    userService = module.get(UserService);
    accountService = module.get(AccountService);
    auditService = module.get(AuditService);

    // Reset semua mock
    jest.clearAllMocks();
  });

  describe('findAllUsers', () => {
    it('should return all users via userService.findAll', async () => {
      const mockUsers = [mockUser];
      userService.findAll.mockResolvedValue(mockUsers);

      const result = await service.findAllUsers();

      expect(result).toEqual(mockUsers);
      expect(userService.findAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('findUserById', () => {
    const userId = 1;

    it('should return user with accounts', async () => {
      const mockUserWithAccounts = {
        ...mockUser,
        accounts: [mockAccount],
      };
      prisma.user.findUnique.mockResolvedValue(mockUserWithAccounts);

      const result = await service.findUserById(userId);

      expect(result).toEqual(mockUserWithAccounts);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          accounts: {
            select: {
              id: true,
              accountNumber: true,
              balance: true,
              createdAt: true,
            },
          },
        },
      });
    });

    it('should throw NotFoundException when user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.findUserById(userId))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('updateUser', () => {
    const userId = 1;
    const adminId = 2;
    const adminEmail = 'admin@example.com';
    const updateUserDto: UpdateUserDto = { name: 'Updated Name' };

    it('should successfully update user', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.user.update.mockResolvedValue({
        ...mockUser,
        name: 'Updated Name',
      });

      const result = await service.updateUser(userId, updateUserDto, adminId, adminEmail);

      expect(result).toEqual({
        ...mockUser,
        name: 'Updated Name',
      });
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
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: updateUserDto,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        },
      });
      expect(auditService.logAuditEvent).toHaveBeenCalled();
    });

    it('should throw NotFoundException when user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.updateUser(userId, updateUserDto, adminId, adminEmail))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('deactivateUser', () => {
    const userId = 1;
    const adminId = 2;
    const adminEmail = 'admin@example.com';
    const reason = 'Violation of terms';

    it('should successfully deactivate user', async () => {
      const mockUserForDeactivation = { 
        ...mockUser, 
        isActive: true,
        id: userId,
        name: 'Test User',
        email: 'test@example.com',
        role: UserRole.CUSTOMER
      };
      
      prisma.user.findUnique.mockResolvedValue(mockUserForDeactivation);
      prisma.account.findMany.mockResolvedValue([]);
      prisma.user.update.mockResolvedValue({
        ...mockUserForDeactivation,
        isActive: false,
        deactivatedAt: new Date(),
        deactivationReason: reason,
      });

      const result = await service.deactivateUser(userId, adminId, adminEmail, reason);

      expect(result.isActive).toBe(false);
      expect(result.deactivationReason).toBe(reason);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
        select: { id: true, name: true, email: true, role: true, isActive: true },
      });
      expect(prisma.account.findMany).toHaveBeenCalledWith({
        where: { userId: userId },
        select: { id: true, accountNumber: true, balance: true },
      });
      expect(auditService.logAuditEvent).toHaveBeenCalled();
    });

    it('should throw NotFoundException when user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.deactivateUser(userId, adminId, adminEmail, reason))
        .rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when user already inactive', async () => {
      const inactiveUser = { 
        ...mockUser, 
        isActive: false,
        id: userId,
        name: 'Test User',
        email: 'test@example.com',
        role: UserRole.CUSTOMER
      };
      prisma.user.findUnique.mockResolvedValue(inactiveUser);

      await expect(service.deactivateUser(userId, adminId, adminEmail, reason))
        .rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when user has accounts with balance > 0', async () => {
      const mockUserForDeactivation = { 
        ...mockUser, 
        isActive: true,
        id: userId,
        name: 'Test User',
        email: 'test@example.com',
        role: UserRole.CUSTOMER
      };
      
      prisma.user.findUnique.mockResolvedValue(mockUserForDeactivation);
      prisma.account.findMany.mockResolvedValue([
        { id: 1, accountNumber: '1234567890', balance: 1000 }
      ]);

      await expect(service.deactivateUser(userId, adminId, adminEmail, reason))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('reactivateUser', () => {
    const userId = 1;
    const adminId = 2;
    const adminEmail = 'admin@example.com';
    const reason = 'User appealed';

    it('should successfully reactivate user', async () => {
      const inactiveUser = { 
        ...mockUser, 
        isActive: false,
        id: userId,
        name: 'Test User',
        email: 'test@example.com',
        role: UserRole.CUSTOMER
      };
      
      prisma.user.findUnique.mockResolvedValue(inactiveUser);
      prisma.user.update.mockResolvedValue({
        ...inactiveUser,
        isActive: true,
        reactivatedAt: new Date(),
        reactivationReason: reason,
      });
      prisma.account.updateMany.mockResolvedValue({ count: 2 });

      const result = await service.reactivateUser(userId, adminId, adminEmail, reason);

      expect(result.isActive).toBe(true);
      expect(result.reactivationReason).toBe(reason);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
        select: { id: true, name: true, email: true, role: true, isActive: true },
      });
      expect(prisma.account.updateMany).toHaveBeenCalledWith({
        where: { userId: userId },
        data: { isActive: true },
      });
      expect(auditService.logAuditEvent).toHaveBeenCalled();
    });

    it('should throw NotFoundException when user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.reactivateUser(userId, adminId, adminEmail, reason))
        .rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when user already active', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);

      await expect(service.reactivateUser(userId, adminId, adminEmail, reason))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('findAllAccounts', () => {
    it('should return all accounts from prisma', async () => {
      const mockAccounts = [mockAccount];
      prisma.account.findMany.mockResolvedValue(mockAccounts);

      const result = await service.findAllAccounts();

      expect(result).toEqual(mockAccounts);
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
  });

  describe('findAccountById', () => {
    const accountId = 1;

    it('should return account with transactions', async () => {
      const mockAccountWithTransactions = {
        ...mockAccount,
        sentTrans: [],
        receivedTrans: [],
        user: { id: 1, name: 'Test User', email: 'test@example.com' },
      };
      prisma.account.findUnique.mockResolvedValue(mockAccountWithTransactions);

      const result = await service.findAccountById(accountId);

      expect(result).toEqual(mockAccountWithTransactions);
      expect(prisma.account.findUnique).toHaveBeenCalledWith({
        where: { id: accountId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          sentTrans: {
            take: 10,
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              type: true,
              amount: true,
              destinationId: true,
              createdAt: true,
            },
          },
          receivedTrans: {
            take: 10,
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              type: true,
              amount: true,
              sourceId: true,
              createdAt: true,
            },
          },
        },
      });
    });

    it('should throw NotFoundException when account not found', async () => {
      prisma.account.findUnique.mockResolvedValue(null);

      await expect(service.findAccountById(accountId))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('updateAccount', () => {
    const accountId = 1;
    const updateAccountDto: UpdateAccountDto = { balance: 50000 };

    it('should successfully update account', async () => {
      prisma.account.findUnique.mockResolvedValue(mockAccount);
      prisma.account.update.mockResolvedValue({
        ...mockAccount,
        ...updateAccountDto,
      });

      const result = await service.updateAccount(accountId, updateAccountDto);

      expect(result).toEqual({
        ...mockAccount,
        ...updateAccountDto,
      });
      expect(prisma.account.findUnique).toHaveBeenCalledWith({
        where: { id: accountId },
      });
      expect(prisma.account.update).toHaveBeenCalledWith({
        where: { id: accountId },
        data: updateAccountDto,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
    });

    it('should throw NotFoundException when account not found', async () => {
      prisma.account.findUnique.mockResolvedValue(null);

      await expect(service.updateAccount(accountId, updateAccountDto))
        .rejects.toThrow(NotFoundException);
    });
  });
});