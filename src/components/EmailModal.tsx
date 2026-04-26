import React, { useState, useEffect } from 'react';
import { X, Send, Paperclip, Loader2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { SafariFormData, GeneratedItinerary, BrandingConfig } from '../types';
import { generateEmailHtml, sendSafariEmail } from '../services/emailService';

interface EmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  formData: SafariFormData;
  itinerary: GeneratedItinerary;
  pdfBlob: Blob | null;
  branding: BrandingConfig;
}

const EmailModal: React.FC<EmailModalProps> = ({ isOpen, onClose, formData, itinerary, pdfBlob, branding }) => {
  const [toEmail, setToEmail] = useState(branding.financeEmail || branding.contactEmail || 'reservations@safaricompany.com');
  const [ccEmail, setCcEmail] = useState(formData.email);
  const [subject, setSubject] = useState(`Booking Request: ${itinerary.tripTitle} - ${formData.name}`);
  const [isSending, setIsSending] = useState(false);
  const [isSent, setIsSent] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Defer to avoid synchronous update warning
      const timeoutId = setTimeout(() => {
        setCcEmail(prev => prev !== formData.email ? formData.email : prev);
        const newSubject = `Booking Request: ${itinerary.tripTitle} - ${formData.name}`;
        setSubject(prev => prev !== newSubject ? newSubject : prev);
        setIsSent(false);
      }, 0);
      return () => clearTimeout(timeoutId);
    }
  }, [isOpen, formData.email, formData.name, itinerary.tripTitle]);

  if (!isOpen) return null;

  const handleSend = async () => {
    if (!pdfBlob) return;

    setIsSending(true);
    const htmlBody = generateEmailHtml(formData, itinerary, branding);

    try {
      await sendSafariEmail({
        to: toEmail,
        cc: ccEmail,
        subject: subject,
        htmlBody: htmlBody,
        attachment: pdfBlob
      });
      setIsSent(true);
      toast.success("Email sent successfully!");
      // Close modal after success message
      setTimeout(() => {
        onClose();
        setIsSent(false);
      }, 2500);
    } catch (error) {
      console.error("Failed to send", error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-md shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-safari-700 p-4 flex justify-between items-center text-white">
          <h3 className="font-bold text-lg flex items-center">
            <Send size={18} className="mr-2" /> Send Booking Request
          </h3>
          <button onClick={onClose} className="hover:bg-safari-600 p-1 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {isSent ? (
          <div className="p-12 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-2">
              <CheckCircle size={32} />
            </div>
            <h3 className="text-2xl font-bold text-safari-900">Sent Successfully!</h3>
            <p className="text-safari-600">
              The itinerary has been sent to reservations and a copy sent to the client.
            </p>
          </div>
        ) : (
          <>
            {/* Body */}
            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-safari-500 uppercase mb-1">To (Reservations)</label>
                  <input 
                    type="email" 
                    value={toEmail}
                    onChange={(e) => setToEmail(e.target.value)}
                    className="w-full p-2 border border-safari-300 rounded bg-white text-safari-900 font-medium text-sm focus:ring-2 focus:ring-safari-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-safari-500 uppercase mb-1">CC (Client)</label>
                  <input 
                    type="email" 
                    value={ccEmail}
                    onChange={(e) => setCcEmail(e.target.value)}
                    className="w-full p-2 border border-safari-300 rounded bg-white text-safari-900 font-medium text-sm focus:ring-2 focus:ring-safari-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-safari-500 uppercase mb-1">Subject</label>
                <input 
                  type="text" 
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full p-2 border border-safari-300 rounded bg-white text-safari-900 font-medium text-sm focus:ring-2 focus:ring-safari-500 outline-none"
                />
              </div>

              {/* Attachment Preview */}
              <div className="flex items-center p-3 bg-safari-50 border border-safari-200 rounded-md">
                <div className="w-8 h-8 bg-red-100 text-red-600 rounded-sm flex items-center justify-center mr-3">
                  <Paperclip size={16} />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-bold text-safari-900">Safari_Itinerary_Proposal.pdf</div>
                  <div className="text-xs text-safari-500">Auto-generated PDF attachment</div>
                </div>
                <div className="text-xs text-safari-400 font-mono">
                  {pdfBlob ? `${(pdfBlob.size / 1024).toFixed(1)} KB` : 'Generating...'}
                </div>
              </div>

              {/* Email Preview (Visual only) */}
              <div className="border border-safari-200 rounded-md p-4 bg-gray-50 max-h-40 overflow-y-auto text-sm text-gray-500">
                <p className="font-bold mb-2 text-gray-700">Email Preview:</p>
                <p>Dear Reservations Team,</p>
                <p className="mt-2">Please find attached the detailed itinerary proposal for <strong>{formData.name}</strong>...</p>
                <p className="mt-2 text-xs italic">[Full HTML template will be sent]</p>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-safari-100 bg-gray-50 flex justify-end gap-3">
              <button 
                onClick={onClose}
                className="px-4 py-2 text-safari-600 font-medium hover:bg-safari-100 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSend}
                disabled={isSending || !pdfBlob}
                className="flex items-center px-6 py-2 bg-safari-600 text-white rounded-md font-bold hover:bg-safari-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSending ? (
                  <>
                    <Loader2 size={18} className="animate-spin mr-2" /> Sending...
                  </>
                ) : (
                  <>
                    <Send size={18} className="mr-2" /> Send Email
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default EmailModal;
