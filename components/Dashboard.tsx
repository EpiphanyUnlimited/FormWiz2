import React from 'react';
import { FileText, Clock, Trash2, ArrowRight, Plus, Moon, Sun, FileCheck } from 'lucide-react';

interface SavedForm {
  id: string;
  name: string;
  timestamp: number;
  progress: number;
}

interface DashboardProps {
  userEmail: string;
  onLogout: () => void;
  onNewForm: () => void;
  onLoadForm: (formId: string) => void;
  savedForms: SavedForm[];
  onDeleteForm: (formId: string) => void;
  darkMode: boolean;
  toggleTheme: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  userEmail, 
  onLogout, 
  onNewForm, 
  onLoadForm, 
  savedForms,
  onDeleteForm,
  darkMode,
  toggleTheme
}) => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
       <nav className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4 flex justify-between items-center sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <FileCheck className="text-blue-600 dark:text-blue-400" size={32} />
            <h1 className="text-xl font-bold text-slate-800 dark:text-white">AutoForm</h1>
          </div>
          <div className="flex items-center gap-4">
              <span className="text-sm text-slate-500 dark:text-slate-400 hidden sm:block">Signed in as {userEmail}</span>
              <button onClick={toggleTheme} className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full">
                {darkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>
              <button onClick={onLogout} className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-red-500 dark:hover:text-red-400 transition-colors">
                  Sign Out
              </button>
          </div>
       </nav>

       <main className="max-w-5xl mx-auto px-6 py-12">
           <div className="flex justify-between items-end mb-8">
               <div>
                   <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Your Forms</h2>
                   <p className="text-slate-500 dark:text-slate-400 mt-1">Manage your in-progress and completed documents.</p>
               </div>
               <button 
                  onClick={onNewForm}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white px-5 py-3 rounded-xl font-semibold shadow-lg shadow-blue-500/20 transition-all transform hover:scale-105"
               >
                   <Plus size={20} />
                   New Form
               </button>
           </div>

           {savedForms.length === 0 ? (
               <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-12 text-center flex flex-col items-center">
                   <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center text-slate-400 dark:text-slate-500 mb-4">
                       <FileText size={32} />
                   </div>
                   <h3 className="text-lg font-semibold text-slate-900 dark:text-white">No forms yet</h3>
                   <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-sm">
                       Upload a PDF to get started. Your progress will be saved automatically here.
                   </p>
                   <button 
                      onClick={onNewForm}
                      className="mt-6 text-blue-600 dark:text-blue-400 font-medium hover:underline"
                   >
                       Start your first form
                   </button>
               </div>
           ) : (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                   {savedForms.map(form => (
                       <div key={form.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 hover:shadow-lg transition-shadow group relative flex flex-col">
                           <div className="flex items-start justify-between mb-4">
                               <div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                                   <FileText size={24} />
                               </div>
                               <button 
                                  onClick={(e) => { e.stopPropagation(); onDeleteForm(form.id); }}
                                  className="text-slate-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 p-2 transition-colors z-10"
                                  title="Delete Form"
                               >
                                   <Trash2 size={18} />
                               </button>
                           </div>
                           
                           <h3 className="font-bold text-slate-800 dark:text-white mb-1 truncate">{form.name}</h3>
                           <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500 mb-6">
                               <Clock size={12} />
                               <span>{new Date(form.timestamp).toLocaleDateString()}</span>
                           </div>

                           <div className="mt-auto">
                               <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1.5 mb-4">
                                   <div 
                                      className="bg-blue-500 dark:bg-blue-400 h-1.5 rounded-full" 
                                      style={{ width: `${form.progress}%` }}
                                   ></div>
                               </div>

                               <button 
                                  onClick={() => onLoadForm(form.id)}
                                  className="w-full py-2 flex items-center justify-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-700 rounded-lg group-hover:bg-blue-600 dark:group-hover:bg-blue-500 group-hover:text-white transition-all"
                               >
                                   Continue
                                   <ArrowRight size={16} />
                               </button>
                           </div>
                       </div>
                   ))}
               </div>
           )}
       </main>
    </div>
  );
};

export default Dashboard;