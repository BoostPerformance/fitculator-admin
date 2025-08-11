import { cache, invalidateCache } from './cache';

// Export cache and invalidation for direct usage
export { cache, invalidateCache };

interface CachedFetchOptions {
  ttl?: number;
  forceRefresh?: boolean;
}

export async function cachedFetch<T>(
  url: string, 
  cacheKey: string, 
  options: CachedFetchOptions = {}
): Promise<T> {
  const { ttl = 5 * 60 * 1000, forceRefresh = false } = options;

  // Check cache first unless forced refresh
  if (!forceRefresh) {
    const cachedData = cache.get<T>(cacheKey);
    if (cachedData) {
      return cachedData;
    }
  }

  // Fetch fresh data
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch: ${response.statusText}`);
  }

  const data = await response.json();
  
  // Cache the result
  cache.set(cacheKey, data, ttl);
  
  return data;
}

// Specific cached API functions
export const cachedAPI = {
  getChallenges: (options?: CachedFetchOptions) =>
    cachedFetch('/api/challenges', cache.keys.challenges, { ttl: 10 * 60 * 1000, ...options }),

  getCoachInfo: (options?: CachedFetchOptions) =>
    cachedFetch('/api/coach-info', cache.keys.coachInfo, { ttl: 15 * 60 * 1000, ...options }),

  getAdminUsers: (options?: CachedFetchOptions) =>
    cachedFetch('/api/admin-users', cache.keys.adminUsers, { ttl: 15 * 60 * 1000, ...options }),

  getChallengeParticipants: (challengeId: string, page: number = 1, limit: number = 30, options?: CachedFetchOptions) => {
    const url = new URL('/api/challenge-participants', window.location.origin);
    url.searchParams.append('page', page.toString());
    url.searchParams.append('limit', limit.toString());
    url.searchParams.append('with_records', 'true');
    url.searchParams.append('challenge_id', challengeId);
    
    return cachedFetch(
      url.toString(), 
      cache.keys.challengeParticipants(challengeId, page),
      { ttl: 2 * 60 * 1000, ...options } // Shorter TTL for dynamic data
    );
  },

  getWorkoutStats: (challengeId: string, type: string = 'today-count', options?: CachedFetchOptions) =>
    cachedFetch(
      `/api/workouts?type=${type}&challengeId=${challengeId}`,
      cache.keys.workoutStats(challengeId),
      { ttl: 1 * 60 * 1000, ...options } // Very short TTL for real-time data
    ),

  getDietUploads: (challengeId: string, options?: CachedFetchOptions) =>
    cachedFetch(
      `/api/diet-uploads?challengeId=${challengeId}`,
      cache.keys.dietUploads(challengeId),
      { ttl: 1 * 60 * 1000, ...options } // Very short TTL for real-time data
    ),
};

// Refresh functions for forcing cache updates
export const refreshAPI = {
  refreshChallenge: async (challengeId: string) => {
    // Invalidate cache and refetch data
    invalidateCache.challengeData(challengeId);
    
    return Promise.all([
      cachedAPI.getWorkoutStats(challengeId, 'today-count', { forceRefresh: true }),
      cachedAPI.getDietUploads(challengeId, { forceRefresh: true }),
      cachedAPI.getChallengeParticipants(challengeId, 1, 30, { forceRefresh: true })
    ]);
  },

  refreshAll: async () => {
    // Clear all cache
    cache.clear();
    
    return Promise.all([
      cachedAPI.getChallenges({ forceRefresh: true }),
      cachedAPI.getCoachInfo({ forceRefresh: true }),
      cachedAPI.getAdminUsers({ forceRefresh: true })
    ]);
  }
};