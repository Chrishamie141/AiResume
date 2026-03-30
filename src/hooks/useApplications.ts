import { useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { databaseService } from '../services/databaseService';
import { useAuth } from './useAuth';
import { JobApplication, ApplicationStatusType } from '../types';

export function useApplications() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchApplications = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const apps = await databaseService.getApplications(user.id);
      setApplications(apps);
    } catch (err) {
      console.error('Error fetching applications:', err);
      setError('Failed to load applications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [user]);

  const updateStatus = async (id: string, status: ApplicationStatusType) => {
    try {
      await databaseService.updateApplicationStatus(id, status);
      setApplications(prev => prev.map(app => 
        app.id === id ? { ...app, status, updatedAt: new Date().toISOString() } : app
      ));
    } catch (err) {
      console.error('Error updating status:', err);
      throw err;
    }
  };

  return { applications, loading, error, updateStatus, refresh: fetchApplications };
}
