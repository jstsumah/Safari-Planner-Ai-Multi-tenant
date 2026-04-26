
import React, { useState, useMemo, useEffect } from 'react';
import { 
  FileText, ArrowLeft, Download, MessageCircle, 
  CheckCircle, User, 
  MapPin, Clock, CreditCard, Mail
} from 'lucide-react';
import { CostingReport, SafariFormData, GeneratedItinerary, Payment } from '../types';
import { generateInvoicePDF } from '../services/pdfService';
import { sendSafariEmail } from '../services/emailService';

interface InvoiceModuleProps {
  report: CostingReport;
  formData: SafariFormData;
  itinerary: GeneratedItinerary;
  payments: Payment[];
  branding: BrandingConfig;
  onBack: () => void;
}

const InvoiceModule: React.FC<InvoiceModuleProps> = ({ 
  report, 
  formData, 
  itinerary, 
  payments,
  branding = {} as BrandingConfig,
  onBack 
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [generatedInvoiceNumber, setGeneratedInvoiceNumber] = useState('');
  
  useEffect(() => {
    if (!generatedInvoiceNumber) {
      const timer = setTimeout(() => {
        setGeneratedInvoiceNumber(`INV-${Date.now().toString().slice(-6)}`);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [generatedInvoiceNumber]);

  const invoiceNumber = report.invoiceNumber || generatedInvoiceNumber;

  const totalPaid = useMemo(() => payments.reduce((sum, p) => sum + p.amount, 0), [payments]);
  const balanceDue = Math.max(0, Math.round(report.total) - totalPaid);

  const handleDownload = () => {
    const blob = generateInvoicePDF(report, formData, itinerary.tripTitle, invoiceNumber);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${invoiceNumber}_${formData.name.replace(/\s+/g, '_')}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleEmail = async () => {
    setIsGenerating(true);
    const blob = generateInvoicePDF(report, formData, itinerary.tripTitle, invoiceNumber);
    try {
      await sendSafariEmail({
        to: formData.email,
        cc: branding.financeEmail || 'finance@safaricompany.com',
        subject: `Invoice ${invoiceNumber} - Safari Booking: ${itinerary.tripTitle}`,
        htmlBody: `
          <h3>Invoice Attached</h3>
          <p>Dear ${formData.name},</p>
          <p>Please find attached the updated invoice for your upcoming safari adventure.</p>
          <p><strong>Total Amount:</strong> $${Math.round(report.total).toLocaleString()}</p>
          <p><strong>Total Paid:</strong> $${totalPaid.toLocaleString()}</p>
          <p><strong>Balance Due:</strong> $${balanceDue.toLocaleString()}</p>
          <p>Safe travels!</p>
        `,
        attachment: blob
      });
      setIsSent(true);
      setTimeout(() => setIsSent(false), 3000);
    } catch (err) {
      console.error("Email send failed", err);
      alert("Failed to send email. Falling back to simulation.");
      setIsSent(true);
      setTimeout(() => setIsSent(false), 3000);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleWhatsApp = () => {
    const text = encodeURIComponent(`Hi ${formData.name}, here is your updated invoice for ${itinerary.tripTitle}. Total due is $${Math.round(report.total).toLocaleString()}, Paid to date: $${totalPaid.toLocaleString()}, Remaining Balance: $${balanceDue.toLocaleString()}.`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-lg shadow-sm border border-safari-100">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-safari-50 rounded-full text-safari-400">
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-2xl font-black text-safari-900 flex items-center gap-2">
              <FileText className="text-safari-500" /> Invoice Preview
            </h1>
            <p className="text-xs text-safari-500 font-bold uppercase tracking-widest">Financial Summary for {formData.name}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={handleWhatsApp} className="px-4 py-2 bg-green-500 text-white rounded-lg font-bold text-xs flex items-center gap-2 hover:bg-green-600 transition-all shadow-md">
            <MessageCircle size={14} /> WhatsApp
          </button>
          <button onClick={handleEmail} disabled={isGenerating} className="px-4 py-2 bg-safari-800 text-white rounded-lg font-bold text-xs flex items-center gap-2 hover:bg-safari-900 transition-all shadow-md disabled:opacity-50">
            {isGenerating ? <Clock size={14} className="animate-spin" /> : <Mail size={14} />} Email
          </button>
          <button onClick={handleDownload} className="px-4 py-2 bg-white border-2 border-safari-100 text-safari-700 rounded-lg font-bold text-xs flex items-center gap-2 hover:bg-safari-50 transition-all shadow-sm">
            <Download size={14} /> Download PDF
          </button>
        </div>
      </div>

      {isSent && (
        <div className="bg-green-50 border border-green-100 p-4 rounded-lg flex items-center gap-3 text-green-700 font-bold animate-fadeIn">
          <CheckCircle size={20} /> Invoice sent successfully to {formData.email}
        </div>
      )}

      {/* Invoice Document Preview */}
      <div className="bg-white rounded-lg shadow-2xl border border-safari-100 overflow-hidden flex flex-col min-h-[800px]">
        {/* Header */}
        <div className="bg-safari-900 p-10 text-white flex justify-between items-start">
          <div className="space-y-4">
            <h2 className="text-4xl font-black tracking-tighter italic">INVOICE</h2>
            <div className="space-y-1 opacity-70">
              <p className="text-xs font-bold uppercase tracking-widest">Bill To:</p>
              <p className="font-bold">{formData.name}</p>
              <p className="text-xs">{formData.email}</p>
              <p className="text-xs">{formData.country}</p>
            </div>
          </div>
          <div className="text-right space-y-2">
            <p className="text-[10px] font-black uppercase tracking-widest opacity-50">Invoice Details</p>
            <p className="text-sm font-bold">Number: {invoiceNumber}</p>
            <p className="text-sm">Date: {new Date().toLocaleDateString()}</p>
            <p className="text-sm">Status: <span className="uppercase">{totalPaid >= Math.round(report.total) ? 'Paid' : 'Unpaid'}</span></p>
          </div>
        </div>

        {/* Info Grid */}
        <div className="p-10 border-b border-safari-50 bg-gray-50/50 grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="space-y-1">
            <span className="text-[9px] font-black uppercase text-safari-400 flex items-center gap-1"><MapPin size={10} /> Destination</span>
            <p className="text-xs font-bold text-safari-900 truncate">{itinerary.tripTitle}</p>
          </div>
          <div className="space-y-1">
            <span className="text-[9px] font-black uppercase text-safari-400 flex items-center gap-1"><Clock size={10} /> Duration</span>
            <p className="text-xs font-bold text-safari-900">{formData.durationDays} Days</p>
          </div>
          <div className="space-y-1">
            <span className="text-[9px] font-black uppercase text-safari-400 flex items-center gap-1"><User size={10} /> Guests</span>
            <p className="text-xs font-bold text-safari-900">{formData.adults + formData.youngAdults + formData.children}</p>
          </div>
          <div className="space-y-1">
            <span className="text-[9px] font-black uppercase text-safari-400 flex items-center gap-1"><CreditCard size={10} /> Payment Status</span>
            <p className="text-xs font-bold text-safari-900">{balanceDue > 0 ? `$${balanceDue.toLocaleString()} Remaining` : 'Fully Paid'}</p>
          </div>
        </div>

        {/* Line Items */}
        <div className="flex-1 p-10">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b-2 border-safari-900">
                <th className="py-4 text-[10px] font-black uppercase tracking-widest text-safari-400">Description</th>
                <th className="py-4 text-[10px] font-black uppercase tracking-widest text-safari-400 text-right w-16">Qty</th>
                <th className="py-4 text-[10px] font-black uppercase tracking-widest text-safari-400 text-right w-32">Rate</th>
                <th className="py-4 text-[10px] font-black uppercase tracking-widest text-safari-400 text-right w-32">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-safari-50">
              {report.items.map(item => (
                <tr key={item.id} className="hover:bg-gray-50/30">
                  <td className="py-4">
                    <p className="text-sm font-bold text-safari-900">{item.description}</p>
                    <p className="text-[10px] text-safari-400 uppercase font-black">{item.type}</p>
                  </td>
                  <td className="py-4 text-sm text-right font-medium text-safari-600">{item.quantity}</td>
                  <td className="py-4 text-sm text-right font-medium text-safari-600">${item.unitPrice.toLocaleString()}</td>
                  <td className="py-4 text-sm text-right font-black text-safari-900">${item.total.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Payments List */}
          {payments.length > 0 && (
            <div className="mt-8 border-t-2 border-dotted border-safari-200 pt-6">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-safari-400 mb-4">Payments</h4>
              <div className="space-y-2">
                {payments.map(p => (
                  <div key={p.id} className="flex justify-between items-center text-xs text-safari-600 bg-safari-50 p-2 rounded">
                    <span>{new Date(p.date).toLocaleDateString()} - {p.method} ({p.reference})</span>
                    <span className="font-bold text-green-600">-${p.amount.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="p-10 bg-gray-50 border-t border-safari-100 flex justify-end">
          <div className="w-full max-w-xs space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-safari-500 font-bold">Total Price (USD)</span>
              <span className="font-black text-safari-900">${Math.round(report.total).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-safari-500 font-bold italic">Total Paid to Date</span>
              <span className="font-bold text-green-600">-${totalPaid.toLocaleString()}</span>
            </div>
            <div className="pt-4 border-t-2 border-safari-900 flex justify-between items-end">
              <span className="text-xs font-black uppercase tracking-widest text-safari-900">Balance Due</span>
              <span className={`text-3xl font-black ${balanceDue > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                ${balanceDue.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Footer Branding */}
        <div className="p-10 text-center border-t border-safari-50 opacity-40">
           <p className="text-[10px] font-black uppercase tracking-widest">Powered by Soroi Custom Safari AI</p>
        </div>
      </div>
    </div>
  );
};

export default InvoiceModule;
