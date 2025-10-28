// Simple unit test that directly tests email service methods
const mockSgMailSend = jest.fn();
const mockSgMailSetApiKey = jest.fn();
const mockFirestoreAdd = jest.fn();

// Mock modules before any imports
jest.mock('@sendgrid/mail', () => ({
  setApiKey: mockSgMailSetApiKey,
  send: mockSgMailSend
}));

jest.mock('firebase-functions', () => ({
  config: jest.fn(() => ({
    sendgrid: {
      key: 'test-key',
      from: 'test@elira.com',
      replyto: 'support@elira.com'
    }
  }))
}));

jest.mock('firebase-admin', () => ({
  initializeApp: jest.fn(),
  firestore: jest.fn(() => ({
    collection: jest.fn(() => ({
      add: mockFirestoreAdd
    }))
  })),
  FieldValue: {
    serverTimestamp: jest.fn(() => new Date())
  },
  apps: []
}));

// Now safe to import the service
import { EmailService } from '../functions/src/services/emailService';

describe('Email Service Unit Tests', () => {
  let emailService: EmailService;

  beforeEach(() => {
    jest.clearAllMocks();
    emailService = new EmailService();
    
    // Setup default successful responses
    mockSgMailSend.mockResolvedValue([{ statusCode: 202 }, {}]);
    mockFirestoreAdd.mockResolvedValue({ id: 'log-id' });
    
    // Mock console methods
    console.log = jest.fn();
    console.error = jest.fn();
  });

  describe('Core Email Functionality', () => {
    test('should initialize with correct configuration', () => {
      expect(mockSgMailSetApiKey).toHaveBeenCalledWith('test-key');
    });

    test('should send basic email successfully', async () => {
      const template = {
        to: 'test@example.com',
        subject: 'Test Email',
        html: '<p>Test content</p>'
      };

      await emailService.sendEmail(template);

      expect(mockSgMailSend).toHaveBeenCalledWith({
        to: 'test@example.com',
        from: 'test@elira.com',
        subject: 'Test Email',
        text: 'Test content',
        html: '<p>Test content</p>',
        templateId: undefined,
        dynamicTemplateData: undefined,
        attachments: undefined,
        cc: undefined,
        bcc: undefined,
        replyTo: 'support@elira.com'
      });
    });

    test('should log successful emails', async () => {
      await emailService.sendEmail({
        to: 'test@example.com',
        subject: 'Test',
        html: '<p>Test</p>'
      });

      expect(mockFirestoreAdd).toHaveBeenCalledWith({
        to: ['test@example.com'],
        subject: 'Test',
        templateId: undefined,
        sentAt: expect.any(Date),
        status: 'sent'
      });

      expect(console.log).toHaveBeenCalledWith(
        '✅ Email sent successfully to:',
        'test@example.com'
      );
    });

    test('should handle email send failures', async () => {
      const error = new Error('SendGrid error');
      mockSgMailSend.mockRejectedValueOnce(error);

      await expect(emailService.sendEmail({
        to: 'test@example.com',
        subject: 'Test',
        html: '<p>Test</p>'
      })).rejects.toThrow('SendGrid error');

      expect(console.error).toHaveBeenCalledWith('❌ Email send failed:', error);
      
      expect(mockFirestoreAdd).toHaveBeenCalledWith({
        to: ['test@example.com'],
        subject: 'Test',
        error: 'SendGrid error',
        sentAt: expect.any(Date),
        status: 'failed'
      });
    });
  });

  describe('Welcome Email', () => {
    test('should send welcome email with user name', async () => {
      await emailService.sendWelcomeEmail({
        email: 'newuser@example.com',
        displayName: 'John Doe'
      });

      expect(mockSgMailSend).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'newuser@example.com',
          subject: 'Üdvözöljük az DMA platformon! 🎓',
          html: expect.stringContaining('John Doe')
        })
      );
    });

    test('should handle missing display name', async () => {
      await emailService.sendWelcomeEmail({
        email: 'newuser@example.com'
      });

      expect(mockSgMailSend).toHaveBeenCalledWith(
        expect.objectContaining({
          html: expect.stringContaining('Felhasználó')
        })
      );
    });
  });

  describe('Password Reset Email', () => {
    test('should send password reset with correct link', async () => {
      const resetLink = 'https://elira.com/reset?token=abc123';
      
      await emailService.sendPasswordResetEmail('user@example.com', resetLink);

      expect(mockSgMailSend).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@example.com',
          subject: 'Jelszó visszaállítás - DMA',
          html: expect.stringContaining(resetLink)
        })
      );
    });
  });

  describe('Enrollment Confirmation', () => {
    test('should send enrollment with course details', async () => {
      await emailService.sendEnrollmentConfirmation(
        { email: 'student@example.com', name: 'Student' },
        { title: 'JavaScript Course', instructor: 'Dr. JS', startDate: '2025-02-01' }
      );

      const sentEmail = mockSgMailSend.mock.calls[0][0];
      expect(sentEmail.subject).toBe('Sikeres jelentkezés: JavaScript Course');
      expect(sentEmail.html).toContain('JavaScript Course');
      expect(sentEmail.html).toContain('Dr. JS');
      expect(sentEmail.html).toContain('2025-02-01');
    });

    test('should handle missing start date', async () => {
      await emailService.sendEnrollmentConfirmation(
        { email: 'student@example.com', name: 'Student' },
        { title: 'Course', instructor: 'Instructor' }
      );

      const sentEmail = mockSgMailSend.mock.calls[0][0];
      expect(sentEmail.html).not.toContain('Kezdés:');
    });
  });

  describe('Quiz Completion Email', () => {
    test('should send passing quiz notification', async () => {
      await emailService.sendQuizCompletionEmail(
        { email: 'student@example.com', name: 'Student' },
        { title: 'Quiz', score: 85, passed: true, certificateUrl: 'https://cert.url' }
      );

      const sentEmail = mockSgMailSend.mock.calls[0][0];
      expect(sentEmail.subject).toContain('Sikeres');
      expect(sentEmail.html).toContain('85%');
      expect(sentEmail.html).toContain('🎉 Gratulálunk!');
      expect(sentEmail.html).toContain('https://cert.url');
    });

    test('should send failing quiz notification', async () => {
      await emailService.sendQuizCompletionEmail(
        { email: 'student@example.com', name: 'Student' },
        { title: 'Quiz', score: 45, passed: false }
      );

      const sentEmail = mockSgMailSend.mock.calls[0][0];
      expect(sentEmail.subject).toContain('Próbálja újra');
      expect(sentEmail.html).toContain('45%');
      expect(sentEmail.html).toContain('📚 Próbálja újra!');
      expect(sentEmail.html).not.toContain('Tanúsítvány');
    });
  });

  describe('Payment Receipt', () => {
    test('should send payment receipt with all details', async () => {
      await emailService.sendPaymentReceipt(
        { email: 'customer@example.com', name: 'Customer' },
        {
          amount: 15000,
          currency: 'HUF',
          description: 'Course Purchase',
          invoiceNumber: 'INV-001',
          date: '2025-01-15'
        }
      );

      const sentEmail = mockSgMailSend.mock.calls[0][0];
      expect(sentEmail.subject).toBe('Számla - INV-001');
      expect(sentEmail.html).toContain('15000 HUF');
      expect(sentEmail.html).toContain('Course Purchase');
      expect(sentEmail.html).toContain('INV-001');
      expect(sentEmail.html).toContain('2025-01-15');
    });
  });

  describe('Certificate Email', () => {
    test('should send certificate with download link', async () => {
      await emailService.sendCertificateEmail(
        { email: 'graduate@example.com', name: 'Graduate' },
        {
          title: 'Advanced Course',
          completionDate: '2025-01-20',
          certificateUrl: 'https://elira.com/cert/123'
        }
      );

      const sentEmail = mockSgMailSend.mock.calls[0][0];
      expect(sentEmail.subject).toBe('🎓 Tanúsítvány - Advanced Course');
      expect(sentEmail.html).toContain('Advanced Course');
      expect(sentEmail.html).toContain('2025-01-20');
      expect(sentEmail.html).toContain('https://elira.com/cert/123');
    });
  });

  describe('HTML Text Conversion', () => {
    test('should strip HTML tags for text version', async () => {
      const service = new EmailService();
      const stripHtml = (service as any).stripHtml;

      const html = '<p>Hello <strong>world</strong>!</p>';
      const text = stripHtml(html);

      expect(text).toBe('Hello world!');
      expect(text).not.toContain('<');
      expect(text).not.toContain('>');
    });
  });

  describe('Multiple Recipients', () => {
    test('should handle array of recipients', async () => {
      const recipients = ['user1@test.com', 'user2@test.com'];

      await emailService.sendEmail({
        to: recipients,
        subject: 'Bulk Email',
        html: '<p>Message for all</p>'
      });

      expect(mockSgMailSend).toHaveBeenCalledWith(
        expect.objectContaining({
          to: recipients
        })
      );

      expect(mockFirestoreAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          to: recipients
        })
      );
    });
  });
});