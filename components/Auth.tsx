import React, { useEffect } from 'react';
import { ShieldCheck, Moon, Sun } from 'lucide-react';
import FormWizLogo from './FormWizLogo';
import { auth } from '../utils/auth';

interface AuthProps {
    onLogin: (email: string) => void;
    darkMode: boolean;
    toggleTheme: () => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin, darkMode, toggleTheme }) => {

    // Auto-open login on mount
    useEffect(() => {
        // We defer slightly to ensure the component is mounted
        const timer = setTimeout(() => {
            auth.login();
        }, 500);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 px-4 font-sans transition-colors duration-300">
            <div className="absolute top-4 right-4">
                <button onClick={toggleTheme} className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors">
                    {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                </button>
            </div>

            <div className="max-w-md w-full p-8 text-center">
                <div className="flex justify-center mb-8">
                    <FormWizLogo size={128} />
                </div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                    Welcome to FormWiz
                </h1>
                <p className="text-slate-500 dark:text-slate-400 mb-8 text-sm">
                    Sign in to access your saved forms and use our AI features.
                </p>

                <button
                    onClick={() => auth.login()}
                    className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-semibold py-3 rounded-lg shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 transition-all mt-4"
                >
                    <ShieldCheck size={18} />
                    Sign In / Sign Up
                </button>
            </div>
        </div>
    );
};

export default Auth;