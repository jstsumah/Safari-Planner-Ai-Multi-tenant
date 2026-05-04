
import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export const PayPalSuccess = () => {
    const [status, setStatus] = useState('Processing...');
    
    useEffect(() => {
        const query = new URLSearchParams(window.location.search);
        const paymentId = query.get('paymentId');
        const payerId = query.get('PayerID');
        const companyId = query.get('companyId');

        if (paymentId && payerId && companyId) {
            fetch('/api/paypal/capture-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ paymentId, payerId })
            })
            .then(res => res.json())
            .then(async (data) => {
                if (data.payment) {
                    setStatus('Payment captured! Updating subscription...');
                    
                    // Update company branding with active status
                    const { data: company, error: fetchError } = await supabase
                        .from('companies')
                        .select('branding')
                        .eq('id', companyId)
                        .single();

                    if (fetchError) throw fetchError;

                    const updatedBranding = {
                        ...company.branding,
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
                } else {
                    setStatus('Failed to capture payment.');
                }
            })
            .catch(err => {
                console.error(err);
                setStatus('Error processing payment.');
            });
        }
    }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md">
            <h1 className="text-2xl font-bold">{status}</h1>
        </div>
    </div>
  );
};
