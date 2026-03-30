import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Briefcase, FileText, Target, BarChart3, ChevronRight, Clock, CheckCircle2, XCircle, MoreVertical, Search, Filter, Plus, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { useApplications } from '../hooks/useApplications';
import { ApplicationStatusType } from '../types';

export default function ApplicationTracker() {
  const { applications, loading, error, updateStatus } = useApplications();
  const [filter, setFilter] = useState<ApplicationStatusType | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredApps = applications.filter(app => {
    const matchesFilter = filter === 'all' || app.status === filter;
    const matchesSearch = 
      app.jobSnapshot?.company.toLowerCase().includes(searchTerm.toLowerCase()) || 
      app.jobSnapshot?.title.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto h-[calc(100vh-128px)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={48} className="text-stone-400 animate-spin" />
          <p className="text-stone-500 font-serif italic">Loading your applications...</p>
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

  return (
    <div className="max-w-6xl mx-auto space-y-12">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-serif font-light text-stone-900 mb-2">Application Tracker</h1>
          <p className="text-stone-500">Manage your job search pipeline and track every version used.</p>
        </div>
        <button className="px-6 py-3 bg-stone-900 text-white rounded-full font-medium hover:bg-stone-800 transition-colors flex items-center gap-2">
          Add Application <Plus size={18} />
        </button>
      </header>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-3xl border border-stone-100 shadow-sm">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto">
          {['All', 'Saved', 'Ready', 'Applied', 'Interview', 'Offer', 'Rejected'].map((s) => (
            <button 
              key={s}
              onClick={() => setFilter(s.toLowerCase() as any)}
              className={cn(
                "px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap",
                filter === s.toLowerCase() ? "bg-stone-900 text-white" : "text-stone-500 hover:bg-stone-50"
              )}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3 px-4 py-2 bg-stone-50 rounded-2xl border border-stone-100 w-full md:w-64">
          <Search size={18} className="text-stone-400" />
          <input 
            type="text" 
            placeholder="Search company or role" 
            className="bg-transparent border-none outline-none text-sm w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-stone-100 shadow-sm overflow-hidden overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-stone-50 border-b border-stone-100">
              <th className="px-8 py-4 text-xs font-bold uppercase tracking-widest text-stone-400">Company & Role</th>
              <th className="px-8 py-4 text-xs font-bold uppercase tracking-widest text-stone-400">Status</th>
              <th className="px-8 py-4 text-xs font-bold uppercase tracking-widest text-stone-400">Documents Used</th>
              <th className="px-8 py-4 text-xs font-bold uppercase tracking-widest text-stone-400">Date</th>
              <th className="px-8 py-4 text-xs font-bold uppercase tracking-widest text-stone-400"></th>
            </tr>
          </thead>
          <tbody>
            {filteredApps.length > 0 ? (
              filteredApps.map((app, i) => (
                <motion.tr 
                  key={app.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="border-b border-stone-50 last:border-0 hover:bg-stone-50 transition-colors group"
                >
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-stone-100 rounded-xl flex items-center justify-center text-stone-400 font-bold">
                        {app.jobSnapshot?.company[0] || 'J'}
                      </div>
                      <div>
                        <h4 className="font-medium text-stone-900">{app.jobSnapshot?.title || 'Job Title'}</h4>
                        <p className="text-sm text-stone-500">{app.jobSnapshot?.company || 'Company'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <StatusBadge status={app.status} />
                  </td>
                  <td className="px-8 py-6">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs text-stone-600">
                        <FileText size={12} className="text-stone-400" /> Resume v{app.resumeId.slice(-4)}
                      </div>
                      {app.coverLetterId && (
                        <div className="flex items-center gap-2 text-xs text-stone-600">
                          <FileText size={12} className="text-stone-400" /> Cover Letter
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-8 py-6 text-sm text-stone-500">
                    {new Date(app.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <select 
                        value={app.status}
                        onChange={(e) => updateStatus(app.id!, e.target.value as any)}
                        className="text-xs bg-stone-50 border border-stone-200 rounded-lg p-1 outline-none focus:ring-1 focus:ring-stone-900"
                      >
                        <option value="saved">Saved</option>
                        <option value="ready">Ready</option>
                        <option value="applied">Applied</option>
                        <option value="interview">Interview</option>
                        <option value="offer">Offer</option>
                        <option value="rejected">Rejected</option>
                      </select>
                      <button className="p-2 text-stone-400 hover:text-stone-900 transition-colors">
                        <MoreVertical size={18} />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-8 py-20 text-center">
                  <p className="text-stone-400 italic">No applications found matching your criteria.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
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
    <span className={`px-4 py-1.5 rounded-full text-xs font-medium border capitalize ${styles[status] || styles['saved']}`}>
      {status}
    </span>
  );
}
