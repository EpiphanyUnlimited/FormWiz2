import React from 'react';
import { ArrowLeft, Upload, Mic, Layout, Download, Settings } from 'lucide-react';
import VoiceDoxLogo from './FormWizLogo';

interface InstructionsProps {
  onBack: () => void;
}

const Instructions: React.FC<InstructionsProps> = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-950 text-slate-900 dark:text-slate-100 font-sans p-6">
      <div className="max-w-4xl mx-auto">
        <button 
            onClick={onBack}
            className="flex items-center gap-2 text-slate-500 hover:text-blue-600 mb-8 transition-colors font-medium"
        >
            <ArrowLeft size={20} /> Back
        </button>

        <div className="text-center mb-12">
            <VoiceDoxLogo size={64} className="mx-auto mb-4" />
            <h1 className="text-4xl font-extrabold mb-4">How VoiceDox Works</h1>
            <p className="text-xl text-slate-500 dark:text-slate-400">Your intelligent assistant for paperwork.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
            {/* Step 1 */}
            <div className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm p-8 rounded-3xl border border-slate-100 dark:border-slate-700 relative overflow-hidden group shadow-sm hover:shadow-md transition-shadow">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Upload size={120} />
                </div>
                <div className="relative z-10">
                    <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center font-bold text-xl mb-6 shadow-lg shadow-blue-500/30">1</div>
                    <h3 className="text-2xl font-bold mb-3">Upload Document</h3>
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                        Start by uploading a PDF, Image, or taking a photo of your form. VoiceDox uses advanced AI to scan the document and detect every question, checkbox, and writing area automatically.
                    </p>
                </div>
            </div>

             {/* Step 2 */}
             <div className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm p-8 rounded-3xl border border-slate-100 dark:border-slate-700 relative overflow-hidden group shadow-sm hover:shadow-md transition-shadow">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Settings size={120} />
                </div>
                <div className="relative z-10">
                    <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center font-bold text-xl mb-6 shadow-lg shadow-indigo-500/30">2</div>
                    <h3 className="text-2xl font-bold mb-3">Setup & Customize</h3>
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                        Before answering, you'll see a preview of all detected fields. 
                        <br/><br/>
                        <span className="font-semibold text-indigo-600 dark:text-indigo-400">• Move & Resize:</span> Drag boxes to adjust alignment.
                        <br/>
                        <span className="font-semibold text-red-500">• Delete:</span> Remove any fields that aren't needed or were detected incorrectly.
                    </p>
                </div>
            </div>

             {/* Step 3 */}
             <div className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm p-8 rounded-3xl border border-slate-100 dark:border-slate-700 relative overflow-hidden group shadow-sm hover:shadow-md transition-shadow">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Mic size={120} />
                </div>
                <div className="relative z-10">
                    <div className="w-12 h-12 bg-purple-600 text-white rounded-2xl flex items-center justify-center font-bold text-xl mb-6 shadow-lg shadow-purple-500/30">3</div>
                    <h3 className="text-2xl font-bold mb-3">The Interview</h3>
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                        VoiceDox will act as your interviewer. It reads questions aloud, and you can simply speak your answers. 
                        <br/><br/>
                        Tap the microphone to speak. The AI auto-detects when you pause and keeps listening until you're done.
                    </p>
                </div>
            </div>

             {/* Step 4 */}
             <div className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm p-8 rounded-3xl border border-slate-100 dark:border-slate-700 relative overflow-hidden group shadow-sm hover:shadow-md transition-shadow">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Download size={120} />
                </div>
                <div className="relative z-10">
                    <div className="w-12 h-12 bg-green-600 text-white rounded-2xl flex items-center justify-center font-bold text-xl mb-6 shadow-lg shadow-green-500/30">4</div>
                    <h3 className="text-2xl font-bold mb-3">Download</h3>
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                        Once finished, review your answers one last time. Then, download the perfectly filled PDF to your device, ready to sign and send.
                    </p>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Instructions;