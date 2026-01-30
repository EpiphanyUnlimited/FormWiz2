import React, { useState } from 'react';
import { X, Check } from 'lucide-react';

interface EnterpriseContactModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const EnterpriseContactModal: React.FC<EnterpriseContactModalProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    const [formData, setFormData] = useState({
        companyName: '',
        contactName: '',
        phone: '',
        email: '',
        orgSize: '1-10',
        bestDay: 'Monday',
        bestTime: '9am-12pm',
    });
    const [submitted, setSubmitted] = useState(false);

    // Time intervals
    const timeSlots = ['9am-12pm EST', '12pm-5pm EST', '5pm-8pm EST'];
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Simulate Netlify form submission or just handling it
        // In a real Netlify Setup, adding <form name="enterprise" netlify hidden> in index.html is needed
        // checking for simple submission here

        console.log("Submitting Enterprise Inquiry:", formData);

        // Construct mailto for fallback
        const subject = `Enterprise Inquiry - ${formData.companyName}`;
        const body = `Company: ${formData.companyName}\nContact: ${formData.contactName}\nEmail: ${formData.email}\nPhone: ${formData.phone}\nSize: ${formData.orgSize}\nBest Time: ${formData.bestDay} ${formData.bestTime}`;

        // Optional: open mailto
        // window.location.href = `mailto:info@epiphanyunltd.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

        setSubmitted(true);
        setTimeout(() => {
            setSubmitted(false);
            onClose();
        }, 3000);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">

                <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Enterprise Inquiry</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1">
                        <X size={20} />
                    </button>
                </div>

                {submitted ? (
                    <div className="p-12 text-center">
                        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Check size={32} />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Request Sent!</h3>
                        <p className="text-slate-500 dark:text-slate-400">We'll be in touch shortly.</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="p-6 space-y-4" name="enterprise-contact" data-netlify="true">
                        <input type="hidden" name="form-name" value="enterprise-contact" />

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Company Name *</label>
                            <input
                                type="text"
                                required
                                className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                value={formData.companyName}
                                onChange={e => setFormData({ ...formData, companyName: e.target.value })}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Contact Name *</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={formData.contactName}
                                    onChange={e => setFormData({ ...formData, contactName: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Phone (Optional)</label>
                                <input
                                    type="tel"
                                    className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={formData.phone}
                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Email Address *</label>
                            <input
                                type="email"
                                required
                                className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Organization Size *</label>
                            <select
                                className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                value={formData.orgSize}
                                onChange={e => setFormData({ ...formData, orgSize: e.target.value })}
                            >
                                <option>1-10</option>
                                <option>11-50</option>
                                <option>51-200</option>
                                <option>201-500</option>
                                <option>500+</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Best Time to Reach (EST) *</label>
                            <div className="grid grid-cols-2 gap-4">
                                <select
                                    className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={formData.bestDay}
                                    onChange={e => setFormData({ ...formData, bestDay: e.target.value })}
                                >
                                    {days.map(d => <option key={d}>{d}</option>)}
                                </select>
                                <select
                                    className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={formData.bestTime}
                                    onChange={e => setFormData({ ...formData, bestTime: e.target.value })}
                                >
                                    {timeSlots.map(t => <option key={t}>{t}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold py-3 rounded-xl hover:opacity-90 transition-opacity"
                            >
                                Submit Inquiry
                            </button>
                        </div>

                    </form>
                )}
            </div>
        </div>
    );
};

export default EnterpriseContactModal;
