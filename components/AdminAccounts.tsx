import React, { useEffect, useState } from 'react';
import { ArrowLeft, ShieldCheck, RefreshCw, Crown } from 'lucide-react';
import { auth } from '../utils/auth';

interface AccountRow {
    id: string;
    email: string;
    plan: string;
    source: string | null;
    hasStripeCustomer: boolean;
}

interface AdminAccountsProps {
    onBack: () => void;
}

/**
 * Hidden owner console at /admin. The server (admin-accounts function)
 * enforces access via the ADMIN_EMAILS allowlist — this page just renders
 * whatever the backend authorizes, and shows a plain "not authorized"
 * message for anyone else.
 */
const AdminAccounts: React.FC<AdminAccountsProps> = ({ onBack }) => {
    const [accounts, setAccounts] = useState<AccountRow[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const load = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = await auth.getToken();
            if (!token) throw new Error('Please sign in first.');
            const res = await fetch('/.netlify/functions/admin-accounts', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.status === 401 || res.status === 403) {
                throw new Error('This page is only available to the site owner.');
            }
            if (!res.ok) throw new Error(`Request failed (${res.status}).`);
            const data = await res.json();
            setAccounts(data.accounts ?? []);
        } catch (e: any) {
            setError(e.message || 'Could not load accounts.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const paidCount = accounts?.filter(a => a.plan !== 'free').length ?? 0;

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-950 text-slate-900 dark:text-slate-100 font-sans p-6 transition-colors duration-300">
            <div className="max-w-3xl mx-auto">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 text-slate-500 hover:text-blue-600 mb-8 transition-colors font-medium"
                >
                    <ArrowLeft size={20} /> Back
                </button>

                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
                            <ShieldCheck size={28} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-extrabold">Accounts</h1>
                            {accounts && (
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    {accounts.length} total · {paidCount} paid
                                </p>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={load}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 font-medium text-sm disabled:opacity-60"
                    >
                        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
                    </button>
                </div>

                {error && (
                    <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 text-red-700 dark:text-red-400 rounded-2xl p-6">
                        {error}
                    </div>
                )}

                {!error && accounts && (
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-700 overflow-hidden">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-100 dark:border-slate-700 text-left text-slate-500 dark:text-slate-400">
                                    <th className="p-4 font-semibold">Email</th>
                                    <th className="p-4 font-semibold">Plan</th>
                                    <th className="p-4 font-semibold">Billing</th>
                                </tr>
                            </thead>
                            <tbody>
                                {accounts.map(a => (
                                    <tr key={a.id} className="border-b border-slate-50 dark:border-slate-700/50 last:border-0">
                                        <td className="p-4 font-medium">{a.email}</td>
                                        <td className="p-4">
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold uppercase ${
                                                a.plan !== 'free'
                                                    ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                                                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                                            }`}>
                                                {a.plan !== 'free' && <Crown size={12} />}
                                                {a.plan}
                                            </span>
                                        </td>
                                        <td className="p-4 text-slate-500 dark:text-slate-400">
                                            {a.source ?? (a.hasStripeCustomer ? 'stripe' : '—')}
                                        </td>
                                    </tr>
                                ))}
                                {accounts.length === 0 && (
                                    <tr><td className="p-4 text-slate-400" colSpan={3}>No accounts yet.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminAccounts;
