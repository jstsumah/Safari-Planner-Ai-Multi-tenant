import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { CheckCircle, Loader2, ArrowRight, ShieldCheck, Compass, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

export const PaymentStatus = () => {
    const [status, setStatus] = useState('Processing...');
    const [step, setStep] = useState<'verifying' | 'updating' | 'success' | 'error'>('verifying');
    const [errorMessage, setErrorMessage] = useState('');
    
    useEffect(() => {
        const query = new URLSearchParams(window.location.search);
        
        // PayPal params
        const paymentId = query.get('paymentId');
        const payerId = query.get('PayerID');
        const paypalCompanyId = query.get('companyId');

        // PesaPal params
        const orderTrackingId = query.get('OrderTrackingId');
        const merchantRef = query.get('OrderMerchantReference');

        // Paystack params
        const paystackRef = query.get('reference');

        if (paymentId && payerId && paypalCompanyId) {
            // PayPal flow
            setStatus('Capturing PayPal payment...');
            console.log('[PaymentStatus] Initiating PayPal capture:', { paymentId, paypalCompanyId });
            
            fetch('/api/paypal/capture-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ paymentId, payerId })
            })
            .then(res => {
                if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
                return res.json();
            })
            .then(async (data) => {
                console.log('[PaymentStatus] PayPal capture response:', data);
                if (data.payment) {
                    await updateSubscriptionStatus(paypalCompanyId);
                } else {
                    throw new Error(data.error || 'Failed to capture PayPal payment.');
                }
            })
            .catch(err => {
                console.error('[PaymentStatus] PayPal capture error:', err);
                setStep('error');
                setErrorMessage(err.message || 'Error processing PayPal payment.');
            });
        } else if (orderTrackingId && merchantRef) {
            // PesaPal flow
            setStep('verifying');
            setStatus('Verifying PesaPal transaction...');
            console.log('[PaymentStatus] Initiating PesaPal verification:', { orderTrackingId, merchantRef });
            
            // Extract company ID from merchant reference (SP-companyId)
            const companyId = merchantRef.startsWith('SP-') ? merchantRef.substring(3) : merchantRef;
            
            fetch(`/api/pesapal/transaction-status?OrderTrackingId=${orderTrackingId}`)
                .then(res => {
                    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
                    return res.json();
                })
                .then(async (data) => {
                    console.log('[PaymentStatus] PesaPal status response:', data);
                    // Status code 1 is success in PesaPal
                    if (data.payment_status_description === 'Success' || data.status === '200' || data.status_code === 1) {
                        await updateSubscriptionStatus(companyId);
                    } else {
                        throw new Error(`Payment Status: ${data.payment_status_description || 'Pending/Failed'}`);
                    }
                })
                .catch(err => {
                    console.error('[PaymentStatus] PesaPal verification error:', err);
                    setStep('error');
                    setErrorMessage(err.message || 'Error verifying PesaPal payment.');
                    setTimeout(() => window.location.href = '/?view=admin', 5000);
                });
        } else if (paystackRef) {
            // Paystack flow
            setStep('verifying');
            setStatus('Connecting to Paystack...');
            console.log('[PaymentStatus] Initiating Paystack verification:', paystackRef);
            
            const verifyPaystack = async (attempts = 3) => {
                try {
                    const res = await fetch(`/api/checkout/confirm/${paystackRef}`);
                    if (!res.ok) {
                        const errData = await res.json().catch(() => ({}));
                        throw new Error(errData.error || `Server returned ${res.status}`);
                    }
                    const data = await res.json();
                    console.log('[PaymentStatus] Paystack status response:', data);
                    
                    if (data.status === 'success' || data.gateway_response === 'Successful' || data.status === 'Successful') {
                        let companyId = data.metadata?.companyId;
                        if (!companyId && data.reference) {
                            const parts = data.reference.split('-');
                            if (parts[0] === 'SP' && parts.length >= 2) {
                                companyId = parts.slice(1, -1).join('-');
                            }
                        }
                        
                        if (companyId) {
                            await updateSubscriptionStatus(companyId);
                        } else {
                            throw new Error('Payment successful, but could not identify company from reference.');
                        }
                    } else {
                        throw new Error(`Transaction status: ${data.status || data.gateway_response || 'Pending'}`);
                    }
                } catch (err: any) {
                    console.error(`[PaymentStatus] Paystack verification attempt failed (${attempts} left):`, err);
                    if (attempts > 0) {
                        setStatus(`Retrying verification... (${attempts} left)`);
                        setTimeout(() => verifyPaystack(attempts - 1), 2000);
                    } else {
                        setStep('error');
                        setErrorMessage(err.message || 'Error verifying Paystack payment.');
                        if (window.opener) {
                            window.opener.postMessage({ type: 'PAYMENT_ERROR', error: err.message }, '*');
                        }
                    }
                }
            };
            verifyPaystack();
        } else {
            setStep('error');
            setErrorMessage('No valid transaction reference found.');
        }
    }, []);

    const updateSubscriptionStatus = async (companyId: string) => {
        setStep('updating');
        setStatus('Activating your account...');
        try {
            const { data: company, error: fetchError } = await supabase
                .from('companies')
                .select('branding')
                .eq('id', companyId)
                .single();

            if (fetchError) throw fetchError;

            const updatedBranding = {
                ...(company.branding || {}),
                subscription_status: 'active',
                trial_ends_at: null 
            };

            const { error: updateError } = await supabase
                .from('companies')
                .update({ branding: updatedBranding })
                .eq('id', companyId);

            if (updateError) throw updateError;

            setStep('success');
            setStatus('Subscription Activated!');
            
            // If this is a popup, notify the opener
            if (window.opener) {
                window.opener.postMessage({ type: 'PAYMENT_SUCCESS' }, '*');
                // Give a moment for the toast to show in the parent before closing
                setTimeout(() => window.close(), 2000);
            } else {
                // If not a popup, redirect automatically as before
                setTimeout(() => {
                    if (window.location.pathname === '/payment-complete') {
                        window.location.href = '/?view=admin';
                    }
                }, 4000);
            }
        } catch (err) {
            console.error(err);
            setStep('error');
            setErrorMessage('Server error updating status.');
            if (window.opener) {
                window.opener.postMessage({ type: 'PAYMENT_ERROR', error: 'Server error updating status.' }, '*');
            }
        }
    };

    const handleNavigate = (view: string) => {
        if (window.opener) {
            // If it's a popup, we shouldn't really be navigating here, 
            // but if the user clicks, we should just notify and close
            window.opener.postMessage({ type: 'PAYMENT_SUCCESS' }, '*');
            window.close();
        } else {
            window.location.href = `/?view=${view}`;
        }
    };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-safari-50 relative overflow-hidden p-4">
        {/* Background Gradients */}
        <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
            <div className="absolute top-[10%] left-[20%] w-96 h-96 bg-safari-900 rounded-full blur-[120px]" />
            <div className="absolute bottom-[20%] right-[10%] w-96 h-96 bg-safari-600 rounded-full blur-[120px]" />
        </div>

        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md bg-white rounded-3xl shadow-2xl shadow-safari-900/10 p-8 text-center relative z-10 border border-safari-100"
        >
            <div className="mb-8 flex justify-center">
                {step === 'success' ? (
                    <motion.div 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", damping: 12 }}
                        className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center text-white"
                    >
                        <CheckCircle size={40} />
                    </motion.div>
                ) : step === 'error' ? (
                    <motion.div 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center text-white"
                    >
                        <AlertCircle size={40} />
                    </motion.div>
                ) : (
                    <motion.div 
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="w-20 h-20 bg-safari-900 rounded-full flex items-center justify-center text-white"
                    >
                        <Loader2 size={40} />
                    </motion.div>
                )}
            </div>

            <h1 className="text-3xl font-black text-safari-900 mb-2 tracking-tight">
                {step === 'success' ? 'Payment Successful!' : step === 'error' ? 'Oops!' : 'Verifying Payment'}
            </h1>
            
            <p className="text-safari-600 font-medium mb-8 leading-relaxed">
                {step === 'error' ? errorMessage : status}
            </p>

            {step === 'success' && (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                >
                    <div className="bg-safari-50 rounded-2xl p-4 mb-8 border border-safari-100 flex items-start gap-3 text-left">
                        <ShieldCheck className="text-safari-600 shrink-0 mt-1" size={20} />
                        <div>
                            <p className="text-sm font-bold text-safari-900">Your account is now Pro</p>
                            <p className="text-xs text-safari-500">All premium features have been unlocked for your workspace.</p>
                        </div>
                    </div>

                    <button 
                        onClick={() => handleNavigate('admin')}
                        className="w-full bg-safari-900 text-white rounded-xl py-4 font-black uppercase text-xs tracking-widest hover:bg-black transition-all shadow-lg shadow-safari-900/20 flex items-center justify-center gap-2 group"
                    >
                        Go to Dashboard
                        <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                    
                    {!window.opener && (
                        <p className="text-[10px] text-safari-400 mt-4 uppercase tracking-widest font-bold">
                            Redirecting in 4 seconds...
                        </p>
                    )}
                </motion.div>
            )}

            {step === 'error' && (
                <button 
                    onClick={() => handleNavigate('subscription')}
                    className="w-full bg-safari-900 text-white rounded-xl py-4 font-black uppercase text-xs tracking-widest hover:bg-black transition-all"
                >
                    Return to Subscriptions
                </button>
            )}
        </motion.div>

        <div className="mt-8 flex items-center gap-2 text-safari-400 opacity-60">
            <Compass size={16} />
            <span className="text-xs font-black tracking-widest uppercase">SafariPlanner.ai</span>
        </div>
    </div>
  );
};
