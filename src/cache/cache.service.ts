import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

@Injectable()
export class CacheService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.cacheManager.get<T>(key);
      return value ?? null;
    } catch (error) {
      console.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    try {
      await this.cacheManager.set(key, value, ttl);
    } catch (error) {
      console.error(`Cache set error for key ${key}:`, error);
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.cacheManager.del(key);
    } catch (error) {
      console.error(`Cache delete error for key ${key}:`, error);
    }
  }

  async reset(): Promise<void> {
    try {
      // Note: reset() method may not exist in all cache implementations
      // For compatibility, we'll implement our own reset logic
      // Since we can't access store directly, we'll track keys manually
      // or use a different approach
      console.warn('Cache reset() method not fully implemented - use clearCachePattern() instead');
    } catch (error) {
      console.error('Cache reset error:', error);
    }
  }

  async wrap<T>(
    key: string,
    fn: () => Promise<T>,
    ttl?: number,
  ): Promise<T> {
    try {
      return await this.cacheManager.wrap(key, fn, ttl);
    } catch (error) {
      console.error(`Cache wrap error for key ${key}:`, error);
      // Fallback to direct function call if cache fails
      return await fn();
    }
  }

  // Banking-specific cache methods
  async getUserAccounts(userId: number): Promise<any[] | null> {
    return this.get(`user:${userId}:accounts`);
  }

  async setUserAccounts(userId: number, accounts: any[], ttl = 300): Promise<void> {
    await this.set(`user:${userId}:accounts`, accounts, ttl * 1000);
  }

  async invalidateUserAccounts(userId: number): Promise<void> {
    await this.del(`user:${userId}:accounts`);
  }

  async getAccountTransactions(accountId: number, page = 1, limit = 10): Promise<any[] | null> {
    return this.get(`account:${accountId}:transactions:${page}:${limit}`);
  }

  async setAccountTransactions(
    accountId: number,
    transactions: any[],
    page = 1,
    limit = 10,
    ttl = 60,
  ): Promise<void> {
    await this.set(`account:${accountId}:transactions:${page}:${limit}`, transactions, ttl * 1000);
  }

  async invalidateAccountTransactions(accountId: number): Promise<void> {
    // Delete all transaction cache for this account
    // Since we can't access store.keys directly, we'll track patterns manually
    // For now, we'll delete known patterns
    const patterns = [
      `account:${accountId}:transactions:*`,
    ];
    
    // In a real implementation, you would use a cache store that supports pattern deletion
    // or maintain a separate index of cache keys
    console.warn(`Cache pattern deletion not fully implemented for account ${accountId}`);
    
    // Delete common pagination patterns
    for (let page = 1; page <= 10; page++) {
      for (let limit of [10, 20, 50]) {
        await this.del(`account:${accountId}:transactions:${page}:${limit}`);
      }
    }
  }

  async getDashboardStats(): Promise<any | null> {
    return this.get('dashboard:stats');
  }

  async setDashboardStats(stats: any, ttl = 30): Promise<void> {
    await this.set('dashboard:stats', stats, ttl * 1000);
  }

  async invalidateDashboardStats(): Promise<void> {
    await this.del('dashboard:stats');
  }

  // Rate limiting helper
  async checkRateLimit(key: string, limit: number, windowMs: number): Promise<{ allowed: boolean; remaining: number }> {
    const now = Date.now();
    const windowStart = now - windowMs;
    
    const requests = (await this.get<number[]>(`ratelimit:${key}`)) || [];
    
    // Remove old requests
    const validRequests = requests.filter(timestamp => timestamp > windowStart);
    
    if (validRequests.length >= limit) {
      return { allowed: false, remaining: 0 };
    }
    
    // Add current request
    validRequests.push(now);
    await this.set(`ratelimit:${key}`, validRequests, windowMs);
    
    return { allowed: true, remaining: limit - validRequests.length };
  }
}