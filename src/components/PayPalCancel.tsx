
import React from 'react';

export const PayPalCancel = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md">
            <h1 className="text-2xl font-bold text-red-600">Payment Cancelled</h1>
            <p className="mt-4">You can return to the subscription page to try again.</p>
            <button onClick={() => window.location.href = '/'} className="mt-6 bg-blue-600 text-white px-4 py-2 rounded">Back to Home</button>
        </div>
    </div>
  );
};
