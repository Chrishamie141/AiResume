import { useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { databaseService } from '../services/databaseService';
import { openaiService } from '../services/openaiService';
import { useAuth } from './useAuth';
import { DashboardStats, JobApplication, AIInsight, UserProfile, Resume } from '../types';

export function useDashboardData() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentApplications, setRecentApplications] = useState<JobApplication[]>([]);
  const [recentResumes, setRecentResumes] = useState<Resume[]>([]);
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const uid = user.id;

        // Fetch all necessary data in parallel
        const [userProfile, applications, resumes] = await Promise.all([
          databaseService.getProfile(uid),
          databaseService.getApplications(uid),
          databaseService.getResumes(uid),
        ]);

        setProfile(userProfile);
        setRecentApplications(applications.slice(0, 5));
        setRecentResumes(resumes.slice(0, 3));

        // Compute stats
        const totalApps = applications.length;
        const interviews = applications.filter(a => a.status === 'interview').length;
        const resumesCount = resumes.length;
        const successRate = totalApps > 0 ? Math.round((interviews / totalApps) * 100) : 0;

        setStats({
          totalApplications: totalApps,
          interviewsScheduled: interviews,
          resumesCreated: resumesCount,
          successRate: successRate,
        });

        // Fetch AI insights if profile exists
        if (userProfile) {
          try {
            const aiInsights = await openaiService.generateInsights(userProfile, applications, resumes);
            setInsights(aiInsights);
          } catch (aiErr: any) {
            console.error('Failed to fetch AI insights:', aiErr);
            const isQuotaExceeded = aiErr.message?.includes('429') || aiErr.status === 429 || aiErr.error?.code === 429;
            
            // Fallback insights if AI fails
            setInsights([{
              title: isQuotaExceeded ? "AI Quota Exceeded" : "Keep going!",
              content: isQuotaExceeded 
                ? "We've reached our AI limit for today. Your personalized insights will be back soon! In the meantime, keep tracking your applications."
                : "Complete your profile to get personalized AI insights and improve your application success rate.",
              type: isQuotaExceeded ? "alert" : "info"
            }]);
          }
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  return { stats, recentApplications, recentResumes, insights, profile, loading, error };
}
