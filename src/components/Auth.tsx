import { auth, signInWithGoogle } from '../lib/firebase';
import { GraduationCap, LogIn } from 'lucide-react';
import { motion } from 'motion/react';

export default function Auth() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FBFBFA]">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full p-12 bg-white rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.05)] text-center border border-slate-100"
      >
        <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-lg shadow-slate-200">
          <GraduationCap className="text-white w-8 h-8" />
        </div>
        
        <h1 className="text-3xl font-semibold text-slate-900 mb-2 tracking-tight">ScholarFlow</h1>
        <p className="text-slate-500 mb-10 leading-relaxed font-medium">Design your learning journey with intelligent focus and clarity.</p>
        
        <button
          onClick={() => signInWithGoogle()}
          className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-50 text-slate-900 font-semibold py-4 px-6 rounded-2xl border-2 border-slate-100 transition-all active:scale-[0.98] shadow-sm"
          id="google-signin-button"
        >
          <LogIn className="w-5 h-5" />
          <span>Continue with Google</span>
        </button>
        
        <p className="mt-8 text-xs text-slate-400 uppercase tracking-widest font-bold">Secure Academic Access</p>
      </motion.div>
    </div>
  );
}
