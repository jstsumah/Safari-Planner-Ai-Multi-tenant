
import React, { useState } from 'react';
import { 
  FileText, ArrowLeft, Search, Printer
} from 'lucide-react';
import { Payment, BrandingConfig } from '../types';
import { generatePaymentVoucherPDF } from '../services/pdfService';

interface PaymentVoucherModuleProps {
  payments: Payment[];
  branding: BrandingConfig;
  onBack: () => void;
}

const PaymentVoucherModule: React.FC<PaymentVoucherModuleProps> = ({ payments, branding = {} as BrandingConfig, onBack }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPayments = payments.filter(payment => {
    const searchLower = searchTerm.toLowerCase();
    return (
      payment.customerName.toLowerCase().includes(searchLower) ||
      payment.reference.toLowerCase().includes(searchLower) ||
      payment.tripTitle.toLowerCase().includes(searchLower) ||
      payment.amount.toString().includes(searchLower)
    );
  });

  const handlePrintVoucher = (payment: Payment) => {
    const blob = generatePaymentVoucherPDF(payment, branding);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `PaymentVoucher_${payment.id.slice(0, 8)}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fadeIn pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-lg shadow-sm border border-safari-100">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-safari-50 rounded-full text-safari-400">
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-2xl font-black text-safari-900 flex items-center gap-2">
              <FileText className="text-safari-500" /> Payment Vouchers
            </h1>
            <p className="text-xs text-safari-500 font-bold uppercase tracking-widest">Client payment confirmation records</p>
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-safari-300" size={16} />
          <input 
            type="text" 
            placeholder="Search vouchers..." 
            className="pl-10 p-3 w-64 bg-white border border-safari-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-safari-500 shadow-sm transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-safari-100 overflow-hidden">
        <div className="overflow-x-auto">
          {payments.length === 0 ? (
            <div className="p-20 text-center text-safari-300">
              <FileText size={48} className="mx-auto mb-4 opacity-10" />
              <p className="font-bold">No payment records found.</p>
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="p-20 text-center text-safari-300">
              <p className="font-bold">No vouchers match your search.</p>
            </div>
          ) : (
            <table className="w-full text-left">
              <thead className="bg-safari-50 border-b border-safari-100">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-black uppercase text-safari-400">Voucher #</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase text-safari-400">Date</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase text-safari-400">Client / Project</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase text-safari-400">Reference</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase text-safari-400 text-right">Amount ($)</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase text-safari-400 text-right">Download</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-safari-50">
                {filteredPayments.map(payment => (
                  <tr key={payment.id} className="hover:bg-safari-50/30 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs font-bold text-safari-600">VCH-{payment.id.slice(0, 8).toUpperCase()}</span>
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-safari-900">
                      {new Date(payment.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs font-black text-safari-900">{payment.customerName}</p>
                      <p className="text-[10px] text-safari-400 truncate max-w-[200px]">{payment.tripTitle}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[9px] font-bold text-safari-500 uppercase">{payment.reference || 'N/A'}</span>
                    </td>
                    <td className="px-6 py-4 text-right font-black text-safari-900">
                      ${payment.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handlePrintVoucher(payment)}
                        className="px-4 py-2 bg-white border border-safari-200 rounded-lg text-xs font-bold text-safari-700 hover:bg-safari-50 transition-all flex items-center gap-2 ml-auto shadow-sm"
                      >
                        <Printer size={14} /> Voucher
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentVoucherModule;
