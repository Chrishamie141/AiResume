import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User as FirebaseUser, signOut } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { LogOut, User, Settings, Bell } from 'lucide-react';

export default function Navbar({ user }: { user: FirebaseUser }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  return (
    <nav className="h-16 bg-white border-b border-stone-200 px-6 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center gap-8">
        <Link to="/dashboard" className="text-xl font-serif font-bold text-stone-900 flex items-center gap-2">
          <div className="w-8 h-8 bg-stone-900 rounded-lg flex items-center justify-center text-white text-sm">JH</div>
          AI Job Hunter
        </Link>
      </div>

      <div className="flex items-center gap-6">
        <button className="p-2 text-stone-500 hover:bg-stone-50 rounded-full transition-colors">
          <Bell size={20} />
        </button>
        
        <div className="flex items-center gap-4 pl-6 border-l border-stone-100">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-stone-900">{user.displayName || 'User'}</p>
            <p className="text-xs text-stone-500">{user.email}</p>
          </div>
          
          <div className="relative group">
            <button className="w-10 h-10 bg-stone-100 rounded-full overflow-hidden border border-stone-200 flex items-center justify-center">
              {user.photoURL ? (
                <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <User size={20} className="text-stone-400" />
              )}
            </button>
            
            <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-xl border border-stone-200 py-2 hidden group-hover:block">
              <Link to="/profile" className="flex items-center gap-2 px-4 py-2 text-sm text-stone-700 hover:bg-stone-50">
                <User size={16} /> Profile
              </Link>
              <Link to="/settings" className="flex items-center gap-2 px-4 py-2 text-sm text-stone-700 hover:bg-stone-50">
                <Settings size={16} /> Settings
              </Link>
              <hr className="my-2 border-stone-100" />
              <button 
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <LogOut size={16} /> Log Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
