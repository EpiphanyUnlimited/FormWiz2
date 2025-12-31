import React from 'react';
import { User, CreditCard, Shield, Moon, Sun, LogOut, ArrowLeft, Trash2, Crown, Download, FileText } from 'lucide-react';
import { UserSettings, PlanType } from '../types';

interface AccountSettingsProps {
  userEmail: string;
  settings: UserSettings;
  onBack: () => void;
  onLogout: () => void;
  onUpgrade: () => void;
  toggleTheme: () => void;
  darkMode: boolean;
}

const AccountSettings: React.FC<AccountSettingsProps> = ({ 
  userEmail, 
  settings, 
  onBack, 
  onLogout, 
  onUpgrade,
  toggleTheme,
  darkMode
}) => {
  
  const PLAN_LIMITS = {
      free: { saved: 3, downloads: 3 },
      premium: { saved: 10, downloads: 10 },
      pro: { saved: 25, downloads: 'Unlimited' },
      enterprise: { saved: 'Unlimited', downloads: 'Unlimited' }
  };

  const limits = PLAN_LIMITS[settings.plan];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-950 text-slate-900 dark:text-slate-100 font-sans p-6 transition-colors duration-300">
      <div className="max-w-2xl mx-auto">
        <button 
            onClick={onBack}
            className="flex items-center gap-2 text-slate-500 hover:text-blue-600 mb-8 transition-colors font-medium"
        >
            <ArrowLeft size={20} /> Back to Dashboard
        </button>

        <h1 className="text-3xl font-extrabold mb-8">Account Settings</h1>

        {/* Profile Card */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-700 overflow-hidden mb-6">
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex items-center gap-4">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400">
                    <User size={32} />
                </div>
                <div>
                    <h2 className="text-xl font-bold">{userEmail}</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Member since {new Date().getFullYear()}</p>
                </div>
            </div>
            <div className="p-6 bg-slate-50 dark:bg-slate-800/50">
                <div className="flex justify-between items-center">
                     <span className="font-medium">App Theme</span>
                     <button 
                        onClick={toggleTheme}
                        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
                     >
                        {darkMode ? <Sun size={18} /> : <Moon size={18} />}
                        <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
                     </button>
                </div>
            </div>
        </div>

        {/* Plan & Usage */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-700 overflow-hidden mb-6">
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg">
                        <Crown size={24} />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold capitalize">{settings.plan} Plan</h2>
                        <p className="text-slate-500 dark:text-slate-400 text-xs">
                            {settings.plan === 'free' ? 'Upgrade to unlock more limits' : 'Thank you for being a premium member'}
                        </p>
                    </div>
                </div>
                {settings.plan !== 'enterprise' && (
                    <button 
                        onClick={onUpgrade}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-sm transition-colors shadow-md"
                    >
                        Upgrade
                    </button>
                )}
            </div>
            
            <div className="p-6 space-y-6">
                {/* Downloads Usage */}
                <div>
                    <div className="flex justify-between text-sm mb-2 font-medium">
                        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                            <Download size={16} /> Monthly Downloads
                        </div>
                        <span className={settings.downloadsUsed >= (typeof limits.downloads === 'number' ? limits.downloads : 0) ? "text-red-500" : "text-slate-500"}>
                            {settings.downloadsUsed} / {limits.downloads}
                        </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
                        <div 
                            className={`h-full rounded-full ${settings.downloadsUsed >= (typeof limits.downloads === 'number' ? limits.downloads : 100) ? 'bg-red-500' : 'bg-blue-500'}`}
                            style={{ width: typeof limits.downloads === 'number' ? `${(settings.downloadsUsed / limits.downloads) * 100}%` : '0%' }}
                        ></div>
                    </div>
                </div>

                {/* Storage Usage */}
                <div>
                    <div className="flex justify-between text-sm mb-2 font-medium">
                        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                            <FileText size={16} /> Active Documents
                        </div>
                         {/* We don't track exact count in userSettings currently, just simulating based on limit logic would require passing saved forms count. 
                             For this UI mock, we assume the user can see their plan limit. */}
                        <span className="text-slate-500">
                           Limit: {limits.saved}
                        </span>
                    </div>
                </div>
            </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-red-50 dark:bg-red-900/10 rounded-2xl border border-red-100 dark:border-red-900/30 p-6">
            <h3 className="text-red-700 dark:text-red-400 font-bold mb-2">Danger Zone</h3>
            <p className="text-sm text-red-600/70 dark:text-red-400/70 mb-4">
                Deleting your account will permanently remove all saved forms and settings from this device.
            </p>
            <div className="flex gap-4">
                <button 
                    onClick={onLogout}
                    className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 font-medium text-sm"
                >
                    <LogOut size={16} /> Sign Out
                </button>
                <button 
                    onClick={() => {
                        if(window.confirm("Are you sure? This will wipe all local data.")) {
                            localStorage.clear();
                            window.location.reload();
                        }
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium text-sm transition-colors"
                >
                    <Trash2 size={16} /> Delete Data
                </button>
            </div>
        </div>

        <div className="text-center mt-8 text-xs text-slate-400">
            <p>FormWiz v1.0.0 • Epiphany Unlimited, Inc.</p>
        </div>
      </div>
    </div>
  );
};

export default AccountSettings;