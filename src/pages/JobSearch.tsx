import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Search, MapPin, Briefcase, Filter, ChevronRight, Save, ExternalLink, Sparkles, Loader2, Info, Navigation } from 'lucide-react';
import { jobProvider } from '../services/jobProviderService';
import { JobListing } from '../types';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';
import { auth } from '../lib/firebase';
import { firestoreService } from '../services/firestoreService';
import { geminiService } from '../services/geminiService';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';

export default function JobSearch() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [loading, setLoading] = useState(false);
  const [tailoring, setTailoring] = useState(false);
  const [selectedJob, setSelectedJob] = useState<JobListing | null>(null);
  const [companyInsights, setCompanyInsights] = useState<string>('');
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [nearbyLocations, setNearbyLocations] = useState<any[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [activeTab, setActiveTab] = useState<'description' | 'insights' | 'locations'>('description');
  const [queryRecommendations, setQueryRecommendations] = useState<string[]>([]);
  const [locationRecommendations, setLocationRecommendations] = useState<string[]>([]);
  const [showQueryRecs, setShowQueryRecs] = useState(false);
  const [showLocationRecs, setShowLocationRecs] = useState(false);

  const queryRef = useRef<HTMLDivElement>(null);
  const locationRef = useRef<HTMLDivElement>(null);

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setLoading(true);
    setShowQueryRecs(false);
    setShowLocationRecs(false);
    try {
      const results = await jobProvider.search(query, location);
      setJobs(results);
      if (results.length > 0) {
        setSelectedJob(results[0]);
      } else {
        setSelectedJob(null);
      }
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveJob = async () => {
    if (!auth.currentUser || !selectedJob) return;
    try {
      await firestoreService.saveApplication({
        uid: auth.currentUser.uid,
        jobId: selectedJob.id,
        status: 'saved',
        jobSnapshot: selectedJob
      });
      toast.success('Job saved to your tracker!');
    } catch (error) {
      console.error('Failed to save job:', error);
      toast.error('Failed to save job');
    }
  };

  const handleTailorResume = async () => {
    if (!auth.currentUser || !selectedJob) return;
    setTailoring(true);
    try {
      const profile = await firestoreService.getProfile(auth.currentUser.uid);
      if (!profile) {
        toast.error('Please complete your profile first');
        navigate('/resume-builder');
        return;
      }

      const resumes = await firestoreService.getResumes(auth.currentUser.uid);
      let baseResumeContent: any;
      
      if (resumes.length > 0) {
        baseResumeContent = resumes[0].content;
      } else {
        baseResumeContent = await geminiService.generateBaseResume(profile);
      }

      const tailored = await geminiService.tailorResume(baseResumeContent, selectedJob.description);
      
      const resumeId = await firestoreService.saveResume({
        uid: auth.currentUser.uid,
        title: `Tailored: ${selectedJob.title} at ${selectedJob.company}`,
        content: tailored.content,
        targetJob: selectedJob.title,
        isBase: false,
        isTailored: true,
        tailoringNotes: tailored.notes
      });

      // Also save as an application in 'ready' status
      await firestoreService.saveApplication({
        uid: auth.currentUser.uid,
        jobId: selectedJob.id,
        status: 'ready',
        resumeId: resumeId,
        jobSnapshot: selectedJob
      });

      navigate(`/resume/${resumeId}`);
    } catch (error) {
      console.error('Tailoring failed:', error);
      toast.error('Failed to tailor resume');
    } finally {
      setTailoring(false);
    }
  };

  const fetchInsights = async (company: string) => {
    setLoadingInsights(true);
    try {
      const insights = await geminiService.getCompanyInsights(company);
      setCompanyInsights(insights);
    } catch (error: any) {
      console.error('Failed to fetch insights:', error);
      const isQuotaExceeded = error.message?.includes('429') || error.status === 429 || error.error?.code === 429;
      setCompanyInsights(isQuotaExceeded 
        ? "### Quota Exceeded\n\nWe've reached our AI search limit for now. Please try again in a few minutes or check back later today. In the meantime, you can still view the job description and apply!" 
        : "Failed to fetch company insights. Please try again later.");
    } finally {
      setLoadingInsights(false);
    }
  };

  const fetchNearby = async (company: string) => {
    setLoadingLocations(true);
    try {
      let userLoc: { lat: number; lng: number } | undefined;
      
      if ("geolocation" in navigator) {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        });
        userLoc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      }

      const locations = await geminiService.getNearbyLocations(company, userLoc);
      setNearbyLocations(locations);
    } catch (error: any) {
      console.error('Failed to fetch locations:', error);
      const isQuotaExceeded = error.message?.includes('429') || error.status === 429 || error.error?.code === 429;
      setNearbyLocations(isQuotaExceeded ? [{
        web: { title: "Quota Exceeded", uri: "We've reached our AI mapping limit. Please try again later." }
      }] : []);
    } finally {
      setLoadingLocations(false);
    }
  };

  useEffect(() => {
    if (selectedJob) {
      setCompanyInsights('');
      setNearbyLocations([]);
      setActiveTab('description');
    }
  }, [selectedJob]);

  useEffect(() => {
    if (selectedJob && activeTab === 'insights' && !companyInsights) {
      fetchInsights(selectedJob.company);
    }
    if (selectedJob && activeTab === 'locations' && nearbyLocations.length === 0) {
      fetchNearby(selectedJob.company);
    }
  }, [selectedJob, activeTab]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (queryRef.current && !queryRef.current.contains(event.target as Node)) {
        setShowQueryRecs(false);
      }
      if (locationRef.current && !locationRef.current.contains(event.target as Node)) {
        setShowLocationRecs(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchQueryRecs = async () => {
      if (query.length >= 2) {
        const recs = await jobProvider.getRecommendations(query);
        setQueryRecommendations(recs);
      } else {
        setQueryRecommendations([]);
      }
    };
    const timer = setTimeout(fetchQueryRecs, 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const fetchLocationRecs = async () => {
      if (location.length >= 2) {
        const recs = await jobProvider.getLocationRecommendations(location);
        setLocationRecommendations(recs);
      } else {
        setLocationRecommendations([]);
      }
    };
    const timer = setTimeout(fetchLocationRecs, 300);
    return () => clearTimeout(timer);
  }, [location]);

  useEffect(() => {
    handleSearch();
  }, []);

  return (
    <div className="max-w-7xl mx-auto h-[calc(100vh-128px)] flex flex-col">
      <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-serif font-light text-stone-900 mb-2">Find your next role.</h1>
          <p className="text-stone-500">Search across thousands of jobs and tailor your resume instantly.</p>
        </div>
      </header>

      {/* Search Bar */}
      <div className="relative z-50">
        <form onSubmit={handleSearch} className="bg-white p-4 rounded-3xl border border-stone-100 shadow-sm flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1 relative" ref={queryRef}>
            <div className="flex items-center gap-3 px-4 py-2 bg-stone-50 rounded-2xl border border-stone-100 focus-within:ring-2 focus-within:ring-stone-900 transition-all">
              <Search size={20} className="text-stone-400" />
              <input 
                type="text" 
                placeholder="Job title, keywords, or company" 
                className="flex-1 bg-transparent border-none outline-none text-stone-900"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setShowQueryRecs(true);
                }}
                onFocus={() => setShowQueryRecs(true)}
              />
            </div>
            {showQueryRecs && queryRecommendations.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-stone-100 rounded-2xl shadow-xl overflow-hidden z-50">
                {queryRecommendations.map((rec, i) => (
                  <button
                    key={i}
                    type="button"
                    className="w-full text-left px-6 py-3 hover:bg-stone-50 text-stone-700 transition-colors border-b border-stone-50 last:border-none"
                    onClick={() => {
                      setQuery(rec);
                      setShowQueryRecs(false);
                    }}
                  >
                    {rec}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex-1 relative" ref={locationRef}>
            <div className="flex items-center gap-3 px-4 py-2 bg-stone-50 rounded-2xl border border-stone-100 focus-within:ring-2 focus-within:ring-stone-900 transition-all">
              <MapPin size={20} className="text-stone-400" />
              <input 
                type="text" 
                placeholder="Location or Remote" 
                className="flex-1 bg-transparent border-none outline-none text-stone-900"
                value={location}
                onChange={(e) => {
                  setLocation(e.target.value);
                  setShowLocationRecs(true);
                }}
                onFocus={() => setShowLocationRecs(true)}
              />
            </div>
            {showLocationRecs && locationRecommendations.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-stone-100 rounded-2xl shadow-xl overflow-hidden z-50">
                {locationRecommendations.map((rec, i) => (
                  <button
                    key={i}
                    type="button"
                    className="w-full text-left px-6 py-3 hover:bg-stone-50 text-stone-700 transition-colors border-b border-stone-50 last:border-none"
                    onClick={() => {
                      setLocation(rec);
                      setShowLocationRecs(false);
                    }}
                  >
                    {rec}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button type="submit" className="px-8 py-3 bg-stone-900 text-white rounded-2xl font-medium hover:bg-stone-800 transition-colors">
            Search Jobs
          </button>
        </form>
      </div>

      <div className="flex-1 flex gap-8 overflow-hidden">
        {/* Job List */}
        <div className="w-full lg:w-1/3 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-6 bg-white rounded-3xl border border-stone-100 animate-pulse">
                <div className="h-6 bg-stone-100 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-stone-100 rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-stone-100 rounded w-1/3"></div>
              </div>
            ))
          ) : jobs.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-stone-100">
              <p className="text-stone-500 italic">No jobs found matching your criteria.</p>
            </div>
          ) : (
            jobs.map((job) => (
              <motion.div 
                key={job.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={() => setSelectedJob(job)}
                className={cn(
                  "p-6 bg-white rounded-3xl border transition-all cursor-pointer group",
                  selectedJob?.id === job.id 
                    ? "border-stone-900 shadow-lg shadow-stone-100 ring-1 ring-stone-900" 
                    : "border-stone-100 hover:border-stone-300"
                )}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="w-10 h-10 bg-stone-100 rounded-xl flex items-center justify-center text-stone-400 font-bold">
                    {job.company[0]}
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400 py-1 px-2 bg-stone-50 rounded-lg">
                    {job.type}
                  </span>
                </div>
                <h3 className="font-medium text-stone-900 mb-1 group-hover:text-stone-600 transition-colors">{job.title}</h3>
                <p className="text-sm text-stone-500 mb-4">{job.company}</p>
                <div className="flex items-center gap-4 text-xs text-stone-400">
                  <span className="flex items-center gap-1"><MapPin size={12} /> {job.location}</span>
                  <span className="flex items-center gap-1"><Briefcase size={12} /> {job.salary}</span>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Job Detail */}
        <div className="hidden lg:block flex-1 bg-white rounded-3xl border border-stone-100 shadow-sm overflow-y-auto custom-scrollbar">
          {selectedJob ? (
            <div className="p-10">
              <div className="flex justify-between items-start mb-10">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-stone-100 rounded-2xl flex items-center justify-center text-stone-400 text-2xl font-bold">
                    {selectedJob.company[0]}
                  </div>
                  <div>
                    <h2 className="text-3xl font-serif font-light text-stone-900 mb-1">{selectedJob.title}</h2>
                    <p className="text-lg text-stone-500">{selectedJob.company} • {selectedJob.location}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={handleSaveJob}
                    className="p-3 border border-stone-200 rounded-2xl text-stone-600 hover:bg-stone-50 transition-colors"
                  >
                    <Save size={20} />
                  </button>
                  <a 
                    href={selectedJob.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    onClick={async () => {
                      // Track that they clicked apply
                      if (auth.currentUser) {
                        await firestoreService.saveApplication({
                          uid: auth.currentUser.uid,
                          jobId: selectedJob.id,
                          status: 'applied',
                          appliedAt: new Date().toISOString(),
                          jobSnapshot: selectedJob
                        });
                      }
                    }}
                    className="px-6 py-3 bg-stone-900 text-white rounded-2xl font-medium hover:bg-stone-800 transition-colors flex items-center gap-2"
                  >
                    Apply on {selectedJob.source} <ExternalLink size={18} />
                  </a>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-8 mb-12">
                <div className="p-6 bg-stone-50 rounded-2xl border border-stone-100">
                  <p className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-2">Salary Range</p>
                  <p className="text-stone-900 font-medium">{selectedJob.salary}</p>
                </div>
                <div className="p-6 bg-stone-50 rounded-2xl border border-stone-100">
                  <p className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-2">Job Type</p>
                  <p className="text-stone-900 font-medium">{selectedJob.type}</p>
                </div>
                <div className="p-6 bg-stone-50 rounded-2xl border border-stone-100">
                  <p className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-2">Posted</p>
                  <p className="text-stone-900 font-medium">2 days ago</p>
                </div>
              </div>

              <div className="space-y-8">
                <div className="p-8 bg-stone-900 text-white rounded-3xl flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-medium mb-1 italic font-serif">Tailor your resume for this role.</h3>
                    <p className="text-stone-400 text-sm">Our AI will optimize your experience for this specific job description.</p>
                  </div>
                  <button 
                    onClick={handleTailorResume}
                    disabled={tailoring}
                    className="px-8 py-4 bg-white text-stone-900 rounded-full font-bold hover:bg-stone-100 transition-all flex items-center gap-2 shadow-lg disabled:opacity-50"
                  >
                    {tailoring ? (
                      <>Tailoring... <Loader2 size={20} className="animate-spin" /></>
                    ) : (
                      <>Tailor Resume <Sparkles size={20} /></>
                    )}
                  </button>
                </div>

                <div>
                  <div className="flex border-b border-stone-100 mb-8">
                    <button 
                      onClick={() => setActiveTab('description')}
                      className={cn(
                        "px-6 py-3 text-sm font-medium transition-all border-b-2",
                        activeTab === 'description' ? "border-stone-900 text-stone-900" : "border-transparent text-stone-400 hover:text-stone-600"
                      )}
                    >
                      Description
                    </button>
                    <button 
                      onClick={() => setActiveTab('insights')}
                      className={cn(
                        "px-6 py-3 text-sm font-medium transition-all border-b-2 flex items-center gap-2",
                        activeTab === 'insights' ? "border-stone-900 text-stone-900" : "border-transparent text-stone-400 hover:text-stone-600"
                      )}
                    >
                      <Info size={14} /> Company Insights
                    </button>
                    <button 
                      onClick={() => setActiveTab('locations')}
                      className={cn(
                        "px-6 py-3 text-sm font-medium transition-all border-b-2 flex items-center gap-2",
                        activeTab === 'locations' ? "border-stone-900 text-stone-900" : "border-transparent text-stone-400 hover:text-stone-600"
                      )}
                    >
                      <Navigation size={14} /> Nearby Offices
                    </button>
                  </div>

                  {activeTab === 'description' && (
                    <div>
                      <h3 className="text-xl font-serif font-light text-stone-900 mb-4">About the Role</h3>
                      <div className="text-stone-600 leading-relaxed space-y-4 whitespace-pre-wrap">
                        {selectedJob.description}
                      </div>
                    </div>
                  )}

                  {activeTab === 'insights' && (
                    <div className="bg-stone-50 p-8 rounded-3xl border border-stone-100">
                      {loadingInsights ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-4">
                          <Loader2 size={32} className="animate-spin text-stone-400" />
                          <p className="text-stone-500 italic">Gathering intelligence from Google Search...</p>
                        </div>
                      ) : (
                        <div className="prose prose-stone max-w-none">
                          <ReactMarkdown>{companyInsights}</ReactMarkdown>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'locations' && (
                    <div className="bg-stone-50 p-8 rounded-3xl border border-stone-100">
                      {loadingLocations ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-4">
                          <Loader2 size={32} className="animate-spin text-stone-400" />
                          <p className="text-stone-500 italic">Mapping locations with Google Maps...</p>
                        </div>
                      ) : nearbyLocations.length > 0 ? (
                        <div className="space-y-4">
                          {nearbyLocations.map((loc, i) => (
                            <div key={i} className="p-4 bg-white rounded-2xl border border-stone-100 flex items-start gap-4">
                              <div className="p-2 bg-stone-50 rounded-lg text-stone-400">
                                <MapPin size={20} />
                              </div>
                              <div>
                                <h4 className="font-medium text-stone-900">{loc.maps?.title || loc.web?.title}</h4>
                                <p className="text-sm text-stone-500">{loc.maps?.uri || loc.web?.uri}</p>
                                {loc.maps?.uri && (
                                  <a 
                                    href={loc.maps.uri} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-xs text-stone-400 hover:text-stone-900 underline mt-2 inline-block"
                                  >
                                    View on Google Maps
                                  </a>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12 text-stone-500 italic">
                          No nearby locations found.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-stone-400 italic">
              Select a job to view details
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
