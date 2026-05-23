import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

const AuthContext = createContext(null);

async function fetchSuperAdminEmails() {
  const { data } = await supabase
    .from('app_configs')
    .select('super_admin_emails')
    .limit(1)
    .maybeSingle();
  return data?.super_admin_emails ?? [];
}

export function AuthProvider({ children }) {
  // Supabase Auth user (for super admins)
  const [supabaseUser, setSupabaseUser]   = useState(null);
  // Custom barbearia session (for barbearia owners/staff)
  const [adminSession, setAdminSessionRaw] = useState(() => {
    try {
      const raw = localStorage.getItem('admin_session');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading]           = useState(true);

  const setAdminSession = useCallback((session) => {
    setAdminSessionRaw(session);
    if (session) {
      localStorage.setItem('admin_session', JSON.stringify(session));
    } else {
      localStorage.removeItem('admin_session');
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const user = session?.user ?? null;
      setSupabaseUser(user);
      if (user?.email) {
        const emails = await fetchSuperAdminEmails();
        setIsSuperAdmin(emails.includes(user.email));
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const user = session?.user ?? null;
        setSupabaseUser(user);
        if (user?.email) {
          // Keep loading=true while we verify super admin status
          // so guards don't redirect prematurely
          setLoading(true);
          const emails = await fetchSuperAdminEmails();
          setIsSuperAdmin(emails.includes(user.email));
          setLoading(false);
        } else {
          setIsSuperAdmin(false);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const isAuthenticated = !!(supabaseUser || adminSession);

  const value = {
    supabaseUser,
    adminSession,
    setAdminSession,
    isSuperAdmin,
    loading,
    isAuthenticated,
    // Convenience: the active user regardless of auth method
    currentUser: adminSession?.user ?? (supabaseUser ? { email: supabaseUser.email, role: isSuperAdmin ? 'admin' : 'user' } : null),
    currentCompany: adminSession?.company ?? null,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
