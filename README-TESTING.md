# Schema Unit Test untuk Project NestJS

## Struktur Schema Test yang Telah Dibuat

### 1. **Mock Data Schema** (`/test/mocks/mock-data.ts`)
- **User Schema**: mock data user dengan role CUSTOMER/ADMIN
- **Account Schema**: mock data rekening dengan balance berbeda
- **Transaction Schema**: mock data transaksi (DEPOSIT/WITHDRAW/TRANSFER)
- **Audit Log Schema**: mock data audit log
- **Error Schema**: mock exception objects
- **Prisma Service Schema**: mock Prisma client dengan semua method

### 2. **Unit Test Files** (`/src/**/*.spec.ts`)

#### a. **Transaction Service Test** (`src/transaction/transaction.service.spec.ts`)
- **Deposit Schema**: Test deposit success, invalid amount, account not found
- **Withdraw Schema**: Test withdraw success, insufficient balance, account not found
- **Transfer Schema**: Test transfer success, same account, insufficient balance
- **History Schema**: Test paginated transactions (user & admin)
- **Detail Schema**: Test transaction detail retrieval

#### b. **User Service Test** (`src/user/user.service.spec.ts`)
- **Auth Schema**: Test register, login, logout, refresh tokens
- **Profile Schema**: Test get profile, update profile
- **Validation Schema**: Test email conflict, invalid credentials
- **Admin Operations Schema**: Test findAll, remove (optional)

#### c. **Account Service Test** (`src/account/account.service.spec.ts`)
- **Create Account Schema**: Test unique account number generation, collision handling
- **CRUD Schema**: Test findAll, findOne, update, remove
- **Admin Schema**: Test adminFindAll, adminFindOne, adminUpdate
- **Validation Schema**: Test account ownership, not found scenarios

### 3. **Test Configuration**
- **TypeScript Config**: Added `"types": ["jest"]` to tsconfig.json
- **Test Directory**: Created `/test/mocks/` for shared mock data
- **Jest Setup**: Ready for use with Jest testing framework

## Cara Menjalankan Test

```bash
# Install dependencies jika belum
npm install

# Jalankan semua test
npm test

# Jalankan test dengan watch mode
npm run test:watch

# Jalankan test dengan coverage
npm run test:cov

# Jalankan test untuk service tertentu
npm test -- transaction.service.spec.ts
```

## Pola Schema Test yang Digunakan

### 1. **Mocking Dependencies**
```typescript
const mockPrismaService = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
    // ... other methods
  },
};
```

### 2. **Test Structure**
```typescript
describe('ServiceName', () => {
  beforeEach(() => {
    // Setup mocks
  });

  describe('methodName', () => {
    it('should ...', async () => {
      // Arrange
      // Act
      // Assert
    });

    it('should throw error when ...', async () => {
      // Error scenario
    });
  });
});
```

### 3. **Common Test Scenarios**
- **Happy Path**: Success scenarios dengan valid input
- **Error Handling**: Exception scenarios (NotFound, BadRequest, etc.)
- **Edge Cases**: Boundary conditions, duplicate data, empty results
- **Validation**: Input validation, business logic validation

## Schema Test yang Masih Bisa Ditambahkan

### 1. **Controller Tests**
- HTTP request/response validation
- Authentication/Authorization tests
- DTO validation tests

### 2. **Integration Tests**
- End-to-end API tests
- Database integration tests
- Authentication flow tests

### 3. **Additional Service Tests**
- **Admin Service**: Admin operations, audit logging
- **Audit Service**: Audit log creation and retrieval
- **Cache Service**: Caching functionality
- **Health Controller**: Health check endpoints

### 4. **Performance Tests**
- Load testing for concurrent transactions
- Database query performance
- Cache hit/miss scenarios

## Best Practices yang Diterapkan

1. **Isolated Tests**: Setiap test independent, reset mocks di beforeEach
2. **Meaningful Names**: Test names menjelaskan expected behavior
3. **Comprehensive Coverage**: Test positive, negative, edge cases
4. **Mock Data Reusability**: Shared mock data di file terpisah
5. **Type Safety**: TypeScript dengan type definitions lengkap

## Contoh Penggunaan Mock Data

```typescript
import { mockUser, mockAccount, mockDepositTransaction } from '../../test/mocks/mock-data';

// Dalam test
prisma.user.findUnique.mockResolvedValue(mockUser);
const result = await service.deposit(userId, accountNumber, amount);
expect(result).toEqual(expectedResult);
```

## Troubleshooting

### Error: "Cannot find name 'jest'"
- Pastikan `@types/jest` terinstall: `npm install --save-dev @types/jest`
- Pastikan `tsconfig.json` memiliki `"types": ["jest"]`

### Error: "Prisma service not mocked properly"
- Periksa mock structure sesuai dengan actual PrismaService
- Gunakan `mockPrismaService` dari file mock-data

### Test Tidak Berjalan
- Pastikan test files berakhiran `.spec.ts`
- Periksa jest configuration di `package.json`