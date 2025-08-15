// Security utility functions for enhanced protection

/**
 * Generate a simple hash of sensitive data for logging purposes
 * This is not cryptographically secure but helps avoid storing plain text sensitive data
 */
export const hashForLogging = (data: string): string => {
  return btoa(data).slice(0, 8) + '***';
};

/**
 * Sanitize user agent string to remove potentially sensitive information
 */
export const sanitizeUserAgent = (userAgent: string): string => {
  // Remove specific version numbers and build information
  return userAgent
    .replace(/\d+\.\d+\.\d+/g, 'x.x.x')
    .replace(/Build\/[\w\d]+/g, 'Build/xxxxx')
    .slice(0, 200); // Limit length
};

/**
 * Check if the current session is in a secure context
 */
export const isSecureContext = (): boolean => {
  return window.isSecureContext && window.location.protocol === 'https:';
};

/**
 * Generate a session fingerprint for additional security monitoring
 */
export const generateSessionFingerprint = (): string => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('Security fingerprint', 2, 2);
  }
  
  const fingerprint = [
    navigator.language,
    screen.width + 'x' + screen.height,
    new Date().getTimezoneOffset(),
    canvas.toDataURL().slice(0, 50)
  ].join('|');
  
  return btoa(fingerprint).slice(0, 16);
};