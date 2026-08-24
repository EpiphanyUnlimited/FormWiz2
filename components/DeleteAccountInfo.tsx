import React from 'react';
import { ArrowLeft, UserX, Trash2, Mail } from 'lucide-react';

interface DeleteAccountInfoProps {
    onBack: () => void;
    onGoToSettings: () => void;
    isSignedIn: boolean;
}

/**
 * Public account-deletion information page, served at /delete-account.
 * This URL is declared in the Google Play Console (Data safety → account
 * deletion) and must be reachable without signing in.
 */
const DeleteAccountInfo: React.FC<DeleteAccountInfoProps> = ({ onBack, onGoToSettings, isSignedIn }) => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-950 text-slate-900 dark:text-slate-100 font-sans p-6 transition-colors duration-300">
            <div className="max-w-2xl mx-auto">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 text-slate-500 hover:text-blue-600 mb-8 transition-colors font-medium"
                >
                    <ArrowLeft size={20} /> Back
                </button>

                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl">
                        <UserX size={28} />
                    </div>
                    <h1 className="text-3xl font-extrabold">Delete Your FormWiz Account</h1>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-700 p-6 mb-6 space-y-4">
                    <p>
                        You can permanently delete your FormWiz account and associated data at any time.
                        Deletion removes your sign-in credentials, your subscription record (any active
                        subscription is cancelled), and your account data from our systems. Forms and
                        documents you saved are stored locally on your own device and are removed by the
                        app as part of deletion; they never leave your device except when you submit a
                        document for AI analysis.
                    </p>
                    <p className="font-semibold">This cannot be undone.</p>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-700 p-6 mb-6">
                    <h2 className="text-lg font-bold mb-3">Option 1 — In the app or on the web</h2>
                    <ol className="list-decimal list-inside space-y-2 text-slate-700 dark:text-slate-300">
                        <li>Sign in to your FormWiz account (mobile app or this website)</li>
                        <li>Open <strong>Settings</strong> (mobile) or <strong>Account Settings</strong> (web)</li>
                        <li>Choose <strong>Delete Account</strong> and confirm</li>
                    </ol>
                    <button
                        onClick={onGoToSettings}
                        className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold text-sm transition-colors"
                    >
                        {isSignedIn ? 'Go to Account Settings' : 'Sign in to delete your account'}
                    </button>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-700 p-6 mb-6">
                    <h2 className="text-lg font-bold mb-3">Option 2 — Email us</h2>
                    <p className="text-slate-700 dark:text-slate-300 flex items-center gap-2">
                        <Mail size={18} className="text-blue-500" />
                        Send a deletion request from your account's email address to{' '}
                        <a href="mailto:info@epiphanyunltd.com" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">
                            info@epiphanyunltd.com
                        </a>
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                        We process email deletion requests within 30 days.
                    </p>
                </div>

                <div className="bg-blue-50 dark:bg-slate-800/50 rounded-2xl border border-blue-100 dark:border-slate-700 p-6">
                    <h2 className="text-lg font-bold mb-2 flex items-center gap-2"><Trash2 size={18} /> Just want to clear local data?</h2>
                    <p className="text-slate-700 dark:text-slate-300 text-sm">
                        If you only want to remove forms and documents stored on a device without closing
                        your account, use <strong>Settings → Delete Data</strong> in the mobile app or{' '}
                        <strong>Account Settings → Delete Local Data</strong> on the web.
                    </p>
                </div>

                <div className="text-center mt-8 text-xs text-slate-400">
                    <p>FormWiz • Epiphany Unlimited, Inc. • info@epiphanyunltd.com</p>
                </div>
            </div>
        </div>
    );
};

export default DeleteAccountInfo;
