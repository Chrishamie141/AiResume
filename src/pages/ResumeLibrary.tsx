import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FileText, Plus, Search, MoreVertical, Trash2, Edit2, ExternalLink, Clock, Sparkles, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { databaseService } from '../services/databaseService';
import { Resume } from '../types';
import { cn } from '../lib/utils';
import { useAuth } from '../hooks/useAuth';

export default function ResumeLibrary() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [resumeToSetBase, setResumeToSetBase] = useState<string | null>(null);

  const fetchResumes = async () => {
    if (!user) { setLoading(false); return; }
    try {
      const data = await databaseService.getResumes(user.id);
      setResumes(data);
    } catch (error) {
      console.error('Error fetching resumes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResumes();
  }, [user]);

  const handleDelete = async (id: string) => {
    try {
      setDeletingId(id);
      await databaseService.deleteResume(id);
      setResumes(prev => prev.filter(r => r.id !== id));
      setConfirmDeleteId(null);
      toast.success('Resume deleted successfully');
    } catch (error) {
      console.error('Error deleting resume:', error);
      toast.error('Failed to delete resume');
    } finally {
      setDeletingId(null);
    }
  };

  const handleSetBase = async () => {
    if (!resumeToSetBase) return;
    
    try {
      setUpdatingId(resumeToSetBase);
      await databaseService.updateResume(resumeToSetBase, { isBase: true });
      await fetchResumes(); // Refresh to see changes
      setResumeToSetBase(null);
      toast.success('Base resume updated');
    } catch (error) {
      console.error('Error setting base resume:', error);
      toast.error('Failed to update base resume');
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredResumes = resumes.filter(resume => 
    resume.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    resume.targetJob?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto h-[calc(100vh-128px)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-stone-900"></div>
          <p className="text-stone-500 font-serif italic">Loading your resume library...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-serif font-light text-stone-900 mb-2">My Resumes</h1>
          <p className="text-stone-500">Manage and access all your created and tailored resumes.</p>
        </div>
        <Link 
          to="/resume-builder" 
          className="px-6 py-3 bg-stone-900 text-white rounded-full font-medium hover:bg-stone-800 transition-all flex items-center gap-2 shadow-lg shadow-stone-200"
        >
          <Plus size={20} /> Create New Resume
        </Link>
      </header>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-3xl border border-stone-100 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="flex-1 flex items-center gap-3 px-4 py-2 bg-stone-50 rounded-2xl border border-stone-100 focus-within:ring-2 focus-within:ring-stone-900 transition-all">
          <Search size={20} className="text-stone-400" />
          <input 
            type="text" 
            placeholder="Search by title or job..." 
            className="flex-1 bg-transparent border-none outline-none text-stone-900"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Resume Grid */}
      {filteredResumes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredResumes.map((resume, i) => (
            <motion.div 
              key={resume.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="group bg-white rounded-[32px] border border-stone-100 shadow-sm hover:shadow-xl hover:shadow-stone-100 transition-all overflow-hidden flex flex-col"
            >
              <div className="p-8 flex-1">
                <div className="flex justify-between items-start mb-6">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center",
                    resume.isBase ? "bg-stone-900 text-white" : "bg-stone-100 text-stone-600"
                  )}>
                    {resume.isTailored ? <Sparkles size={24} /> : <FileText size={24} />}
                  </div>
                  <div className="flex items-center gap-2">
                    {resume.isBase && (
                      <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400 py-1 px-2 bg-stone-50 rounded-lg">
                        Base
                      </span>
                    )}
                    {resume.isTailored && (
                      <span className="text-[10px] font-bold uppercase tracking-widest text-blue-400 py-1 px-2 bg-blue-50 rounded-lg">
                        Tailored
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-serif font-medium text-stone-900 group-hover:text-stone-600 transition-colors truncate">
                    {resume.title}
                  </h3>
                  {!resume.isBase && (
                    <button 
                      onClick={() => resume.id && setResumeToSetBase(resume.id)}
                      disabled={updatingId !== null}
                      className="text-[10px] font-bold uppercase tracking-widest text-stone-400 hover:text-stone-900 transition-colors disabled:opacity-50"
                      title="Set as your primary base resume"
                    >
                      {updatingId === resume.id ? "Setting..." : "Set as Base"}
                    </button>
                  )}
                </div>
                
                {resume.targetJob && (
                  <p className="text-sm text-stone-500 mb-4 line-clamp-1">
                    Target: {resume.targetJob}
                  </p>
                )}

                <div className="flex items-center gap-2 text-xs text-stone-400">
                  <Clock size={14} />
                  <span>Updated {new Date(resume.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="p-4 bg-stone-50 border-t border-stone-100 flex gap-2">
                <Link 
                  to={`/resume/${resume.id}`}
                  className="flex-1 py-2 bg-white border border-stone-200 text-stone-700 rounded-xl text-sm font-medium hover:bg-stone-100 transition-colors flex items-center justify-center gap-2"
                >
                  <ExternalLink size={16} /> View
                </Link>
                <button 
                  onClick={() => navigate(`/resume-builder?id=${resume.id}`)}
                  className="p-2 bg-white border border-stone-200 text-stone-700 rounded-xl hover:bg-stone-100 transition-colors"
                  title="Edit Resume"
                >
                  <Edit2 size={16} />
                </button>
                <button 
                  onClick={() => resume.id && setConfirmDeleteId(resume.id)}
                  disabled={deletingId === resume.id}
                  className="p-2 bg-white border border-stone-200 text-red-600 rounded-xl hover:bg-red-50 transition-colors disabled:opacity-50"
                  title="Delete Resume"
                >
                  <Trash2 size={16} className={deletingId === resume.id ? "animate-pulse" : ""} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-[40px] border border-stone-100 shadow-sm">
          <div className="w-20 h-20 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <FileText size={40} className="text-stone-300" />
          </div>
          <h3 className="text-xl font-serif text-stone-900 mb-2">No resumes found</h3>
          <p className="text-stone-500 mb-8 max-w-md mx-auto">
            {searchQuery ? "Try adjusting your search query to find what you're looking for." : "Start by creating your first professional resume with our AI builder."}
          </p>
          {!searchQuery && (
            <Link 
              to="/resume-builder" 
              className="px-8 py-3 bg-stone-900 text-white rounded-full font-medium hover:bg-stone-800 transition-all inline-flex items-center gap-2"
            >
              <Plus size={20} /> Create Your First Resume
            </Link>
          )}
        </div>
      )}
      {/* Set as Base Confirmation Modal */}
      <AnimatePresence>
        {resumeToSetBase && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[32px] p-8 max-w-md w-full shadow-2xl"
            >
              <div className="w-16 h-16 bg-stone-100 rounded-2xl flex items-center justify-center text-stone-900 mb-6">
                <Sparkles size={32} />
              </div>
              <h3 className="text-2xl font-serif font-light text-stone-900 mb-2">Set as Base Resume?</h3>
              <p className="text-stone-500 mb-8">
                This will make this resume your primary version for tailoring. Any existing base resume will be unmarked.
              </p>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => setResumeToSetBase(null)}
                  className="flex-1 px-6 py-3 border border-stone-200 text-stone-600 rounded-2xl font-medium hover:bg-stone-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSetBase}
                  disabled={updatingId !== null}
                  className="flex-1 px-6 py-3 bg-stone-900 text-white rounded-2xl font-medium hover:bg-stone-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {updatingId ? (
                    <>Updating... <Loader2 size={18} className="animate-spin" /></>
                  ) : (
                    'Confirm'
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {confirmDeleteId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[32px] p-8 max-w-sm w-full shadow-2xl text-center"
            >
              <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trash2 size={32} />
              </div>
              <h3 className="text-2xl font-serif font-light text-stone-900 mb-2">Delete Resume?</h3>
              <p className="text-stone-500 text-sm mb-8">
                Are you sure you want to delete this resume? This action cannot be undone.
              </p>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => setConfirmDeleteId(null)}
                  className="flex-1 py-3 border border-stone-200 text-stone-600 rounded-full font-medium hover:bg-stone-50 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => handleDelete(confirmDeleteId)}
                  disabled={!!deletingId}
                  className="flex-1 py-3 bg-red-600 text-white rounded-full font-medium hover:bg-red-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {deletingId ? "Deleting..." : "Delete"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
