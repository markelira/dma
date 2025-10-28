import { getFirestore } from 'firebase-admin/firestore';

export const batchOperations = async (operations: Promise<any>[]) => {
  const batch = getFirestore().batch();
  // Implement batch operations
  return batch.commit();
};

export const paginateResults = (query: any, limit: number = 20) => {
  return query.limit(limit);
}; 