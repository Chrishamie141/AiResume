import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, ChevronLeft, Plus, Trash2, Save, FileText, Sparkles, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { cn } from '../lib/utils';
import { firestoreService } from '../services/firestoreService';
import { geminiService } from '../services/geminiService';
import { auth } from '../lib/firebase';
import { UserProfile } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { onAuthStateChanged } from 'firebase/auth';

const profileSchema = z.object({
  firstName: z.string().min(2, 'First name is required'),
  lastName: z.string().min(2, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Invalid phone number'),
  location: z.string().min(2, 'Location is required'),
  links: z.object({
    linkedin: z.string().url('Invalid URL').optional().or(z.literal('')),
    portfolio: z.string().url('Invalid URL').optional().or(z.literal('')),
    github: z.string().url('Invalid URL').optional().or(z.literal('')),
  }),
  summary: z.string().min(50, 'Summary should be at least 50 characters'),
  education: z.array(z.object({
    school: z.string().min(2, 'School is required'),
    degree: z.string().min(2, 'Degree is required'),
    field: z.string().min(2, 'Field is required'),
    startDate: z.string(),
    endDate: z.string(),
    description: z.string().optional(),
  })),
  projects: z.array(z.object({
    name: z.string().min(2, 'Project name is required'),
    description: z.string().min(10, 'Description should be at least 10 characters'),
    technologies: z.array(z.string()),
    url: z.string().url('Invalid URL').optional().or(z.literal('')),
    date: z.string().optional(),
  })),
  coursework: z.array(z.object({
    name: z.string().min(2, 'Course name is required'),
    description: z.string().optional(),
  })),
  experience: z.array(z.object({
    company: z.string().min(2, 'Company is required'),
    title: z.string().min(2, 'Title is required'),
    location: z.string().min(2, 'Location is required'),
    startDate: z.string(),
    endDate: z.string(),
    current: z.boolean(),
    description: z.string().min(50, 'Description should be at least 50 characters'),
  })),
  skills: z.object({
    technical: z.array(z.string()),
    soft: z.array(z.string()),
  }),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const steps = [
  { id: 'basics', title: 'Basics', description: 'Contact information' },
  { id: 'summary', title: 'Summary', description: 'Professional bio' },
  { id: 'experience', title: 'Experience', description: 'Work history' },
  { id: 'projects', title: 'Projects', description: 'Personal & academic projects' },
  { id: 'education', title: 'Education', description: 'Academic background' },
  { id: 'coursework', title: 'Coursework', description: 'Relevant courses' },
  { id: 'skills', title: 'Skills', description: 'Technical & soft skills' },
];

export default function ResumeBuilder() {
  const { userData } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [hasBaseResume, setHasBaseResume] = useState(false);
  const navigate = useNavigate();

  const { register, control, handleSubmit, formState: { errors }, watch, setValue, reset } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      education: [{ school: '', degree: '', field: '', startDate: '', endDate: '', description: '' }],
      experience: [{ company: '', title: '', location: '', startDate: '', endDate: '', current: false, description: '' }],
      projects: [],
      coursework: [],
      skills: { technical: [], soft: [] },
    }
  });

  useEffect(() => {
    const checkBaseResume = async () => {
      if (auth.currentUser) {
        const resumes = await firestoreService.getResumes(auth.currentUser.uid);
        setHasBaseResume(resumes.some(r => r.isBase));
      }
    };
    checkBaseResume();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const profile = await firestoreService.getProfile(user.uid);
          if (profile) {
            reset({
              firstName: profile.firstName,
              lastName: profile.lastName,
              email: profile.email,
              phone: profile.phone,
              location: profile.location,
              links: profile.links,
              summary: profile.summary,
              education: profile.education,
              experience: profile.experience,
              projects: profile.projects || [],
              coursework: profile.coursework || [],
              skills: profile.skills,
            });
          }
        } catch (error) {
          console.error('Error fetching profile:', error);
        }
      }
    });
    return unsubscribe;
  }, [reset]);

  const { fields: expFields, append: appendExp, remove: removeExp } = useFieldArray({ control, name: 'experience' });
  const { fields: eduFields, append: appendEdu, remove: removeEdu } = useFieldArray({ control, name: 'education' });
  const { fields: projectFields, append: appendProject, remove: removeProject } = useFieldArray({ control, name: 'projects' });
  const { fields: courseworkFields, append: appendCoursework, remove: removeCoursework } = useFieldArray({ control, name: 'coursework' });

  const saveProgress = async () => {
    if (!auth.currentUser) return;
    setIsSaving(true);
    const data = watch();
    try {
      const profile: UserProfile = {
        uid: auth.currentUser.uid,
        ...data,
        certifications: [],
        preferences: {
          industries: [],
          titles: [],
          locations: [],
          workType: '',
          salary: '',
          visa: '',
          yearsOfExperience: 0
        }
      };
      await firestoreService.saveProfile(profile);
    } catch (error) {
      console.error('Error saving progress:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const onSubmit = async (data: ProfileFormValues) => {
    if (!auth.currentUser) return;
    
    setIsGenerating(true);
    setShowErrors(false);
    try {
      const profile: UserProfile = {
        uid: auth.currentUser.uid,
        ...data,
        certifications: [],
        preferences: {
          industries: [],
          titles: [],
          locations: [],
          workType: '',
          salary: '',
          visa: '',
          yearsOfExperience: 0
        }
      };

      // 1. Save Profile
      await firestoreService.saveProfile(profile);

      // 2. Generate Resume
      const resumeContent = await geminiService.generateBaseResume(profile);

      // 3. Save Resume (will overwrite existing base resume)
      const resumeId = await firestoreService.saveResume({
        uid: auth.currentUser.uid,
        title: 'Base Resume',
        content: resumeContent,
        templateId: 'default',
        style: 'professional',
        isBase: true,
        isTailored: false
      });

      // 4. Navigate to preview
      toast.success('Resume updated successfully!');
      navigate(`/resume/${resumeId}`);
    } catch (error: any) {
      console.error('Failed to generate resume:', error);
      const errorMessage = error.message?.toLowerCase() || "";
      if (errorMessage.includes('rpc failed') || errorMessage.includes('xhr error') || errorMessage.includes('deadline exceeded')) {
        toast.error('AI service is temporarily busy. Please try again in a moment.', { duration: 5000 });
      } else if (errorMessage.includes('429')) {
        toast.error('Rate limit reached. Please wait a minute and try again.');
      } else {
        toast.error('Failed to generate resume. Please check your connection and try again.');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const onInvalid = (errors: any) => {
    console.log('Form Errors:', errors);
    setShowErrors(true);
    toast.error('Please fix the errors in the form before generating.');
    
    // Find the first step with an error and switch to it
    const errorKeys = Object.keys(errors);
    if (errorKeys.length > 0) {
      const firstError = errorKeys[0];
      let targetStep = -1;
      
      if (['firstName', 'lastName', 'email', 'phone', 'location', 'links'].includes(firstError)) targetStep = 0;
      else if (firstError === 'summary') targetStep = 1;
      else if (firstError === 'experience') targetStep = 2;
      else if (firstError === 'projects') targetStep = 3;
      else if (firstError === 'education') targetStep = 4;
      else if (firstError === 'coursework') targetStep = 5;
      else if (firstError === 'skills') targetStep = 6;
      
      if (targetStep !== -1 && targetStep !== currentStep) {
        setCurrentStep(targetStep);
      }
      
      // Scroll to top of the form
      const formElement = document.querySelector('form');
      if (formElement) {
        formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  const nextStep = () => {
    saveProgress();
    setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
  };
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 0));

  return (
    <div className="max-w-4xl mx-auto">
      <header className="mb-12">
        <h1 className="text-4xl font-serif font-light text-stone-900 mb-2">Resume Builder</h1>
        <p className="text-stone-500">Fill in your details to generate a professional AI-powered resume.</p>
      </header>

      {/* Stepper */}
      <div className="flex items-center justify-between mb-12 px-4">
        {steps.map((step, i) => (
          <div key={step.id} className="flex flex-col items-center gap-2 relative">
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all z-10",
              i <= currentStep ? "bg-stone-900 text-white" : "bg-stone-100 text-stone-400"
            )}>
              {i + 1}
            </div>
            <span className={cn(
              "text-xs font-medium uppercase tracking-wider",
              i <= currentStep ? "text-stone-900" : "text-stone-400"
            )}>
              {step.title}
            </span>
            {i < steps.length - 1 && (
              <div className={cn(
                "absolute top-5 left-10 w-[calc(100vw/5)] h-[1px] -z-0",
                i < currentStep ? "bg-stone-900" : "bg-stone-200"
              )} />
            )}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="bg-white p-10 rounded-3xl border border-stone-100 shadow-sm">
        {showErrors && Object.keys(errors).length > 0 && (
          <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3 text-red-600">
            <AlertCircle className="shrink-0 mt-0.5" size={18} />
            <div>
              <p className="text-sm font-bold">Please fix the following errors before generating:</p>
              <ul className="text-xs list-disc list-inside mt-1 space-y-1">
                {errors.firstName && <li>First name is required</li>}
                {errors.lastName && <li>Last name is required</li>}
                {errors.email && <li>Valid email is required</li>}
                {errors.phone && <li>Phone number is required (min 10 digits)</li>}
                {errors.location && <li>Location is required</li>}
                {errors.summary && <li>Summary must be at least 50 characters</li>}
                {errors.experience?.map?.((e: any, i: number) => (
                  <React.Fragment key={i}>
                    {e?.company && <li>Experience {i + 1}: Company is required</li>}
                    {e?.title && <li>Experience {i + 1}: Title is required</li>}
                    {e?.description && <li>Experience {i + 1}: Description must be at least 50 characters</li>}
                  </React.Fragment>
                ))}
                {errors.education?.map?.((e: any, i: number) => (
                  <React.Fragment key={i}>
                    {e?.school && <li>Education {i + 1}: School is required</li>}
                    {e?.degree && <li>Education {i + 1}: Degree is required</li>}
                    {e?.field && <li>Education {i + 1}: Field of study is required</li>}
                  </React.Fragment>
                ))}
                {errors.projects?.map?.((e: any, i: number) => (
                  <React.Fragment key={i}>
                    {e?.name && <li>Project {i + 1}: Name is required</li>}
                    {e?.description && <li>Project {i + 1}: Description must be at least 10 characters</li>}
                  </React.Fragment>
                ))}
                {errors.coursework?.map?.((e: any, i: number) => (
                  <React.Fragment key={i}>
                    {e?.name && <li>Coursework {i + 1}: Name is required</li>}
                  </React.Fragment>
                ))}
              </ul>
            </div>
          </div>
        )}
        <AnimatePresence mode="wait">
          {currentStep === 0 && (
            <motion.div 
              key="basics"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-2 gap-6">
                <Input label="First Name" {...register('firstName')} error={errors.firstName?.message} />
                <Input label="Last Name" {...register('lastName')} error={errors.lastName?.message} />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <Input label="Email" {...register('email')} error={errors.email?.message} />
                <Input label="Phone" {...register('phone')} error={errors.phone?.message} />
              </div>
              <Input label="Location" placeholder="City, State" {...register('location')} error={errors.location?.message} />
              <div className="space-y-4">
                <p className="text-sm font-medium text-stone-700">Links</p>
                <Input placeholder="LinkedIn URL" {...register('links.linkedin')} error={errors.links?.linkedin?.message} />
                <Input placeholder="Portfolio URL" {...register('links.portfolio')} error={errors.links?.portfolio?.message} />
                <Input placeholder="GitHub URL" {...register('links.github')} error={errors.links?.github?.message} />
              </div>
            </motion.div>
          )}

          {currentStep === 1 && (
            <motion.div 
              key="summary"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="space-y-2">
                <label className="text-sm font-medium text-stone-700">Professional Summary</label>
                <textarea 
                  {...register('summary')}
                  className={cn(
                    "w-full p-4 bg-stone-50 border border-stone-200 rounded-2xl h-48 focus:ring-2 focus:ring-stone-900 focus:border-transparent outline-none transition-all",
                    errors.summary && "border-red-500 focus:ring-red-500"
                  )}
                  placeholder="Describe your professional background and career goals..."
                />
                {errors.summary && <p className="text-xs text-red-500">{errors.summary.message}</p>}
              </div>
            </motion.div>
          )}

          {currentStep === 2 && (
            <motion.div 
              key="experience"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              {expFields.map((field, index) => (
                <div key={field.id} className="p-6 bg-stone-50 rounded-2xl border border-stone-100 relative group">
                  <button 
                    type="button" 
                    onClick={() => removeExp(index)}
                    className="absolute top-4 right-4 p-2 text-stone-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                  <div className="grid grid-cols-2 gap-6 mb-4">
                    <Input label="Company" {...register(`experience.${index}.company`)} error={errors.experience?.[index]?.company?.message} />
                    <Input label="Title" {...register(`experience.${index}.title`)} error={errors.experience?.[index]?.title?.message} />
                  </div>
                  <div className="grid grid-cols-3 gap-6 mb-4">
                    <Input label="Location" {...register(`experience.${index}.location`)} error={errors.experience?.[index]?.location?.message} />
                    <Input label="Start Date" type="month" {...register(`experience.${index}.startDate`)} error={errors.experience?.[index]?.startDate?.message} />
                    <Input label="End Date" type="month" {...register(`experience.${index}.endDate`)} disabled={watch(`experience.${index}.current`)} error={errors.experience?.[index]?.endDate?.message} />
                  </div>
                  <div className="flex items-center gap-2 mb-4">
                    <input type="checkbox" {...register(`experience.${index}.current`)} className="rounded border-stone-300 text-stone-900 focus:ring-stone-900" />
                    <label className="text-sm text-stone-600">I currently work here</label>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-stone-700">Description</label>
                    <textarea 
                      {...register(`experience.${index}.description`)}
                      className={cn(
                        "w-full p-4 bg-white border border-stone-200 rounded-xl h-32 focus:ring-2 focus:ring-stone-900 focus:border-transparent outline-none transition-all",
                        errors.experience?.[index]?.description && "border-red-500 focus:ring-red-500"
                      )}
                    />
                    {errors.experience?.[index]?.description && <p className="text-xs text-red-500">{errors.experience[index].description.message}</p>}
                  </div>
                </div>
              ))}
              <button 
                type="button" 
                onClick={() => appendExp({ company: '', title: '', location: '', startDate: '', endDate: '', current: false, description: '' })}
                className="w-full py-4 border-2 border-dashed border-stone-200 rounded-2xl text-stone-500 hover:border-stone-400 hover:text-stone-700 transition-all flex items-center justify-center gap-2"
              >
                <Plus size={20} /> Add Work Experience
              </button>
            </motion.div>
          )}

          {currentStep === 3 && (
            <motion.div 
              key="projects"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              {projectFields.map((field, index) => (
                <div key={field.id} className="p-6 bg-stone-50 rounded-2xl border border-stone-100 relative group">
                  <button 
                    type="button" 
                    onClick={() => removeProject(index)}
                    className="absolute top-4 right-4 p-2 text-stone-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                  <div className="grid grid-cols-2 gap-6 mb-4">
                    <Input label="Project Title" {...register(`projects.${index}.name`)} error={errors.projects?.[index]?.name?.message} />
                    <Input label="Date / Timeframe" placeholder="e.g. Summer 2023" {...register(`projects.${index}.date`)} error={errors.projects?.[index]?.date?.message} />
                  </div>
                  <div className="mb-4">
                    <Input label="Project Link" placeholder="GitHub, portfolio, or demo URL" {...register(`projects.${index}.url`)} error={errors.projects?.[index]?.url?.message} />
                  </div>
                  <div className="space-y-4 mb-4">
                    <label className="text-sm font-medium text-stone-700">Technologies Used</label>
                    <div className="flex flex-wrap gap-2">
                      {watch(`projects.${index}.technologies`)?.map((tech, i) => (
                        <span key={i} className="px-3 py-1 bg-white text-stone-700 rounded-full text-sm flex items-center gap-2 border border-stone-200">
                          {tech}
                          <button type="button" onClick={() => {
                            const current = watch(`projects.${index}.technologies`);
                            const next = current.filter((_, idx) => idx !== i);
                            setValue(`projects.${index}.technologies`, next);
                          }} className="hover:text-red-500">
                            <Trash2 size={14} />
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input 
                        id={`tech-input-${index}`}
                        type="text" 
                        placeholder="Add a technology (e.g. React, Node.js)"
                        className="flex-1 p-3 bg-white border border-stone-200 rounded-xl focus:ring-2 focus:ring-stone-900 outline-none"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const val = e.currentTarget.value.trim();
                            if (val) {
                              const current = watch(`projects.${index}.technologies`) || [];
                              setValue(`projects.${index}.technologies`, [...current, val]);
                              e.currentTarget.value = '';
                            }
                          }
                        }}
                      />
                      <button 
                        type="button"
                        onClick={() => {
                          const input = document.getElementById(`tech-input-${index}`) as HTMLInputElement;
                          const val = input.value.trim();
                          if (val) {
                            const current = watch(`projects.${index}.technologies`) || [];
                            setValue(`projects.${index}.technologies`, [...current, val]);
                            input.value = '';
                          }
                        }}
                        className="p-3 bg-stone-200 text-stone-900 rounded-xl hover:bg-stone-300 transition-all"
                      >
                        <Plus size={20} />
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-stone-700">Description</label>
                    <textarea 
                      {...register(`projects.${index}.description`)}
                      className={cn(
                        "w-full p-4 bg-white border border-stone-200 rounded-xl h-32 focus:ring-2 focus:ring-stone-900 focus:border-transparent outline-none transition-all",
                        errors.projects?.[index]?.description && "border-red-500 focus:ring-red-500"
                      )}
                      placeholder="Describe what you built, why, and the impact..."
                    />
                    {errors.projects?.[index]?.description && <p className="text-xs text-red-500">{errors.projects[index].description.message}</p>}
                  </div>
                </div>
              ))}
              <button 
                type="button" 
                onClick={() => appendProject({ name: '', description: '', technologies: [], url: '', date: '' })}
                className="w-full py-4 border-2 border-dashed border-stone-200 rounded-2xl text-stone-500 hover:border-stone-400 hover:text-stone-700 transition-all flex items-center justify-center gap-2"
              >
                <Plus size={20} /> Add Project
              </button>
            </motion.div>
          )}

          {currentStep === 4 && (
            <motion.div 
              key="education"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              {eduFields.map((field, index) => (
                <div key={field.id} className="p-6 bg-stone-50 rounded-2xl border border-stone-100 relative group">
                  <button 
                    type="button" 
                    onClick={() => removeEdu(index)}
                    className="absolute top-4 right-4 p-2 text-stone-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                  <div className="grid grid-cols-2 gap-6 mb-4">
                    <Input label="School" {...register(`education.${index}.school`)} error={errors.education?.[index]?.school?.message} />
                    <Input label="Degree" {...register(`education.${index}.degree`)} error={errors.education?.[index]?.degree?.message} />
                  </div>
                  <div className="grid grid-cols-3 gap-6">
                    <Input label="Field of Study" {...register(`education.${index}.field`)} error={errors.education?.[index]?.field?.message} />
                    <Input label="Start Date" type="month" {...register(`education.${index}.startDate`)} error={errors.education?.[index]?.startDate?.message} />
                    <Input label="End Date" type="month" {...register(`education.${index}.endDate`)} error={errors.education?.[index]?.endDate?.message} />
                  </div>
                </div>
              ))}
              <button 
                type="button" 
                onClick={() => appendEdu({ school: '', degree: '', field: '', startDate: '', endDate: '', description: '' })}
                className="w-full py-4 border-2 border-dashed border-stone-200 rounded-2xl text-stone-500 hover:border-stone-400 hover:text-stone-700 transition-all flex items-center justify-center gap-2"
              >
                <Plus size={20} /> Add Education
              </button>
            </motion.div>
          )}

          {currentStep === 5 && (
            <motion.div 
              key="coursework"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              {courseworkFields.map((field, index) => (
                <div key={field.id} className="p-6 bg-stone-50 rounded-2xl border border-stone-100 relative group">
                  <button 
                    type="button" 
                    onClick={() => removeCoursework(index)}
                    className="absolute top-4 right-4 p-2 text-stone-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                  <div className="mb-4">
                    <Input label="Course Name" {...register(`coursework.${index}.name`)} error={errors.coursework?.[index]?.name?.message} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-stone-700">Brief Description (Optional)</label>
                    <textarea 
                      {...register(`coursework.${index}.description`)}
                      className="w-full p-4 bg-white border border-stone-200 rounded-xl h-24 focus:ring-2 focus:ring-stone-900 focus:border-transparent outline-none transition-all"
                      placeholder="Briefly describe what you learned or key topics covered..."
                    />
                  </div>
                </div>
              ))}
              <button 
                type="button" 
                onClick={() => appendCoursework({ name: '', description: '' })}
                className="w-full py-4 border-2 border-dashed border-stone-200 rounded-2xl text-stone-500 hover:border-stone-400 hover:text-stone-700 transition-all flex items-center justify-center gap-2"
              >
                <Plus size={20} /> Add Relevant Coursework
              </button>
            </motion.div>
          )}

          {currentStep === 6 && (
            <motion.div 
              key="skills"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="space-y-6">
                <div className="space-y-4">
                  <label className="text-sm font-medium text-stone-700">Technical Skills</label>
                  <div className="flex flex-wrap gap-2">
                    {watch('skills.technical').map((skill, i) => (
                      <span key={i} className="px-3 py-1 bg-stone-100 text-stone-700 rounded-full text-sm flex items-center gap-2">
                        {skill}
                        <button type="button" onClick={() => {
                          const current = watch('skills.technical');
                          const next = current.filter((_, idx) => idx !== i);
                          setValue('skills.technical', next);
                        }} className="hover:text-red-500">
                          <Trash2 size={14} />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input 
                      id="tech-skill-input"
                      type="text" 
                      placeholder="Add a technical skill (e.g. React, Python)"
                      className="flex-1 p-4 bg-stone-50 border border-stone-200 rounded-2xl focus:ring-2 focus:ring-stone-900 outline-none"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const val = e.currentTarget.value.trim();
                          if (val) {
                            const current = watch('skills.technical');
                            setValue('skills.technical', [...current, val]);
                            e.currentTarget.value = '';
                          }
                        }
                      }}
                    />
                    <button 
                      type="button"
                      onClick={() => {
                        const input = document.getElementById('tech-skill-input') as HTMLInputElement;
                        const val = input.value.trim();
                        if (val) {
                          const current = watch('skills.technical');
                          setValue('skills.technical', [...current, val]);
                          input.value = '';
                        }
                      }}
                      className="p-4 bg-stone-100 text-stone-900 rounded-2xl hover:bg-stone-200 transition-all"
                    >
                      <Plus size={24} />
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-sm font-medium text-stone-700">Soft Skills</label>
                  <div className="flex flex-wrap gap-2">
                    {watch('skills.soft').map((skill, i) => (
                      <span key={i} className="px-3 py-1 bg-stone-100 text-stone-700 rounded-full text-sm flex items-center gap-2">
                        {skill}
                        <button type="button" onClick={() => {
                          const current = watch('skills.soft');
                          const next = current.filter((_, idx) => idx !== i);
                          setValue('skills.soft', next);
                        }} className="hover:text-red-500">
                          <Trash2 size={14} />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input 
                      id="soft-skill-input"
                      type="text" 
                      placeholder="Add a soft skill (e.g. Leadership, Communication)"
                      className="flex-1 p-4 bg-stone-50 border border-stone-200 rounded-2xl focus:ring-2 focus:ring-stone-900 outline-none"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const val = e.currentTarget.value.trim();
                          if (val) {
                            const current = watch('skills.soft');
                            setValue('skills.soft', [...current, val]);
                            e.currentTarget.value = '';
                          }
                        }
                      }}
                    />
                    <button 
                      type="button"
                      onClick={() => {
                        const input = document.getElementById('soft-skill-input') as HTMLInputElement;
                        const val = input.value.trim();
                        if (val) {
                          const current = watch('skills.soft');
                          setValue('skills.soft', [...current, val]);
                          input.value = '';
                        }
                      }}
                      className="p-4 bg-stone-100 text-stone-900 rounded-2xl hover:bg-stone-200 transition-all"
                    >
                      <Plus size={24} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-8 bg-stone-900 text-white rounded-3xl flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-medium mb-1">Ready to generate?</h3>
                  <p className="text-stone-400 text-sm">Our AI will polish your content and optimize for ATS.</p>
                </div>
                <div className="flex items-center gap-4">
                  <button 
                    type="button"
                    onClick={saveProgress}
                    disabled={isSaving}
                    className="px-6 py-4 border border-stone-700 text-white rounded-full font-medium hover:bg-stone-800 transition-all flex items-center gap-2"
                  >
                    {isSaving ? 'Saving...' : 'Save Draft'} <Save size={18} />
                  </button>
                  <button 
                    type="submit"
                    disabled={isGenerating}
                    className="px-8 py-4 bg-white text-stone-900 rounded-full font-bold hover:bg-stone-100 transition-all flex items-center gap-2 shadow-lg disabled:opacity-50"
                  >
                    {isGenerating ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-stone-900"></div>
                        Generating...
                      </>
                    ) : (
                      <>
                        Generate Resume <Sparkles size={20} />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-12 pt-8 border-t border-stone-100 flex justify-between">
          <button 
            type="button" 
            onClick={prevStep}
            disabled={currentStep === 0}
            className="px-6 py-3 text-stone-600 font-medium hover:bg-stone-50 rounded-full disabled:opacity-0 transition-all flex items-center gap-2"
          >
            <ChevronLeft size={20} /> Previous
          </button>
          {currentStep < steps.length - 1 && (
            <button 
              type="button" 
              onClick={nextStep}
              className="px-8 py-3 bg-stone-900 text-white rounded-full font-medium hover:bg-stone-800 transition-all flex items-center gap-2"
            >
              Next Step <ChevronRight size={20} />
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement> & { label?: string, error?: string }>(
  ({ label, error, className, ...props }, ref) => (
    <div className="space-y-2 w-full">
      {label && <label className="text-sm font-medium text-stone-700">{label}</label>}
      <input 
        ref={ref}
        className={cn(
          "w-full p-4 bg-stone-50 border border-stone-200 rounded-2xl focus:ring-2 focus:ring-stone-900 focus:border-transparent outline-none transition-all",
          error && "border-red-500 focus:ring-red-500",
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
);
Input.displayName = 'Input';
