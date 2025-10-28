// Mock dependencies first, before importing
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

// Now import after mocking
import { emailService } from '../functions/src/services/emailService';
import * as admin from 'firebase-admin';
import * as sgMail from '@sendgrid/mail';

describe('Email Service Tests', () => {
  const testEmail = 'test@elira.com';
  
  beforeAll(() => {
    // Initialize admin SDK for testing
    if (!admin.apps.length) {
      admin.initializeApp();
    }
  });

  beforeEach(() => {
    jest.clearAllMocks();
    console.log = jest.fn(); // Mock console.log
    console.error = jest.fn(); // Mock console.error
  });

  describe('Welcome Email', () => {
    test('should send welcome email successfully', async () => {
      const mockSend = sgMail.send as jest.MockedFunction<typeof sgMail.send>;
      mockSend.mockResolvedValueOnce([{} as any, {}]);

      await emailService.sendWelcomeEmail({
        email: testEmail,
        displayName: 'Test User'
      });

      expect(mockSend).toHaveBeenCalledWith({
        to: testEmail,
        from: 'test@elira.com',
        subject: 'Üdvözöljük az DMA platformon! 🎓',
        text: expect.any(String),
        html: expect.stringContaining('Test User'),
        templateId: undefined,
        dynamicTemplateData: undefined,
        attachments: undefined,
        cc: undefined,
        bcc: undefined,
        replyTo: 'support@elira.com'
      });
    });

    test('should handle missing display name', async () => {
      const mockSend = sgMail.send as jest.MockedFunction<typeof sgMail.send>;
      mockSend.mockResolvedValueOnce([{} as any, {}]);

      await emailService.sendWelcomeEmail({
        email: testEmail
      });

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          html: expect.stringContaining('Felhasználó')
        })
      );
    });

    test('should log email sent successfully', async () => {
      const mockSend = sgMail.send as jest.MockedFunction<typeof sgMail.send>;
      mockSend.mockResolvedValueOnce([{} as any, {}]);

      await emailService.sendWelcomeEmail({
        email: testEmail,
        displayName: 'Test User'
      });

      expect(console.log).toHaveBeenCalledWith('✅ Email sent successfully to:', testEmail);
    });
  });

  describe('Password Reset Email', () => {
    test('should send password reset email successfully', async () => {
      const mockSend = sgMail.send as jest.MockedFunction<typeof sgMail.send>;
      mockSend.mockResolvedValueOnce([{} as any, {}]);

      const resetLink = 'https://elira.com/reset?token=test123';

      await emailService.sendPasswordResetEmail(testEmail, resetLink);

      expect(mockSend).toHaveBeenCalledWith({
        to: testEmail,
        from: 'test@elira.com',
        subject: 'Jelszó visszaállítás - DMA',
        text: expect.any(String),
        html: expect.stringContaining(resetLink),
        templateId: undefined,
        dynamicTemplateData: undefined,
        attachments: undefined,
        cc: undefined,
        bcc: undefined,
        replyTo: 'support@elira.com'
      });
    });

    test('should include security warnings in Hungarian', async () => {
      const mockSend = sgMail.send as jest.MockedFunction<typeof sgMail.send>;
      mockSend.mockResolvedValueOnce([{} as any, {}]);

      await emailService.sendPasswordResetEmail(testEmail, 'https://elira.com/reset?token=test123');

      const sentEmail = mockSend.mock.calls[0][0];
      expect(sentEmail.html).toContain('60 percig érvényes');
      expect(sentEmail.html).toContain('Egy alkalommal használható');
      expect(sentEmail.html).toContain('Ha nem Ön kérte');
    });
  });

  describe('Enrollment Confirmation Email', () => {
    test('should send enrollment confirmation successfully', async () => {
      const mockSend = sgMail.send as jest.MockedFunction<typeof sgMail.send>;
      mockSend.mockResolvedValueOnce([{} as any, {}]);

      await emailService.sendEnrollmentConfirmation(
        { email: testEmail, name: 'Test User' },
        { 
          title: 'Test Course',
          instructor: 'Dr. Test',
          startDate: '2025-02-01'
        }
      );

      expect(mockSend).toHaveBeenCalledWith({
        to: testEmail,
        from: 'test@elira.com',
        subject: 'Sikeres jelentkezés: Test Course',
        text: expect.any(String),
        html: expect.stringContaining('Test Course'),
        templateId: undefined,
        dynamicTemplateData: undefined,
        attachments: undefined,
        cc: undefined,
        bcc: undefined,
        replyTo: 'support@elira.com'
      });
    });

    test('should handle optional start date', async () => {
      const mockSend = sgMail.send as jest.MockedFunction<typeof sgMail.send>;
      mockSend.mockResolvedValueOnce([{} as any, {}]);

      await emailService.sendEnrollmentConfirmation(
        { email: testEmail, name: 'Test User' },
        { 
          title: 'Test Course',
          instructor: 'Dr. Test'
        }
      );

      const sentEmail = mockSend.mock.calls[0][0];
      expect(sentEmail.html).toContain('Dr. Test');
      expect(sentEmail.html).not.toContain('Kezdés:');
    });

    test('should include course information and learning tips', async () => {
      const mockSend = sgMail.send as jest.MockedFunction<typeof sgMail.send>;
      mockSend.mockResolvedValueOnce([{} as any, {}]);

      await emailService.sendEnrollmentConfirmation(
        { email: testEmail, name: 'Test User' },
        { 
          title: 'Advanced JavaScript',
          instructor: 'Dr. JavaScript',
          startDate: '2025-02-01'
        }
      );

      const sentEmail = mockSend.mock.calls[0][0];
      expect(sentEmail.html).toContain('Advanced JavaScript');
      expect(sentEmail.html).toContain('Dr. JavaScript');
      expect(sentEmail.html).toContain('Állítson be rendszeres tanulási időt');
      expect(sentEmail.html).toContain('Készítsen jegyzeteket');
    });
  });

  describe('Quiz Completion Email', () => {
    test('should send successful quiz completion email', async () => {
      const mockSend = sgMail.send as jest.MockedFunction<typeof sgMail.send>;
      mockSend.mockResolvedValueOnce([{} as any, {}]);

      await emailService.sendQuizCompletionEmail(
        { email: testEmail, name: 'Test User' },
        {
          title: 'JavaScript Fundamentals Quiz',
          score: 85,
          passed: true,
          certificateUrl: 'https://elira.com/cert/123'
        }
      );

      expect(mockSend).toHaveBeenCalledWith({
        to: testEmail,
        from: 'test@elira.com',
        subject: 'Kvíz eredmény: JavaScript Fundamentals Quiz - Sikeres',
        text: expect.any(String),
        html: expect.stringContaining('85%'),
        templateId: undefined,
        dynamicTemplateData: undefined,
        attachments: undefined,
        cc: undefined,
        bcc: undefined,
        replyTo: 'support@elira.com'
      });
    });

    test('should send failed quiz completion email', async () => {
      const mockSend = sgMail.send as jest.MockedFunction<typeof sgMail.send>;
      mockSend.mockResolvedValueOnce([{} as any, {}]);

      await emailService.sendQuizCompletionEmail(
        { email: testEmail, name: 'Test User' },
        {
          title: 'Advanced Algorithms Quiz',
          score: 45,
          passed: false
        }
      );

      const sentEmail = mockSend.mock.calls[0][0];
      expect(sentEmail.subject).toBe('Kvíz eredmény: Advanced Algorithms Quiz - Próbálja újra');
      expect(sentEmail.html).toContain('45%');
      expect(sentEmail.html).toContain('A sikeres teljesítéshez 70% szükséges');
      expect(sentEmail.html).toContain('Tekintse át újra a tananyagot');
    });

    test('should include certificate link for passing grades', async () => {
      const mockSend = sgMail.send as jest.MockedFunction<typeof sgMail.send>;
      mockSend.mockResolvedValueOnce([{} as any, {}]);

      const certificateUrl = 'https://elira.com/certificates/abc123';

      await emailService.sendQuizCompletionEmail(
        { email: testEmail, name: 'Test User' },
        {
          title: 'Final Assessment',
          score: 92,
          passed: true,
          certificateUrl
        }
      );

      const sentEmail = mockSend.mock.calls[0][0];
      expect(sentEmail.html).toContain(certificateUrl);
      expect(sentEmail.html).toContain('Tanúsítvány letöltése');
    });

    test('should not include certificate for failing grades', async () => {
      const mockSend = sgMail.send as jest.MockedFunction<typeof sgMail.send>;
      mockSend.mockResolvedValueOnce([{} as any, {}]);

      await emailService.sendQuizCompletionEmail(
        { email: testEmail, name: 'Test User' },
        {
          title: 'Midterm Exam',
          score: 55,
          passed: false
        }
      );

      const sentEmail = mockSend.mock.calls[0][0];
      expect(sentEmail.html).not.toContain('Tanúsítvány');
      expect(sentEmail.html).toContain('Kvíz újrapróbálása');
    });
  });

  describe('Payment Receipt Email', () => {
    test('should send payment receipt successfully', async () => {
      const mockSend = sgMail.send as jest.MockedFunction<typeof sgMail.send>;
      mockSend.mockResolvedValueOnce([{} as any, {}]);

      await emailService.sendPaymentReceipt(
        { email: testEmail, name: 'Test User' },
        {
          amount: 9999,
          currency: 'HUF',
          description: 'JavaScript Masterclass Course',
          invoiceNumber: 'INV-2025-001',
          date: '2025-01-15'
        }
      );

      expect(mockSend).toHaveBeenCalledWith({
        to: testEmail,
        from: 'test@elira.com',
        subject: 'Számla - INV-2025-001',
        text: expect.any(String),
        html: expect.stringContaining('9999 HUF'),
        templateId: undefined,
        dynamicTemplateData: undefined,
        attachments: undefined,
        cc: undefined,
        bcc: undefined,
        replyTo: 'support@elira.com'
      });
    });

    test('should include proper invoice formatting', async () => {
      const mockSend = sgMail.send as jest.MockedFunction<typeof sgMail.send>;
      mockSend.mockResolvedValueOnce([{} as any, {}]);

      await emailService.sendPaymentReceipt(
        { email: testEmail, name: 'Test User' },
        {
          amount: 15000,
          currency: 'HUF',
          description: 'Full Stack Development Bundle',
          invoiceNumber: 'INV-2025-002',
          date: '2025-01-16'
        }
      );

      const sentEmail = mockSend.mock.calls[0][0];
      expect(sentEmail.html).toContain('INV-2025-002');
      expect(sentEmail.html).toContain('2025-01-16');
      expect(sentEmail.html).toContain('Full Stack Development Bundle');
      expect(sentEmail.html).toContain('Végösszeg: 15000 HUF');
      expect(sentEmail.html).toContain('DMA Kft.');
    });
  });

  describe('Certificate Email', () => {
    test('should send certificate email successfully', async () => {
      const mockSend = sgMail.send as jest.MockedFunction<typeof sgMail.send>;
      mockSend.mockResolvedValueOnce([{} as any, {}]);

      await emailService.sendCertificateEmail(
        { email: testEmail, name: 'Test User' },
        { 
          title: 'React Development Masterclass',
          completionDate: '2025-01-15',
          certificateUrl: 'https://elira.com/certificates/react-123'
        }
      );

      expect(mockSend).toHaveBeenCalledWith({
        to: testEmail,
        from: 'test@elira.com',
        subject: '🎓 Tanúsítvány - React Development Masterclass',
        text: expect.any(String),
        html: expect.stringContaining('React Development Masterclass'),
        templateId: undefined,
        dynamicTemplateData: undefined,
        attachments: undefined,
        cc: undefined,
        bcc: undefined,
        replyTo: 'support@elira.com'
      });
    });

    test('should include achievement highlights and next steps', async () => {
      const mockSend = sgMail.send as jest.MockedFunction<typeof sgMail.send>;
      mockSend.mockResolvedValueOnce([{} as any, {}]);

      await emailService.sendCertificateEmail(
        { email: testEmail, name: 'Test User' },
        { 
          title: 'Advanced Node.js',
          completionDate: '2025-01-20',
          certificateUrl: 'https://elira.com/certificates/node-456'
        }
      );

      const sentEmail = mockSend.mock.calls[0][0];
      expect(sentEmail.html).toContain('Összes lecke teljesítve');
      expect(sentEmail.html).toContain('Összes kvíz sikeresen teljesítve');
      expect(sentEmail.html).toContain('Csatolhatja önéletrajzához');
      expect(sentEmail.html).toContain('Feltöltheti LinkedIn profiljára');
      expect(sentEmail.html).toContain('További kurzusok böngészése');
    });
  });

  describe('Error Handling', () => {
    test('should handle SendGrid API errors', async () => {
      const mockSend = sgMail.send as jest.MockedFunction<typeof sgMail.send>;
      const sendGridError = new Error('SendGrid API error');
      mockSend.mockRejectedValueOnce(sendGridError);

      await expect(emailService.sendWelcomeEmail({
        email: testEmail,
        displayName: 'Test User'
      })).rejects.toThrow('SendGrid API error');

      expect(console.error).toHaveBeenCalledWith('❌ Email send failed:', sendGridError);
    });

    test('should log failed emails to Firestore', async () => {
      const mockSend = sgMail.send as jest.MockedFunction<typeof sgMail.send>;
      const mockAdd = jest.fn().mockResolvedValue({ id: 'error-log-id' });
      
      (admin.firestore as jest.Mock).mockReturnValue({
        collection: jest.fn(() => ({ add: mockAdd }))
      });

      const sendGridError = new Error('Network timeout');
      mockSend.mockRejectedValueOnce(sendGridError);

      try {
        await emailService.sendWelcomeEmail({
          email: testEmail,
          displayName: 'Test User'
        });
      } catch (error) {
        // Expected to throw
      }

      expect(mockAdd).toHaveBeenCalledWith({
        to: [testEmail],
        subject: 'Üdvözöljük az DMA platformon! 🎓',
        error: 'Network timeout',
        sentAt: expect.any(Date),
        status: 'failed'
      });
    });

    test('should log successful emails to Firestore', async () => {
      const mockSend = sgMail.send as jest.MockedFunction<typeof sgMail.send>;
      const mockAdd = jest.fn().mockResolvedValue({ id: 'success-log-id' });
      
      (admin.firestore as jest.Mock).mockReturnValue({
        collection: jest.fn(() => ({ add: mockAdd }))
      });

      mockSend.mockResolvedValueOnce([{} as any, {}]);

      await emailService.sendWelcomeEmail({
        email: testEmail,
        displayName: 'Test User'
      });

      expect(mockAdd).toHaveBeenCalledWith({
        to: [testEmail],
        subject: 'Üdvözöljük az DMA platformon! 🎓',
        templateId: undefined,
        sentAt: expect.any(Date),
        status: 'sent'
      });
    });
  });

  describe('HTML Content Validation', () => {
    test('should contain required HTML structure', async () => {
      const mockSend = sgMail.send as jest.MockedFunction<typeof sgMail.send>;
      mockSend.mockResolvedValueOnce([{} as any, {}]);

      await emailService.sendWelcomeEmail({
        email: testEmail,
        displayName: 'Test User'
      });

      const sentEmail = mockSend.mock.calls[0][0];
      
      // Check HTML structure
      expect(sentEmail.html).toContain('<!DOCTYPE html>');
      expect(sentEmail.html).toContain('<html>');
      expect(sentEmail.html).toContain('<head>');
      expect(sentEmail.html).toContain('<meta charset="utf-8">');
      expect(sentEmail.html).toContain('<body>');
      
      // Check styling
      expect(sentEmail.html).toContain('font-family: Arial, sans-serif');
      expect(sentEmail.html).toContain('max-width: 600px');
      
      // Check content structure
      expect(sentEmail.html).toContain('class="container"');
      expect(sentEmail.html).toContain('class="header"');
      expect(sentEmail.html).toContain('class="content"');
      expect(sentEmail.html).toContain('class="footer"');
    });

    test('should properly strip HTML tags for text version', async () => {
      const mockSend = sgMail.send as jest.MockedFunction<typeof sgMail.send>;
      mockSend.mockResolvedValueOnce([{} as any, {}]);

      await emailService.sendWelcomeEmail({
        email: testEmail,
        displayName: 'Test User'
      });

      const sentEmail = mockSend.mock.calls[0][0];
      
      // Text version should not contain HTML tags
      expect(sentEmail.text).not.toContain('<');
      expect(sentEmail.text).not.toContain('>');
      expect(sentEmail.text).toContain('Üdvözöljük az DMA-n!');
      expect(sentEmail.text).toContain('Test User');
    });
  });

  describe('Multiple Recipients', () => {
    test('should handle array of email addresses', async () => {
      const mockSend = sgMail.send as jest.MockedFunction<typeof sgMail.send>;
      mockSend.mockResolvedValueOnce([{} as any, {}]);

      const recipients = ['user1@test.com', 'user2@test.com'];

      await emailService.sendEmail({
        to: recipients,
        subject: 'Test Multiple Recipients',
        html: '<p>Test email content</p>'
      });

      expect(mockSend).toHaveBeenCalledWith({
        to: recipients,
        from: 'test@elira.com',
        subject: 'Test Multiple Recipients',
        text: 'Test email content',
        html: '<p>Test email content</p>',
        templateId: undefined,
        dynamicTemplateData: undefined,
        attachments: undefined,
        cc: undefined,
        bcc: undefined,
        replyTo: 'support@elira.com'
      });
    });
  });

  describe('Template Features', () => {
    test('should support custom template options', async () => {
      const mockSend = sgMail.send as jest.MockedFunction<typeof sgMail.send>;
      mockSend.mockResolvedValueOnce([{} as any, {}]);

      await emailService.sendEmail({
        to: testEmail,
        subject: 'Custom Template Test',
        html: '<p>Test content</p>',
        templateId: 'd-123456789',
        dynamicTemplateData: { name: 'Test User', course: 'React' },
        cc: ['cc@test.com'],
        bcc: ['bcc@test.com'],
        replyTo: 'custom-reply@test.com',
        attachments: [{ filename: 'test.pdf', content: 'base64content' }]
      });

      expect(mockSend).toHaveBeenCalledWith({
        to: testEmail,
        from: 'test@elira.com',
        subject: 'Custom Template Test',
        text: 'Test content',
        html: '<p>Test content</p>',
        templateId: 'd-123456789',
        dynamicTemplateData: { name: 'Test User', course: 'React' },
        attachments: [{ filename: 'test.pdf', content: 'base64content' }],
        cc: ['cc@test.com'],
        bcc: ['bcc@test.com'],
        replyTo: 'custom-reply@test.com'
      });
    });
  });

  describe('Environment Configuration', () => {
    test('should use environment variables when functions config is not available', async () => {
      // Temporarily override the config mock
      const originalConfig = require('firebase-functions').config;
      require('firebase-functions').config = jest.fn(() => ({}));
      
      process.env.SENDGRID_API_KEY = 'env-sendgrid-key';
      
      // Need to re-import the service to pick up new config
      jest.resetModules();
      const { EmailService } = require('../functions/src/services/emailService');
      const testEmailService = new EmailService();

      const mockSend = sgMail.send as jest.MockedFunction<typeof sgMail.send>;
      mockSend.mockResolvedValueOnce([{} as any, {}]);

      await testEmailService.sendEmail({
        to: testEmail,
        subject: 'Environment Test',
        html: '<p>Test</p>'
      });

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          from: 'noreply@elira.com', // Default fallback
          replyTo: 'support@elira.com' // Default fallback
        })
      );

      // Restore original config
      require('firebase-functions').config = originalConfig;
      delete process.env.SENDGRID_API_KEY;
    });
  });
});