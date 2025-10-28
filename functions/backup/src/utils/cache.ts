import { getFirestore } from 'firebase-admin/firestore';

const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export const getCachedData = async (key: string, fetcher: () => Promise<any>) => {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  
  const data = await fetcher();
  cache.set(key, { data, timestamp: Date.now() });
  return data;
}; 