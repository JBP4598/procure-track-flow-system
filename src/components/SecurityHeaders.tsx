import { useEffect } from 'react';

/**
 * Component to set security headers and CSP via meta tags
 * This provides additional client-side security measures
 */
export const SecurityHeaders: React.FC = () => {
  useEffect(() => {
    // Set Content Security Policy
    const cspMeta = document.createElement('meta');
    cspMeta.httpEquiv = 'Content-Security-Policy';
    cspMeta.content = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://ekctfpcglgphystvzwwv.supabase.co",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https: blob:",
      "font-src 'self' data:",
      "connect-src 'self' https://ekctfpcglgphystvzwwv.supabase.co wss://ekctfpcglgphystvzwwv.supabase.co",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'"
    ].join('; ');
    
    // Remove existing CSP meta tag if present
    const existingCsp = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    if (existingCsp) {
      existingCsp.remove();
    }
    
    document.head.appendChild(cspMeta);

    // Set X-Frame-Options
    const frameOptionsMeta = document.createElement('meta');
    frameOptionsMeta.httpEquiv = 'X-Frame-Options';
    frameOptionsMeta.content = 'DENY';
    document.head.appendChild(frameOptionsMeta);

    // Set X-Content-Type-Options
    const contentTypeMeta = document.createElement('meta');
    contentTypeMeta.httpEquiv = 'X-Content-Type-Options';
    contentTypeMeta.content = 'nosniff';
    document.head.appendChild(contentTypeMeta);

    // Set Referrer Policy
    const referrerMeta = document.createElement('meta');
    referrerMeta.name = 'referrer';
    referrerMeta.content = 'strict-origin-when-cross-origin';
    document.head.appendChild(referrerMeta);

    return () => {
      // Cleanup on unmount
      [cspMeta, frameOptionsMeta, contentTypeMeta, referrerMeta].forEach(meta => {
        if (document.head.contains(meta)) {
          document.head.removeChild(meta);
        }
      });
    };
  }, []);

  return null; // This component doesn't render anything
};