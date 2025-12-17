import React, { useState, useEffect, useCallback } from 'react';
import netlifyIdentity from 'netlify-identity-widget';
import { Upload, Loader2, Save, ArrowLeft, LogOut, Moon, Sun, AlertTriangle, PlayCircle, Crown } from 'lucide-react';
import { AppStep, FormField, PlanType, UserSettings } from './types';
import { convertPDFToImages, generateFilledPDF, convertImageToPDF } from './utils/pdfUtils';
import { analyzeFormImage } from './services/geminiService';
import VoiceInterviewer from './components/VoiceInterviewer';
import PDFPreview from './components/PDFPreview';
import Dashboard from './components/Dashboard';
import Splash from './components/Splash';
import PrivacyPolicy from './components/PrivacyPolicy';
import Instructions from './components/Instructions';
import Pricing from './components/Pricing';
import AccountSettings from './components/AccountSettings';
import VoiceDoxLogo from './components/FormWizLogo';
import AnalyzingAnimation from './components/AnalyzingAnimation';

// Helper to manage storage keys per user
const getStorageKey = (userId: string) => `autoform_forms_${userId}`;

const PLAN_LIMITS = {
    free: { saved: 3, downloads: 3 },
    premium: { saved: 10, downloads: 10 },
    pro: { saved: 25, downloads: 99999 }, // Unlimited
    enterprise: { saved: 99999, downloads: 99999 }
};

function App() {
  const [user, setUser] = useState<any>(null);
  const [view, setView] = useState<'splash' | 'dashboard' | 'editor' | 'privacy' | 'instructions' | 'pricing' | 'settings'>('splash');
  
  const [settings, setSettings] = useState<UserSettings>({
      plan: 'free',
      downloadsUsed: 0,
      lastResetDate: Date.now()
  });

  const [darkMode, setDarkMode] = useState<boolean>(() => {
      if (typeof window !== 'undefined') {
          const stored = localStorage.getItem('autoform_theme');
          if (stored) return stored === 'dark';
          return window.matchMedia('(prefers-color-scheme: dark)').matches;
      }
      return false;
  });
  
  const [currentFormId, setCurrentFormId] = useState<string | null>(null);
  const [step, setStep] = useState<AppStep>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [fields, setFields] = useState<FormField[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [formName, setFormName] = useState<string>("Untitled Form");
  
  const [globalSaveStatus, setGlobalSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [isConverting, setIsConverting] = useState(false);
  const [savedForms, setSavedForms] = useState<any[]>([]);

  useEffect(() => {
    netlifyIdentity.init();
    const currentUser = netlifyIdentity.currentUser();
    if (currentUser) {
      handleLogin(currentUser);
    } else {
      netlifyIdentity.on('login', handleLogin);
    }
    netlifyIdentity.on('logout', handleLogout);
    return () => {
      netlifyIdentity.off('login', handleLogin);
      netlifyIdentity.off('logout', handleLogout);
    };
  }, []);

  useEffect(() => {
      if (darkMode) {
          document.documentElement.classList.add('dark');
          localStorage.setItem('autoform_theme', 'dark');
      } else {
          document.documentElement.classList.remove('dark');
          localStorage.setItem('autoform_theme', 'light');
      }
  }, [darkMode]);

  const loadUserData = async (userId: string, token: string) => {
      try {
          const rawForms = localStorage.getItem(getStorageKey(userId));
          const forms = rawForms ? JSON.parse(rawForms) : [];
          setSavedForms(forms);

          const response = await fetch('/.netlify/functions/get-user', {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });

          if (response.ok) {
            const userData = await response.json();
            setSettings(prev => ({ ...prev, plan: userData.subscription_status || 'free' }));
          } else {
            console.error("Failed to fetch user plan.");
          }
      } catch (e) {
          console.error("Error loading user data", e);
      }
  };

  const handleUpgradePlan = () => {
      setView('dashboard');
  };

  const toggleTheme = () => setDarkMode(!darkMode);

  const handleSplashProceed = () => {
      if (user) {
          setView('dashboard');
      } else {
          netlifyIdentity.open();
      }
  };

  const handleLogin = (loggedInUser: any) => {
      setUser(loggedInUser);
      netlifyIdentity.close();
      setView('dashboard');
      if (loggedInUser) {
        loadUserData(loggedInUser.id, loggedInUser.token.access_token);
      }
  };

  const handleLogout = () => {
      netlifyIdentity.logout();
      setUser(null);
      setCurrentFormId(null);
      setFields([]);
      setImages([]);
      setView('splash');
  };

  const checkStorageLimit = (): boolean => {
      const limit = PLAN_LIMITS[settings.plan].saved;
      if (typeof limit === 'number' && savedForms.length >= limit) {
          alert(`You have reached the limit of ${limit} active documents for the ${settings.plan.toUpperCase()} plan. Please delete some documents or upgrade.`);
          setView('pricing');
          return false;
      }
      return true;
  };

  const checkDownloadLimit = (): boolean => {
      const limit = PLAN_LIMITS[settings.plan].downloads;
      if (typeof limit === 'number' && settings.downloadsUsed >= limit) {
          alert(`You have reached your monthly download limit of ${limit} for the ${settings.plan.toUpperCase()} plan. Upgrade to increase your limit.`);
          setView('pricing');
          return false;
      }
      return true;
  };

  const handleStartNew = () => {
      if (!checkStorageLimit()) return;
      setCurrentFormId(Date.now().toString());
      setStep('upload');
      setFile(null);
      setImages([]);
      setFields([]);
      setError(null);
      setFormName("Untitled Form");
      setView('editor');
  };

  const handleLoadForm = (formId: string) => {
      if (!user) return;
      const forms = JSON.parse(localStorage.getItem(getStorageKey(user.id)) || '[]');
      const form = forms.find((f: any) => f.id === formId);
      if (form) {
          setCurrentFormId(form.id);
          setFields(form.fields);
          setImages(form.images || []); 
          setStep(form.step || 'review');
          setFormName(form.name);
          setView('editor');
      }
  };
  
  const handleDeleteForm = (formId: string) => {
      if (!user) return;
      if (!window.confirm("Are you sure you want to delete this form? This action cannot be undone.")) return;
      
      const forms = savedForms.filter(f => f.id !== formId);
      localStorage.setItem(getStorageKey(user.id), JSON.stringify(forms));
      setSavedForms(forms);
      
      if (currentFormId === formId) {
          setView('dashboard');
      }
  };

  const saveCurrentProgress = useCallback(() => {
      if (!user || !currentFormId) return false;
      
      setGlobalSaveStatus('saving');

      const newFormEntry = {
          id: currentFormId,
          name: formName,
          timestamp: Date.now(),
          progress: fields.length > 0 ? Math.round((fields.filter(f => f.value && f.value !== 'false').length / fields.length) * 100) : 0,
          fields,
          images,
          step
      };

      try {
          const forms = JSON.parse(localStorage.getItem(getStorageKey(user.id)) || '[]');
          const existingIdx = forms.findIndex((f: any) => f.id === currentFormId);
          
          if (existingIdx >= 0) {
              forms[existingIdx] = newFormEntry;
          } else {
              if (!checkStorageLimit()) {
                 setGlobalSaveStatus('idle');
                 return false;
              }
              forms.push(newFormEntry);
          }
          
          localStorage.setItem(getStorageKey(user.id), JSON.stringify(forms));
          
          setSavedForms(forms);
          setGlobalSaveStatus('saved');
          setTimeout(() => setGlobalSaveStatus('idle'), 2000);
          return true;
      } catch (e) {
          console.error("Save failed", e);
          setGlobalSaveStatus('idle');
          return false;
      }
  }, [user, currentFormId, formName, fields, images, step, settings.plan]);

  useEffect(() => {
      if (view === 'editor' && fields.length > 0) {
          const timeout = setTimeout(() => {
              if (user && currentFormId) {
                  saveCurrentProgress();
              }
          }, 5000);
          return () => clearTimeout(timeout);
      }
  }, [fields, user, currentFormId, saveCurrentProgress, view]);

  const handleAddField = (rect: [number, number, number, number], pageIndex: number, label: string) => {
      const newField: FormField = {
          id: `field-manual-${Date.now()}`,
          label: label,
          value: '',
          rect: rect,
          pageIndex: pageIndex,
          required: false,
          type: 'text'
      };
      setFields(prev => [...prev, newField]);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      let selectedFile = e.target.files[0];
      setError(null);
      setFormName(selectedFile.name.replace(/\.[^/.]+$/, ""));
      setIsConverting(true);

      try {
          if (selectedFile.type.startsWith('image/')) {
              selectedFile = await convertImageToPDF(selectedFile);
          }
          if (selectedFile.type !== 'application/pdf') {
              throw new Error("Unsupported file format. Please upload a PDF or Image.");
          }
          setFile(selectedFile);
          setStep('analyzing');
          const { images: imgData } = await convertPDFToImages(selectedFile);
          setImages(imgData);

          let allFields: FormField[] = [];
          for (let i = 0; i < imgData.length; i++) {
            const pageFields = await analyzeFormImage(imgData[i], i);
            allFields = [...allFields, ...pageFields];
          }
          setFields(allFields);
          setStep('setup');
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Failed to analyze document.');
        setStep('upload');
      } finally {
          setIsConverting(false);
      }
    }
  };

  const handleProceedToInterview = () => {
      saveCurrentProgress();
      setStep('interview');
  };

  const handleDownload = async () => {
    if (!checkDownloadLimit()) return;
    
    if (!file) {
        setError("Original file is missing. Please re-upload to export.");
        return;
    }
    setStep('exporting');
    try {
      const pdfBytes = await generateFilledPDF(file, fields);
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `filled_${formName}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      if (user) {
          setSettings(s => ({ ...s, downloadsUsed: s.downloadsUsed + 1 }));
      }

    } catch (e) {
      console.error(e);
      setError('Failed to generate PDF');
    } finally {
      setStep('review');
    }
  };

  const renderContent = () => {
      if (view === 'settings' && user) {
          return <AccountSettings userEmail={user.email} settings={settings} onBack={() => setView('dashboard')} onLogout={handleLogout} onUpgrade={() => setView('pricing')} toggleTheme={toggleTheme} darkMode={darkMode} />;
      }
      if (view === 'pricing') {
          return <Pricing onBack={() => setView(user ? 'dashboard' : 'splash')} currentPlan={settings.plan} onUpgrade={handleUpgradePlan} />;
      }
      if (view === 'privacy') {
          return <PrivacyPolicy onBack={() => setView('splash')} />;
      }
      if (view === 'instructions') {
          return <Instructions onBack={() => setView('splash')} />;
      }
      if (!user) {
          return <Splash onProceed={handleSplashProceed} onPrivacy={() => setView('privacy')} onInstructions={() => setView('instructions')} onPricing={() => setView('pricing')} darkMode={darkMode} toggleTheme={toggleTheme} />;
      }
      if (view === 'dashboard') {
          return <Dashboard userEmail={user.email!} onLogout={handleLogout} onNewForm={handleStartNew} onLoadForm={handleLoadForm} savedForms={savedForms} onDeleteForm={handleDeleteForm} darkMode={darkMode} toggleTheme={toggleTheme} onSettings={() => setView('settings')} onUpgrade={() => setView('pricing')} />;
      }
      if (view === 'editor') {
          return (
              <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-300">
                  <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-50 transition-colors duration-300">
                      <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
                          <div className="flex items-center gap-4">
                              <button onClick={() => setView('dashboard')} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-500 dark:text-slate-400">
                                  <ArrowLeft size={20} />
                              </button>
                              <div className="flex items-center gap-2">
                                  <VoiceDoxLogo className="text-blue-600 dark:text-blue-400" size={28} />
                                  <h1 className="text-lg font-bold text-slate-800 dark:text-white truncate max-w-[200px]">{formName}</h1>
                              </div>
                          </div>
                          <div className="flex items-center gap-2">
                              {step !== 'upload' && step !== 'analyzing' && settings.plan !== 'enterprise' && (
                                  <button 
                                      onClick={() => setView('pricing')}
                                      className="hidden sm:flex items-center gap-1 text-xs font-bold uppercase tracking-wide bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 px-3 py-1 rounded-full mr-2 hover:bg-amber-200 transition-colors"
                                  >
                                      <Crown size={12} /> Upgrade
                                  </button>
                              )}
                              <button onClick={toggleTheme} className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full">
                                  {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                              </button>
                              <button 
                                  onClick={() => saveCurrentProgress()} 
                                  className={`flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg transition-all ${globalSaveStatus === 'saved' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600'}`}
                              >
                                  {globalSaveStatus === 'saving' ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                  <span className="hidden sm:inline">{globalSaveStatus === 'saved' ? 'Saved!' : 'Save'}</span>
                              </button>
                              <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-2"></div>
                              <button 
                                  onClick={handleLogout}
                                  className="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 px-3 py-2 rounded-lg transition-colors"
                              >
                                  <LogOut size={16} />
                              </button>
                          </div>
                      </div>
                  </header>
                  <main className="max-w-5xl mx-auto px-6 py-12">
                      {error && (
                          <div className="mb-8 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-3 text-red-700 dark:text-red-300">
                              <AlertTriangle size={20} className="shrink-0" />
                              <div className="flex-1 break-words"><p>{error}</p></div>
                              {error.includes("Word or Google Docs") && (
                                  <label className="px-4 py-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 font-medium text-sm whitespace-nowrap">
                                      Select PDF
                                      <input type="file" accept=".pdf" className="hidden" onChange={handleFileUpload} />
                                  </label>
                              )}
                          </div>
                      )}
                      {step === 'upload' && (
                          <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
                              <div className="text-center mb-10 max-w-lg">
                                  <h2 className="text-4xl font-extrabold text-slate-900 dark:text-white mb-4">New Form Interview</h2>
                                  <p className="text-lg text-slate-500 dark:text-slate-400">Upload a PDF, Image, or Document to begin.</p>
                              </div>
                              <label className="group relative cursor-pointer">
                                  <div className="flex flex-col items-center justify-center w-80 h-64 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-2xl bg-white dark:bg-slate-800 hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-slate-750 transition-all duration-300 shadow-sm">
                                      {isConverting ? (
                                          <div className="flex flex-col items-center animate-pulse">
                                              <Loader2 size={32} className="text-blue-600 dark:text-blue-400 animate-spin mb-4" />
                                              <p className="font-semibold text-slate-700 dark:text-slate-200">Processing File...</p>
                                          </div>
                                      ) : (
                                          <>
                                              <div className="p-4 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 mb-4 group-hover:scale-110 transition-transform">
                                                  <Upload size={32} />
                                              </div>
                                              <p className="font-semibold text-slate-700 dark:text-slate-200">Click to upload document</p>
                                              <p className="text-xs text-slate-400 mt-2 text-center">PDF, JPG, PNG<br/>Word & Google Docs</p>
                                          </>
                                      )}
                                  </div>
                                  <input type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp" className="hidden" onChange={handleFileUpload} disabled={isConverting} />
                              </label>
                          </div>
                      )}
                      {step === 'analyzing' && <AnalyzingAnimation />}
                      {step === 'setup' && (
                          <div className="flex flex-col items-center">
                              <div className="mb-6 text-center max-w-2xl">
                                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Setup Form Fields</h2>
                                  <p className="text-slate-500 dark:text-slate-400">We detected the following fields. You can move or resize the boxes now to ensure they fit perfectly.</p>
                              </div>
                              <div className="w-full flex justify-end gap-3 mb-4 max-w-[800px]">
                                  <button onClick={handleProceedToInterview} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-blue-500/30 transition-all transform hover:scale-105">
                                      Proceed with Interview
                                      <PlayCircle size={20} />
                                  </button>
                              </div>
                              {images.length > 0 && <PDFPreview images={images} fields={fields} onUpdateField={(id, r) => setFields(f => f.map(x => x.id === id ? {...x, rect: r} : x))} onDeleteField={(id) => setFields(f => f.filter(x => x.id !== id))} onAddField={handleAddField} mode="setup" />}
                          </div>
                      )}
                      {step === 'interview' && (
                          <div className="flex flex-col items-center">
                              <div className="w-full max-w-2xl flex justify-start mb-4">
                                  <button onClick={() => setStep('setup')} className="flex items-center gap-1 text-sm text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-colors">
                                      <ArrowLeft size={16} /> Back to Setup
                                  </button>
                              </div>
                              <VoiceInterviewer fields={fields} onUpdate={(updated) => setFields(updated)} onComplete={(updated) => { setFields(updated); setStep('review'); }} onSaveForLater={() => saveCurrentProgress()} />
                          </div>
                      )}
                      {(step === 'review' || step === 'exporting') && (
                          <div className="flex flex-col items-center">
                              <div className="w-full max-w-[800px] flex justify-between gap-3 mb-4">
                                  <button onClick={() => setStep('interview')} className="flex items-center gap-1 text-sm text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-colors">
                                      <ArrowLeft size={16} /> Back to Interview
                                  </button>
                                  <button onClick={handleDownload} disabled={step === 'exporting'} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-blue-500/30 transition-all disabled:opacity-50">
                                      {step === 'exporting' ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                                      Download PDF
                                  </button>
                              </div>
                              {images.length > 0 ? <PDFPreview images={images} fields={fields} onUpdateField={(id, r) => setFields(f => f.map(x => x.id === id ? {...x, rect: r} : x))} onUpdateValue={(id, v) => setFields(f => f.map(x => x.id === id ? {...x, value: v} : x))} mode="review" /> : (
                                  <div className="bg-slate-100 dark:bg-slate-800 p-12 rounded-xl text-center border border-slate-200 dark:border-slate-700">
                                      <p className="text-slate-500 dark:text-slate-400 mb-4">Preview images not available in restored session.</p>
                                      <label className="text-blue-600 dark:text-blue-400 font-semibold cursor-pointer hover:underline">
                                          Upload PDF to restore preview
                                          <input type="file" accept=".pdf" className="hidden" onChange={handleFileUpload} />
                                      </label>
                                  </div>
                              )}
                          </div>
                      )}
                  </main>
              </div>
          );
      }
      return null;
  }

  return (
    <div className="App">
        {renderContent()}
    </div>
  );
}

export default App;