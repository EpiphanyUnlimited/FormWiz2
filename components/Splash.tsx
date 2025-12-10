import React from 'react';
import { Mic, CheckCircle, ArrowRight, Moon, Sun, Play } from 'lucide-react';
import FormWizLogo from './FormWizLogo';

interface SplashProps {
  onProceed: () => void;
  onPrivacy: () => void;
  onInstructions: () => void;
  onPricing: () => void;
  darkMode: boolean;
  toggleTheme: () => void;
}

const Splash: React.FC<SplashProps> = ({ onProceed, onPrivacy, onInstructions, onPricing, darkMode, toggleTheme }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-700 via-indigo-800 to-purple-900 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950 flex flex-col font-sans text-white transition-colors duration-500 overflow-hidden relative">
      
      {/* Header Navigation */}
      <header className="flex justify-between items-start p-6 z-20 max-w-7xl mx-auto w-full">
         <div className="flex items-center gap-3">
            {/* Logo background matches footer link color (blue-200) with low opacity for glass effect */}
            <div className="bg-blue-200/20 p-2 rounded-xl backdrop-blur-sm">
               <FormWizLogo size={28} />
            </div>
            <div className="flex flex-col">
                <div className="flex items-start">
                    <span className="font-bold text-2xl tracking-tight leading-none">FormWiz</span>
                    <span className="text-[10px] font-medium opacity-60 ml-1 mt-0.5">© 2025</span>
                </div>
                <span className="text-[10px] text-blue-200 font-medium tracking-wide uppercase mt-1 opacity-80">
                    by Epiphany Unlimited, Inc.
                </span>
            </div>
         </div>
         
         <div className="flex items-center gap-4 sm:gap-6 pt-1">
             <button onClick={onInstructions} className="hidden sm:flex text-sm font-medium text-blue-100 hover:text-white transition-colors">How it Works</button>
             <button onClick={onPricing} className="hidden sm:flex text-sm font-medium text-blue-100 hover:text-white transition-colors">Pricing</button>
             <button onClick={onPrivacy} className="hidden sm:flex text-sm font-medium text-blue-100 hover:text-white transition-colors">Privacy</button>
             
             <div className="h-5 w-px bg-white/20 hidden sm:block"></div>
             
             <button onClick={toggleTheme} className="p-2 text-white/70 hover:bg-white/10 rounded-full transition-colors">
                {darkMode ? <Sun size={20} /> : <Moon size={20} />}
             </button>
         </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-6 relative z-10">
        <div className="max-w-6xl w-full grid lg:grid-cols-2 gap-16 items-center">
            
            <div className="space-y-8 animate-fade-in-up text-center lg:text-left">
                <h1 className="text-5xl md:text-6xl font-extrabold leading-tight tracking-tight">
                    Fill Forms with <br/>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-purple-200">Just Your Voice.</span>
                </h1>
                
                <p className="text-xl text-blue-100 leading-relaxed max-w-xl mx-auto lg:mx-0">
                    The AI assistant that interviews you to complete PDF paperwork instantly. No typing required.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-4">
                    <button 
                        onClick={onProceed}
                        className="group bg-white text-blue-700 dark:bg-blue-600 dark:text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-xl shadow-blue-900/20 hover:bg-blue-50 dark:hover:bg-blue-500 transition-all transform hover:scale-105 flex items-center justify-center gap-3"
                    >
                        Get Started
                        <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                    </button>
                    <button 
                        onClick={onInstructions}
                        className="px-8 py-4 rounded-2xl font-bold text-lg border border-white/30 hover:bg-white/10 transition-all flex items-center justify-center text-blue-50"
                    >
                        Learn More
                    </button>
                </div>
                
                <div className="pt-8 flex items-center justify-center lg:justify-start gap-6 text-sm text-blue-200/80">
                    <div className="flex items-center gap-2"><CheckCircle size={16} /> No Cloud Storage</div>
                    <div className="flex items-center gap-2"><CheckCircle size={16} /> Bank-Level Privacy</div>
                    <div className="flex items-center gap-2"><CheckCircle size={16} /> PDF & Word Support</div>
                </div>
            </div>

            {/* Visual Mockup */}
            <div className="relative animate-float hidden lg:block">
                {/* Background Glow */}
                <div className="absolute inset-0 bg-indigo-500 rounded-full blur-[100px] opacity-30"></div>
                
                {/* The Card */}
                <div className="relative bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl transform rotate-2 hover:rotate-0 transition-transform duration-700">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8 border-b border-white/10 pb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center shadow-lg">
                                <FormWizLogo size={20} className="text-white" />
                            </div>
                            <div>
                                <div className="text-sm font-bold text-white">FormWiz AI</div>
                                <div className="text-xs text-blue-200">Interviewing...</div>
                            </div>
                        </div>
                        <div className="px-3 py-1 bg-green-500/20 text-green-300 text-xs font-bold rounded-full border border-green-500/30 animate-pulse">
                            Live
                        </div>
                    </div>

                    {/* Chat UI */}
                    <div className="space-y-6">
                        
                        {/* AI Message */}
                        <div className="flex gap-4">
                            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                                <Play size={18} fill="currentColor" className="text-white ml-1" />
                            </div>
                            <div className="space-y-2">
                                <div className="bg-white/10 rounded-2xl rounded-tl-none p-4 border border-white/5">
                                    <p className="text-sm text-blue-50 leading-relaxed">
                                        "Please state your full legal name as it appears on your ID."
                                    </p>
                                </div>
                                <span className="text-xs text-blue-300 ml-1">AI Interviewer • 10:42 AM</span>
                            </div>
                        </div>

                        {/* User Response */}
                        <div className="flex gap-4 flex-row-reverse">
                             <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/40">
                                <Mic size={20} className="text-white" />
                            </div>
                            <div className="space-y-2 text-right">
                                <div className="bg-blue-600 rounded-2xl rounded-tr-none p-4 shadow-lg">
                                    <div className="flex items-center gap-2 mb-1 justify-end">
                                        <div className="w-1 h-3 bg-white/50 rounded-full animate-pulse"></div>
                                        <div className="w-1 h-5 bg-white rounded-full animate-pulse delay-75"></div>
                                        <div className="w-1 h-3 bg-white/50 rounded-full animate-pulse delay-150"></div>
                                    </div>
                                    <p className="text-sm text-white font-medium">
                                        "John Doe"
                                    </p>
                                </div>
                                <span className="text-xs text-blue-300 mr-1">You • Listening...</span>
                            </div>
                        </div>

                        {/* Field Preview */}
                        <div className="mt-6 p-4 bg-black/20 rounded-xl border border-white/10">
                            <div className="text-xs text-blue-300 mb-2 uppercase font-bold tracking-wider">Form Field Detected</div>
                            <div className="bg-white/5 p-3 rounded-lg border border-white/10 flex justify-between items-center">
                                <span className="text-sm text-blue-100">Full Name</span>
                                <span className="text-sm font-mono text-white bg-blue-500/30 px-2 py-1 rounded border border-blue-400/30">John Doe</span>
                            </div>
                        </div>

                    </div>
                </div>
            </div>

        </div>
      </div>
      
      {/* Footer Mobile Links (Visible only on small screens) */}
      <div className="sm:hidden p-6 text-center text-sm text-blue-200/60 border-t border-white/10">
          <div className="flex justify-center gap-6">
            <button onClick={onPrivacy}>Privacy</button>
            <button onClick={onInstructions}>Instructions</button>
            <button onClick={onPricing}>Pricing</button>
          </div>
      </div>
    </div>
  );
};

export default Splash;