import React, { useEffect, useState } from "react";
import { Loader2, MapPin, Search, Briefcase, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { databaseService } from "../services/databaseService";
import { openaiService } from "../services/openaiService";
import { JobListing } from "../types";
import { jobProvider } from "../services/jobProviderService";
import { useAuth } from '../hooks/useAuth';

export default function JobSearch() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [keywords, setKeywords] = useState("Software Engineer");
  const [location, setLocation] = useState("Remote");
  const [fullTimeOnly, setFullTimeOnly] = useState(false);
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [salaryMin, setSalaryMin] = useState("");

  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [selectedJob, setSelectedJob] = useState<JobListing | null>(null);
  const [loading, setLoading] = useState(false);
  const [tailoring, setTailoring] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const runSearch = async (targetPage = 1) => {
    setLoading(true);
    try {
      const result = await jobProvider.search({
        keywords,
        location,
        page: targetPage,
        resultsPerPage: 10,
        filters: {
          fullTime: fullTimeOnly,
          remote: remoteOnly,
          salaryMin: salaryMin ? Number(salaryMin) : undefined,
        },
      });

      setJobs(result.jobs);
      setSelectedJob(result.jobs[0] || null);
      setPage(result.page);
      setHasMore(result.hasMore);

      if (result.jobs.length === 0) {
        toast.info("No jobs found. Try broader keywords or location.");
      }
    } catch (error: any) {
      toast.error(error.message || "Unable to fetch jobs right now.");
      setJobs([]);
      setSelectedJob(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await runSearch(1);
  };

  const handleSaveJob = async () => {
    if (!user || !selectedJob) return;
    await databaseService.saveApplication({
      uid: user.id,
      jobId: selectedJob.id,
      status: "saved",
      jobSnapshot: selectedJob,
    });
    toast.success("Job saved to tracker.");
  };

  const handleTailorResume = async () => {
    if (!user || !selectedJob) return;
    setTailoring(true);
    try {
      const profile = await databaseService.getProfile(user.id);
      if (!profile) {
        toast.error("Please complete your profile first.");
        navigate("/resume-builder");
        return;
      }

      const resumes = await databaseService.getResumes(user.id);
      const baseResumeContent = resumes.length
        ? resumes[0].content
        : await openaiService.generateBaseResume(profile);

      const tailored = await openaiService.tailorResume(
        baseResumeContent,
        selectedJob.description,
      );

      const resumeId = await databaseService.saveResume({
        uid: user.id,
        title: `Tailored: ${selectedJob.title} at ${selectedJob.company}`,
        content: tailored.content,
        targetJob: selectedJob.title,
        isBase: false,
        isTailored: true,
        tailoringNotes: tailored.notes,
      });

      await databaseService.saveApplication({
        uid: user.id,
        jobId: selectedJob.id,
        status: "ready",
        resumeId,
        jobSnapshot: selectedJob,
      });

      navigate(`/resume/${resumeId}`);
    } catch (error) {
      toast.error("Failed to tailor resume from selected job.");
    } finally {
      setTailoring(false);
    }
  };

  useEffect(() => {
    runSearch(1);
  }, []);

  return (
    <div className="max-w-7xl mx-auto min-h-[calc(100vh-128px)] flex flex-col gap-4 md:gap-6">
      <header>
        <h1 className="text-4xl font-serif font-light text-stone-900">Job Search</h1>
        <p className="text-stone-500 mt-2">Single-provider mode: powered only by Adzuna Jobs API.</p>
      </header>

      <form onSubmit={handleSearchSubmit} className="bg-white border border-stone-200 rounded-2xl p-4 grid grid-cols-1 md:grid-cols-5 gap-3">
        <label className="md:col-span-2 flex items-center gap-2 border rounded-lg px-3">
          <Search className="text-stone-400" size={16} />
          <input className="w-full py-2 outline-none" value={keywords} onChange={(e) => setKeywords(e.target.value)} placeholder="Role or keywords" />
        </label>
        <label className="md:col-span-2 flex items-center gap-2 border rounded-lg px-3">
          <MapPin className="text-stone-400" size={16} />
          <input className="w-full py-2 outline-none" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Location" />
        </label>
        <button className="rounded-lg bg-stone-900 text-white px-4 py-2">Search</button>

        <label className="flex items-center gap-2 text-sm text-stone-600">
          <input type="checkbox" checked={remoteOnly} onChange={(e) => setRemoteOnly(e.target.checked)} />
          Remote only
        </label>
        <label className="flex items-center gap-2 text-sm text-stone-600">
          <input type="checkbox" checked={fullTimeOnly} onChange={(e) => setFullTimeOnly(e.target.checked)} />
          Full-time only
        </label>
        <label className="flex items-center gap-2 text-sm text-stone-600 md:col-span-2">
          Minimum salary
          <input
            type="number"
            className="border rounded px-2 py-1 w-36"
            value={salaryMin}
            onChange={(e) => setSalaryMin(e.target.value)}
            placeholder="e.g. 80000"
            min={0}
          />
        </label>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 min-h-0 md:min-h-[420px]">
        <div className="border rounded-2xl p-3 overflow-auto bg-white">
          {loading ? (
            <div className="flex items-center gap-2 text-stone-500"><Loader2 className="animate-spin" size={16} /> Loading jobs...</div>
          ) : (
            jobs.map((job) => (
              <button
                key={job.id}
                className={`w-full text-left border rounded-xl p-3 mb-2 ${selectedJob?.id === job.id ? "border-stone-900" : "border-stone-200"}`}
                onClick={() => setSelectedJob(job)}
              >
                <p className="font-semibold text-stone-900">{job.title}</p>
                <p className="text-sm text-stone-600">{job.company}</p>
                <p className="text-sm text-stone-500">{job.location}</p>
                <p className="text-xs text-stone-500 mt-1">{job.salary || "Salary not listed"} · {job.type || "Type not listed"}</p>
              </button>
            ))
          )}
        </div>

        <div className="border rounded-2xl p-4 bg-white overflow-auto">
          {selectedJob ? (
            <>
              <p className="text-sm text-stone-500">Provider: {selectedJob.source}</p>
              <h2 className="text-2xl font-semibold mt-1">{selectedJob.title}</h2>
              <p className="text-stone-700">{selectedJob.company}</p>
              <p className="text-stone-500 mb-4">{selectedJob.location}</p>

              <div className="flex flex-wrap gap-2 mb-4">
                <button onClick={handleSaveJob} className="px-3 py-2 rounded bg-stone-100 text-stone-800">Save</button>
                <button onClick={handleTailorResume} disabled={tailoring} className="px-3 py-2 rounded bg-stone-900 text-white flex items-center gap-2">
                  {tailoring ? <Loader2 size={14} className="animate-spin" /> : <Briefcase size={14} />}
                  Tailor Resume
                </button>
                <a href={selectedJob.url} target="_blank" rel="noreferrer" className="px-3 py-2 rounded bg-blue-600 text-white inline-flex items-center gap-2">
                  Apply Link <ExternalLink size={14} />
                </a>
              </div>

              <p className="text-sm leading-6 whitespace-pre-wrap">{selectedJob.description}</p>
            </>
          ) : (
            <p className="text-stone-500">Select a job to view details.</p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <button
          className="px-3 py-1.5 border rounded disabled:opacity-40"
          disabled={loading || page <= 1}
          onClick={() => runSearch(page - 1)}
        >
          Previous
        </button>
        <p className="text-sm text-stone-500">Page {page}</p>
        <button
          className="px-3 py-1.5 border rounded disabled:opacity-40"
          disabled={loading || !hasMore}
          onClick={() => runSearch(page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}
