// Mock dependencies first
jest.mock('firebase-admin', () => ({
  initializeApp: jest.fn(),
  firestore: jest.fn(() => ({
    collection: jest.fn(() => ({
      add: jest.fn(() => Promise.resolve({ id: 'mock-doc-id' }))
    }))
  })),
  FieldValue: {
    serverTimestamp: jest.fn(() => new Date())
  },
  apps: []
}));

jest.mock('@sendgrid/mail', () => ({
  setApiKey: jest.fn(),
  send: jest.fn()
}));

jest.mock('firebase-functions', () => ({
  config: jest.fn(() => ({
    sendgrid: {
      key: 'test-sendgrid-key',
      from: 'test@elira.com',
      replyto: 'support@elira.com'
    }
  }))
}));

// Import after mocking
import { emailService } from '../functions/src/services/emailService';
import * as admin from 'firebase-admin';
import * as sgMail from '@sendgrid/mail';

describe('Email Integration Tests', () => {
  const mockSend = sgMail.send as jest.MockedFunction<typeof sgMail.send>;
  const mockFirestoreAdd = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup Firestore mock
    (admin.firestore as jest.Mock).mockReturnValue({
      collection: jest.fn(() => ({
        add: mockFirestoreAdd
      }))
    });

    // Setup successful SendGrid response
    mockSend.mockResolvedValue([{
      statusCode: 202,
      body: {},
      headers: {}
    }, {}]);

    mockFirestoreAdd.mockResolvedValue({ id: 'mock-log-id' });
    
    console.log = jest.fn();
    console.error = jest.fn();
  });

  describe('End-to-End Email Flow', () => {
    test('complete user registration flow', async () => {
      const user = {
        email: 'newuser@elira.com',
        displayName: 'New User'
      };

      // Send welcome email
      await emailService.sendWelcomeEmail(user);

      // Verify SendGrid was called correctly
      expect(mockSend).toHaveBeenCalledWith({
        to: user.email,
        from: 'test@elira.com',
        subject: 'Üdvözöljük az DMA platformon! 🎓',
        text: expect.any(String),
        html: expect.stringContaining(user.displayName),
        templateId: undefined,
        dynamicTemplateData: undefined,
        attachments: undefined,
        cc: undefined,
        bcc: undefined,
        replyTo: 'support@elira.com'
      });

      // Verify logging to Firestore
      expect(mockFirestoreAdd).toHaveBeenCalledWith({
        to: [user.email],
        subject: 'Üdvözöljük az DMA platformon! 🎓',
        templateId: undefined,
        sentAt: expect.any(Date),
        status: 'sent'
      });

      // Verify success logging
      expect(console.log).toHaveBeenCalledWith(
        '✅ Email sent successfully to:',
        user.email
      );
    });

    test('complete course enrollment flow', async () => {
      const user = { email: 'student@elira.com', name: 'Student User' };
      const course = {
        title: 'Full Stack JavaScript',
        instructor: 'Dr. JavaScript',
        startDate: '2025-02-15'
      };

      // Send enrollment confirmation
      await emailService.sendEnrollmentConfirmation(user, course);

      // Verify email content includes all course details
      const sentEmail = mockSend.mock.calls[0][0];
      expect(sentEmail.html).toContain(course.title);
      expect(sentEmail.html).toContain(course.instructor);
      expect(sentEmail.html).toContain(course.startDate);
      expect(sentEmail.html).toContain('Sikeres jelentkezés');

      // Verify proper subject line
      expect(sentEmail.subject).toBe(`Sikeres jelentkezés: ${course.title}`);
    });

    test('complete quiz completion and certificate flow', async () => {
      const user = { email: 'student@elira.com', name: 'Successful Student' };
      const quiz = {
        title: 'JavaScript Fundamentals Final',
        score: 92,
        passed: true,
        certificateUrl: 'https://elira.com/certificates/js-fund-123'
      };

      // Send quiz completion with certificate
      await emailService.sendQuizCompletionEmail(user, quiz);

      const sentEmail = mockSend.mock.calls[0][0];
      
      // Should indicate success
      expect(sentEmail.subject).toContain('Sikeres');
      expect(sentEmail.html).toContain('🎉 Gratulálunk!');
      expect(sentEmail.html).toContain('92%');
      expect(sentEmail.html).toContain(quiz.certificateUrl);
      expect(sentEmail.html).toContain('Tanúsítvány letöltése');
    });

    test('complete payment and receipt flow', async () => {
      const user = { email: 'customer@elira.com', name: 'Paying Customer' };
      const payment = {
        amount: 25000,
        currency: 'HUF',
        description: 'Premium Course Bundle',
        invoiceNumber: 'INV-2025-0123',
        date: '2025-01-20'
      };

      // Send payment receipt
      await emailService.sendPaymentReceipt(user, payment);

      const sentEmail = mockSend.mock.calls[0][0];
      
      // Verify invoice details
      expect(sentEmail.subject).toBe(`Számla - ${payment.invoiceNumber}`);
      expect(sentEmail.html).toContain(payment.invoiceNumber);
      expect(sentEmail.html).toContain('25000 HUF');
      expect(sentEmail.html).toContain(payment.description);
      expect(sentEmail.html).toContain('2025-01-20');
      expect(sentEmail.html).toContain('DMA Kft.');
    });
  });

  describe('Error Recovery and Resilience', () => {
    test('should handle SendGrid rate limiting gracefully', async () => {
      // Simulate rate limiting error
      const rateLimitError = new Error('Rate limit exceeded') as any;
      rateLimitError.code = 429;
      rateLimitError.response = {
        status: 429,
        body: { errors: [{ message: 'Rate limit exceeded' }] }
      };

      mockSend.mockRejectedValueOnce(rateLimitError);

      await expect(emailService.sendWelcomeEmail({
        email: 'test@example.com',
        displayName: 'Test User'
      })).rejects.toThrow('Rate limit exceeded');

      // Should log the error
      expect(console.error).toHaveBeenCalledWith(
        '❌ Email send failed:',
        rateLimitError
      );

      // Should log failure to Firestore
      expect(mockFirestoreAdd).toHaveBeenCalledWith({
        to: ['test@example.com'],
        subject: 'Üdvözöljük az DMA platformon! 🎓',
        error: 'Rate limit exceeded',
        sentAt: expect.any(Date),
        status: 'failed'
      });
    });

    test('should handle invalid email addresses', async () => {
      const invalidEmailError = new Error('Invalid email') as any;
      invalidEmailError.code = 400;
      invalidEmailError.response = {
        status: 400,
        body: { errors: [{ message: 'Invalid email address' }] }
      };

      mockSend.mockRejectedValueOnce(invalidEmailError);

      await expect(emailService.sendPasswordResetEmail(
        'invalid-email',
        'https://elira.com/reset?token=123'
      )).rejects.toThrow('Invalid email');

      // Should log the validation error
      expect(mockFirestoreAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Invalid email',
          status: 'failed'
        })
      );
    });

    test('should handle Firestore logging failures', async () => {
      // Make Firestore fail
      mockFirestoreAdd.mockRejectedValueOnce(new Error('Firestore unavailable'));

      // Email should still succeed even if logging fails
      await emailService.sendWelcomeEmail({
        email: 'test@example.com',
        displayName: 'Test User'
      });

      // SendGrid should still be called
      expect(mockSend).toHaveBeenCalled();
      
      // Should log success despite Firestore failure
      expect(console.log).toHaveBeenCalledWith(
        '✅ Email sent successfully to:',
        'test@example.com'
      );
    });
  });

  describe('Bulk Email Operations', () => {
    test('should handle multiple recipients efficiently', async () => {
      const recipients = [
        'user1@elira.com',
        'user2@elira.com',
        'user3@elira.com'
      ];

      await emailService.sendEmail({
        to: recipients,
        subject: 'Course Announcement',
        html: '<p>New course available!</p>'
      });

      // Should send to all recipients in one call
      expect(mockSend).toHaveBeenCalledWith({
        to: recipients,
        from: 'test@elira.com',
        subject: 'Course Announcement',
        text: 'New course available!',
        html: '<p>New course available!</p>',
        templateId: undefined,
        dynamicTemplateData: undefined,
        attachments: undefined,
        cc: undefined,
        bcc: undefined,
        replyTo: 'support@elira.com'
      });

      // Should log with all recipients
      expect(mockFirestoreAdd).toHaveBeenCalledWith({
        to: recipients,
        subject: 'Course Announcement',
        templateId: undefined,
        sentAt: expect.any(Date),
        status: 'sent'
      });
    });

    test('should handle CC and BCC recipients', async () => {
      await emailService.sendEmail({
        to: 'primary@elira.com',
        cc: ['cc1@elira.com', 'cc2@elira.com'],
        bcc: ['bcc@elira.com'],
        subject: 'Important Announcement',
        html: '<p>Please review this announcement.</p>'
      });

      expect(mockSend).toHaveBeenCalledWith({
        to: 'primary@elira.com',
        from: 'test@elira.com',
        subject: 'Important Announcement',
        text: 'Please review this announcement.',
        html: '<p>Please review this announcement.</p>',
        templateId: undefined,
        dynamicTemplateData: undefined,
        attachments: undefined,
        cc: ['cc1@elira.com', 'cc2@elira.com'],
        bcc: ['bcc@elira.com'],
        replyTo: 'support@elira.com'
      });
    });
  });

  describe('Template Customization', () => {
    test('should support dynamic template data', async () => {
      const templateData = {
        user_name: 'John Doe',
        course_name: 'Advanced React',
        completion_percentage: 85,
        next_lesson: 'State Management'
      };

      await emailService.sendEmail({
        to: 'student@elira.com',
        subject: 'Progress Update',
        html: '<p>Custom template</p>',
        templateId: 'd-12345',
        dynamicTemplateData: templateData
      });

      expect(mockSend).toHaveBeenCalledWith({
        to: 'student@elira.com',
        from: 'test@elira.com',
        subject: 'Progress Update',
        text: 'Custom template',
        html: '<p>Custom template</p>',
        templateId: 'd-12345',
        dynamicTemplateData: templateData,
        attachments: undefined,
        cc: undefined,
        bcc: undefined,
        replyTo: 'support@elira.com'
      });
    });

    test('should support email attachments', async () => {
      const attachments = [
        {
          filename: 'certificate.pdf',
          content: 'base64encodedcontent',
          type: 'application/pdf'
        },
        {
          filename: 'course-materials.zip',
          content: 'anotherdocument',
          type: 'application/zip'
        }
      ];

      await emailService.sendEmail({
        to: 'student@elira.com',
        subject: 'Course Materials',
        html: '<p>Your course materials are attached.</p>',
        attachments
      });

      expect(mockSend).toHaveBeenCalledWith({
        to: 'student@elira.com',
        from: 'test@elira.com',
        subject: 'Course Materials',
        text: 'Your course materials are attached.',
        html: '<p>Your course materials are attached.</p>',
        templateId: undefined,
        dynamicTemplateData: undefined,
        attachments,
        cc: undefined,
        bcc: undefined,
        replyTo: 'support@elira.com'
      });
    });

    test('should support custom reply-to addresses', async () => {
      await emailService.sendEmail({
        to: 'student@elira.com',
        subject: 'Instructor Message',
        html: '<p>Message from your instructor</p>',
        replyTo: 'instructor@elira.com'
      });

      expect(mockSend).toHaveBeenCalledWith({
        to: 'student@elira.com',
        from: 'test@elira.com',
        subject: 'Instructor Message',
        text: 'Message from your instructor',
        html: '<p>Message from your instructor</p>',
        templateId: undefined,
        dynamicTemplateData: undefined,
        attachments: undefined,
        cc: undefined,
        bcc: undefined,
        replyTo: 'instructor@elira.com'
      });
    });
  });

  describe('Email Analytics Integration', () => {
    test('should log email metrics for analytics', async () => {
      await emailService.sendWelcomeEmail({
        email: 'analytics@elira.com',
        displayName: 'Analytics User'
      });

      // Should log comprehensive metrics
      expect(mockFirestoreAdd).toHaveBeenCalledWith({
        to: ['analytics@elira.com'],
        subject: 'Üdvözöljük az DMA platformon! 🎓',
        templateId: undefined,
        sentAt: expect.any(Date),
        status: 'sent'
      });

      // Verify timestamp is recent
      const logCall = mockFirestoreAdd.mock.calls[0][0];
      const sentAt = logCall.sentAt;
      expect(sentAt).toBeInstanceOf(Date);
      expect(Date.now() - sentAt.getTime()).toBeLessThan(1000); // Within 1 second
    });

    test('should track different email types for analytics', async () => {
      const emailTypes = [
        () => emailService.sendWelcomeEmail({ email: 'test@elira.com' }),
        () => emailService.sendPasswordResetEmail('test@elira.com', 'https://reset.url'),
        () => emailService.sendEnrollmentConfirmation(
          { email: 'test@elira.com', name: 'Test' },
          { title: 'Course', instructor: 'Instructor' }
        ),
        () => emailService.sendQuizCompletionEmail(
          { email: 'test@elira.com', name: 'Test' },
          { title: 'Quiz', score: 80, passed: true }
        ),
        () => emailService.sendPaymentReceipt(
          { email: 'test@elira.com', name: 'Test' },
          { amount: 1000, currency: 'HUF', description: 'Course', invoiceNumber: 'INV-1', date: '2025-01-01' }
        )
      ];

      for (const emailType of emailTypes) {
        jest.clearAllMocks();
        mockSend.mockResolvedValue([{} as any, {}]);
        mockFirestoreAdd.mockResolvedValue({ id: 'log-id' });

        await emailType();

        // Each should be logged
        expect(mockFirestoreAdd).toHaveBeenCalledTimes(1);
        expect(mockFirestoreAdd).toHaveBeenCalledWith(
          expect.objectContaining({
            status: 'sent',
            sentAt: expect.any(Date)
          })
        );
      }
    });
  });

  describe('Performance and Optimization', () => {
    test('should handle concurrent email sends', async () => {
      const emailPromises = [
        emailService.sendWelcomeEmail({ email: 'user1@elira.com', displayName: 'User 1' }),
        emailService.sendWelcomeEmail({ email: 'user2@elira.com', displayName: 'User 2' }),
        emailService.sendWelcomeEmail({ email: 'user3@elira.com', displayName: 'User 3' })
      ];

      await Promise.all(emailPromises);

      // All emails should be sent
      expect(mockSend).toHaveBeenCalledTimes(3);
      expect(mockFirestoreAdd).toHaveBeenCalledTimes(3);

      // All should succeed
      expect(console.log).toHaveBeenCalledTimes(3);
      expect(console.error).not.toHaveBeenCalled();
    });

    test('should optimize text generation from HTML', async () => {
      const htmlWithComplexStructure = `
        <div>
          <h1>Welcome</h1>
          <p>This is a <strong>test</strong> email with <em>formatting</em>.</p>
          <ul>
            <li>Item 1</li>
            <li>Item 2</li>
          </ul>
          <table>
            <tr><td>Cell 1</td><td>Cell 2</td></tr>
          </table>
        </div>
      `;

      await emailService.sendEmail({
        to: 'test@elira.com',
        subject: 'Complex HTML Test',
        html: htmlWithComplexStructure
      });

      const sentEmail = mockSend.mock.calls[0][0];
      const textVersion = sentEmail.text as string;

      // Should strip HTML tags
      expect(textVersion).not.toContain('<');
      expect(textVersion).not.toContain('>');
      
      // Should preserve essential content
      expect(textVersion).toContain('Welcome');
      expect(textVersion).toContain('test email');
      expect(textVersion).toContain('formatting');
      expect(textVersion).toContain('Item 1');
      expect(textVersion).toContain('Item 2');
    });
  });
});