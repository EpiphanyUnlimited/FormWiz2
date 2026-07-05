import React from 'react';
import { Check, ArrowLeft, CreditCard, Sparkles, Building2, Crown, Zap } from 'lucide-react';
import { PlanType } from '../types';
import FormWizLogo from './FormWizLogo';
import { auth } from '../utils/auth';
import EnterpriseContactModal from './EnterpriseContactModal';

interface PricingProps {
    onBack: () => void;
    currentPlan: PlanType;
    onUpgrade: (plan: PlanType) => void;
}

const Pricing: React.FC<PricingProps> = ({ onBack, currentPlan, onUpgrade }) => {
    const [showEnterpriseModal, setShowEnterpriseModal] = React.useState(false);
    const [user, setUser] = React.useState(auth.currentUser());

    React.useEffect(() => {
        const handler = (u: any) => setUser(u);
        auth.on('login', handler);
        auth.on('logout', () => setUser(null));
        return () => {
            auth.off('login', handler);
            auth.off('logout', () => { });
        };
    }, []);

    const handlePayment = async (plan: PlanType, price: string) => {
        // 1. Check if user is logged in
        if (!user) {
            auth.signup();
            return;
        }

        // 2. Only subscription plans go through Stripe
        if (plan !== 'premium' && plan !== 'pro') {
            alert("Invalid plan selected.");
            return;
        }

        try {
            // 3. Get Auth Token
            const token = await auth.getToken();

            if (!token) {
                alert("Authentication error. Please re-login.");
                return;
            }

            // 4. Call Netlify Function — the plan key is resolved to a
            // Stripe price ID server-side, so price IDs never live in
            // the client (same contract the mobile app uses)
            const response = await fetch('/.netlify/functions/create-checkout-session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ plan })
            });

            if (!response.ok) {
                let detail = 'Network response was not ok';
                try {
                    const body = await response.json();
                    if (body?.error) detail = body.error;
                } catch { /* non-JSON body */ }
                throw new Error(detail);
            }

            const { url } = await response.json();

            // 5. Redirect to Stripe's hosted checkout page
            if (!url) {
                throw new Error('Checkout session did not return a URL');
            }
            window.location.href = url;

        } catch (error: any) {
            console.error("Payment error:", error);
            alert(`Failed to initiate payment: ${error?.message ?? 'unknown error'}`);
        }
    };

    const PlanCard = ({
        type,
        price,
        period,
        features,
        icon: Icon,
        popular = false,
    }: {
        type: PlanType;
        price: string;
        period?: string;
        features: string[];
        icon: any;
        popular?: boolean;
        color?: string;
    }) => {
        const isCurrent = currentPlan === type;

        return (
            <div className={`relative bg-white dark:bg-slate-800 rounded-2xl p-6 border transition-all duration-300 flex flex-col ${popular ? 'border-blue-500 shadow-2xl scale-105 z-10' : 'border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-xl'}`}>
                {popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wide shadow-lg">
                        Best Value
                    </div>
                )}

                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${type === 'enterprise' ? 'bg-slate-900 text-white' :
                    type === 'pro' ? 'bg-indigo-100 text-indigo-600' :
                        type === 'premium' ? 'bg-blue-100 text-blue-600' :
                            'bg-slate-100 text-slate-600'
                    }`}>
                    <Icon size={24} />
                </div>

                <h3 className="text-xl font-bold text-slate-900 dark:text-white capitalize">
                    {type === 'pro' ? 'Plus' : type}
                </h3>
                <div className="mt-2 mb-6">
                    <span className="text-3xl font-extrabold text-slate-900 dark:text-white">{price}</span>
                    {period && <span className="text-slate-500 dark:text-slate-400 text-sm">/{period}</span>}
                </div>

                <ul className="space-y-3 mb-8 flex-1">
                    {features.map((feat, idx) => (
                        <li key={idx} className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-300">
                            <Check size={16} className={`shrink-0 mt-0.5 ${type === 'free' ? 'text-slate-400' : 'text-green-500'}`} />
                            <span>{feat}</span>
                        </li>
                    ))}
                </ul>

                {type === 'enterprise' ? (
                    <button
                        onClick={() => setShowEnterpriseModal(true)}
                        className="w-full py-3 rounded-xl border-2 border-slate-900 dark:border-slate-100 text-slate-900 dark:text-white font-bold hover:bg-slate-900 hover:text-white dark:hover:bg-white dark:hover:text-slate-900 transition-colors"
                    >
                        Contact Sales
                    </button>
                ) : isCurrent ? (
                    <button disabled className="w-full py-3 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-400 font-bold cursor-default">
                        Current Plan
                    </button>
                ) : (
                    <div className="space-y-2">
                        <button
                            onClick={() => handlePayment(type, price)}
                            className={`w-full py-3 rounded-xl font-bold text-white shadow-lg transition-transform hover:-translate-y-0.5 flex items-center justify-center gap-2 ${type === 'pro' ? 'bg-gradient-to-r from-indigo-600 to-purple-600' : 'bg-blue-600 hover:bg-blue-700'
                                }`}
                        >
                            {!user
                                ? (type === 'free' ? 'Sign Up Free' : 'Sign Up to Subscribe')
                                : (type === 'free' ? 'Downgrade' : 'Subscribe')
                            }
                        </button>
                        {type !== 'free' && (
                            <div className="flex justify-center gap-2 opacity-50">
                                <span className="text-[10px] text-slate-400 flex items-center gap-1"><CreditCard size={10} /> Stripe</span>
                                <span className="text-[10px] text-slate-400">|</span>
                                <span className="text-[10px] text-slate-400 font-serif italic">PayPal</span>
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    };



    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-950 text-slate-900 dark:text-slate-100 font-sans p-6 overflow-y-auto" >
            <div className="max-w-7xl mx-auto">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 text-slate-500 hover:text-blue-600 mb-8 transition-colors font-medium"
                >
                    <ArrowLeft size={20} /> Back
                </button>

                <div className="text-center mb-12">
                    <FormWizLogo size={96} className="mx-auto mb-4" />
                    <h1 className="text-4xl font-extrabold mb-4">Choose Your Plan</h1>
                    <p className="text-xl text-slate-500 dark:text-slate-400">Unlock more documents, downloads, and premium features.</p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto items-start">

                    {/* FREE */}
                    <PlanCard
                        type="free"
                        price="Free"
                        icon={Zap}
                        features={[
                            "3 Saved Documents (Active)",
                            "3 PDF Downloads / Month",
                            "Standard AI Analysis",
                            "Voice Interviewer"
                        ]}
                    />

                    {/* PREMIUM */}
                    <PlanCard
                        type="premium"
                        price="$6.99"
                        period="mo"
                        icon={Sparkles}
                        features={[
                            "10 Saved Documents (Active)",
                            "10 PDF Downloads / Month",
                            "Priority AI Processing",
                            "Voice Interviewer"
                        ]}
                    />

                    {/* PRO (Displayed as Plus) */}
                    <PlanCard
                        type="pro"
                        price="$11.99"
                        period="mo"
                        icon={Crown}
                        popular={true}
                        features={[
                            "25 Saved Documents (Active)",
                            "Unlimited Downloads",
                            "Advanced AI Analysis (Full PII Detection)",
                            "Priority Support"
                        ]}
                    />

                    {/* ENTERPRISE */}
                    <PlanCard
                        type="enterprise"
                        price="Custom"
                        icon={Building2}
                        features={[
                            "All features of Plus",
                            "White Label Version",
                            "Custom Pre-written Templates",
                            "Onboarding & Intake Workflows",
                            "API Access",
                            "Dedicated Account Manager",
                            "Consultation with Epiphany Unlimited"
                        ]}
                    />

                </div>

                <div className="mt-12 text-center text-sm text-slate-400 max-w-2xl mx-auto">
                    <p>Prices are in USD. Subscription auto-renews monthly. Cancel anytime from your account settings.</p>
                    <p className="mt-2">Secure payments processed by Stripe and PayPal.</p>
                </div>
            </div>

            <EnterpriseContactModal isOpen={showEnterpriseModal} onClose={() => setShowEnterpriseModal(false)} />
        </div >
    );
};

export default Pricing;