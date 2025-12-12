import React, { useState } from 'react';
import { Mail, Lock, ArrowRight, Loader2, ShieldCheck, Moon, Sun, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import VoiceDoxLogo from './FormWizLogo';

interface AuthProps {
  onLogin: (email: string) => void;
  darkMode: boolean;
  toggleTheme: () => void;
}

// Simulated User DB interface
interface UserRecord {
    email: string;
    password: string;
    verified: boolean;
}

const Auth: React.FC<AuthProps> = ({ onLogin, darkMode, toggleTheme }) => {
  const [view, setView] = useState<'login' | 'signup' | 'verify' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [verifyCode, setVerifyCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Helper to access our local "database"
  const getUsers = (): Record<string, UserRecord> => {
      try {
          return JSON.parse(localStorage.getItem('autoform_db_users') || '{}');
      } catch {
          return {};
      }
  };

  const saveUser = (user: UserRecord) => {
      const users = getUsers();
      users[user.email] = user;
      localStorage.setItem('autoform_db_users', JSON.stringify(users));
  };

  const validatePassword = (pwd: string): boolean => {
      // At least 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
      const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
      return regex.test(pwd);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const cleanEmail = email.trim();
    const cleanPassword = password.trim();

    setTimeout(() => {
        const users = getUsers();
        const user = users[cleanEmail];

        if (!user) {
            setError("Account not found. Please sign up.");
            setIsLoading(false);
            return;
        }

        // Exact match check on password
        if (user.password !== cleanPassword) {
            setError("Incorrect password.");
            setIsLoading(false);
            return;
        }

        if (!user.verified) {
            setView('verify');
            setError("Account not verified. Please enter the code sent to your email.");
            alert(`Resending Verification Code: 123456`);
            setIsLoading(false);
            return;
        }

        onLogin(cleanEmail);
        setIsLoading(false);
    }, 800);
  };

  const handleSignup = (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      setIsLoading(true);

      const cleanEmail = email.trim();
      const cleanPassword = password.trim();

      setTimeout(() => {
          const users = getUsers();
          if (users[cleanEmail]) {
              setError("An account with this email already exists.");
              setIsLoading(false);
              return;
          }

          if (!validatePassword(cleanPassword)) {
              setError("Password does not meet complexity requirements.");
              setIsLoading(false);
              return;
          }

          // Create unverified user
          saveUser({ email: cleanEmail, password: cleanPassword, verified: false });
          
          alert(`VoiceDox Verification Code for ${cleanEmail}: 123456`);
          
          setIsLoading(false);
          setView('verify');
      }, 800);
  };

  const handleVerify = (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      setIsLoading(true);

      const cleanCode = verifyCode.trim();

      setTimeout(() => {
          if (cleanCode === '123456') {
              const users = getUsers();
              const cleanEmail = email.trim();
              if (users[cleanEmail]) {
                  users[cleanEmail].verified = true;
                  localStorage.setItem('autoform_db_users', JSON.stringify(users));
                  onLogin(cleanEmail);
              } else {
                  setError("User record missing. Please sign up again.");
                  setView('signup');
              }
          } else {
              setError("Invalid verification code.");
          }
          setIsLoading(false);
      }, 800);
  };

  const handleForgotPassword = (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      setSuccessMessage(null);
      setIsLoading(true);
      
      const cleanEmail = email.trim();

      setTimeout(() => {
          // Simulate sending email regardless of whether user exists (security best practice)
          setSuccessMessage(`If an account exists for ${cleanEmail}, we have sent a password reset link.`);
          setIsLoading(false);
      }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 px-4 font-sans transition-colors duration-300">
      <div className="absolute top-4 right-4">
        <button onClick={toggleTheme} className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors">
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>

      <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 border border-slate-100 dark:border-slate-700 transition-colors duration-300">
        <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
                <VoiceDoxLogo size={64} />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                {view === 'login' && "Welcome Back"}
                {view === 'signup' && "Create Account"}
                {view === 'verify' && "Verify Email"}
                {view === 'forgot' && "Reset Password"}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">
                {view === 'login' && "Sign in to access your saved forms."}
                {view === 'signup' && "Get started with AI-powered form filling."}
                {view === 'verify' && `We've sent a code to ${email}`}
                {view === 'forgot' && "Enter your email to receive a reset link."}
            </p>
        </div>

        {error && (
            <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 text-sm rounded-lg border border-red-100 dark:border-red-800 flex items-start gap-2">
                <ShieldCheck size={16} className="mt-0.5 shrink-0" />
                <span>{error}</span>
            </div>
        )}

        {successMessage && (
            <div className="mb-6 p-3 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-300 text-sm rounded-lg border border-green-100 dark:border-green-800 flex items-start gap-2">
                <ShieldCheck size={16} className="mt-0.5 shrink-0" />
                <span>{successMessage}</span>
            </div>
        )}

        {view === 'verify' ? (
             <form onSubmit={handleVerify} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Verification Code</label>
                    <input 
                        type="text" 
                        required
                        className="w-full px-4 py-3 text-center text-2xl tracking-widest rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="000000"
                        maxLength={6}
                        value={verifyCode}
                        onChange={(e) => setVerifyCode(e.target.value)}
                    />
                    <p className="text-xs text-center text-slate-400 mt-2">Use code 123456 for testing</p>
                </div>
                <button 
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-semibold py-3 rounded-lg shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 transition-all disabled:opacity-70 mt-4"
                >
                    {isLoading ? <Loader2 className="animate-spin" /> : (
                        <>Verify & Sign In <ArrowRight size={18} /></>
                    )}
                </button>
             </form>
        ) : view === 'forgot' ? (
            <form onSubmit={handleForgotPassword} className="space-y-4">
                 <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-3 text-slate-400" size={18} />
                        <input 
                            type="email" 
                            required
                            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                </div>
                <button 
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-semibold py-3 rounded-lg shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 transition-all disabled:opacity-70 mt-6"
                >
                    {isLoading ? <Loader2 className="animate-spin" /> : "Send Reset Link"}
                </button>
            </form>
        ) : (
            <form onSubmit={view === 'login' ? handleLogin : handleSignup} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-3 text-slate-400" size={18} />
                        <input 
                            type="email" 
                            required
                            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                </div>

                <div>
                    <div className="flex justify-between items-center mb-1">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Password</label>
                        {view === 'login' && (
                             <button type="button" onClick={() => setView('forgot')} className="text-xs text-blue-600 dark:text-blue-400 hover:underline">Forgot?</button>
                        )}
                    </div>
                    <div className="relative">
                        <Lock className="absolute left-3 top-3 text-slate-400" size={18} />
                        <input 
                            type={showPassword ? "text" : "password"} 
                            required
                            className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        <button 
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                        >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                    {view === 'signup' && (
                        <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 space-y-1">
                            <p>Password requirements:</p>
                            <ul className="list-disc pl-4 space-y-0.5">
                                <li className={password.length >= 8 ? "text-green-600 dark:text-green-400" : ""}>At least 8 characters</li>
                                <li className={/[A-Z]/.test(password) ? "text-green-600 dark:text-green-400" : ""}>One uppercase letter</li>
                                <li className={/[a-z]/.test(password) ? "text-green-600 dark:text-green-400" : ""}>One lowercase letter</li>
                                <li className={/\d/.test(password) ? "text-green-600 dark:text-green-400" : ""}>One number</li>
                                <li className={/[@$!%*?&]/.test(password) ? "text-green-600 dark:text-green-400" : ""}>One special character (@$!%*?&)</li>
                            </ul>
                        </div>
                    )}
                </div>

                <button 
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-semibold py-3 rounded-lg shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 transition-all disabled:opacity-70 mt-6"
                >
                    {isLoading ? <Loader2 className="animate-spin" /> : (
                        <>
                            {view === 'login' ? "Sign In" : "Create Account"}
                            <ArrowRight size={18} />
                        </>
                    )}
                </button>
            </form>
        )}

        <div className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
            {view === 'login' ? (
                <>
                    Don't have an account?{' '}
                    <button onClick={() => { setView('signup'); setError(null); }} className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">Sign up</button>
                </>
            ) : view === 'signup' ? (
                <>
                    Already have an account?{' '}
                    <button onClick={() => { setView('login'); setError(null); }} className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">Sign in</button>
                </>
            ) : (
                <button onClick={() => { setView('login'); setError(null); setSuccessMessage(null); }} className="flex items-center justify-center gap-1 mx-auto text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                    <ArrowLeft size={14} /> Back to Sign In
                </button>
            )}
        </div>
      </div>
    </div>
  );
};

export default Auth;