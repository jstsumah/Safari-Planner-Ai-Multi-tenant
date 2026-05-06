
import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export const PayPalSuccess = () => {
    const [status, setStatus] = useState('Processing...');
    
    useEffect(() => {
        const query = new URLSearchParams(window.location.search);
        
        // PayPal params
        const paymentId = query.get('paymentId');
        const payerId = query.get('PayerID');
        const paypalCompanyId = query.get('companyId');

        // PesaPal params
        const orderTrackingId = query.get('OrderTrackingId');
        const merchantRef = query.get('OrderMerchantReference');

        if (paymentId && payerId && paypalCompanyId) {
            // PayPal flow
            fetch('/api/paypal/capture-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ paymentId, payerId })
            })
            .then(res => res.json())
            .then(async (data) => {
                if (data.payment) {
                    await updateSubscriptionStatus(paypalCompanyId);
                } else {
                    setStatus('Failed to capture PayPal payment.');
                }
            })
            .catch(err => {
                console.error(err);
                setStatus('Error processing PayPal payment.');
            });
        } else if (orderTrackingId && merchantRef) {
            // PesaPal flow
            setStatus('PesaPal payment received! Verifying status...');
            
            // Extract companyId from merchantRef (SP-UUID)
            const companyId = merchantRef.replace('SP-', '');
            
            fetch(`/api/pesapal/transaction-status?OrderTrackingId=${orderTrackingId}`)
                .then(res => res.json())
                .then(async (data) => {
                    if (data.payment_status_description === 'Success' || data.status === '200') {
                        await updateSubscriptionStatus(companyId);
                    } else {
                        setStatus(`PesaPal Status: ${data.payment_status_description || 'Pending/Failed'}`);
                        // If it's still being processed, maybe redirect anyway after a longer delay
                        setTimeout(() => window.location.href = '/?tab=dashboard', 5000);
                    }
                })
                .catch(err => {
                    console.error(err);
                    setStatus('Error verifying PesaPal payment.');
                });
        }
    }, []);

    const updateSubscriptionStatus = async (companyId: string) => {
        setStatus('Updating subscription...');
        try {
            // Update company branding with active status
            const { data: company, error: fetchError } = await supabase
                .from('companies')
                .select('branding')
                .eq('id', companyId)
                .single();

            if (fetchError) throw fetchError;

            const updatedBranding = {
                ...(company.branding || {}),
                subscription_status: 'active',
                trial_ends_at: null // Clear trial end date if active
            };

            const { error: updateError } = await supabase
                .from('companies')
                .update({ branding: updatedBranding })
                .eq('id', companyId);

            if (updateError) throw updateError;

            setStatus('Subscription successful! Redirecting...');
            setTimeout(() => window.location.href = '/?tab=dashboard', 2000);
        } catch (err) {
            console.error(err);
            setStatus('Failed to update subscription status. Please contact support.');
        }
    };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md">
            <h1 className="text-2xl font-bold">{status}</h1>
        </div>
    </div>
  );
};
