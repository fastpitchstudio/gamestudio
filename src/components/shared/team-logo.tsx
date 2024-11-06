// src/components/shared/team-logo.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { ImageOff } from 'lucide-react';
import { logoCacheService } from '@/lib/cache/logo-cache';

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

  const fetchSignedUrl = useCallback(async () => {
    if (!logoUrl) {
      setLoading(false);
      return;
    }

    try {
      const url = await logoCacheService.getSignedUrl(logoUrl);
      if (url) {
        setSignedUrl(url);
        setError(false);
      } else {
        setError(true);
      }
    } catch (err) {
      console.error('Error fetching signed URL:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [logoUrl]);

  useEffect(() => {
    let mounted = true;
    
    if (mounted) {
      setLoading(true);
      setError(false);
      fetchSignedUrl();
    }

    return () => {
      mounted = false;
    };
  }, [fetchSignedUrl]);

  // Refresh URL before expiration
  useEffect(() => {
    if (!logoUrl || !signedUrl) return;

    const timer = setInterval(fetchSignedUrl, 40 * 60 * 1000); // Refresh 5 minutes before expiration
    return () => clearInterval(timer);
  }, [logoUrl, signedUrl, fetchSignedUrl]);

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