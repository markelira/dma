/**
 * Utility functions for masking Personally Identifiable Information (PII)
 * Used to comply with GDPR by not logging sensitive data in production
 */

/**
 * Mask an email address for logging purposes
 * Example: "test@example.com" -> "tes***@***.com"
 */
export function maskEmail(email: string | null | undefined): string {
  if (!email || typeof email !== 'string') {
    return '[no-email]';
  }

  const parts = email.split('@');
  if (parts.length !== 2) {
    return '[invalid-email]';
  }

  const [local, domain] = parts;
  const domainParts = domain.split('.');

  // Show first 3 chars of local part, mask the rest
  const maskedLocal = local.length > 3
    ? local.substring(0, 3) + '***'
    : local.substring(0, 1) + '***';

  // Show only the TLD
  const maskedDomain = domainParts.length > 1
    ? '***.' + domainParts[domainParts.length - 1]
    : '***';

  return `${maskedLocal}@${maskedDomain}`;
}

/**
 * Mask a user ID for logging purposes
 * Example: "abc123xyz789" -> "abc1...789"
 */
export function maskUserId(userId: string | null | undefined): string {
  if (!userId || typeof userId !== 'string') {
    return '[no-id]';
  }

  if (userId.length <= 8) {
    return userId.substring(0, 2) + '***';
  }

  return userId.substring(0, 4) + '...' + userId.substring(userId.length - 3);
}

/**
 * Mask a phone number for logging purposes
 * Example: "+36301234567" -> "+36***567"
 */
export function maskPhone(phone: string | null | undefined): string {
  if (!phone || typeof phone !== 'string') {
    return '[no-phone]';
  }

  if (phone.length <= 6) {
    return '***' + phone.substring(phone.length - 2);
  }

  return phone.substring(0, 3) + '***' + phone.substring(phone.length - 3);
}

/**
 * Sanitize an object by masking PII fields
 * Useful for logging entire objects safely
 */
export function sanitizeForLogging<T extends Record<string, unknown>>(
  obj: T,
  fieldsToMask: string[] = ['email', 'phone', 'adminEmail', 'employeeEmail', 'to']
): T {
  const sanitized = { ...obj };

  for (const field of fieldsToMask) {
    if (field in sanitized && typeof sanitized[field] === 'string') {
      if (field.toLowerCase().includes('email') || field === 'to') {
        (sanitized as Record<string, unknown>)[field] = maskEmail(sanitized[field] as string);
      } else if (field.toLowerCase().includes('phone')) {
        (sanitized as Record<string, unknown>)[field] = maskPhone(sanitized[field] as string);
      }
    }
  }

  return sanitized;
}
