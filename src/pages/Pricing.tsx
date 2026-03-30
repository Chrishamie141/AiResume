import React from 'react';
import { motion } from 'motion/react';
import { Check, ChevronRight, Sparkles, Zap, ShieldCheck, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { auth } from '../lib/firebase';
import { firestoreService } from '../services/firestoreService';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Pricing() {
  const { userData, refreshUserData } = useAuth();
  const [loading, setLoading] = React.useState<string | null>(null);
  const navigate = useNavigate();

  const handleUpgrade = async (planName: string) => {
    if (!auth.currentUser) {
      toast.error('Please log in to upgrade');
      navigate('/login');
      return;
    }

    const plan = planName.toLowerCase().includes('pro') ? 'pro' : 'free';
    
    setLoading(planName);
    try {
      if (userData) {
        await firestoreService.saveUser({ 
          ...userData,
          plan 
        });
        await refreshUserData();
        toast.success(`Successfully upgraded to ${planName}!`);
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Upgrade failed:', error);
      toast.error('Failed to upgrade. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  const plans = [
    {
      name: 'Free',
      price: '$0',
      description: 'Perfect for casual job seekers.',
      features: [
        '1 Base Resume',
        '3 Job Applications Tracking',
        'Basic Job Search',
        'Community Support',
      ],
      cta: 'Get Started',
      popular: false,
    },
    {
      name: 'Resume Pack',
      price: '$29',
      description: 'One-time payment for a polished profile.',
      features: [
        'Unlimited Base Resumes',
        'AI Resume Polishing',
        '5 Tailored Resumes',
        'PDF Export',
        'Email Support',
      ],
      cta: 'Buy Now',
      popular: false,
    },
    {
      name: 'Pro Automation',
      price: '$19',
      period: '/mo',
      description: 'Advanced tools for serious careers.',
      features: [
        'Unlimited Tailored Resumes',
        'Unlimited Cover Letters',
        'Advanced Job Ingestion',
        'Priority AI Generation',
        'Application Analytics',
        'Priority Support',
      ],
      cta: 'Start Free Trial',
      popular: true,
    },
  ];

  return (
    <div className="max-w-6xl mx-auto py-12 px-6">
      <header className="text-center mb-20">
        <h1 className="text-5xl font-serif font-light text-stone-900 mb-6">Simple, transparent pricing.</h1>
        <p className="text-xl text-stone-500 max-w-2xl mx-auto leading-relaxed">
          Choose the plan that fits your career goals. Upgrade or downgrade at any time.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans.map((plan, i) => (
          <motion.div 
            key={plan.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            className={cn(
              "p-10 rounded-[40px] border transition-all relative flex flex-col",
              plan.popular 
                ? "bg-stone-900 text-white border-stone-900 shadow-2xl shadow-stone-200" 
                : "bg-white text-stone-900 border-stone-100 shadow-sm hover:shadow-lg"
            )}
          >
            {plan.popular && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-stone-100 text-stone-900 text-xs font-bold uppercase tracking-widest rounded-full border border-stone-200">
                Most Popular
              </div>
            )}
            
            <div className="mb-10">
              <h3 className="text-2xl font-serif font-medium mb-2 italic">{plan.name}</h3>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-5xl font-serif font-medium">{plan.price}</span>
                {plan.period && <span className={cn("text-lg", plan.popular ? "text-stone-400" : "text-stone-500")}>{plan.period}</span>}
              </div>
              <p className={cn("text-sm leading-relaxed", plan.popular ? "text-stone-400" : "text-stone-500")}>
                {plan.description}
              </p>
            </div>

            <div className="space-y-4 mb-12 flex-1">
              {plan.features.map((feature) => (
                <div key={feature} className="flex items-center gap-3">
                  <div className={cn(
                    "w-5 h-5 rounded-full flex items-center justify-center",
                    plan.popular ? "bg-stone-800 text-stone-200" : "bg-stone-50 text-stone-600"
                  )}>
                    <Check size={12} />
                  </div>
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>

            <button 
              onClick={() => handleUpgrade(plan.name)}
              disabled={!!loading}
              className={cn(
                "w-full py-4 rounded-full font-bold transition-all flex items-center justify-center gap-2",
                plan.popular 
                  ? "bg-white text-stone-900 hover:bg-stone-100" 
                  : "bg-stone-900 text-white hover:bg-stone-800"
              )}
            >
              {loading === plan.name ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <>
                  {plan.cta} <ChevronRight size={18} />
                </>
              )}
            </button>
          </motion.div>
        ))}
      </div>

      <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
        <div className="space-y-4">
          <div className="w-12 h-12 bg-stone-100 rounded-2xl flex items-center justify-center text-stone-600 mx-auto">
            <Sparkles size={24} />
          </div>
          <h4 className="font-medium text-stone-900">AI-Powered</h4>
          <p className="text-sm text-stone-500 leading-relaxed">State-of-the-art AI models specifically trained for resume optimization.</p>
        </div>
        <div className="space-y-4">
          <div className="w-12 h-12 bg-stone-100 rounded-2xl flex items-center justify-center text-stone-600 mx-auto">
            <Zap size={24} />
          </div>
          <h4 className="font-medium text-stone-900">Instant Results</h4>
          <p className="text-sm text-stone-500 leading-relaxed">Tailor your resume in seconds, not hours. Stay ahead of the competition.</p>
        </div>
        <div className="space-y-4">
          <div className="w-12 h-12 bg-stone-100 rounded-2xl flex items-center justify-center text-stone-600 mx-auto">
            <ShieldCheck size={24} />
          </div>
          <h4 className="font-medium text-stone-900">ATS-Friendly</h4>
          <p className="text-sm text-stone-500 leading-relaxed">Our templates are tested against major ATS systems to ensure you get seen.</p>
        </div>
      </div>
    </div>
  );
}
