
import React, { useState, useMemo } from 'react';
import { 
  CreditCard, DollarSign, 
  ArrowLeft, CheckCircle, Search, RefreshCw, 
  Printer, Plus, 
  Clock, X
} from 'lucide-react';
// Import CostingLineItem and CostingItemType for the voucher grouping logic
import { Payment } from '../types';
import { generatePaymentVoucherPDF } from '../services/pdfService';

interface PaymentModuleProps {
  pendingInvoices: any[];
  payments: Payment[];
  onRecordPayment: (payment: Partial<Payment>) => void;
  onBack: () => void;
}

const PaymentModule: React.FC<PaymentModuleProps> = ({ 
  pendingInvoices, 
  payments, 
  onRecordPayment, 
  onBack 
}) => {
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
  const [amount, setAmount] = useState<string>('');
  const [method, setMethod] = useState<string>('Bank Transfer');
  const [reference, setReference] = useState<string>('');
  const [isRecording, setIsRecording] = useState(false);
  const [success, setSuccess] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const selectedStats = useMemo(() => {
    if (!selectedInvoice) return null;
    const total = Math.round(selectedInvoice.costing_report.total);
    const paid = payments
      .filter(p => p.itineraryId === selectedInvoice.id)
      .reduce((sum, p) => sum + p.amount, 0);
    const balance = Math.max(0, total - paid);
    return { total, paid, balance };
  }, [selectedInvoice, payments]);

  const filteredPayments = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return payments;
    return payments.filter(p => 
      p.customerName.toLowerCase().includes(term) ||
      p.tripTitle.toLowerCase().includes(term) ||
      p.reference.toLowerCase().includes(term) ||
      p.method.toLowerCase().includes(term) ||
      p.amount.toString().includes(term)
    );
  }, [payments, searchTerm]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice || !amount) return;

    setIsRecording(true);
    await onRecordPayment({
      itineraryId: selectedInvoice.id,
      amount: parseFloat(amount),
      date: new Date().toISOString(),
      method,
      reference,
      customerName: selectedInvoice.customer_name,
      tripTitle: selectedInvoice.trip_title
    });

    setSuccess(true);
    setIsRecording(false);
    setSelectedInvoice(null);
    setAmount('');
    setReference('');
    setTimeout(() => setSuccess(false), 3000);
  };

  // Fixed: generatePaymentVoucherPDF expects 1 argument (payment: Payment).
  // Removed unnecessary invoice lookup and grouping logic which caused "Expected 1 arguments, but got 2" error.
  const handleDownloadVoucher = (payment: Payment) => {
    const blob = generatePaymentVoucherPDF(payment);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Voucher_${payment.id.slice(0, 8)}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fadeIn pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-lg shadow-sm border border-safari-100">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-safari-50 rounded-full text-safari-400 transition-colors">
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-2xl font-black text-safari-900 flex items-center gap-2">
              <CreditCard className="text-safari-500" /> Payment Manager
            </h1>
            <p className="text-xs text-safari-500 font-bold uppercase tracking-widest">Receive payments and issue vouchers</p>
          </div>
        </div>
      </div>

      {success && (
        <div className="bg-green-50 border border-green-100 p-4 rounded-lg flex items-center gap-3 text-green-700 font-bold animate-fadeIn">
          <CheckCircle size={20} /> Payment recorded successfully! Voucher generated.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Record New Payment Form */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-xl shadow-lg border border-safari-100 p-8">
            <h3 className="text-sm font-black uppercase tracking-widest text-safari-400 mb-6 flex items-center gap-2">
              <Plus size={16} /> Record Payment
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-safari-500 uppercase mb-1">Select Invoice</label>
                <select 
                  className="w-full p-3 border border-safari-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-safari-500 outline-none font-bold"
                  value={selectedInvoice?.id || ''}
                  onChange={(e) => {
                    const inv = pendingInvoices.find(i => i.id === e.target.value);
                    setSelectedInvoice(inv);
                    if (inv) {
                      const paid = payments
                        .filter(p => p.itineraryId === inv.id)
                        .reduce((sum, p) => sum + p.amount, 0);
                      const rem = Math.max(0, Math.round(inv.costing_report.total) - paid);
                      setAmount(rem.toString());
                    }
                  }}
                  required
                >
                  <option value="">Choose an invoice...</option>
                  {pendingInvoices.map(inv => (
                    <option key={inv.id} value={inv.id}>
                      {inv.customer_name} - {inv.trip_title}
                    </option>
                  ))}
                </select>
              </div>

              {selectedInvoice && selectedStats && (
                <div className="p-4 bg-safari-50 rounded-lg border border-safari-100 space-y-3 animate-fadeIn">
                   <div className="flex justify-between text-xs">
                     <span className="text-safari-500 font-bold uppercase tracking-tighter">Total Price:</span>
                     <span className="text-safari-900 font-black">${selectedStats.total.toLocaleString()}</span>
                   </div>
                   <div className="flex justify-between text-xs">
                     <span className="text-safari-500 font-bold uppercase tracking-tighter">Already Paid:</span>
                     <span className="text-blue-600 font-black">${selectedStats.paid.toLocaleString()}</span>
                   </div>
                   <div className="pt-2 border-t border-safari-200 flex justify-between text-xs">
                     <span className="text-safari-800 font-black uppercase tracking-tighter">Balance Due:</span>
                     <span className="text-orange-600 font-black text-sm">${selectedStats.balance.toLocaleString()}</span>
                   </div>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-black text-safari-500 uppercase mb-1">Payment Amount ($)</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-safari-300" size={16} />
                  <input 
                    type="number" 
                    placeholder="0.00"
                    className="w-full pl-10 p-3 border border-safari-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-safari-500 outline-none font-bold"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-safari-500 uppercase mb-1">Payment Method</label>
                <select 
                  className="w-full p-3 border border-safari-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-safari-500 outline-none font-bold"
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                >
                  <option>Bank Transfer</option>
                  <option>Credit Card</option>
                  <option>M-Pesa</option>
                  <option>Cash</option>
                  <option>Check</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-safari-500 uppercase mb-1">Reference # / Notes</label>
                <input 
                  type="text" 
                  placeholder="TXN-123456789"
                  className="w-full p-3 border border-safari-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-safari-500 outline-none font-bold"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                />
              </div>

              <button 
                type="submit"
                disabled={isRecording || !selectedInvoice || parseFloat(amount) <= 0}
                className="w-full py-4 bg-safari-800 text-white rounded-lg font-black uppercase text-xs tracking-widest hover:bg-safari-900 shadow-xl transition-all active:scale-95 disabled:opacity-50"
              >
                {isRecording ? <RefreshCw size={18} className="animate-spin mx-auto" /> : "Record & Generate Voucher"}
              </button>
            </form>
          </div>
        </div>

        {/* Payment History Table */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-safari-100 overflow-hidden flex flex-col h-full">
            <div className="p-6 border-b border-safari-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h3 className="text-sm font-black uppercase tracking-widest text-safari-400 flex items-center gap-2">
                <Clock size={16} /> Payment History
              </h3>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-safari-300" size={16} />
                <input 
                  type="text" 
                  placeholder="Search payments..." 
                  className="w-full pl-10 pr-10 p-2.5 border border-safari-200 rounded-lg text-xs bg-white outline-none focus:ring-2 focus:ring-safari-500 font-bold shadow-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button 
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-safari-300 hover:text-safari-600"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>
            <div className="overflow-x-auto flex-1">
              {payments.length === 0 ? (
                <div className="p-20 text-center text-safari-300">
                  <CreditCard size={48} className="mx-auto mb-4 opacity-10" />
                  <p className="font-bold">No payments recorded yet.</p>
                </div>
              ) : filteredPayments.length === 0 ? (
                <div className="p-20 text-center text-safari-300">
                   <p className="font-bold">No payments match your search.</p>
                </div>
              ) : (
                <table className="w-full text-left">
                  <thead className="bg-safari-50 border-b border-safari-100">
                    <tr>
                      <th className="px-6 py-4 text-[10px] font-black uppercase text-safari-400">Date / Ref</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase text-safari-400">Client</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase text-safari-400">Method</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase text-safari-400 text-right">Amount ($)</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase text-safari-400 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-safari-50">
                    {filteredPayments.map(payment => (
                      <tr key={payment.id} className="hover:bg-safari-50/30 transition-colors">
                        <td className="px-6 py-4">
                          <p className="text-xs font-bold text-safari-900">{new Date(payment.date).toLocaleDateString()}</p>
                          <p className="text-[10px] text-safari-400 uppercase font-black truncate max-w-[100px]">{payment.reference || 'No Ref'}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-xs font-black text-safari-900">{payment.customerName}</p>
                          <p className="text-[10px] text-safari-400 truncate max-w-[150px]">{payment.tripTitle}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-[9px] font-black uppercase bg-safari-50 px-2 py-1 rounded text-safari-600">{payment.method}</span>
                        </td>
                        <td className="px-6 py-4 text-right font-black text-safari-900">
                          ${payment.amount.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button 
                            onClick={() => handleDownloadVoucher(payment)}
                            className="p-2 bg-safari-50 text-safari-600 rounded-lg hover:bg-safari-100 transition-colors"
                            title="Print Voucher"
                          >
                            <Printer size={16} />
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
      </div>
    </div>
  );
};

export default PaymentModule;
