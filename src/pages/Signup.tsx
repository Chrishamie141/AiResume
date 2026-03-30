import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { motion } from 'motion/react';
import { ChevronRight, Mail, Lock, User } from 'lucide-react';

export default function Signup() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 px-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white p-12 rounded-[40px] border border-stone-100 shadow-xl shadow-stone-200"
      >
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-stone-900 rounded-2xl flex items-center justify-center text-white text-2xl font-bold mx-auto mb-6">JH</div>
          <h1 className="text-3xl font-serif font-light text-stone-900 mb-2">Create an account.</h1>
          <p className="text-stone-500">Start your AI-powered job search today.</p>
        </div>

        {error && (
          <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-sm mb-6 border border-red-100">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <button 
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full py-4 bg-stone-900 text-white rounded-full font-bold hover:bg-stone-800 transition-all shadow-lg flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
            ) : (
              <>
                <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5 brightness-0 invert" />
                Sign up with Google
              </>
            )}
          </button>
        </div>

        <p className="text-center text-sm text-stone-500 mt-10">
          Already have an account? <Link to="/login" className="text-stone-900 font-medium underline underline-offset-4">Log in</Link>
        </p>
      </motion.div>
    </div>
  );
}
