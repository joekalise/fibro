import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  getMedications,
  addMedication as dbAddMedication,
  updateMedication as dbUpdateMedication,
  deleteMedication as dbDeleteMedication,
} from '@/services/database';
import { scheduleMedicationReminder, cancelNotification } from '@/services/notifications';
import { MedicationReminder } from '@/types';

export function useMedications(): {
  medications: MedicationReminder[];
  isLoading: boolean;
  error: string | null;
  addMedication: (med: Omit<MedicationReminder, 'id' | 'user_id'>) => Promise<void>;
  updateMedication: (id: string, updates: Partial<MedicationReminder>) => Promise<void>;
  deleteMedication: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
} {
  const { user } = useAuth();
  const [medications, setMedications] = useState<MedicationReminder[]>([]);
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
      const meds = await getMedications(user.id);
      setMedications(meds);
    } catch (err) {
      console.error('useMedications load error:', err);
      setError('Failed to load medications.');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const addMedication = useCallback(
    async (med: Omit<MedicationReminder, 'id' | 'user_id'>) => {
      if (!user) throw new Error('No authenticated user');

      const saved = await dbAddMedication({ ...med, user_id: user.id });
      setMedications((prev) => [...prev, saved]);

      // Schedule push notification for this medication
      await scheduleMedicationReminder(saved);
    },
    [user]
  );

  const updateMedication = useCallback(
    async (id: string, updates: Partial<MedicationReminder>) => {
      const updated = await dbUpdateMedication(id, updates);
      setMedications((prev) =>
        prev.map((m) => (m.id === id ? updated : m))
      );

      // Reschedule the reminder with updated details
      await scheduleMedicationReminder(updated);
    },
    []
  );

  const deleteMedication = useCallback(async (id: string) => {
    await dbDeleteMedication(id);
    setMedications((prev) => prev.filter((m) => m.id !== id));

    // Cancel the scheduled notification
    await cancelNotification(`med-${id}`);
  }, []);

  return {
    medications,
    isLoading,
    error,
    addMedication,
    updateMedication,
    deleteMedication,
    refresh: load,
  };
}
