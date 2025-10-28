import { onCall } from 'firebase-functions/v2/https';
import { firestore } from './admin';
import * as z from 'zod';
import { createAuditLogEntry } from './auditLog';

// Create support ticket
const CreateTicketSchema = z.object({
  subject: z.string(),
  message: z.string(),
  category: z.string(),
});

export const createSupportTicket = onCall(async (request) => {
  if (!request.auth) {
    throw new Error('Authentication required');
  }

  const validatedData = CreateTicketSchema.parse(request.data);
  
  try {
    // Get user info
    const userDoc = await firestore.collection('users').doc(request.auth.uid).get();
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

    const ticketRef = await firestore.collection('supportTickets').add(ticketData);
    
    // Create audit log entry
    await createAuditLogEntry(
      request.auth.uid,
      request.auth?.token?.email || '',
      ticketData.userName,
      'CREATE_TICKET',
      'SupportTicket',
      ticketRef.id,
      {
        subject: validatedData.subject,
        category: validatedData.category,
      },
      'LOW'
    );

    console.log(`[Support] Ticket created: ${ticketRef.id} by ${ticketData.userName}`);
    
    return { 
      success: true, 
      ticketId: ticketRef.id,
      message: 'Support ticket created successfully' 
    };
  } catch (error) {
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

export const respondToSupportTicket = onCall(async (request) => {
  if (!request.auth) {
    throw new Error('Authentication required');
  }

  const validatedData = RespondToTicketSchema.parse(request.data);
  
  try {
    // Get admin info
    const userDoc = await firestore.collection('users').doc(request.auth.uid).get();
    const userData = userDoc.data();
    
    if (userData?.role !== 'ADMIN') {
      throw new Error('Admin access required');
    }
    
    const adminName = `${userData?.firstName || ''} ${userData?.lastName || ''}`.trim() || 'Admin Team';
    
    // Get ticket
    const ticketDoc = await firestore.collection('supportTickets').doc(validatedData.ticketId).get();
    
    if (!ticketDoc.exists) {
      throw new Error('Ticket not found');
    }
    
    const ticketData = ticketDoc.data();
    
    // Update ticket with response
    const updateData: any = {
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
    
    await firestore.collection('supportTickets').doc(validatedData.ticketId).update(updateData);
    
    // Create audit log entry
    await createAuditLogEntry(
      request.auth.uid,
      request.auth?.token?.email || '',
      adminName,
      validatedData.closeTicket ? 'CLOSE_TICKET' : 'RESPOND_TICKET',
      'SupportTicket',
      validatedData.ticketId,
      {
        ticketSubject: ticketData?.subject,
        responsePreview: validatedData.message.substring(0, 100),
      },
      'MEDIUM'
    );
    
    console.log(`[Support] Admin ${adminName} responded to ticket ${validatedData.ticketId}`);
    
    return { 
      success: true,
      message: validatedData.closeTicket ? 'Ticket closed successfully' : 'Response sent successfully' 
    };
  } catch (error) {
    console.error('[respondToSupportTicket] Error:', error);
    throw error;
  }
});