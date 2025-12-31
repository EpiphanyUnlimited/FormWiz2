import React, { useState, useEffect } from 'react';
import FormWizLogo from './FormWizLogo';
import { Sparkles } from 'lucide-react';

const AnalyzingAnimation: React.FC = () => {
  const [text, setText] = useState("Scanning Document...");
  const [progress, setProgress] = useState(0);
  
  useEffect(() => {
    const messages = [
      "Scanning Document...",
      "Identifying Questions...",
      "Analyzing Layout...",
      "Preparing Interview..."
    ];
    let i = 0;
    const interval = setInterval(() => {
      i = (i + 1) % messages.length;
      setText(messages[i]);
    }, 1500);

    // Progress bar simulation (approx 6 seconds total)
    const progressInterval = setInterval(() => {
        setProgress(old => {
            if (old >= 100) {
                clearInterval(progressInterval);
                return 100;
            }
            return old + 1.5; // Increment
        });
    }, 100);

    return () => {
        clearInterval(interval);
        clearInterval(progressInterval);
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-20 min-h-[400px] animate-fade-in">
      {/* Animation Container */}
      <div className="relative w-32 h-40 mb-10">
        
        {/* Glowing Background Pulse */}
        <div className="absolute inset-0 bg-blue-500/20 rounded-xl blur-xl animate-pulse"></div>

        {/* The Document (Logo) */}
        <div className="relative z-10 w-full h-full bg-white dark:bg-slate-800 rounded-xl border-2 border-slate-200 dark:border-slate-600 shadow-2xl flex items-center justify-center overflow-hidden">
           <FormWizLogo size={64} className="opacity-80" />
           
           {/* Scanning Beam */}
           <div className="absolute top-0 left-0 w-full h-1 bg-blue-400 shadow-[0_0_15px_rgba(96,165,250,0.8)] animate-[scan_2s_ease-in-out_infinite]"></div>
        </div>

        {/* Floating Magic Particles */}
        <div className="absolute -top-4 -right-6 animate-[bounce_2s_infinite]">
            <Sparkles className="text-amber-400 w-8 h-8 drop-shadow-lg" />
        </div>
        <div className="absolute -bottom-2 -left-8 animate-[bounce_2.5s_infinite_0.5s]">
            <Sparkles className="text-blue-400 w-6 h-6 drop-shadow-lg" />
        </div>
      </div>

      {/* Text Area */}
      <div className="text-center space-y-4 w-full max-w-xs">
        <div>
            <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
            {text}
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
            FormWiz AI is working its magic...
            </p>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div 
                className="h-full bg-blue-600 dark:bg-blue-400 transition-all duration-100 ease-out relative"
                style={{ width: `${progress}%` }}
            >
                <div className="absolute top-0 right-0 bottom-0 w-4 bg-white/30 blur-sm"></div>
            </div>
        </div>
      </div>

      {/* Animation Styles */}
      <style>{`
        @keyframes scan {
          0% { top: 0%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default AnalyzingAnimation;