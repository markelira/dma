import { onCall } from 'firebase-functions/v2/https';
import { firestore } from './admin';
import * as z from 'zod';

// Audit log entry schema
const AuditLogEntrySchema = z.object({
  action: z.string(),
  resource: z.string(),
  resourceId: z.string().optional(),
  details: z.record(z.any()).optional(),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('LOW'),
});

// Create audit log entry
export const createAuditLogEntry = async (
  userId: string,
  userEmail: string,
  userName: string,
  action: string,
  resource: string,
  resourceId?: string,
  details?: any,
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW'
) => {
  try {
    const entry = {
      userId,
      userEmail,
      userName,
      action,
      resource,
      resourceId: resourceId || '',
      details: JSON.stringify(details || {}),
      severity,
      ipAddress: 'N/A', // Can be extracted from request context in real implementation
      userAgent: 'N/A', // Can be extracted from request context in real implementation
      createdAt: new Date(),
    };

    await firestore.collection('auditLogs').add(entry);
    console.log('[AuditLog] Created:', action, resource);
  } catch (error) {
    console.error('[AuditLog] Error creating entry:', error);
  }
};

// Get audit logs
export const getAuditLogs = onCall(async (request) => {
  // Check if user is admin
  if (!request.auth) {
    throw new Error('Authentication required');
  }

  const userDoc = await firestore.collection('users').doc(request.auth.uid).get();
  const userData = userDoc.data();
  
  if (userData?.role !== 'ADMIN') {
    throw new Error('Admin access required');
  }

  try {
    // Get last 500 audit logs
    const snapshot = await firestore
      .collection('auditLogs')
      .orderBy('createdAt', 'desc')
      .limit(500)
      .get();

    const logs = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    }));

    return { success: true, data: logs };
  } catch (error) {
    console.error('[getAuditLogs] Error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch audit logs'
    };
  }
});

// Get audit log statistics
export const getAuditLogStats = onCall(async (request) => {
  // Check if user is admin
  if (!request.auth) {
    throw new Error('Authentication required');
  }

  const userDoc = await firestore.collection('users').doc(request.auth.uid).get();
  const userData = userDoc.data();
  
  if (userData?.role !== 'ADMIN') {
    throw new Error('Admin access required');
  }

  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);
    const last30Days = new Date(today);
    last30Days.setDate(last30Days.getDate() - 30);

    // Get total entries
    const totalSnapshot = await firestore.collection('auditLogs').count().get();
    const totalEntries = totalSnapshot.data().count;

    // Get today's entries
    const todaySnapshot = await firestore
      .collection('auditLogs')
      .where('createdAt', '>=', today)
      .count()
      .get();
    const todayEntries = todaySnapshot.data().count;

    // Get critical events in last 30 days
    const criticalSnapshot = await firestore
      .collection('auditLogs')
      .where('severity', '==', 'CRITICAL')
      .where('createdAt', '>=', last30Days)
      .count()
      .get();
    const criticalEvents = criticalSnapshot.data().count;

    // Get unique users in last 7 days
    const usersSnapshot = await firestore
      .collection('auditLogs')
      .where('createdAt', '>=', lastWeek)
      .get();
    
    const uniqueUsers = new Set(usersSnapshot.docs.map((doc: any) => doc.data().userId)).size;

    return {
      success: true,
      data: {
        totalEntries,
        todayEntries,
        criticalEvents,
        uniqueUsers,
      }
    };
  } catch (error) {
    console.error('[getAuditLogStats] Error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch audit statistics'
    };
  }
});