"use strict";
/**
 * Utility functions for masking Personally Identifiable Information (PII)
 * Used to comply with GDPR by not logging sensitive data in production
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.maskEmail = maskEmail;
exports.maskUserId = maskUserId;
exports.maskPhone = maskPhone;
exports.sanitizeForLogging = sanitizeForLogging;
/**
 * Mask an email address for logging purposes
 * Example: "test@example.com" -> "tes***@***.com"
 */
function maskEmail(email) {
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
function maskUserId(userId) {
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
function maskPhone(phone) {
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
function sanitizeForLogging(obj, fieldsToMask = ['email', 'phone', 'adminEmail', 'employeeEmail', 'to']) {
    const sanitized = { ...obj };
    for (const field of fieldsToMask) {
        if (field in sanitized && typeof sanitized[field] === 'string') {
            if (field.toLowerCase().includes('email') || field === 'to') {
                sanitized[field] = maskEmail(sanitized[field]);
            }
            else if (field.toLowerCase().includes('phone')) {
                sanitized[field] = maskPhone(sanitized[field]);
            }
        }
    }
    return sanitized;
}
//# sourceMappingURL=maskPii.js.map