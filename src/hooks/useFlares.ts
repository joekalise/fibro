import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  getFlares,
  getActiveFlare,
  startFlare as dbStartFlare,
  endFlare as dbEndFlare,
} from '@/services/database';
import { Flare, FlareSeverity, PainLocation } from '@/types';

export function useFlares(): {
  flares: Flare[];
  activeFlare: Flare | null;
  isLoading: boolean;
  error: string | null;
  startFlare: (severity: FlareSeverity, areas: PainLocation[], notes: string) => Promise<void>;
  endCurrentFlare: () => Promise<void>;
  refresh: () => Promise<void>;
} {
  const { user } = useAuth();
  const [flares, setFlares] = useState<Flare[]>([]);
  const [activeFlare, setActiveFlare] = useState<Flare | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const [allFlares, active] = await Promise.all([
        getFlares(user.id),
        getActiveFlare(user.id),
      ]);
      setFlares(allFlares);
      setActiveFlare(active);
    } catch (err) {
      console.error('useFlares load error:', err);
      setError('Failed to load flare history.');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const startFlare = useCallback(
    async (severity: FlareSeverity, areas: PainLocation[], notes: string) => {
      if (!user) throw new Error('No authenticated user');

      const today = new Date().toISOString().split('T')[0];
      const newFlare = await dbStartFlare({
        user_id: user.id,
        start_date: today,
        severity,
        areas_affected: areas,
        notes,
      });

      setActiveFlare(newFlare);
      setFlares((prev) => [newFlare, ...prev]);
    },
    [user]
  );

  const endCurrentFlare = useCallback(async () => {
    if (!activeFlare?.id) throw new Error('No active flare');

    const today = new Date().toISOString().split('T')[0];
    const ended = await dbEndFlare(activeFlare.id, today);

    setActiveFlare(null);
    setFlares((prev) =>
      prev.map((f) => (f.id === ended.id ? ended : f))
    );
  }, [activeFlare]);

  return {
    flares,
    activeFlare,
    isLoading,
    error,
    startFlare,
    endCurrentFlare,
    refresh: load,
  };
}
