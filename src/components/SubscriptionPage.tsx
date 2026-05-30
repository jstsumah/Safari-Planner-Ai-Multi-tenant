
import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Check, Zap, Globe, Shield, Star, BarChart3, CloudUpload, Infinity as InfinityIcon, ArrowLeft, Home, Loader2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';

export const SubscriptionPage = () => {
  const { company } = useAuth();
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  
  const subscribe = async (plan: 'starter' | 'pro') => {
    if (!company) {
      toast.error('You must be logged in to subscribe.');
      return;
    }

    setIsProcessing(plan);
    const toastId = toast.loading(`Initiating secure checkout for ${plan} plan...`);

    // First try PesaPal, then Paystack as fallback, or based on branding
    // This allows the app to be flexible depending on which keys are provided in the environment
    try {
      // 1. Try to get branding to see preferred gateway
      const preferredGateway = (company as any)?.branding?.paymentGateways?.preferred || 'paystack';
      
      let endpoint = preferredGateway === 'pesapal' ? '/api/pesapal/submit-order' : '/api/checkout/init';
      
      console.log(`[Subscription] Initiating with ${preferredGateway} at ${endpoint}`);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, companyId: company.id, email: company.email || '' })
      });
      
      const text = await response.text();
      let data;
      const contentType = response.headers.get('content-type');
      
      console.log(`[Subscription] Response status: ${response.status}, type: ${contentType}`);
      
      if (contentType && contentType.includes('application/json')) {
        try {
          data = JSON.parse(text);
        } catch (err) {
          console.error('Failed to parse JSON response:', text.substring(0, 500));
          throw new Error('Server returned an invalid JSON response.');
        }
      } else {
        console.error('Unexpected response content type:', contentType);
        console.error('Response body:', text.substring(0, 500));
        
        // If preferred failed, try fallback
        if (preferredGateway === 'pesapal' && !response.ok) {
           console.log('[Subscription] PesaPal failed with non-JSON, trying Paystack fallback...');
           endpoint = '/api/checkout/init';
           const retryRes = await fetch(endpoint, {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({ plan, companyId: company.id, email: company.email || '' })
           });
           const retryText = await retryRes.text();
           const retryType = retryRes.headers.get('content-type');
           if (retryType?.includes('application/json')) {
             data = JSON.parse(retryText);
             if (!retryRes.ok) throw new Error(data?.error || data?.message || `Paystack Error: ${retryRes.status}`);
           } else {
             throw new Error(`All payment gateways returned unexpected formats. (Last status: ${retryRes.status})`);
           }
        } else {
          throw new Error(`Server returned an unexpected response format [${contentType || 'unknown'}] (Status: ${response.status})`);
        }
      }
 
      if (!response.ok) { 
        throw new Error(data?.error || data?.message || `Server Error: ${response.status}`);
      }
      
      // Additional safety check: If it was a 404, throw even if data exists (e.g. catch-all JSON)
      if (response.status === 404 && !data?.authorization_url && !data?.redirect_url) {
        throw new Error(data?.error || 'Payment initialization endpoint not found (404). Please contact support.');
      }

      const authUrl = data.authorization_url || data.redirect_url || data.url;
      
      if (authUrl) {
        toast.success('Opening secure payment window...', { id: toastId });
        
        // Open in a popup if possible, otherwise fallback to current window
        const width = 600;
        const height = 800;
        const left = (window.screen.width / 2) - (width / 2);
        const top = (window.screen.height / 2) - (height / 2);
        
        const popup = window.open(
          authUrl, 
          'SafariPlannerPayment', 
          `width=${width},height=${height},top=${top},left=${left},scrollbars=yes,status=yes`
        );

        if (!popup || popup.closed || typeof popup.closed === 'undefined') {
          // Popup blocked - fallback to same window
          window.location.href = authUrl;
        } else {
          // Listen for message from the popup
          const messageHandler = (event: MessageEvent) => {
            // Validate origin for security
            if (event.data?.type === 'PAYMENT_SUCCESS') {
              toast.success('Payment verified successfully!', { id: toastId });
              window.removeEventListener('message', messageHandler);
              // Refresh page to show new status
              window.location.href = '/?view=admin';
            } else if (event.data?.type === 'PAYMENT_ERROR') {
              toast.error(event.data.error || 'Payment failed.', { id: toastId });
              window.removeEventListener('message', messageHandler);
            }
          };
          window.addEventListener('message', messageHandler);

          // Optional: Polling as fallback if message fails
          const timer = setInterval(async () => {
            if (popup.closed) {
              clearInterval(timer);
              window.removeEventListener('message', messageHandler);
              
              const { data: refreshedCompany, error: pollError } = await supabase
                .from('companies')
                .select('branding')
                .eq('id', company.id)
                .single();
                
              if (!pollError && (refreshedCompany?.branding?.subscription_status === 'active' || refreshedCompany?.branding?.subscription_status === plan)) {
                toast.success('Subscription detected and activated!', { id: toastId });
                setTimeout(() => {
                  window.location.href = '/?view=admin';
                }, 1500);
              } else {
                toast.dismiss(toastId);
              }
            }
          }, 2000);
        }
      } else {
        throw new Error('No checkout URL returned from payment gateway');
      }
    } catch (error: any) {
      console.error('Subscription error:', error);
      toast.error(error.message || 'An unexpected error occurred', { id: toastId });
    } finally {
      setIsProcessing(null);
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
        <div className="flex justify-between items-center -mb-8">
          <button 
            onClick={() => window.location.href = '/?view=admin'}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-safari-200 text-safari-600 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-safari-50 transition-all shadow-sm group"
          >
            <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
            Back to Dashboard
          </button>
          
          <button 
            onClick={() => window.location.href = '/'}
            className="hidden sm:flex items-center gap-2 px-4 py-2 text-safari-400 hover:text-safari-900 transition-colors font-black uppercase text-[10px] tracking-widest"
          >
            <Home size={14} />
            Home
          </button>
        </div>

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
                disabled={isProcessing !== null}
                className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${
                  plan.popular 
                    ? 'bg-white text-safari-900 hover:bg-safari-50 hover:shadow-xl hover:shadow-white/10' 
                    : 'bg-safari-900 text-white hover:bg-safari-800 hover:shadow-xl hover:shadow-safari-900/20'
                } ${isProcessing !== null ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isProcessing === plan.id ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    Processing...
                  </>
                ) : plan.cta}
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
