"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAuditLogStats = exports.getAuditLogs = exports.createAuditLogEntry = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin_1 = require("./admin");
const z = __importStar(require("zod"));
// Audit log entry schema
const AuditLogEntrySchema = z.object({
    action: z.string(),
    resource: z.string(),
    resourceId: z.string().optional(),
    details: z.record(z.any()).optional(),
    severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('LOW'),
});
// Create audit log entry
const createAuditLogEntry = async (userId, userEmail, userName, action, resource, resourceId, details, severity = 'LOW') => {
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
        await admin_1.firestore.collection('auditLogs').add(entry);
        console.log('[AuditLog] Created:', action, resource);
    }
    catch (error) {
        console.error('[AuditLog] Error creating entry:', error);
    }
};
exports.createAuditLogEntry = createAuditLogEntry;
// Get audit logs
exports.getAuditLogs = (0, https_1.onCall)(async (request) => {
    // Check if user is admin
    if (!request.auth) {
        throw new Error('Authentication required');
    }
    const userDoc = await admin_1.firestore.collection('users').doc(request.auth.uid).get();
    const userData = userDoc.data();
    if (userData?.role !== 'ADMIN') {
        throw new Error('Admin access required');
    }
    try {
        // Get last 500 audit logs
        const snapshot = await admin_1.firestore
            .collection('auditLogs')
            .orderBy('createdAt', 'desc')
            .limit(500)
            .get();
        const logs = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        }));
        return { success: true, data: logs };
    }
    catch (error) {
        console.error('[getAuditLogs] Error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to fetch audit logs'
        };
    }
});
// Get audit log statistics
exports.getAuditLogStats = (0, https_1.onCall)(async (request) => {
    // Check if user is admin
    if (!request.auth) {
        throw new Error('Authentication required');
    }
    const userDoc = await admin_1.firestore.collection('users').doc(request.auth.uid).get();
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
        const totalSnapshot = await admin_1.firestore.collection('auditLogs').count().get();
        const totalEntries = totalSnapshot.data().count;
        // Get today's entries
        const todaySnapshot = await admin_1.firestore
            .collection('auditLogs')
            .where('createdAt', '>=', today)
            .count()
            .get();
        const todayEntries = todaySnapshot.data().count;
        // Get critical events in last 30 days
        const criticalSnapshot = await admin_1.firestore
            .collection('auditLogs')
            .where('severity', '==', 'CRITICAL')
            .where('createdAt', '>=', last30Days)
            .count()
            .get();
        const criticalEvents = criticalSnapshot.data().count;
        // Get unique users in last 7 days
        const usersSnapshot = await admin_1.firestore
            .collection('auditLogs')
            .where('createdAt', '>=', lastWeek)
            .get();
        const uniqueUsers = new Set(usersSnapshot.docs.map((doc) => doc.data().userId)).size;
        return {
            success: true,
            data: {
                totalEntries,
                todayEntries,
                criticalEvents,
                uniqueUsers,
            }
        };
    }
    catch (error) {
        console.error('[getAuditLogStats] Error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to fetch audit statistics'
        };
    }
});
//# sourceMappingURL=auditLog.js.map