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
exports.reportLessonIssue = exports.respondToSupportTicket = exports.createSupportTicket = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin_1 = require("./admin");
const z = __importStar(require("zod"));
const auditLog_1 = require("./auditLog");
// Create support ticket
const CreateTicketSchema = z.object({
    subject: z.string(),
    message: z.string(),
    category: z.string(),
});
exports.createSupportTicket = (0, https_1.onCall)(async (request) => {
    if (!request.auth) {
        throw new Error('Authentication required');
    }
    const validatedData = CreateTicketSchema.parse(request.data);
    try {
        // Get user info
        const userDoc = await admin_1.firestore.collection('users').doc(request.auth.uid).get();
        const userData = userDoc.data();
        const ticketData = {
            userId: request.auth.uid,
            userEmail: request.auth?.token?.email || '',
            userName: `${userData?.firstName || ''} ${userData?.lastName || ''}`.trim() || 'Unknown User',
            subject: validatedData.subject,
            message: validatedData.message,
            category: validatedData.category,
            status: 'OPEN',
            createdAt: new Date(),
            updatedAt: new Date(),
            hasUnreadResponse: false,
        };
        const ticketRef = await admin_1.firestore.collection('supportTickets').add(ticketData);
        // Create audit log entry
        await (0, auditLog_1.createAuditLogEntry)(request.auth.uid, request.auth?.token?.email || '', ticketData.userName, 'CREATE_TICKET', 'SupportTicket', ticketRef.id, {
            subject: validatedData.subject,
            category: validatedData.category,
        }, 'LOW');
        console.log(`[Support] Ticket created: ${ticketRef.id} by ${ticketData.userName}`);
        return {
            success: true,
            ticketId: ticketRef.id,
            message: 'Support ticket created successfully'
        };
    }
    catch (error) {
        console.error('[createSupportTicket] Error:', error);
        throw error;
    }
});
// Admin respond to ticket
const RespondToTicketSchema = z.object({
    ticketId: z.string(),
    message: z.string(),
    closeTicket: z.boolean().optional(),
});
exports.respondToSupportTicket = (0, https_1.onCall)(async (request) => {
    if (!request.auth) {
        throw new Error('Authentication required');
    }
    const validatedData = RespondToTicketSchema.parse(request.data);
    try {
        // Get admin info
        const userDoc = await admin_1.firestore.collection('users').doc(request.auth.uid).get();
        const userData = userDoc.data();
        if (userData?.role !== 'ADMIN') {
            throw new Error('Admin access required');
        }
        const adminName = `${userData?.firstName || ''} ${userData?.lastName || ''}`.trim() || 'Admin Team';
        // Get ticket
        const ticketDoc = await admin_1.firestore.collection('supportTickets').doc(validatedData.ticketId).get();
        if (!ticketDoc.exists) {
            throw new Error('Ticket not found');
        }
        const ticketData = ticketDoc.data();
        // Update ticket with response
        const updateData = {
            adminResponse: validatedData.message,
            adminId: request.auth.uid,
            adminName,
            respondedAt: new Date(),
            hasUnreadResponse: true,
            updatedAt: new Date(),
        };
        if (validatedData.closeTicket) {
            updateData.status = 'CLOSED';
            updateData.closedAt = new Date();
        }
        await admin_1.firestore.collection('supportTickets').doc(validatedData.ticketId).update(updateData);
        // Create audit log entry
        await (0, auditLog_1.createAuditLogEntry)(request.auth.uid, request.auth?.token?.email || '', adminName, validatedData.closeTicket ? 'CLOSE_TICKET' : 'RESPOND_TICKET', 'SupportTicket', validatedData.ticketId, {
            ticketSubject: ticketData?.subject,
            responsePreview: validatedData.message.substring(0, 100),
        }, 'MEDIUM');
        console.log(`[Support] Admin ${adminName} responded to ticket ${validatedData.ticketId}`);
        return {
            success: true,
            message: validatedData.closeTicket ? 'Ticket closed successfully' : 'Response sent successfully'
        };
    }
    catch (error) {
        console.error('[respondToSupportTicket] Error:', error);
        throw error;
    }
});
// Report lesson-specific issue
const ReportLessonIssueSchema = z.object({
    lessonId: z.string(),
    courseId: z.string(),
    issueType: z.enum(['technical', 'content', 'video', 'audio', 'other']),
    subject: z.string().min(3).max(200),
    description: z.string().min(10).max(2000),
    browser: z.string().optional(),
    platform: z.string().optional(),
    url: z.string().optional(),
});
exports.reportLessonIssue = (0, https_1.onCall)(async (request) => {
    if (!request.auth) {
        throw new Error('Authentication required');
    }
    const validatedData = ReportLessonIssueSchema.parse(request.data);
    try {
        // Get user info
        const userDoc = await admin_1.firestore.collection('users').doc(request.auth.uid).get();
        const userData = userDoc.data();
        // Get lesson and course info for context
        const lessonDoc = await admin_1.firestore
            .collection('courses')
            .doc(validatedData.courseId)
            .collection('lessons')
            .doc(validatedData.lessonId)
            .get();
        const courseDoc = await admin_1.firestore
            .collection('courses')
            .doc(validatedData.courseId)
            .get();
        const lessonTitle = lessonDoc.exists ? lessonDoc.data()?.title : 'Unknown Lesson';
        const courseTitle = courseDoc.exists ? courseDoc.data()?.title : 'Unknown Course';
        // Priority mapping based on issue type
        const priorityMap = {
            'technical': 'high',
            'video': 'high',
            'audio': 'medium',
            'content': 'medium',
            'other': 'low'
        };
        const ticketData = {
            userId: request.auth.uid,
            userEmail: request.auth?.token?.email || '',
            userName: `${userData?.firstName || ''} ${userData?.lastName || ''}`.trim() || 'Unknown User',
            // Issue context
            lessonId: validatedData.lessonId,
            courseId: validatedData.courseId,
            lessonTitle,
            courseTitle,
            issueType: validatedData.issueType,
            // Issue details
            subject: validatedData.subject,
            description: validatedData.description,
            priority: priorityMap[validatedData.issueType] || 'low',
            status: 'open',
            // Technical metadata
            browser: validatedData.browser,
            platform: validatedData.platform,
            url: validatedData.url,
            // Timestamps
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        const ticketRef = await admin_1.firestore.collection('supportTickets').add(ticketData);
        // Create audit log entry
        await (0, auditLog_1.createAuditLogEntry)(request.auth.uid, request.auth?.token?.email || '', ticketData.userName, 'REPORT_LESSON_ISSUE', 'SupportTicket', ticketRef.id, {
            lessonTitle,
            courseTitle,
            issueType: validatedData.issueType,
            subject: validatedData.subject,
        }, ticketData.priority === 'high' ? 'HIGH' : 'MEDIUM');
        console.log(`[Support] Lesson issue reported: ${ticketRef.id} by ${ticketData.userName}`, {
            lessonId: validatedData.lessonId,
            courseId: validatedData.courseId,
            issueType: validatedData.issueType
        });
        return {
            success: true,
            ticketId: ticketRef.id,
            message: 'Probléma sikeresen jelentve. Hamarosan válaszolunk!',
            data: {
                ticketId: ticketRef.id,
                status: 'open',
                priority: ticketData.priority
            }
        };
    }
    catch (error) {
        console.error('[reportLessonIssue] Error:', error);
        if (error instanceof z.ZodError) {
            return {
                success: false,
                error: 'Validációs hiba',
                details: error.errors
            };
        }
        throw error;
    }
});
//# sourceMappingURL=support.js.map