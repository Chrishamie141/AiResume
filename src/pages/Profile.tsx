import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { User, Mail, Phone, MapPin, Link as LinkIcon, Edit2, Shield, CreditCard, Bell, Loader2 } from 'lucide-react';
import { databaseService } from '../services/databaseService';
import { UserProfile } from '../types';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Profile() {
  const { userData, user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) { setLoading(false); return; }
      try {
        const data = await databaseService.getProfile(user.id);
        setProfile(data);
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const sections = [
    { id: 'personal', title: 'Personal Information', icon: User },
    { id: 'security', title: 'Security & Privacy', icon: Shield },
    { id: 'billing', title: 'Billing & Subscription', icon: CreditCard },
    { id: 'notifications', title: 'Notifications', icon: Bell },
  ];

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 size={48} className="text-stone-400 animate-spin" />
        <p className="text-stone-500 font-serif italic">Loading your profile...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 bg-stone-100 rounded-[32px] overflow-hidden border-4 border-white shadow-lg">
            <div className="w-full h-full flex items-center justify-center text-stone-300">
              <User size={48} />
            </div>
          </div>
          <div>
            <h1 className="text-4xl font-serif font-light text-stone-900 mb-1">
              {profile ? `${profile.firstName} ${profile.lastName}` : ((user?.user_metadata?.full_name as string | undefined) || 'User')}
            </h1>
            <p className="text-stone-500">{user?.email}</p>
          </div>
        </div>
        <Link 
          to="/resume-builder"
          className="px-6 py-3 bg-stone-900 text-white rounded-full font-medium hover:bg-stone-800 transition-colors flex items-center gap-2"
        >
          Edit Profile <Edit2 size={18} />
        </Link>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <aside className="space-y-2">
          {sections.map((section) => (
            <button 
              key={section.id}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium text-stone-500 hover:bg-stone-100 hover:text-stone-900 transition-all text-left"
            >
              <section.icon size={18} />
              {section.title}
            </button>
          ))}
        </aside>

        <div className="md:col-span-3 space-y-8">
          <div className="p-8 bg-white rounded-[40px] border border-stone-100 shadow-sm space-y-8">
            <h3 className="text-xl font-serif font-medium text-stone-900 italic">Contact Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div className="space-y-1">
                <p className="text-xs font-bold uppercase tracking-widest text-stone-400">Email</p>
                <div className="flex items-center gap-2 text-stone-900">
                  <Mail size={16} className="text-stone-400" /> {profile?.email || user?.email}
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold uppercase tracking-widest text-stone-400">Phone</p>
                <div className="flex items-center gap-2 text-stone-900">
                  <Phone size={16} className="text-stone-400" /> {profile?.phone || 'Not provided'}
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold uppercase tracking-widest text-stone-400">Location</p>
                <div className="flex items-center gap-2 text-stone-900">
                  <MapPin size={16} className="text-stone-400" /> {profile?.location || 'Not provided'}
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold uppercase tracking-widest text-stone-400">LinkedIn</p>
                <div className="flex items-center gap-2 text-stone-900">
                  <LinkIcon size={16} className="text-stone-400" /> {profile?.links?.linkedin || 'Not provided'}
                </div>
              </div>
            </div>
          </div>

          <div className="p-8 bg-stone-50 rounded-[40px] border border-stone-100 flex items-center justify-between">
            <div>
              <h3 className="text-xl font-serif font-medium text-stone-900 italic mb-1">Subscription Plan</h3>
              <p className="text-stone-500 text-sm capitalize">You are currently on the {userData?.plan || 'Free'} Tier.</p>
            </div>
            {userData?.plan !== 'pro' && (
              <button 
                onClick={() => navigate('/pricing')}
                className="px-6 py-3 bg-stone-900 text-white rounded-full font-medium hover:bg-stone-800 transition-colors"
              >
                Upgrade to Pro
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
