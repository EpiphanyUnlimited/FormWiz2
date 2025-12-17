import React, { useState } from 'react';
import { useStripe } from '@stripe/react-stripe-js';
import { Check, ArrowLeft, CreditCard, Sparkles, Building2, Crown, Zap, Loader2 } from 'lucide-react';
import { PlanType } from '../types';
import VoiceDoxLogo from './FormWizLogo';

interface PricingProps {
  onBack: () => void;
  currentPlan: PlanType;
  onUpgrade: (plan: PlanType) => void;
}

const Pricing: React.FC<PricingProps> = ({ onBack, currentPlan, onUpgrade }) => {
  const stripe = useStripe();
  const [loadingPlan, setLoadingPlan] = useState<PlanType | null>(null);

  const handlePayment = async (plan: PlanType, priceId: string) => {
    if (!stripe) {
      console.error("Stripe.js has not yet loaded.");
      return;
    }

    setLoadingPlan(plan);

    try {
      const response = await fetch('/.netlify/functions/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ priceId }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session.');
      }

      const { sessionId } = await response.json();

      const { error } = await stripe.redirectToCheckout({
        sessionId,
      });

      if (error) {
        console.error("Stripe checkout error:", error);
        alert(`Error: ${error.message}`);
      }
    } catch (error) {
      console.error("Payment error:", error);
      alert("Could not initiate payment. Please try again.");
    } finally {
      setLoadingPlan(null);
    }
  };

  const PlanCard = ({
    type,
    price,
    period,
    features,
    icon: Icon,
    priceId,
    popular = false,
  }: {
    type: PlanType;
    price: string;
    period?: string;
    features: string[];
    icon: any;
    priceId?: string;
    popular?: boolean;
  }) => {
    const isCurrent = currentPlan === type;

    return (
      <div className={`relative bg-white dark:bg-slate-800 rounded-2xl p-6 border transition-all duration-300 flex flex-col ${popular ? 'border-blue-500 shadow-2xl scale-105 z-10' : 'border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-xl'}`}>
        {popular && (
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wide shadow-lg">
                Best Value
            </div>
        )}
        
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
            type === 'enterprise' ? 'bg-slate-900 text-white' : 
            type === 'pro' ? 'bg-indigo-100 text-indigo-600' :
            type === 'premium' ? 'bg-blue-100 text-blue-600' : 
            'bg-slate-100 text-slate-600'
        }`}>
            <Icon size={24} />
        </div>

        <h3 className="text-xl font-bold text-slate-900 dark:text-white capitalize">{type}</h3>
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
                onClick={() => alert("Please contact sales@epiphanyunlimited.com for a consultation.")}
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
                    onClick={() => priceId && handlePayment(type, priceId)}
                    disabled={!priceId || loadingPlan === type}
                    className={`w-full py-3 rounded-xl font-bold text-white shadow-lg transition-transform hover:-translate-y-0.5 flex items-center justify-center gap-2 ${
                        type === 'pro' ? 'bg-gradient-to-r from-indigo-600 to-purple-600' : 'bg-blue-600 hover:bg-blue-700'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                    {loadingPlan === type ? <Loader2 className="animate-spin" /> : (type === 'free' ? 'Downgrade' : 'Subscribe')}
                </button>
                {type !== 'free' && (
                    <div className="flex justify-center gap-2 opacity-50">
                        <span className="text-[10px] text-slate-400 flex items-center gap-1"><CreditCard size={10} /> Stripe</span>
                    </div>
                )}
            </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-950 text-slate-900 dark:text-slate-100 font-sans p-6 overflow-y-auto">
      <div className="max-w-7xl mx-auto">
        <button 
            onClick={onBack}
            className="flex items-center gap-2 text-slate-500 hover:text-blue-600 mb-8 transition-colors font-medium"
        >
            <ArrowLeft size={20} /> Back
        </button>

        <div className="text-center mb-12">
            <VoiceDoxLogo size={48} className="mx-auto mb-4" />
            <h1 className="text-4xl font-extrabold mb-4">Choose Your Plan</h1>
            <p className="text-xl text-slate-500 dark:text-slate-400">Unlock more documents, downloads, and premium features.</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto items-start">
            
            {/* TODO: User needs to create these products in their Stripe Dashboard */}
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

            <PlanCard 
                type="premium" 
                price="$6.99" 
                period="mo"
                icon={Sparkles}
                priceId="price_1SeymiIBiOShj96XAq1X8XyU" // REPLACE THIS with your Stripe Price ID
                features={[
                    "10 Saved Documents (Active)",
                    "10 PDF Downloads / Month",
                    "Priority AI Processing",
                    "Voice Interviewer",
                    "Email Support"
                ]} 
            />

            <PlanCard 
                type="pro" 
                price="$11.99" 
                period="mo"
                icon={Crown}
                popular={true}
                priceId="price_1SeypPIBiOShj96XIwTYfZ5S" // REPLACE THIS with your Stripe Price ID
                features={[
                    "25 Saved Documents (Active)",
                    "Unlimited Downloads",
                    "Advanced AI Analysis (Full PII Detection)",
                    "Priority Voice Processing",
                    "Priority Support",
                    "Remove Watermarks"
                ]} 
            />

            <PlanCard 
                type="enterprise" 
                price="Custom" 
                icon={Building2}
                features={[
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
            <p className="mt-2">Secure payments processed by Stripe.</p>
        </div>
      </div>
    </div>
  );
};

export default Pricing;