<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

<p align="center">
  <a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
  <a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
  <a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
  <a href="https://github.com/Yoga-Pro-Player" target="_blank"><img src="https://img.shields.io/badge/author-Yoga%20Pro%20Player-blue" alt="Author" /></a>
</p>

<h1 align="center">RevoBank API 🏦</h1>

<p align="center">
  Modern Banking API built with NestJS, PostgreSQL, and Prisma
</p>

## 📋 Overview

RevoBank API is a comprehensive banking system API that provides secure and scalable banking operations. This project implements a full-featured digital banking platform with user management, account operations, transaction processing, admin dashboard, and audit logging.

## ✨ Features

### 🛡️ Security & Authentication
- **JWT-based authentication** with refresh tokens
- **Role-based access control** (CUSTOMER & ADMIN)
- **Password hashing** with bcrypt
- **Helmet.js** for security headers
- **Rate limiting** to prevent brute force attacks
- **Request validation** with class-validator

### 💰 Banking Operations
- **Account management** (create, view, update, delete)
- **Transaction processing** (deposit, withdraw, transfer)
- **Balance management** with decimal precision
- **Transaction history** with pagination
- **Idempotency keys** for duplicate transaction prevention

### 👥 User Management
- **User registration** with email validation
- **Profile management** (view and update)
- **Account ownership** verification
- **Soft delete** with deactivation/reactivation
- **Admin user management**

### 🏛️ Admin Features
- **Dashboard** with system overview
- **User management** (view, update, deactivate)
- **Account management** (view, update, delete)
- **Transaction monitoring** (view all transactions)
- **Audit logging** for all administrative actions

### 📊 System Features
- **Audit logging** for compliance and tracking
- **Caching** with Cache Manager for performance
- **Health checks** for monitoring
- **Swagger documentation** with OpenAPI 3.0
- **Winston logging** with structured logging
- **Database migrations** with Prisma
- **Error handling** with custom filters

## 🛠️ Technology Stack

- **Backend Framework**: [NestJS](https://nestjs.com/) (TypeScript)
- **Database**: [PostgreSQL](https://www.postgresql.org/) with [Prisma ORM](https://www.prisma.io/)
- **Authentication**: [JWT](https://jwt.io/) with [@nestjs/jwt](https://docs.nestjs.com/security/authentication)
- **Validation**: [class-validator](https://github.com/typestack/class-validator) & [class-transformer](https://github.com/typestack/class-transformer)
- **Documentation**: [Swagger/OpenAPI](https://swagger.io/) with [@nestjs/swagger](https://docs.nestjs.com/openapi/introduction)
- **Testing**: [Jest](https://jestjs.io/) for unit & integration tests
- **Security**: [Helmet](https://helmetjs.github.io/), [bcrypt](https://github.com/kelektiv/node.bcrypt.js)
- **Logging**: [Winston](https://github.com/winstonjs/winston) for structured logging
- **Performance**: [Compression](https://github.com/expressjs/compression), caching with [cache-manager](https://github.com/node-cache-manager/node-cache-manager)

## 📁 Project Structure

Proyek ini mengikuti arsitektur modular NestJS dengan struktur yang terorganisir dengan baik. Total terdapat **54 file TypeScript** dalam proyek ini.

### 📂 **Root Directory**
```
milestone-4-yogaaaa123/
├── prisma/                    # Database configuration and migrations
├── src/                      # Source code utama
├── test/                     # Test files and mocks
├── .env                      # Environment variables (gitignored)
├── .env.example              # Environment variables template
├── package.json              # Dependencies and scripts
├── package-lock.json         # Lock file for dependencies
├── tsconfig.json             # TypeScript configuration
├── tsconfig.build.json       # Build configuration
├── nest-cli.json             # NestJS CLI configuration
├── prisma.config.ts          # Prisma configuration
├── eslint.config.mjs         # ESLint configuration
├── .prettierrc               # Prettier configuration
├── .prettierignore           # Prettier ignore patterns
├── .gitignore               # Git ignore patterns
├── README.md                # This documentation file
└── README-TESTING.md        # Testing documentation
```

### 🗃️ **Prisma Directory** - Database Layer
```
prisma/
├── schema.prisma            # Database schema definition
├── seed.ts                  # Database seeding script
└── migrations/              # Database migration files
    ├── 20260411132504_init/
    ├── 20260412035911_add_account_model/
    ├── 20260412041346_merge_account_model/
    ├── 20260413071533_rename_tables_to_lowercase/
    ├── 20260413172901_add_idempotency_key/
    ├── 20260413173605_index_created_at/
    ├── 20260413173934_add_refresh_token_to_user/
    └── 20260418100544_add_soft_delete_fields/
```

### 🏗️ **Source Code (src/) - Arsitektur Modular**

#### **Core Application Files**
```
src/
├── main.ts                  # Application entry point
├── app.module.ts           # Root application module
├── app.controller.ts       # Main controller
├── app.service.ts          # Main service
```

#### **📊 Database Layer**
```
src/prisma/
├── prisma.module.ts        # Prisma module
└── prisma.service.ts       # Prisma service (database client)
```

#### **👤 User Management Module**
```
src/user/
├── user.module.ts          # User module
├── user.controller.ts      # User controller (profile management)
├── user.service.ts         # User service (business logic)
├── user.service.spec.ts    # User service tests
├── entities/
│   └── user.entity.ts      # User entity definition
└── dto/
    ├── create-user.dto.ts  # Create user DTO
    └── update-user.dto.ts  # Update user DTO
```

#### **🔐 Authentication Module**
```
src/auth/
├── auth.module.ts          # Authentication module
├── auth.controller.ts      # Auth controller (register/login)
├── auth.controller.spec.ts # Auth controller tests
└── auth.service.ts         # Auth service (JWT logic)
```

#### **💰 Account Management Module**
```
src/account/
├── account.module.ts       # Account module
├── account.controller.ts   # Account controller
├── account.service.ts      # Account service
├── account.service.spec.ts # Account service tests
├── entities/
│   └── account.entity.ts   # Account entity
└── dto/
    ├── create-account.dto.ts
    └── update-account.dto.ts
```

#### **💸 Transaction Processing Module**
```
src/transaction/
├── transaction.module.ts   # Transaction module
├── transaction.controller.ts # Transaction controller
├── transaction.service.ts  # Transaction service
├── transaction.service.spec.ts # Transaction service tests
├── entities/
│   └── transaction.entity.ts # Transaction entity
└── dto/
    ├── create-transaction.dto.ts
    ├── deposit.dto.ts
    ├── withdraw.dto.ts
    ├── transfer.dto.ts
    └── update-transaction.dto.ts
```

#### **👑 Admin Management Module**
```
src/admin/
├── admin.module.ts         # Admin module
├── admin.controller.ts     # Admin controller
├── admin.service.ts        # Admin service
└── admin.service.spec.ts   # Admin service tests
```

#### **📝 Audit Logging Module**
```
src/audit/
├── audit.module.ts         # Audit module
├── audit.service.ts        # Audit service
└── audit.service.spec.ts   # Audit service tests
```

#### **🏥 Health Check Module**
```
src/health/
├── health.module.ts        # Health module
├── health.controller.ts    # Health controller
└── health.controller.spec.ts # Health controller tests
```

#### **⚡ Caching Service**
```
src/cache/
├── cache.service.ts        # Cache service
└── cache.service.spec.ts   # Cache service tests
```

#### **🔧 Common Utilities**
```
src/common/
├── decorators/
│   └── roles.decorator.ts  # Custom decorator for roles
├── filters/
│   ├── json-exception.filter.ts  # JSON exception filter
│   └── prisma-exception.filter.ts # Prisma exception filter
├── guards/
│   ├── jwt.guard.ts        # JWT authentication guard
│   └── roles.guard.ts      # Role-based authorization guard
├── interfaces/
│   └── request-with-user.interface.ts # Extended request interface
├── logger/
│   └── winston.logger.ts   # Winston logger configuration
└── middleware/
    └── logger.middleware.ts # Request logging middleware
```

#### **⚙️ Configuration**
```
src/config/
└── jwt.config.ts           # JWT configuration
```

### 🧪 **Test Structure**
```
test/
└── mocks/
    └── mock-data.ts        # Shared mock data for tests
```

### 📊 **File Statistics**
- **Total TypeScript Files**: 54
- **Controller Files**: 7
- **Service Files**: 9
- **Module Files**: 10
- **DTO Files**: 9
- **Entity Files**: 4
- **Test Files**: 8
- **Common Utility Files**: 7

### 🏗️ **Arsitektur Modular**
Proyek ini mengikuti prinsip **Separation of Concerns** dengan setiap modul memiliki:
1. **Module** - Konfigurasi dan dependency injection
2. **Controller** - Menangani HTTP requests/responses
3. **Service** - Business logic dan data access
4. **DTO** - Data transfer objects untuk validation
5. **Entity** - Type definitions untuk database models
6. **Tests** - Unit tests untuk setiap service

Setiap modul independen dan dapat dikembangkan secara terpisah, dengan **AppModule** sebagai root module yang mengimport semua modul lainnya.

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **PostgreSQL** (v14 or higher)
- **Git**

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Yoga-Pro-Player/Final-project-crack.git
   cd milestone-4/milestone-4-yogaaaa123
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` file with your database credentials:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/revobank"
   JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
   JWT_REFRESH_SECRET="your-super-secret-refresh-key-change-this-too"
   PORT=3000
   NODE_ENV=development
   ```

4. **Set up database**
   ```bash
   # Generate Prisma client
   npx prisma generate

   # Run database migrations
   npx prisma migrate deploy

   # Seed the database with initial data
   npx prisma db seed
   ```

5. **Build the application**
   ```bash
   npm run build
   ```

## 🏃‍♂️ Running the Application

### Development mode
```bash
# Start in development mode with hot reload
npm run start:dev
```

### Production mode
```bash
# Build and start in production mode
npm run build
npm run start:prod
```

### Access the application
- **Local Development**:
  - **API Server**: http://localhost:3000
  - **Swagger Documentation**: http://localhost:3000/api
  - **Health Check**: http://localhost:3000/health

- **Production Deployment**:
  - **Live API Server**: https://observant-growth-production.up.railway.app/
  - **Live Swagger Documentation**: https://observant-growth-production.up.railway.app/api
  - **Live Health Check**: https://observant-growth-production.up.railway.app/health

## 📚 API Documentation

API documentation is available via Swagger UI at `/api` endpoint. The documentation includes:
- All available endpoints
- Request/Response schemas
- Authentication requirements
- Try-it-out functionality

### Authentication
Most endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:cov

# Run end-to-end tests
npm run test:e2e
```

### Test Structure
- **Unit Tests**: Test individual services and controllers
- **Integration Tests**: Test database interactions
- **E2E Tests**: Test complete API flows

## 🔧 Database Management

### Prisma Commands

```bash
# Generate Prisma client
npx prisma generate

# Create a new migration
npx prisma migrate dev --name <migration-name>

# Apply pending migrations
npx prisma migrate deploy

# View database in Prisma Studio
npx prisma studio

# Reset database (development only)
npx prisma migrate reset
```

### Database Schema
The database includes the following models:
- **User**: User accounts with roles (CUSTOMER, ADMIN)
- **Account**: Bank accounts with balances
- **Transaction**: Financial transactions (DEPOSIT, WITHDRAW, TRANSFER)
- **AuditLog**: Audit trail for system activities

## 🔒 Security Features

1. **Authentication**: JWT tokens with refresh mechanism
2. **Authorization**: Role-based access control (RBAC)
3. **Password Security**: bcrypt hashing with salt rounds
4. **Input Validation**: Comprehensive validation using class-validator
5. **Rate Limiting**: Protection against brute force attacks
6. **Security Headers**: Helmet.js for secure HTTP headers
7. **CORS**: Configurable Cross-Origin Resource Sharing
8. **Audit Logging**: Complete audit trail for compliance

## 📈 Performance Optimization

1. **Caching**: Redis-compatible caching layer
2. **Database Indexing**: Optimized queries with proper indexes
3. **Connection Pooling**: Efficient database connections
4. **Compression**: Response compression for faster transfers
5. **Pagination**: Efficient data retrieval for large datasets

## 🐳 Deployment

### Docker (Recommended)

```dockerfile
# Dockerfile example
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY prisma ./prisma/
RUN npx prisma generate

COPY dist ./dist/

EXPOSE 3000

CMD ["node", "dist/src/main"]
```

### Environment Variables for Production
```env
DATABASE_URL="postgresql://user:password@host:5432/database"
JWT_SECRET="secure-random-string"
JWT_REFRESH_SECRET="another-secure-random-string"
PORT=3000
NODE_ENV=production
REDIS_URL="redis://localhost:6379"
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Write tests for new features
- Update documentation as needed
- Use meaningful commit messages
- Follow the existing code style

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👤 Author

**Yoga Pro Player**
- GitHub: [@Yoga-Pro-Player](https://github.com/Yoga-Pro-Player)

## 🙏 Acknowledgments

- [NestJS](https://nestjs.com/) for the amazing framework
- [Prisma](https://www.prisma.io/) for the excellent ORM
- All contributors and maintainers

---

<p align="center">
  Made with ❤️ for the Final Project Crack - Milestone 4
</p>

[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/PzCCy7VV)