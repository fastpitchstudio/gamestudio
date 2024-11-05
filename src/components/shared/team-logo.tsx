// src/components/shared/team-logo.tsx
'use client';

import { useEffect, useState } from 'react';
import { ImageOff } from 'lucide-react';
import { getSignedUrl } from '@/lib/supabase/storage';

interface TeamLogoProps {
  logoUrl: string | null;
  teamName: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizes = {
  sm: 32,
  md: 48,
  lg: 64
};

export function TeamLogo({ logoUrl, teamName, size = 'sm' }: TeamLogoProps) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const dimension = sizes[size];

  useEffect(() => {
    let mounted = true;
    
    async function fetchSignedUrl() {
      if (!logoUrl) {
        setLoading(false);
        return;
      }

      try {
        const url = await getSignedUrl(logoUrl);
        
        if (mounted) {
          if (url) {
            setSignedUrl(url);
            setError(false);
          } else {
            setError(true);
          }
        }
      } catch (err) {
        console.error('Error fetching signed URL:', err);
        if (mounted) {
          setError(true);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    setLoading(true);
    setError(false);
    fetchSignedUrl();

    return () => {
      mounted = false;
    };
  }, [logoUrl]);

  useEffect(() => {
    if (!signedUrl || !logoUrl) return;

    const timer = setInterval(() => {
      getSignedUrl(logoUrl).then(url => {
        if (url) {
          setSignedUrl(url);
        }
      });
    }, 45 * 60 * 1000);

    return () => clearInterval(timer);
  }, [logoUrl, signedUrl]);

  if (loading) {
    return (
      <div 
        className="flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-full"
        style={{ width: dimension, height: dimension }}
      >
        <div className="animate-spin rounded-full h-1/2 w-1/2 border-2 border-gray-500 border-t-transparent" />
      </div>
    );
  }

  if (!logoUrl || error || !signedUrl) {
    return (
      <div 
        className="flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-full"
        style={{ width: dimension, height: dimension }}
      >
        <ImageOff className="w-1/2 h-1/2 text-slate-400" />
      </div>
    );
  }

  return (
    <div 
      className="relative rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800" 
      style={{ width: dimension, height: dimension }}
    >
      <img
        src={signedUrl}
        alt={`${teamName} logo`}
        className="w-full h-full object-cover"
        onError={() => setError(true)}
      />
    </div>
  );
}