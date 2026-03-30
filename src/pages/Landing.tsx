import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Briefcase, FileText, Target, BarChart3, ChevronRight } from 'lucide-react';

export default function Landing() {
  return (
    <div className="min-h-screen bg-stone-50">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 pt-24 pb-32">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-6xl font-serif font-light leading-tight text-stone-900 mb-8">
              Your AI-Powered <br />
              <span className="italic text-stone-600 font-medium">Job Hunting</span> <br />
              Copilot.
            </h1>
            <p className="text-xl text-stone-600 mb-10 leading-relaxed max-w-lg">
              Generate ATS-friendly resumes, tailor them to specific job descriptions, 
              and track your applications all in one place.
            </p>
            <div className="flex gap-4">
              <Link to="/signup" className="px-8 py-4 bg-stone-900 text-white rounded-full font-medium hover:bg-stone-800 transition-colors flex items-center gap-2">
                Get Started Free <ChevronRight size={20} />
              </Link>
              <Link to="/pricing" className="px-8 py-4 border border-stone-300 text-stone-700 rounded-full font-medium hover:bg-stone-100 transition-colors">
                View Pricing
              </Link>
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <div className="bg-white p-8 rounded-3xl shadow-xl border border-stone-200 relative z-10">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-stone-100 rounded-xl flex items-center justify-center">
                  <FileText className="text-stone-600" />
                </div>
                <div>
                  <h3 className="font-medium text-stone-900">Tailored Resume</h3>
                  <p className="text-sm text-stone-500">Optimized for Senior Product Designer</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="h-4 bg-stone-50 rounded w-full"></div>
                <div className="h-4 bg-stone-50 rounded w-5/6"></div>
                <div className="h-4 bg-stone-50 rounded w-4/6"></div>
                <div className="pt-4 flex gap-2">
                  <span className="px-3 py-1 bg-green-50 text-green-700 text-xs rounded-full border border-green-100">98% Match</span>
                  <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs rounded-full border border-blue-100">ATS Optimized</span>
                </div>
              </div>
            </div>
            <div className="absolute -top-10 -right-10 w-64 h-64 bg-stone-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
            <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-stone-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white py-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-serif font-light text-stone-900 mb-4">Everything you need to land your next role.</h2>
            <p className="text-stone-500 max-w-2xl mx-auto">Our AI-driven tools handle the tedious parts of job hunting so you can focus on the interview.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard 
              icon={<FileText />}
              title="AI Resume Builder"
              description="Create a professional, ATS-friendly resume from scratch in minutes."
            />
            <FeatureCard 
              icon={<Target />}
              title="Job Tailoring"
              description="Automatically adjust your resume for every job description you apply for."
            />
            <FeatureCard 
              icon={<Briefcase />}
              title="Job Search"
              description="Find relevant roles across multiple platforms with powerful filters."
            />
            <FeatureCard 
              icon={<BarChart3 />}
              title="Application Tracker"
              description="Keep track of every application, interview, and offer in one dashboard."
            />
          </div>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="p-8 bg-stone-50 rounded-3xl border border-stone-100 hover:shadow-lg transition-shadow">
      <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-stone-600 mb-6 shadow-sm">
        {icon}
      </div>
      <h3 className="text-xl font-medium text-stone-900 mb-3">{title}</h3>
      <p className="text-stone-500 leading-relaxed">{description}</p>
    </div>
  );
}
