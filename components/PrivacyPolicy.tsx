import React from 'react';
import { Shield, Lock, Trash2, ArrowLeft } from 'lucide-react';
import VoiceDoxLogo from './FormWizLogo';

interface PrivacyPolicyProps {
  onBack: () => void;
}

const PrivacyPolicy: React.FC<PrivacyPolicyProps> = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-950 text-slate-900 dark:text-slate-100 font-sans p-6">
      <div className="max-w-3xl mx-auto">
        <button 
            onClick={onBack}
            className="flex items-center gap-2 text-slate-500 hover:text-blue-600 mb-8 transition-colors font-medium"
        >
            <ArrowLeft size={20} /> Back
        </button>

        <div className="flex items-center gap-3 mb-8">
            <VoiceDoxLogo size={40} />
            <h1 className="text-3xl font-bold">Privacy & Data Security</h1>
        </div>

        <div className="space-y-8">
            
            <section className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm p-6 rounded-2xl border border-blue-100 dark:border-slate-700 shadow-sm">
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/50 text-blue-600 rounded-xl">
                        <Lock size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold mb-2">Local-Only Storage</h2>
                        <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                            VoiceDox operates on a <strong>Local-First</strong> principle. We do not maintain a central database of your filled forms, answers, or voice recordings on our servers. All form data is stored securely within your browser's local storage mechanism on your specific device.
                        </p>
                    </div>
                </div>
            </section>

            <section>
                <h2 className="text-xl font-bold mb-4">Data Usage & Retention</h2>
                <ul className="space-y-4 text-slate-600 dark:text-slate-300">
                    <li className="flex gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2.5"></div>
                        <p><strong>Voice Processing:</strong> Your voice is processed in real-time to transcribe answers. Audio recordings are transient and are not saved, archived, or used for model training purposes by VoiceDox.</p>
                    </li>
                    <li className="flex gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2.5"></div>
                        <p><strong>Document Analysis:</strong> When you upload a PDF, it is processed temporarily by our AI to identify fields. The document content is not retained by VoiceDox after the session ends.</p>
                    </li>
                    <li className="flex gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2.5"></div>
                        <p><strong>Third-Party Processing:</strong> We utilize secure, enterprise-grade AI providers (Google Gemini) for analysis. Data sent to these providers is used solely for the purpose of generating the response and is subject to their strict enterprise data privacy agreements.</p>
                    </li>
                </ul>
            </section>

            <section className="bg-red-50/50 dark:bg-red-900/10 backdrop-blur-sm p-6 rounded-2xl border border-red-100 dark:border-red-900/30">
                 <div className="flex items-start gap-4">
                    <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-xl">
                        <Trash2 size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold mb-2">You Are in Control</h2>
                        <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                            Because data is stored on your device, you have total control. You can delete individual forms or clear all application data at any time.
                        </p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Clearing your browser cache or "Site Data" will permanently remove all saved forms.
                        </p>
                    </div>
                </div>
            </section>

            <div className="text-center pt-8 border-t border-slate-200 dark:border-slate-800 text-sm text-slate-400">
                <p>&copy; {new Date().getFullYear()} Epiphany Unlimited, Inc. All rights reserved.</p>
            </div>

        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;