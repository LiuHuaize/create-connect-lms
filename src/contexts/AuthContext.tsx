
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

// Define role type
type UserRole = 'student' | 'teacher' | 'admin';

type AuthContextType = {
  session: Session | null;
  user: User | null;
  role: UserRole | null;
  signIn: (username: string, password: string) => Promise<{ error: any }>;
  signUp: (username: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  loading: boolean;
  refreshUserRole: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<UserRole | null>(null);
  
  // Function to fetch user's role
  const fetchUserRole = async (userId: string) => {
    try {
      console.log('Fetching role for user:', userId);
      // Check for admin role
      const { data: isAdmin, error: adminError } = await supabase
        .rpc('has_role', { user_id: userId, role: 'admin' });

      if (adminError) {
        console.error('Error checking admin role:', adminError);
        return;
      }

      if (isAdmin === true) {
        console.log('User has admin role');
        setRole('admin');
        return;
      }

      // Check for teacher role
      const { data: isTeacher, error: teacherError } = await supabase
        .rpc('has_role', { user_id: userId, role: 'teacher' });

      if (teacherError) {
        console.error('Error checking teacher role:', teacherError);
        return;
      }

      if (isTeacher === true) {
        console.log('User has teacher role');
        setRole('teacher');
        return;
      }

      // Default to student
      console.log('User has student role');
      setRole('student');
    } catch (error) {
      console.error('Error in fetchUserRole:', error);
    }
  };

  // Function to refresh user role - useful for when roles change
  const refreshUserRole = async () => {
    if (user) {
      console.log('Refreshing user role for user:', user.id);
      await fetchUserRole(user.id);
    }
  };

  useEffect(() => {
    // Set up the auth state listener
    console.log('Setting up auth state listener');
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        console.log('Auth state changed:', event);
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        // If user is logged in, fetch their role
        if (currentSession?.user) {
          console.log('User logged in, fetching role');
          fetchUserRole(currentSession.user.id);
        } else {
          setRole(null);
        }
        
        setLoading(false);
        
        if (event === 'SIGNED_OUT') {
          toast({
            title: "已退出登录",
            description: "您已成功退出登录。"
          });
        } else if (event === 'SIGNED_IN') {
          toast({
            title: "已登录",
            description: "欢迎回来！"
          });
        }
      }
    );
    
    // Check for existing session
    console.log('Checking for existing session');
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      console.log('Existing session check result:', currentSession ? 'Session found' : 'No session');
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      
      // If user is logged in, fetch their role
      if (currentSession?.user) {
        console.log('User session found, fetching role');
        fetchUserRole(currentSession.user.id);
      }
      
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []); 

  const signIn = async (username: string, password: string) => {
    // For username-password auth, we use the email field but with a standard domain
    const email = `${username}@user.internal`;
    console.log('Signing in with email:', email);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (!error) {
      console.log('Sign-in successful');
    } else {
      console.error('Sign-in error:', error);
    }
    return { error };
  };

  const signUp = async (username: string, password: string) => {
    // For username-password auth, we use the email field but with a standard domain
    const email = `${username}@user.internal`;
    console.log('Signing up with email:', email);
    const { error } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        data: {
          username: username
        }
      }
    });
    if (!error) {
      console.log('Sign-up successful');
    } else {
      console.error('Sign-up error:', error);
    }
    return { error };
  };

  const signOut = async () => {
    console.log('Signing out');
    await supabase.auth.signOut();
  };

  const value = {
    session,
    user,
    role,
    signIn,
    signUp,
    signOut,
    loading,
    refreshUserRole
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
