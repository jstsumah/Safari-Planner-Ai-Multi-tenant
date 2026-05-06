
import React from 'react';
import { motion } from 'motion/react';
import { Check, Zap, Globe, Shield, Star, BarChart3, CloudUpload, Infinity as InfinityIcon } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'sonner';

export const SubscriptionPage = () => {
  const { company } = useAuth();
  
  const subscribe = async (plan: 'starter' | 'pro') => {
    if (!company) {
      toast.error('You must be logged in to subscribe.');
      return;
    }

    const toastId = toast.loading('Initiating secure checkout...');

    try {
      const response = await fetch('/api/pesapal/submit-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, companyId: company.id })
      });
      
      const text = await response.text();
      let data;
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        try {
          data = JSON.parse(text);
        } catch (err) {
          console.error('Failed to parse JSON response:', text.substring(0, 500));
          throw new Error('Server returned an invalid JSON response. Please try again or contact support.');
        }
      } else {
        console.error('Expected JSON but received:', text.substring(0, 500));
        throw new Error('Server returned an unexpected response format (not JSON). Please try again later.');
      }
 
      if (!response.ok) {
        throw new Error(data?.error || `Server Error: ${response.status}`);
      }

      if (data.redirect_url) {
        toast.success('Redirecting to PesaPal...', { id: toastId });
        window.location.href = data.redirect_url;
      } else {
        throw new Error('No redirect URL returned from PesaPal');
      }
    } catch (error: any) {
      console.error('Subscription error:', error);
      toast.error(error.message || 'An unexpected error occurred', { id: toastId });
    }
  };

  const plans = [
    {
      id: 'starter',
      name: 'Essential',
      price: '30',
      description: 'Perfect for boutique operators and solo planners starting their digital journey.',
      icon: <Zap className="text-yellow-500" />,
      features: [
        { text: '5 Active Lodge Listings', cap: true },
        { text: '30 AI Itineraries / Month', cap: true },
        { text: 'Basic PDF Export Layouts', cap: false },
        { text: 'Managed Booking Dashboard', cap: false },
        { text: 'Standard Email Support', cap: false },
        { text: 'SafariPlanner.ai Subdomain', cap: false },
      ],
      cta: 'Get Started',
      popular: false
    },
    {
      id: 'pro',
      name: 'Unlimited',
      price: '60',
      description: 'The industry standard for established agencies demanding total control.',
      icon: <Shield className="text-safari-600" />,
      features: [
        { text: 'Unlimited Lodge Listings', cap: false },
        { text: 'Unlimited AI Generation', cap: false },
        { text: 'White-Label Branding (Remove AIS)', cap: false },
        { text: 'Custom Domain Integration', cap: false },
        { text: 'Priority Concierge Support', cap: false },
        { text: 'Full Financial Analytics Suite', cap: false },
        { text: 'Supplier Voucher Generation', cap: false },
        { text: 'Advanced Agency SEO Tools', cap: false },
      ],
      cta: 'Go Unlimited',
      popular: true
    }
  ];

  return (
    <div className="min-h-screen bg-[#FDFCFB] py-12 px-6">
      <div className="max-w-6xl mx-auto space-y-16">
        <header className="text-center space-y-4 max-w-2xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-safari-100 text-safari-900 text-[10px] uppercase font-black tracking-widest"
          >
            <Star size={12} className="fill-safari-900" />
            Pricing Plans
          </motion.div>
          <h1 className="text-5xl font-black text-safari-900 tracking-tight leading-[0.9]">
            Scale Your Rhythm <br />
            <span className="text-safari-400">Of The Wild.</span>
          </h1>
          <p className="text-safari-500 font-medium text-lg italic italic-tracking-tight">
            Choose the precision level your agency requires to deliver unforgettable African experiences.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, idx) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.1 }}
              className={`relative flex flex-col p-8 rounded-3xl border-2 transition-all duration-500 ${
                plan.popular 
                  ? 'border-safari-900 bg-safari-900 text-white shadow-2xl shadow-safari-900/20' 
                  : 'border-safari-100 bg-white hover:border-safari-200 shadow-xl shadow-safari-100/50'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-yellow-400 text-safari-900 text-[10px] font-black uppercase px-4 py-1.5 rounded-full tracking-widest shadow-lg">
                  Most Popular
                </div>
              )}

              <div className="flex items-center justify-between mb-8">
                <div className={`p-3 rounded-2xl ${plan.popular ? 'bg-white/10' : 'bg-safari-50'}`}>
                  {plan.icon}
                </div>
                <div className="text-right">
                  <div className="flex items-baseline justify-end gap-1">
                    <span className="text-sm font-bold opacity-60">$</span>
                    <span className="text-5xl font-black tracking-tighter">{plan.price}</span>
                  </div>
                  <p className={`text-[10px] uppercase font-black tracking-widest ${plan.popular ? 'text-safari-400' : 'text-safari-400'}`}>per month</p>
                </div>
              </div>

              <div className="mb-8">
                <h2 className="text-3xl font-black tracking-tight mb-2">{plan.name}</h2>
                <p className={`text-sm font-medium leading-relaxed ${plan.popular ? 'text-safari-300' : 'text-safari-500'}`}>
                  {plan.description}
                </p>
              </div>

              <div className="flex-1 space-y-4 mb-10">
                {plan.features.map((feature, fIdx) => (
                  <div key={fIdx} className="flex items-center gap-3">
                    <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${
                      plan.popular ? 'bg-safari-100 text-safari-900' : 'bg-safari-900 text-white'
                    }`}>
                      <Check size={12} strokeWidth={4} />
                    </div>
                    <span className={`text-sm font-bold tracking-tight ${
                      feature.cap ? (plan.popular ? 'text-white' : 'text-safari-900') : (plan.popular ? 'text-white' : 'text-safari-900')
                    }`}>
                      {feature.text}
                    </span>
                    {!feature.cap && (
                      <InfinityIcon size={14} className={plan.popular ? 'text-safari-400' : 'text-safari-300'} />
                    )}
                  </div>
                ))}
              </div>

              <button
                onClick={() => subscribe(plan.id as 'starter' | 'pro')}
                className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-sm transition-all active:scale-[0.98] ${
                  plan.popular 
                    ? 'bg-white text-safari-900 hover:bg-safari-50 hover:shadow-xl hover:shadow-white/10' 
                    : 'bg-safari-900 text-white hover:bg-safari-800 hover:shadow-xl hover:shadow-safari-900/20'
                }`}
              >
                {plan.cta}
              </button>
            </motion.div>
          ))}
        </div>

        <footer className="text-center">
          <div className="inline-flex flex-col sm:flex-row items-center gap-6 p-6 rounded-3xl bg-safari-50 border border-safari-100 max-w-3xl mx-auto">
            <div className="flex -space-x-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-safari-200 overflow-hidden">
                  <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i + 10}`} alt="" />
                </div>
              ))}
            </div>
            <p className="text-sm text-safari-600 font-medium text-left">
              Join <span className="text-safari-900 font-black">200+ elite safari agencies</span> using our platform to generate over $5M in seasonal bookings every month.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
};
