import React from 'react';
import { Mic, FileText, CheckCircle, ArrowRight, FileCheck, Moon, Sun } from 'lucide-react';

interface SplashProps {
  onProceed: () => void;
  darkMode: boolean;
  toggleTheme: () => void;
}

const Splash: React.FC<SplashProps> = ({ onProceed, darkMode, toggleTheme }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-indigo-800 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-6 font-sans text-white transition-colors duration-300">
      
      <div className="absolute top-4 right-4 z-20">
        <button onClick={toggleTheme} className="p-2 text-white/70 hover:bg-white/10 rounded-full transition-colors">
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>

      <div className="max-w-4xl w-full grid md:grid-cols-2 gap-12 items-center">
        
        <div className="space-y-8 animate-fade-in-up">
          <div className="flex items-center gap-3">
              <FileCheck className="text-blue-200 w-12 h-12" />
              <div className="text-3xl font-bold">AutoForm</div>
          </div>
          
          <h1 className="text-5xl font-extrabold leading-tight">
            Fill Forms with <br/>
            <span className="text-blue-200">Just Your Voice.</span>
          </h1>
          
          <p className="text-lg text-blue-100 leading-relaxed">
            AutoForm analyzes your PDF documents and interviews you to gather the answers. No more typing on tiny mobile screens or deciphering complex paperwork.
          </p>

          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-500/20 rounded-lg"><FileText size={24} /></div>
              <span>Upload PDF, Word, or Docs</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-500/20 rounded-lg"><Mic size={24} /></div>
              <span>Answer questions naturally via voice</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-500/20 rounded-lg"><CheckCircle size={24} /></div>
              <span>Download the perfectly filled document</span>
            </div>
          </div>

          <button 
            onClick={onProceed}
            className="group mt-8 bg-white text-blue-700 dark:bg-blue-600 dark:text-white px-8 py-4 rounded-xl font-bold text-lg shadow-xl hover:bg-blue-50 dark:hover:bg-blue-500 transition-all transform hover:scale-105 flex items-center gap-3"
          >
            Get Started
            <ArrowRight className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        <div className="hidden md:block relative animate-float">
           <div className="absolute inset-0 bg-blue-500 rounded-full blur-3xl opacity-20"></div>
           <div className="relative bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-500">
               <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-4">
                  <div className="flex items-center gap-3">
                     <div className="w-3 h-3 rounded-full bg-red-400"></div>
                     <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                     <div className="w-3 h-3 rounded-full bg-green-400"></div>
                  </div>
                  <div className="text-xs font-mono text-blue-200">Processing...</div>
               </div>
               <div className="space-y-4">
                  <div className="h-4 bg-white/20 rounded w-3/4"></div>
                  <div className="h-8 bg-white/5 rounded border border-white/10 flex items-center px-3 text-sm text-blue-100">
                      John Doe
                  </div>
                  <div className="h-4 bg-white/20 rounded w-1/2 mt-4"></div>
                  <div className="h-24 bg-white/5 rounded border border-white/10 flex p-3 text-sm text-blue-100">
                      I am applying for this position because...
                  </div>
               </div>
           </div>
        </div>

      </div>
    </div>
  );
};

export default Splash;