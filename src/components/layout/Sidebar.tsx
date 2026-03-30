import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FileText, Briefcase, BarChart3, CreditCard, User as UserIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

import { User } from '../../types';

export default function Sidebar({ userData }: { userData: User | null }) {
  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/resumes', icon: FileText, label: 'My Resumes' },
    { to: '/resume-builder', icon: FileText, label: 'Resume Builder' },
    { to: '/jobs', icon: Briefcase, label: 'Job Search' },
    { to: '/tracker', icon: BarChart3, label: 'Application Tracker' },
    { to: '/pricing', icon: CreditCard, label: 'Pricing' },
    { to: '/profile', icon: UserIcon, label: 'Profile' },
  ];

  return (
    <aside className="w-64 bg-white border-r border-stone-200 h-[calc(100vh-64px)] sticky top-16 hidden md:block">
      <div className="p-6 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => cn(
              "flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all",
              isActive 
                ? "bg-stone-900 text-white shadow-lg shadow-stone-200" 
                : "text-stone-500 hover:bg-stone-50 hover:text-stone-900"
            )}
          >
            <item.icon size={20} />
            {item.label}
          </NavLink>
        ))}
      </div>
      
      <div className="absolute bottom-8 left-6 right-6 p-6 bg-stone-50 rounded-3xl border border-stone-100">
        <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">Current Plan</p>
        <p className="text-sm font-medium text-stone-900 mb-4 capitalize">{userData?.plan || 'Free'} Tier</p>
        {userData?.plan !== 'pro' && (
          <NavLink to="/pricing" className="text-xs font-semibold text-stone-900 underline underline-offset-4">
            Upgrade to Pro
          </NavLink>
        )}
      </div>
    </aside>
  );
}
