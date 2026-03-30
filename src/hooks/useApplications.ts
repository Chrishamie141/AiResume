import { useState, useEffect } from 'react';
import { auth } from '../lib/firebase';
import { firestoreService } from '../services/firestoreService';
import { JobApplication, ApplicationStatusType } from '../types';

export function useApplications() {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchApplications = async () => {
    if (!auth.currentUser) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const apps = await firestoreService.getApplications(auth.currentUser.uid);
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
  }, []);

  const updateStatus = async (id: string, status: ApplicationStatusType) => {
    try {
      await firestoreService.updateApplicationStatus(id, status);
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
