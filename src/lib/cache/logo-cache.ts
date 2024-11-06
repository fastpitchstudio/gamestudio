'use client';

// src/lib/cache/logo-cache.ts
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/lib/types/database-types';

interface CacheEntry {
  url: string;
  expires: number;
}

class LogoCacheService {
  private memoryCache: Map<string, CacheEntry>;
  private readonly CACHE_PREFIX = 'team_logo_';
  private readonly CACHE_DURATION = 45 * 60 * 1000; // 45 minutes in milliseconds

  constructor() {
    this.memoryCache = new Map();
  }

  private getMemoryCacheKey(logoUrl: string): string {
    return `${this.CACHE_PREFIX}${logoUrl}`;
  }

  private getStorageKey(logoUrl: string): string {
    return `${this.CACHE_PREFIX}${logoUrl}`;
  }

  private isExpired(timestamp: number): boolean {
    return Date.now() > timestamp;
  }

  private getFromLocalStorage(key: string): CacheEntry | null {
    if (typeof window === 'undefined') return null;
    
    try {
      const item = localStorage.getItem(key);
      if (!item) return null;
      
      return JSON.parse(item) as CacheEntry;
    } catch (error) {
      console.warn('Error reading from localStorage:', error);
      return null;
    }
  }

  private setInLocalStorage(key: string, value: CacheEntry): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn('Error writing to localStorage:', error);
    }
  }

  async getSignedUrl(logoUrl: string): Promise<string | null> {
    if (typeof window === 'undefined') return null;

    // 1. Check memory cache first
    const memoryCacheKey = this.getMemoryCacheKey(logoUrl);
    const memoryCacheEntry = this.memoryCache.get(memoryCacheKey);
    
    if (memoryCacheEntry && !this.isExpired(memoryCacheEntry.expires)) {
      return memoryCacheEntry.url;
    }

    // 2. Check localStorage cache
    const storageKey = this.getStorageKey(logoUrl);
    const storageEntry = this.getFromLocalStorage(storageKey);
    
    if (storageEntry && !this.isExpired(storageEntry.expires)) {
      // Update memory cache
      this.memoryCache.set(memoryCacheKey, storageEntry);
      return storageEntry.url;
    }

    // 3. Fetch new signed URL if cache miss or expired
    try {
      const supabase = createClientComponentClient<Database>();
      
      // Parse the URL to get bucket and path
      const url = new URL(logoUrl);
      const correctedPath = url.pathname.replace('/storage/v1/object/public/', '');
      const [bucket, ...pathParts] = correctedPath.split('/');
      const filePath = pathParts.join('/');

      const { data, error } = await supabase
        .storage
        .from(bucket)
        .createSignedUrl(filePath, 3600, {
          download: false,
          transform: {
            width: 64,
            height: 64,
            resize: 'cover'
          }
        });

      if (error || !data.signedUrl) {
        console.error('Error creating signed URL:', error);
        return null;
      }

      // Cache the new signed URL
      const cacheEntry: CacheEntry = {
        url: data.signedUrl,
        expires: Date.now() + this.CACHE_DURATION
      };

      // Update both caches
      this.memoryCache.set(memoryCacheKey, cacheEntry);
      this.setInLocalStorage(storageKey, cacheEntry);

      return data.signedUrl;
    } catch (error) {
      console.error('Error in getSignedUrl:', error);
      return null;
    }
  }

  clearCache(): void {
    if (typeof window === 'undefined') return;

    // Clear memory cache
    this.memoryCache.clear();

    // Clear localStorage cache
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.CACHE_PREFIX)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn('Error clearing localStorage cache:', error);
    }
  }
}

// Export singleton instance
export const logoCacheService = new LogoCacheService();