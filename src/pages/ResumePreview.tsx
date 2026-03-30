import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { Resume, ResumeContent, JobListing } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Download, Edit2, Share2, ChevronLeft, FileText, Sparkles, Loader2, Target, MapPin, Mail, Phone, Globe, ExternalLink, Trash2 } from 'lucide-react';
import { openaiService } from '../services/openaiService';
import { firestoreService } from '../services/firestoreService';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import jsPDF from 'jspdf';
import { toPng } from 'html-to-image';

export default function ResumePreview() {
  const { userData } = useAuth();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const resumeRef = useRef<HTMLDivElement>(null);
  const clRef = useRef<HTMLDivElement>(null);
  const [resume, setResume] = useState<Resume | null>(null);
  const [loading, setLoading] = useState(true);
  const [isTailoring, setIsTailoring] = useState(false);
  const [isGeneratingCL, setIsGeneratingCL] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [tailorJobUrl, setTailorJobUrl] = useState('');
  const [showTailorModal, setShowTailorModal] = useState(false);
  const [showCLModal, setShowCLModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');

  useEffect(() => {
    const fetchResume = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, 'resumes', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setResume({ id: docSnap.id, ...docSnap.data() } as Resume);
        }
      } catch (error) {
        console.error('Error fetching resume:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchResume();
  }, [id]);

  const handleTailor = async () => {
    if (!resume || !tailorJobUrl || !auth.currentUser) return;
    
    if (userData?.plan === 'free') {
      toast.error('AI Tailoring is a Pro feature. Please upgrade to use this tool.');
      navigate('/pricing');
      return;
    }
    
    setIsTailoring(true);
    try {
      // In a real app, we might fetch the job details from the URL first
      // For now, we'll pass the URL to our backend which can handle it
      const { content: tailoredContent, notes } = await openaiService.tailorResume(resume.content, tailorJobUrl);
      
      const newResumeId = await firestoreService.saveResume({
        uid: auth.currentUser.uid,
        title: `${resume.title} (Tailored)`,
        content: tailoredContent,
        templateId: resume.templateId,
        style: resume.style,
        isBase: false,
        isTailored: true,
        targetJob: tailorJobUrl,
        tailoringNotes: notes
      });

      navigate(`/resume/${newResumeId}`);
      setShowTailorModal(false);
      toast.success('Resume tailored successfully!');
    } catch (error: any) {
      console.error('Failed to tailor resume:', error);
      const errorMessage = error.message?.toLowerCase() || "";
      if (errorMessage.includes('rpc failed') || errorMessage.includes('xhr error') || errorMessage.includes('deadline exceeded')) {
        toast.error('AI service is temporarily busy. Please try again in a moment.', { duration: 5000 });
      } else if (errorMessage.includes('429')) {
        toast.error('Rate limit reached. Please wait a minute and try again.');
      } else {
        toast.error('Failed to tailor resume. Please check your connection and try again.');
      }
    } finally {
      setIsTailoring(false);
    }
  };

  const handleGenerateCL = async () => {
    if (!resume || !auth.currentUser) return;
    
    if (userData?.plan === 'free') {
      toast.error('Cover Letter Generation is a Pro feature. Please upgrade to use this tool.');
      navigate('/pricing');
      return;
    }
    
    // We'll use the targetJob if it exists, otherwise ask for a description
    let jobDesc = resume.targetJob || '';
    
    if (!jobDesc) {
      setShowCLModal(true);
      return;
    }

    setIsGeneratingCL(true);
    try {
      const clText = await openaiService.generateCoverLetter(resume.content, jobDesc);
      setCoverLetter(clText);
      setShowCLModal(true);
      
      // Optionally save to Firestore
      await firestoreService.saveCoverLetter({
        uid: auth.currentUser.uid,
        resumeId: resume.id,
        title: `Cover Letter for ${resume.title}`,
        content: clText,
        jobId: resume.targetJob // This might be a URL or ID
      });
      toast.success('Cover letter generated!');
    } catch (error: any) {
      console.error('Failed to generate cover letter:', error);
      const errorMessage = error.message?.toLowerCase() || "";
      if (errorMessage.includes('rpc failed') || errorMessage.includes('xhr error') || errorMessage.includes('deadline exceeded')) {
        toast.error('AI service is temporarily busy. Please try again in a moment.', { duration: 5000 });
      } else if (errorMessage.includes('429')) {
        toast.error('Rate limit reached. Please wait a minute and try again.');
      } else {
        toast.error('Failed to generate cover letter. Please check your connection and try again.');
      }
    } finally {
      setIsGeneratingCL(false);
    }
  };

  const handleExport = async () => {
    if (!resumeRef.current || !resume) return;
    
    if (userData?.plan === 'free') {
      toast.error('PDF Export is a Pro feature. Please upgrade to download your resume.');
      navigate('/pricing');
      return;
    }

    setIsExporting(true);
    const toastId = toast.loading('Generating PDF...');
    
    try {
      const element = resumeRef.current;
      
      // Wait for fonts to be ready to avoid rendering issues and potential CORS errors
      await document.fonts.ready;
      
      const dataUrl = await toPng(element, {
        quality: 1,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
        cacheBust: true, // Help with some caching issues
      });
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(dataUrl);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${resume.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('Resume exported successfully!', { id: toastId });
    } catch (error) {
      console.error('Failed to export PDF:', error);
      toast.error('Failed to generate PDF. Please try again.', { id: toastId });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportCL = async () => {
    if (!clRef.current || !coverLetter) return;
    
    if (userData?.plan === 'free') {
      toast.error('PDF Export is a Pro feature. Please upgrade to download your cover letter.');
      navigate('/pricing');
      return;
    }

    setIsExporting(true);
    const toastId = toast.loading('Generating PDF...');
    
    try {
      const element = clRef.current;
      
      // Wait for fonts to be ready to avoid rendering issues and potential CORS errors
      await document.fonts.ready;
      
      const dataUrl = await toPng(element, {
        quality: 1,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
        cacheBust: true, // Help with some caching issues
      });
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(dataUrl);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Cover_Letter_${resume?.title.replace(/\s+/g, '_') || 'resume'}_${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('Cover letter exported successfully!', { id: toastId });
    } catch (error) {
      console.error('Failed to export PDF:', error);
      toast.error('Failed to generate PDF. Please try again.', { id: toastId });
    } finally {
      setIsExporting(false);
    }
  };

  const handleDelete = async () => {
    if (!resume || !auth.currentUser) return;
    
    setIsDeleting(true);
    try {
      await firestoreService.deleteResume(resume.id!);
      toast.success('Resume deleted');
      navigate('/dashboard');
    } catch (error) {
      console.error('Failed to delete resume:', error);
      toast.error('Failed to delete resume');
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 size={48} className="text-stone-400 animate-spin" />
        <p className="text-stone-500 font-serif italic">Loading your resume...</p>
      </div>
    );
  }

  if (!resume) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-serif text-stone-900 mb-4">Resume not found</h2>
        <Link to="/dashboard" className="text-stone-600 underline">Return to Dashboard</Link>
      </div>
    );
  }

  const { content } = resume;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className="p-2 hover:bg-stone-100 rounded-full transition-colors">
            <ChevronLeft size={24} />
          </Link>
          <div>
            <h1 className="text-3xl font-serif font-light text-stone-900">{resume.title}</h1>
            <p className="text-stone-500 text-sm">
              {resume.isBase ? 'Base Resume' : 'Tailored Version'} • Updated on {new Date(resume.updatedAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleExport}
            disabled={isExporting}
            className="px-6 py-2 border border-stone-200 rounded-full text-stone-700 hover:bg-stone-50 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {isExporting ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
            {isExporting ? 'Exporting...' : 'Export PDF'}
          </button>
          <Link to="/resume-builder" className="px-6 py-2 bg-stone-900 text-white rounded-full font-medium hover:bg-stone-800 transition-colors flex items-center gap-2">
            <Edit2 size={18} /> Edit Content
          </Link>
          <button 
            onClick={() => setShowDeleteModal(true)}
            className="p-2 border border-red-100 text-red-600 rounded-full hover:bg-red-50 transition-colors"
            title="Delete Resume"
          >
            <Trash2 size={20} />
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar / Actions */}
        <div className="space-y-6">
          <div className="p-6 bg-white rounded-3xl border border-stone-100 shadow-sm">
            <h3 className="text-sm font-bold uppercase tracking-widest text-stone-400 mb-4">AI Tools</h3>
            <div className="space-y-2">
              <motion.button 
                whileHover={{ x: 5, backgroundColor: 'rgba(245, 245, 244, 1)' }}
                onClick={() => setShowTailorModal(true)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium text-stone-700 transition-all"
              >
                <Sparkles size={18} className="text-stone-400" /> Tailor for Job
              </motion.button>
              <motion.button 
                whileHover={{ x: 5, backgroundColor: 'rgba(245, 245, 244, 1)' }}
                onClick={handleGenerateCL}
                disabled={isGeneratingCL}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium text-stone-700 transition-all disabled:opacity-50"
              >
                {isGeneratingCL ? (
                  <Loader2 size={18} className="text-stone-400 animate-spin" />
                ) : (
                  <FileText size={18} className="text-stone-400" />
                )}
                Generate Cover Letter
              </motion.button>
            </div>
          </div>

          <div className="p-6 bg-stone-900 text-white rounded-3xl shadow-xl">
            <h3 className="text-lg font-serif italic mb-2">Pro Tip</h3>
            <p className="text-stone-400 text-xs leading-relaxed">
              Tailoring your resume for each job description can increase your interview rate by up to 40%.
            </p>
          </div>
        </div>

        {/* Resume Content Renderer */}
        <div className="lg:col-span-3">
          <motion.div 
            ref={resumeRef}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-12 rounded-[40px] border border-stone-100 shadow-xl shadow-stone-100 min-h-[1000px] font-sans text-stone-800"
          >
            {/* Header */}
            <section className="text-center mb-10 border-b border-stone-100 pb-10">
              <h1 className="text-4xl font-serif font-medium text-stone-900 mb-4">{content.basics.name}</h1>
              <div className="flex flex-wrap justify-center gap-4 text-sm text-stone-500">
                {content.basics.location && <span className="flex items-center gap-1"><MapPin size={14} /> {content.basics.location}</span>}
                <span className="flex items-center gap-1"><Mail size={14} /> {content.basics.email}</span>
                {content.basics.phone && <span className="flex items-center gap-1"><Phone size={14} /> {content.basics.phone}</span>}
                {content.basics.url && <span className="flex items-center gap-1"><Globe size={14} /> {content.basics.url}</span>}
              </div>
            </section>

            {/* Summary */}
            <section className="mb-10">
              <h2 className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-4 border-b border-stone-50 pb-2">Professional Summary</h2>
              <p className="text-stone-700 leading-relaxed">{content.basics.summary}</p>
            </section>

            {/* Skills */}
            <section className="mb-10">
              <h2 className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-4 border-b border-stone-50 pb-2">Skills</h2>
              <div className="grid grid-cols-2 gap-6">
                {content.skills.map((skillGroup, i) => (
                  <div key={i}>
                    <h4 className="text-sm font-bold text-stone-900 mb-2">{skillGroup.name}</h4>
                    <div className="flex flex-wrap gap-2">
                      {skillGroup.keywords?.map((keyword, j) => (
                        <span key={j} className="text-sm text-stone-600">{keyword}{j < (skillGroup.keywords?.length || 0) - 1 ? ' • ' : ''}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Experience */}
            <section className="mb-10">
              <h2 className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-6 border-b border-stone-50 pb-2">Experience</h2>
              <div className="space-y-8">
                {content.work.map((job, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between items-baseline">
                      <h3 className="font-bold text-stone-900">{job.position}</h3>
                      <span className="text-sm text-stone-500">{job.startDate} — {job.endDate || 'Present'}</span>
                    </div>
                    <div className="text-sm font-medium text-stone-600">{job.name}</div>
                    <p className="text-sm text-stone-700 mb-2">{job.summary}</p>
                    {job.highlights && (
                      <ul className="list-disc list-outside ml-4 space-y-1">
                        {job.highlights.map((highlight, j) => (
                          <li key={j} className="text-sm text-stone-700 pl-1">{highlight}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* Projects */}
            {content.projects && content.projects.length > 0 && (
              <section className="mb-10">
                <h2 className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-6 border-b border-stone-50 pb-2">Projects</h2>
                <div className="space-y-8">
                  {content.projects.map((project, i) => (
                    <div key={i} className="space-y-2">
                      <div className="flex justify-between items-baseline">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-stone-900">{project.name}</h3>
                          {project.url && (
                            <a href={project.url} target="_blank" rel="noopener noreferrer" className="text-stone-400 hover:text-stone-600 transition-colors">
                              <ExternalLink size={14} />
                            </a>
                          )}
                        </div>
                        {project.date && <span className="text-sm text-stone-500">{project.date}</span>}
                      </div>
                      <p className="text-sm text-stone-700 mb-2">{project.description}</p>
                      {project.highlights && (
                        <ul className="list-disc list-outside ml-4 space-y-1">
                          {project.highlights.map((highlight, j) => (
                            <li key={j} className="text-sm text-stone-700 pl-1">{highlight}</li>
                          ))}
                        </ul>
                      )}
                      {project.keywords && project.keywords.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {project.keywords.map((keyword, j) => (
                            <span key={j} className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-stone-50 text-stone-500 rounded border border-stone-100">
                              {keyword}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Education */}
            <section className="mb-10">
              <h2 className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-6 border-b border-stone-50 pb-2">Education</h2>
              <div className="space-y-6">
                {content.education.map((edu, i) => (
                  <div key={i}>
                    <div className="flex justify-between items-baseline">
                      <h3 className="font-bold text-stone-900">{edu.institution}</h3>
                      <span className="text-sm text-stone-500">{edu.startDate} — {edu.endDate || 'Present'}</span>
                    </div>
                    <div className="text-sm text-stone-600">{edu.studyType} in {edu.area}</div>
                  </div>
                ))}
              </div>
            </section>

            {/* Coursework */}
            {content.coursework && content.coursework.length > 0 && (
              <section>
                <h2 className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-4 border-b border-stone-50 pb-2">Relevant Coursework</h2>
                <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                  {content.coursework.map((course, i) => (
                    <div key={i}>
                      <h4 className="text-sm font-bold text-stone-900">{course.name}</h4>
                      {course.description && <p className="text-xs text-stone-600 mt-1">{course.description}</p>}
                    </div>
                  ))}
                </div>
              </section>
            )}
          </motion.div>
        </div>
      </div>

      {/* Tailor Modal */}
      <AnimatePresence>
        {showTailorModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[32px] p-8 max-w-lg w-full shadow-2xl"
            >
              <h3 className="text-2xl font-serif font-light text-stone-900 mb-2">Tailor for Job</h3>
              <p className="text-stone-500 text-sm mb-6">Enter the job listing URL or description to optimize your resume for this specific role.</p>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-stone-400">Job URL or Description</label>
                  <textarea 
                    value={tailorJobUrl}
                    onChange={(e) => setTailorJobUrl(e.target.value)}
                    placeholder="Paste job URL or description here..."
                    className="w-full p-4 bg-stone-50 border border-stone-200 rounded-2xl h-32 focus:ring-2 focus:ring-stone-900 outline-none transition-all text-sm"
                  />
                </div>
                
                <div className="flex gap-3 pt-4">
                  <button 
                    onClick={() => setShowTailorModal(false)}
                    className="flex-1 py-3 border border-stone-200 text-stone-600 rounded-full font-medium hover:bg-stone-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleTailor}
                    disabled={isTailoring || !tailorJobUrl}
                    className="flex-1 py-3 bg-stone-900 text-white rounded-full font-medium hover:bg-stone-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isTailoring ? (
                      <>
                        <Loader2 size={18} className="animate-spin" /> Tailoring...
                      </>
                    ) : (
                      <>
                        <Sparkles size={18} /> Optimize
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Cover Letter Modal */}
      <AnimatePresence>
        {showCLModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[32px] p-8 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-hidden flex flex-col"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-serif font-light text-stone-900">Your AI Cover Letter</h3>
                <button 
                  onClick={() => setShowCLModal(false)}
                  className="p-2 hover:bg-stone-100 rounded-full transition-colors"
                >
                  <ChevronLeft size={20} className="rotate-90" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto pr-2 mb-6">
                <div 
                  ref={clRef}
                  className="bg-stone-50 p-8 rounded-2xl font-serif text-stone-800 whitespace-pre-wrap leading-relaxed"
                >
                  {coverLetter}
                </div>
              </div>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(coverLetter);
                    toast.success('Copied to clipboard!');
                  }}
                  className="flex-1 py-3 border border-stone-200 text-stone-600 rounded-full font-medium hover:bg-stone-50 transition-all flex items-center justify-center gap-2"
                >
                  <Share2 size={18} /> Copy
                </button>
                <button 
                  onClick={handleExportCL}
                  disabled={isExporting}
                  className="flex-1 py-3 border border-stone-200 text-stone-600 rounded-full font-medium hover:bg-stone-50 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isExporting ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                  Download PDF
                </button>
                <button 
                  onClick={() => setShowCLModal(false)}
                  className="flex-1 py-3 bg-stone-900 text-white rounded-full font-medium hover:bg-stone-800 transition-all"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[32px] p-8 max-w-md w-full shadow-2xl"
            >
              <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center text-red-600 mb-6">
                <Trash2 size={32} />
              </div>
              <h3 className="text-2xl font-serif font-light text-stone-900 mb-2">Delete Resume?</h3>
              <p className="text-stone-500 mb-8">
                Are you sure you want to delete "{resume.title}"? This action cannot be undone and will remove it from your library.
              </p>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-6 py-3 border border-stone-200 text-stone-600 rounded-2xl font-medium hover:bg-stone-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-1 px-6 py-3 bg-red-600 text-white rounded-2xl font-medium hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isDeleting ? (
                    <>Deleting... <Loader2 size={18} className="animate-spin" /></>
                  ) : (
                    'Delete Resume'
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
