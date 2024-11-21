'use client'

import React, { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import type { User, Session } from '@supabase/supabase-js';

interface AuthState {
  session: Session | null;
  user: User | null;
  error: string | null;
  loading: boolean;
}

const AuthDebug = () => {
  const [authState, setAuthState] = useState<AuthState>({
    session: null,
    user: null,
    error: null,
    loading: true
  });

  const supabase = createClientComponentClient();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          setAuthState(prev => ({
            ...prev,
            error: error.message,
            loading: false
          }));
          return;
        }

        const { data: { user } } = await supabase.auth.getUser();
        
        setAuthState({
          session,
          user,
          error: null,
          loading: false
        });
      } catch (err) {
        setAuthState(prev => ({
          ...prev,
          error: err instanceof Error ? err.message : 'An unknown error occurred',
          loading: false
        }));
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event);
        const { data: { user } } = await supabase.auth.getUser();
        setAuthState({
          session,
          user,
          error: null,
          loading: false
        });
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase.auth]);

  return (
    <Card className="w-full max-w-2xl mx-auto my-4">
      <CardHeader>
        <CardTitle>Authentication Debug Panel</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {authState.loading ? (
          <div className="text-center">Loading authentication state...</div>
        ) : authState.error ? (
          <Alert variant="destructive">
            <AlertTitle>Authentication Error</AlertTitle>
            <AlertDescription>{authState.error}</AlertDescription>
          </Alert>
        ) : (
          <>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-semibold">Auth Status:</span>
                <Badge variant={authState.session ? "secondary" : "destructive"}
                       className={authState.session ? "bg-green-500" : ""}
                >
                  {authState.session ? "Authenticated" : "Not Authenticated"}
                </Badge>
              </div>
              
              {authState.user && (
                <div className="space-y-2">
                  <h3 className="font-semibold">User Details:</h3>
                  <pre className="bg-secondary p-4 rounded-lg overflow-auto">
                    {JSON.stringify(authState.user, null, 2)}
                  </pre>
                </div>
              )}
              
              {authState.session && (
                <div className="space-y-2">
                  <h3 className="font-semibold">Session Details:</h3>
                  <pre className="bg-secondary p-4 rounded-lg overflow-auto">
                    {JSON.stringify(authState.session, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default AuthDebug;