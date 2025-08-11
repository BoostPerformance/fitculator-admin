interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class MemoryCache {
  private cache = new Map<string, CacheItem<any>>();

  set<T>(key: string, data: T, ttl: number = 5 * 60 * 1000): void { // Default 5 minutes
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    const isExpired = Date.now() - item.timestamp > item.ttl;
    
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return item.data as T;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // Cache keys for different types of data
  static keys = {
    challenges: 'challenges',
    coachInfo: 'coach-info',
    adminUsers: 'admin-users',
    challengeParticipants: (challengeId: string, page: number) => `challenge-participants-${challengeId}-${page}`,
    workoutStats: (challengeId: string) => `workout-stats-${challengeId}`,
    dietUploads: (challengeId: string) => `diet-uploads-${challengeId}`,
    feedbackData: (challengeId: string) => `feedback-data-${challengeId}`,
  } as const;

}

export const cache = new MemoryCache();

// Cache invalidation helpers
export const invalidateCache = {
  challengeData: (challengeId: string) => {
    cache.delete(MemoryCache.keys.workoutStats(challengeId));
    cache.delete(MemoryCache.keys.dietUploads(challengeId));
    cache.delete(MemoryCache.keys.feedbackData(challengeId));
    // Invalidate all pages of challenge participants
    for (let page = 1; page <= 10; page++) {
      cache.delete(MemoryCache.keys.challengeParticipants(challengeId, page));
    }
  },
  allChallenges: () => {
    cache.delete(MemoryCache.keys.challenges);
  },
  userInfo: () => {
    cache.delete(MemoryCache.keys.coachInfo);
    cache.delete(MemoryCache.keys.adminUsers);
  }
};