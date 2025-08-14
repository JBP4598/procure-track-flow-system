import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SecurityAttempt {
  email: string;
  timestamp: number;
  ip?: string;
}

interface UseSecurityMonitoringReturn {
  recordFailedAttempt: (email: string) => void;
  isAccountLocked: (email: string) => boolean;
  getRemainingLockTime: (email: string) => number;
}

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes
const ATTEMPT_WINDOW = 60 * 60 * 1000; // 1 hour

export const useSecurityMonitoring = (): UseSecurityMonitoringReturn => {
  const [failedAttempts, setFailedAttempts] = useState<SecurityAttempt[]>([]);

  useEffect(() => {
    // Load failed attempts from localStorage
    const stored = localStorage.getItem('security_attempts');
    if (stored) {
      try {
        const attempts = JSON.parse(stored);
        // Filter out old attempts
        const now = Date.now();
        const validAttempts = attempts.filter(
          (attempt: SecurityAttempt) => now - attempt.timestamp < ATTEMPT_WINDOW
        );
        setFailedAttempts(validAttempts);
      } catch (error) {
        console.error('Failed to parse security attempts:', error);
      }
    }
  }, []);

  const recordFailedAttempt = (email: string) => {
    const now = Date.now();
    const newAttempt: SecurityAttempt = {
      email: email.toLowerCase(),
      timestamp: now,
    };

    const updatedAttempts = [...failedAttempts, newAttempt].filter(
      attempt => now - attempt.timestamp < ATTEMPT_WINDOW
    );

    setFailedAttempts(updatedAttempts);
    localStorage.setItem('security_attempts', JSON.stringify(updatedAttempts));

    // Log security event to database
    logSecurityEvent('failed_login', { email, timestamp: now });
  };

  const isAccountLocked = (email: string): boolean => {
    const now = Date.now();
    const recentAttempts = failedAttempts.filter(
      attempt => 
        attempt.email === email.toLowerCase() && 
        now - attempt.timestamp < LOCKOUT_DURATION
    );

    return recentAttempts.length >= MAX_ATTEMPTS;
  };

  const getRemainingLockTime = (email: string): number => {
    const now = Date.now();
    const recentAttempts = failedAttempts.filter(
      attempt => 
        attempt.email === email.toLowerCase() && 
        now - attempt.timestamp < LOCKOUT_DURATION
    );

    if (recentAttempts.length < MAX_ATTEMPTS) return 0;

    const oldestAttempt = recentAttempts.reduce((oldest, current) => 
      current.timestamp < oldest.timestamp ? current : oldest
    );

    return Math.max(0, LOCKOUT_DURATION - (now - oldestAttempt.timestamp));
  };

  const logSecurityEvent = async (action: string, details: any) => {
    try {
      await supabase.from('activity_logs').insert({
        user_id: null, // No user ID for failed login attempts
        action,
        table_name: 'auth_security',
        record_id: crypto.randomUUID(),
        new_values: details,
        user_agent: navigator.userAgent,
      });
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  };

  return {
    recordFailedAttempt,
    isAccountLocked,
    getRemainingLockTime,
  };
};