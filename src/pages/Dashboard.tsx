import React from 'react';
import { motion } from 'motion/react';
import { Briefcase, FileText, Target, BarChart3, ChevronRight, Clock, CheckCircle2, XCircle, Loader2, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useDashboardData } from '../hooks/useDashboardData';
import { ApplicationStatusType } from '../types';
import { cn } from '../lib/utils';

export default function Dashboard() {
  const { stats, recentApplications, recentResumes, insights, profile, loading, error } = useDashboardData();

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto h-[calc(100vh-128px)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={48} className="text-stone-400 animate-spin" />
          <p className="text-stone-500 font-serif italic">Gathering your career insights...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto py-20 flex flex-col items-center text-center">
        <AlertCircle size={48} className="text-red-500 mb-4" />
        <h2 className="text-2xl font-serif text-stone-900 mb-2">Something went wrong</h2>
        <p className="text-stone-500 mb-8">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="px-8 py-3 bg-stone-900 text-white rounded-full font-medium hover:bg-stone-800 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  const statCards = [
    { label: 'Applications', value: stats?.totalApplications || 0, icon: Briefcase, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Interviews', value: stats?.interviewsScheduled || 0, icon: Target, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Resumes', value: stats?.resumesCreated || 0, icon: FileText, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Success Rate', value: `${stats?.successRate || 0}%`, icon: BarChart3, color: 'text-orange-600', bg: 'bg-orange-50' },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-12">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-serif font-light text-stone-900 mb-2">
            Welcome back, {profile?.firstName || 'User'}.
          </h1>
          <p className="text-stone-500">
            {stats?.interviewsScheduled ? `You have ${stats.interviewsScheduled} interviews scheduled.` : "Ready to find your next opportunity?"}
          </p>
        </div>
        <div className="flex gap-4">
          <Link to="/resume-builder" className="px-6 py-3 bg-stone-900 text-white rounded-full font-medium hover:bg-stone-800 transition-colors flex items-center gap-2">
            New Resume <FileText size={18} />
          </Link>
          <Link to="/jobs" className="px-6 py-3 border border-stone-300 text-stone-700 rounded-full font-medium hover:bg-stone-100 transition-colors flex items-center gap-2">
            Find Jobs <Briefcase size={18} />
          </Link>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, i) => (
          <motion.div 
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.1 }}
            className="p-6 bg-white rounded-3xl border border-stone-100 shadow-sm"
          >
            <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center mb-4`}>
              <stat.icon size={24} />
            </div>
            <p className="text-sm font-medium text-stone-500 mb-1">{stat.label}</p>
            <p className="text-3xl font-serif font-medium text-stone-900">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Resumes */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-serif font-light text-stone-900">Recent Resumes</h2>
            <Link to="/resumes" className="text-sm font-medium text-stone-600 hover:text-stone-900 flex items-center gap-1">
              View all <ChevronRight size={16} />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recentResumes.length > 0 ? (
              recentResumes.map((resume, i) => (
                <Link 
                  key={resume.id || i} 
                  to={`/resume/${resume.id}`}
                  className="p-6 bg-white rounded-3xl border border-stone-100 shadow-sm hover:shadow-md transition-all flex items-center gap-4 group"
                >
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center transition-colors",
                    resume.isBase ? "bg-stone-900 text-white" : "bg-stone-100 text-stone-400 group-hover:bg-stone-200"
                  )}>
                    <FileText size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-stone-900 truncate">{resume.title}</h4>
                    <p className="text-xs text-stone-500">
                      Updated {new Date(resume.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <ChevronRight size={16} className="text-stone-300 group-hover:text-stone-900 transition-colors" />
                </Link>
              ))
            ) : (
              <div className="col-span-full p-12 bg-white rounded-3xl border border-stone-100 border-dashed text-center">
                <p className="text-stone-400 italic">No resumes created yet.</p>
                <Link to="/resume-builder" className="text-stone-900 font-medium underline mt-2 inline-block">Create your first resume</Link>
              </div>
            )}
          </div>

          {/* Recent Applications */}
          <div className="pt-8 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-serif font-light text-stone-900">Recent Applications</h2>
              <Link to="/tracker" className="text-sm font-medium text-stone-600 hover:text-stone-900 flex items-center gap-1">
                View all <ChevronRight size={16} />
              </Link>
            </div>
            
            <div className="bg-white rounded-3xl border border-stone-100 shadow-sm overflow-hidden">
              {recentApplications.length > 0 ? (
                recentApplications.map((app, i) => (
                  <div key={app.id || i} className="p-6 flex items-center justify-between border-b border-stone-50 last:border-0 hover:bg-stone-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-stone-100 rounded-xl flex items-center justify-center text-stone-400 font-bold">
                        {app.jobSnapshot?.company[0] || 'J'}
                      </div>
                      <div>
                        <h4 className="font-medium text-stone-900">{app.jobSnapshot?.title || 'Job Title'}</h4>
                        <p className="text-sm text-stone-500">{app.jobSnapshot?.company || 'Company'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right hidden sm:block">
                        <p className="text-xs text-stone-400 uppercase tracking-wider mb-1">Status</p>
                        <StatusBadge status={app.status} />
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-stone-400 uppercase tracking-wider mb-1">Applied</p>
                        <p className="text-sm text-stone-600">
                          {app.appliedAt ? new Date(app.appliedAt).toLocaleDateString() : 'Not applied'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-20 text-center">
                  <p className="text-stone-400 italic">No recent applications found.</p>
                  <Link to="/jobs" className="text-stone-900 font-medium underline mt-2 inline-block">Start searching</Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* AI Recommendations */}
        <div className="space-y-6">
          <h2 className="text-2xl font-serif font-light text-stone-900">AI Insights</h2>
          {insights.length > 0 ? (
            <div className="space-y-4">
              {insights.map((insight, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className={cn(
                    "p-6 rounded-3xl border shadow-sm",
                    insight.type === 'tip' && "bg-blue-50 border-blue-100 text-blue-900",
                    insight.type === 'alert' && "bg-red-50 border-red-100 text-red-900",
                    insight.type === 'success' && "bg-green-50 border-green-100 text-green-900",
                    insight.type === 'info' && "bg-stone-900 text-white border-stone-800"
                  )}
                >
                  <h3 className="font-medium mb-2 flex items-center gap-2">
                    {insight.type === 'tip' && <Clock size={16} />}
                    {insight.type === 'alert' && <AlertCircle size={16} />}
                    {insight.type === 'success' && <CheckCircle2 size={16} />}
                    {insight.title}
                  </h3>
                  <p className={cn(
                    "text-sm leading-relaxed",
                    insight.type === 'info' ? "text-stone-400" : "opacity-80"
                  )}>
                    {insight.content}
                  </p>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="p-8 bg-stone-50 rounded-3xl border border-stone-100 text-center">
              <p className="text-stone-400 italic">No insights available yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: ApplicationStatusType }) {
  const styles: Record<ApplicationStatusType, string> = {
    'interview': 'bg-purple-50 text-purple-700 border-purple-100',
    'applied': 'bg-blue-50 text-blue-700 border-blue-100',
    'saved': 'bg-stone-100 text-stone-600 border-stone-200',
    'rejected': 'bg-red-50 text-red-700 border-red-100',
    'offer': 'bg-green-50 text-green-700 border-green-100',
    'ready': 'bg-yellow-50 text-yellow-700 border-yellow-100',
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium border capitalize ${styles[status] || styles['saved']}`}>
      {status}
    </span>
  );
}
