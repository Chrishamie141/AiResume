import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User as FirebaseUser } from 'firebase/auth';
import { authService } from '../../services/authService';
import { LogOut, User, Bell } from 'lucide-react';

export default function Navbar({ user }: { user: FirebaseUser }) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await authService.logout();
    navigate('/');
  };

  return (
    <nav className="h-16 bg-white border-b border-stone-200 px-3 md:px-6 flex items-center justify-between sticky top-0 z-50">
      <Link to="/dashboard" className="text-base md:text-xl font-serif font-bold text-stone-900 flex items-center gap-2 min-w-0">
        <div className="w-8 h-8 bg-stone-900 rounded-lg flex items-center justify-center text-white text-sm shrink-0">JH</div>
        <span className="truncate">AI Job Hunter</span>
      </Link>

      <div className="flex items-center gap-2 md:gap-4">
        <button className="p-2 text-stone-500 hover:bg-stone-50 rounded-full transition-colors" aria-label="Notifications">
          <Bell size={18} />
        </button>

        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="w-10 h-10 bg-stone-100 rounded-full overflow-hidden border border-stone-200 flex items-center justify-center"
            aria-label="Open profile menu"
          >
            {user.photoURL ? (
              <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <User size={20} className="text-stone-400" />
            )}
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl border border-stone-200 py-2">
              <div className="px-4 py-2 border-b border-stone-100">
                <p className="text-sm font-medium text-stone-900 truncate">{user.displayName || 'User'}</p>
                <p className="text-xs text-stone-500 truncate">{user.email}</p>
              </div>
              <Link to="/profile" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-stone-700 hover:bg-stone-50">
                <User size={16} /> Profile
              </Link>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <LogOut size={16} /> Log Out
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
