// Mock dependencies first
jest.mock('firebase-admin');
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
import * as sgMail from '@sendgrid/mail';

describe('Email Template Validation Tests', () => {
  const mockSend = sgMail.send as jest.MockedFunction<typeof sgMail.send>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSend.mockResolvedValue([{} as any, {}]);
    console.log = jest.fn();
    console.error = jest.fn();
  });

  describe('HTML Template Structure Validation', () => {
    test('welcome email should have valid HTML structure', async () => {
      await emailService.sendWelcomeEmail({
        email: 'test@example.com',
        displayName: 'Test User'
      });

      const sentEmail = mockSend.mock.calls[0][0];
      const html = sentEmail.html as string;

      // DOCTYPE and basic HTML structure
      expect(html).toMatch(/<!DOCTYPE html>/i);
      expect(html).toMatch(/<html>/i);
      expect(html).toMatch(/<head>/i);
      expect(html).toMatch(/<body>/i);
      expect(html).toMatch(/<\/html>/i);

      // Meta tags
      expect(html).toContain('<meta charset="utf-8">');

      // Required sections
      expect(html).toContain('class="container"');
      expect(html).toContain('class="header"');
      expect(html).toContain('class="content"');
      expect(html).toContain('class="footer"');
    });

    test('password reset email should have security-focused structure', async () => {
      await emailService.sendPasswordResetEmail(
        'test@example.com',
        'https://elira.com/reset?token=abc123'
      );

      const sentEmail = mockSend.mock.calls[0][0];
      const html = sentEmail.html as string;

      // Security warnings section
      expect(html).toContain('class="warning"');
      expect(html).toContain('⚠️ Fontos:');
      
      // Reset link validation
      expect(html).toContain('https://elira.com/reset?token=abc123');
      expect(html).toContain('60 percig érvényes');
      expect(html).toContain('Egy alkalommal használható');
    });

    test('quiz completion email should adapt based on pass/fail status', async () => {
      // Test passing quiz
      await emailService.sendQuizCompletionEmail(
        { email: 'test@example.com', name: 'Test User' },
        { title: 'Test Quiz', score: 85, passed: true, certificateUrl: 'https://cert.url' }
      );

      let sentEmail = mockSend.mock.calls[0][0];
      let html = sentEmail.html as string;

      expect(html).toContain('#28a745'); // Green color for success
      expect(html).toContain('🎉 Gratulálunk!');
      expect(html).toContain('✅ Sikeres teljesítés!');
      expect(html).toContain('https://cert.url');

      // Clear mocks and test failing quiz
      jest.clearAllMocks();
      mockSend.mockResolvedValue([{} as any, {}]);

      await emailService.sendQuizCompletionEmail(
        { email: 'test@example.com', name: 'Test User' },
        { title: 'Test Quiz', score: 45, passed: false }
      );

      sentEmail = mockSend.mock.calls[0][0];
      html = sentEmail.html as string;

      expect(html).toContain('#ffc107'); // Warning color for failure
      expect(html).toContain('📚 Próbálja újra!');
      expect(html).toContain('⚠️ A sikeres teljesítéshez 70% szükséges');
      expect(html).not.toContain('Tanúsítvány');
    });
  });

  describe('CSS Styling Validation', () => {
    test('emails should have responsive design CSS', async () => {
      await emailService.sendWelcomeEmail({
        email: 'test@example.com',
        displayName: 'Test User'
      });

      const sentEmail = mockSend.mock.calls[0][0];
      const html = sentEmail.html as string;

      // Mobile-responsive max-width
      expect(html).toContain('max-width: 600px');
      
      // Font family for readability
      expect(html).toContain('font-family: Arial, sans-serif');
      
      // Line height for readability
      expect(html).toContain('line-height: 1.6');
      
      // Margin centering
      expect(html).toContain('margin: 0 auto');
    });

    test('buttons should have proper styling', async () => {
      await emailService.sendEnrollmentConfirmation(
        { email: 'test@example.com', name: 'Test User' },
        { title: 'Test Course', instructor: 'Dr. Test' }
      );

      const sentEmail = mockSend.mock.calls[0][0];
      const html = sentEmail.html as string;

      // Button styling
      expect(html).toMatch(/class="button"/);
      expect(html).toContain('display: inline-block');
      expect(html).toContain('padding: 12px 30px');
      expect(html).toContain('text-decoration: none');
      expect(html).toContain('border-radius: 5px');
    });

    test('color scheme should be consistent across templates', async () => {
      const templates = [
        () => emailService.sendWelcomeEmail({ email: 'test@example.com' }),
        () => emailService.sendEnrollmentConfirmation(
          { email: 'test@example.com', name: 'Test' },
          { title: 'Course', instructor: 'Instructor' }
        ),
        () => emailService.sendCertificateEmail(
          { email: 'test@example.com', name: 'Test' },
          { title: 'Course', completionDate: '2025-01-01', certificateUrl: 'https://cert.url' }
        )
      ];

      for (const template of templates) {
        jest.clearAllMocks();
        mockSend.mockResolvedValue([{} as any, {}]);
        await template();
        
        const sentEmail = mockSend.mock.calls[0][0];
        const html = sentEmail.html as string;

        // Check for consistent color usage
        expect(html).toContain('color: #333'); // Main text color
        expect(html).toContain('color: #666'); // Footer text color
        expect(html).toContain('background: #f8f9fa'); // Content background
      }
    });
  });

  describe('Content Localization Validation', () => {
    test('all user-facing text should be in Hungarian', async () => {
      await emailService.sendWelcomeEmail({
        email: 'test@example.com',
        displayName: 'Test User'
      });

      const sentEmail = mockSend.mock.calls[0][0];
      const html = sentEmail.html as string;

      // Hungarian specific text
      expect(html).toContain('Üdvözöljük');
      expect(html).toContain('Kedves');
      expect(html).toContain('kurzus');
      expect(html).toContain('tanúsítvány');
      expect(html).toContain('Következő lépések');
      expect(html).toContain('Minden jog fenntartva');
    });

    test('payment receipt should use Hungarian financial terms', async () => {
      await emailService.sendPaymentReceipt(
        { email: 'test@example.com', name: 'Test User' },
        {
          amount: 10000,
          currency: 'HUF',
          description: 'Test Course',
          invoiceNumber: 'INV-001',
          date: '2025-01-01'
        }
      );

      const sentEmail = mockSend.mock.calls[0][0];
      const html = sentEmail.html as string;

      expect(html).toContain('Számla');
      expect(html).toContain('Számlaszám');
      expect(html).toContain('Megnevezés');
      expect(html).toContain('Összeg');
      expect(html).toContain('Végösszeg');
      expect(html).toContain('Adószám');
      expect(html).toContain('Cégjegyzékszám');
    });
  });

  describe('Link and URL Validation', () => {
    test('all links should be properly formatted and accessible', async () => {
      await emailService.sendWelcomeEmail({
        email: 'test@example.com',
        displayName: 'Test User'
      });

      const sentEmail = mockSend.mock.calls[0][0];
      const html = sentEmail.html as string;

      // Links should be properly formatted
      const linkRegex = /<a[^>]+href="([^"]+)"[^>]*>/g;
      const links = html.match(linkRegex);
      
      expect(links).toBeTruthy();
      if (links) {
        links.forEach(link => {
          expect(link).toMatch(/href="https?:\/\//); // Should start with http/https
        });
      }

      // Dashboard link
      expect(html).toContain('href="https://elira.com/dashboard"');
      
      // Footer links
      expect(html).toContain('href="https://elira.com/unsubscribe"');
      expect(html).toContain('href="https://elira.com/privacy"');
    });

    test('password reset link should be secure', async () => {
      const resetLink = 'https://elira.com/reset?token=secure_token_123&expires=1640995200';
      
      await emailService.sendPasswordResetEmail('test@example.com', resetLink);

      const sentEmail = mockSend.mock.calls[0][0];
      const html = sentEmail.html as string;

      // Link should appear twice (button and text)
      const linkOccurrences = (html.match(/https:\/\/elira\.com\/reset\?token=secure_token_123&expires=1640995200/g) || []).length;
      expect(linkOccurrences).toBeGreaterThanOrEqual(2);
    });

    test('certificate links should be properly formatted', async () => {
      const certificateUrl = 'https://elira.com/certificates/abc123.pdf';
      
      await emailService.sendCertificateEmail(
        { email: 'test@example.com', name: 'Test User' },
        { title: 'Course', completionDate: '2025-01-01', certificateUrl }
      );

      const sentEmail = mockSend.mock.calls[0][0];
      const html = sentEmail.html as string;

      expect(html).toContain(certificateUrl);
      expect(html).toContain('href="' + certificateUrl + '"');
    });
  });

  describe('Email Accessibility', () => {
    test('emails should have proper alt attributes for images', async () => {
      await emailService.sendWelcomeEmail({
        email: 'test@example.com',
        displayName: 'Test User'
      });

      const sentEmail = mockSend.mock.calls[0][0];
      const html = sentEmail.html as string;

      // If images are present, they should have alt attributes
      const imgTags = html.match(/<img[^>]*>/g);
      if (imgTags) {
        imgTags.forEach(img => {
          expect(img).toMatch(/alt="[^"]*"/);
        });
      }
    });

    test('emails should have semantic HTML structure', async () => {
      await emailService.sendEnrollmentConfirmation(
        { email: 'test@example.com', name: 'Test User' },
        { title: 'Test Course', instructor: 'Dr. Test' }
      );

      const sentEmail = mockSend.mock.calls[0][0];
      const html = sentEmail.html as string;

      // Proper heading hierarchy
      expect(html).toMatch(/<h1[^>]*>/);
      expect(html).toMatch(/<h2[^>]*>/);
      expect(html).toMatch(/<h3[^>]*>/);
      
      // Lists for structured content
      expect(html).toMatch(/<ul[^>]*>/);
      expect(html).toMatch(/<ol[^>]*>/);
      expect(html).toMatch(/<li[^>]*>/);
    });
  });

  describe('Email Size and Performance', () => {
    test('email HTML should not exceed reasonable size limits', async () => {
      await emailService.sendWelcomeEmail({
        email: 'test@example.com',
        displayName: 'Test User'
      });

      const sentEmail = mockSend.mock.calls[0][0];
      const html = sentEmail.html as string;

      // HTML should be under 100KB (most email clients limit)
      expect(html.length).toBeLessThan(100 * 1024);
      
      // Should be substantial enough to contain actual content
      expect(html.length).toBeGreaterThan(1000);
    });

    test('CSS should be inline for email client compatibility', async () => {
      await emailService.sendPaymentReceipt(
        { email: 'test@example.com', name: 'Test User' },
        {
          amount: 5000,
          currency: 'HUF',
          description: 'Course',
          invoiceNumber: 'INV-001',
          date: '2025-01-01'
        }
      );

      const sentEmail = mockSend.mock.calls[0][0];
      const html = sentEmail.html as string;

      // CSS should be in <style> tags within <head>
      expect(html).toMatch(/<style[^>]*>[\s\S]*<\/style>/);
      
      // Should not have external stylesheet links
      expect(html).not.toMatch(/<link[^>]*rel="stylesheet"/);
    });
  });

  describe('Text Version Generation', () => {
    test('should generate proper text version from HTML', async () => {
      await emailService.sendQuizCompletionEmail(
        { email: 'test@example.com', name: 'Test User' },
        { title: 'JavaScript Quiz', score: 88, passed: true }
      );

      const sentEmail = mockSend.mock.calls[0][0];
      const text = sentEmail.text as string;

      // Should not contain HTML tags
      expect(text).not.toMatch(/<[^>]*>/);
      
      // Should contain key information
      expect(text).toContain('Test User');
      expect(text).toContain('JavaScript Quiz');
      expect(text).toContain('88%');
      expect(text).toContain('Gratulálunk');
      
      // Should be readable
      expect(text.length).toBeGreaterThan(100);
    });

    test('text version should preserve important formatting', async () => {
      await emailService.sendEnrollmentConfirmation(
        { email: 'test@example.com', name: 'Test User' },
        { title: 'Advanced React', instructor: 'Dr. React', startDate: '2025-02-01' }
      );

      const sentEmail = mockSend.mock.calls[0][0];
      const text = sentEmail.text as string;

      // Should preserve list structure with clear separation
      expect(text).toContain('Advanced React');
      expect(text).toContain('Dr. React');
      expect(text).toContain('2025-02-01');
      
      // Should have reasonable line breaks
      const lines = text.split('\n').filter(line => line.trim().length > 0);
      expect(lines.length).toBeGreaterThan(5);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle missing optional parameters gracefully', async () => {
      await emailService.sendEnrollmentConfirmation(
        { email: 'test@example.com', name: 'Test User' },
        { title: 'Course Without Date', instructor: 'Dr. Test' }
        // startDate is optional and missing
      );

      const sentEmail = mockSend.mock.calls[0][0];
      const html = sentEmail.html as string;

      expect(html).toContain('Course Without Date');
      expect(html).toContain('Dr. Test');
      expect(html).not.toContain('Kezdés:');
      expect(html).not.toContain('undefined');
      expect(html).not.toContain('null');
    });

    test('should handle special characters in content', async () => {
      await emailService.sendWelcomeEmail({
        email: 'test@example.com',
        displayName: 'Árvíztűrő Tükörfúrógép'
      });

      const sentEmail = mockSend.mock.calls[0][0];
      const html = sentEmail.html as string;

      expect(html).toContain('Árvíztűrő Tükörfúrógép');
      
      // Should have proper charset declaration
      expect(html).toContain('charset="utf-8"');
    });

    test('should handle long content without breaking layout', async () => {
      const longCourseName = 'Very Long Course Name That Might Break Email Layout If Not Handled Properly With Multiple Words And Special Characters ÁÉÍÓÖŐÚÜŰáéíóöőúüű';
      
      await emailService.sendEnrollmentConfirmation(
        { email: 'test@example.com', name: 'Test User' },
        { title: longCourseName, instructor: 'Dr. Test' }
      );

      const sentEmail = mockSend.mock.calls[0][0];
      const html = sentEmail.html as string;

      expect(html).toContain(longCourseName);
      
      // Should still have proper structure
      expect(html).toContain('class="container"');
      expect(html).toContain('max-width: 600px');
    });
  });
});