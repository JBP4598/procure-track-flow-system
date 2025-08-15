
import { useState, useEffect, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>;
  signOut: () => Promise<{ error: any }>;
}

const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const ACTIVITY_CHECK_INTERVAL = 60 * 1000; // 1 minute

export const useAuth = (): AuthContextType => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastActivity, setLastActivity] = useState<number>(Date.now());

  // Track user activity for session timeout
  const updateActivity = useCallback(() => {
    setLastActivity(Date.now());
  }, []);

  // Set up activity listeners
  useEffect(() => {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    const handleActivity = () => updateActivity();
    
    events.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
    };
  }, [updateActivity]);

  // Session timeout check
  useEffect(() => {
    if (!session) return;

    const checkSessionTimeout = () => {
      const now = Date.now();
      if (now - lastActivity > SESSION_TIMEOUT) {
        console.log('Session timed out due to inactivity');
        signOut();
      }
    };

    const interval = setInterval(checkSessionTimeout, ACTIVITY_CHECK_INTERVAL);
    return () => clearInterval(interval);
  }, [session, lastActivity]);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event, session?.user ? 'user_authenticated' : 'user_unauthenticated');
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        // Log authentication events
        if (event === 'SIGNED_IN' && session?.user) {
          logAuthEvent('user_signed_in', session.user.id);
        } else if (event === 'SIGNED_OUT') {
          logAuthEvent('user_signed_out', session?.user?.id || null);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const logAuthEvent = async (action: string, userId: string | null) => {
    try {
      await supabase.from('activity_logs').insert({
        user_id: userId,
        action,
        table_name: 'auth_events',
        record_id: crypto.randomUUID(),
        new_values: { timestamp: new Date().toISOString() },
        user_agent: navigator.userAgent,
      });
    } catch (error) {
      console.error('Failed to log auth event:', error);
    }
  };

  const signIn = async (email: string, password: string) => {
    updateActivity(); // Reset activity timer on sign in
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
        }
      }
    });
    return { error };
  };

  const signOut = async () => {
    // Clear security attempts on sign out
    localStorage.removeItem('security_attempts');
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  return {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
  };
};
