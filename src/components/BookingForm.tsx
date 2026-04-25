import React, { useState, useEffect } from 'react';
import { Send, User, Mail, Phone, Calendar, MessageSquare, Loader2, CheckCircle2, ChevronRight, ArrowLeft, ShieldCheck, Star, Plus, Minus } from 'lucide-react';
import { GeneratedItinerary, SafariFormData, TeamMember } from '../types';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';

interface BookingFormProps {
  itinerary: GeneratedItinerary;
  formData: SafariFormData;
  specialist?: TeamMember | null;
}

const BookingForm: React.FC<BookingFormProps> = ({ itinerary, formData, specialist }) => {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [bookingData, setBookingData] = useState({
    name: formData.name || '',
    email: formData.email || '',
    phone: '',
    preferredDate: '',
    guests: formData.guests || 2,
    message: `I am interested in booking the "${itinerary.tripTitle}" safari.`
  });

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async () => {
    if (!bookingData.preferredDate || !bookingData.email || !bookingData.name || !isValidEmail(bookingData.email)) {
      setShowErrors(true);
      return;
    }
    setIsSubmitting(true);

    try {
      const { error } = await supabase.from('itineraries').insert([{
        company_id: itinerary.company_id,
        customer_name: bookingData.name,
        customer_email: bookingData.email.toLowerCase().trim(),
        trip_title: itinerary.tripTitle,
        form_data: {
          ...formData,
          phone: bookingData.phone,
          preferredDate: bookingData.preferredDate,
          guests: bookingData.guests,
          bookingMessage: bookingData.message
        },
        itinerary_data: itinerary,
        status: 'booking_request'
      }]);

      if (error) throw error;

      setIsSuccess(true);
      toast.success("Booking request sent successfully!");
    } catch (err: any) {
      console.error("Booking submission failed:", err);
      toast.error("Failed to send booking request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => {
    if (step === 1 && !bookingData.preferredDate) {
      setShowErrors(true);
      return;
    }
    if (step === 2 && (!bookingData.email || !bookingData.name || !isValidEmail(bookingData.email))) {
      setShowErrors(true);
      return;
    }
    setShowErrors(false);
    setStep(s => Math.min(s + 1, 3));
  };
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  const [referenceNumber, setReferenceNumber] = useState('');
  useEffect(() => {
    if (isSuccess && !referenceNumber) {
      const timer = setTimeout(() => {
        setReferenceNumber(Math.random().toString(36).substring(7).toUpperCase());
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isSuccess, referenceNumber]);

  if (isSuccess) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg p-10 shadow-2xl border border-safari-100 flex flex-col items-center text-center space-y-8"
      >
        <div className="relative">
          <div className="w-24 h-24 bg-safari-50 text-safari-600 rounded-full flex items-center justify-center shadow-inner">
            <CheckCircle2 size={48} />
          </div>
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3 }}
            className="absolute -top-2 -right-2 bg-safari-500 text-white p-2 rounded-full shadow-lg"
          >
            <Star size={16} fill="currentColor" />
          </motion.div>
        </div>
        
        <div className="space-y-4">
          <h3 className="text-3xl font-title font-bold text-safari-900">Your Journey Begins</h3>
          <p className="text-safari-600 leading-relaxed max-w-sm mx-auto">
            We've received your request for the <span className="font-bold text-safari-800">{itinerary.tripTitle}</span>. 
            A senior specialist will reach out within 24 hours to finalize your bespoke experience.
          </p>
        </div>

        <div className="p-6 bg-safari-50 rounded-lg border border-safari-100 w-full max-w-md">
          <div className="flex items-center gap-3 text-safari-700 font-bold text-sm mb-2 justify-center">
            <ShieldCheck size={18} className="text-safari-500" />
            Secure Confirmation
          </div>
          <p className="text-[11px] text-safari-400 uppercase tracking-widest font-black">Reference: {referenceNumber}</p>
        </div>
      </motion.div>
    );
  }

  return (
    <div id="booking-form" className="bg-white rounded-lg shadow-2xl border border-safari-100 overflow-hidden">
      {/* Header */}
      <div className="p-8 border-b border-safari-100 flex items-center justify-between bg-white">
        <div className="flex items-center gap-4">
          {step > 1 && (
            <button 
              onClick={prevStep}
              className="p-2 hover:bg-safari-50 rounded-full text-safari-400 hover:text-safari-900 transition-all"
            >
              <ArrowLeft size={20} />
            </button>
          )}
          <div>
            <h3 className="text-2xl font-title font-bold text-safari-900">Book This Safari</h3>
            <p className="text-[10px] font-black uppercase tracking-widest text-safari-400">Step {step} of 3</p>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-1.5 w-full bg-safari-50">
        <motion.div 
          className="h-full bg-safari-500"
          initial={{ width: '33.33%' }}
          animate={{ width: `${(step / 3) * 100}%` }}
        />
      </div>

      <div className="p-8 md:p-12">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div 
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="space-y-2">
                <h4 className="text-xl font-bold text-safari-900">The Vision</h4>
                <p className="text-sm text-safari-500">When would you like to experience the wild?</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-safari-400 flex items-center gap-2">
                    <Calendar size={12} /> Preferred Start Date <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="date"
                    className={`w-full p-4 bg-safari-50 border rounded-md font-bold text-sm outline-none focus:ring-2 focus:ring-safari-200 focus:bg-white transition-all ${
                      showErrors && !bookingData.preferredDate ? 'border-red-500' : 'border-safari-100'
                    }`}
                    value={bookingData.preferredDate}
                    onChange={(e) => setBookingData({...bookingData, preferredDate: e.target.value})}
                  />
                  {showErrors && !bookingData.preferredDate && (
                    <p className="text-[10px] text-red-500 font-bold mt-1">Please select a start date</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-safari-400 flex items-center gap-2">
                    <User size={12} /> Number of Guests
                  </label>
                  <div className="flex items-center space-x-4 p-4 bg-white border border-safari-100 rounded-lg shadow-sm">
                    <button 
                      type="button"
                      onClick={() => setBookingData({...bookingData, guests: Math.max(1, bookingData.guests - 1)})}
                      className="w-10 h-10 flex items-center justify-center bg-safari-50 text-safari-600 border border-safari-100 rounded-lg hover:bg-safari-100 transition-all active:scale-90"
                    >
                      <Minus size={18} />
                    </button>
                    <div className="flex-1 text-center">
                      <span className="text-xl font-black text-safari-900">{bookingData.guests}</span>
                      <span className="text-[10px] block font-bold uppercase text-safari-400 mt-0.5">Travelers</span>
                    </div>
                    <button 
                      type="button"
                      onClick={() => setBookingData({...bookingData, guests: bookingData.guests + 1})}
                      className="w-10 h-10 flex items-center justify-center bg-safari-900 text-white rounded-lg hover:bg-safari-800 transition-all shadow-md active:scale-90"
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                </div>
              </div>

              {specialist && (
                <div className="p-6 bg-safari-50 rounded-lg border border-safari-100 flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 border-2 border-white shadow-sm">
                    <img src={specialist.photo_url || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100"} alt={specialist.name} referrerPolicy="no-referrer" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-safari-900">{specialist.name}</p>
                    <p className="text-[10px] text-safari-500 italic">"I'll be your dedicated specialist for this {formData.destinations?.[0] || 'safari'} expedition."</p>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {step === 2 && (
            <motion.div 
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="space-y-2">
                <h4 className="text-xl font-bold text-safari-900">The Traveler</h4>
                <p className="text-sm text-safari-500">How shall we address you?</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-safari-400 flex items-center gap-2">
                    <User size={12} /> Full Name <span className="text-red-500">*</span>
                  </label>
                  <input 
                    required
                    type="text"
                    className={`w-full p-4 bg-safari-50 border rounded-md font-bold text-sm outline-none focus:ring-2 focus:ring-safari-200 focus:bg-white transition-all ${
                      showErrors && !bookingData.name ? 'border-red-500' : 'border-safari-100'
                    }`}
                    placeholder="John Doe"
                    value={bookingData.name}
                    onChange={(e) => setBookingData({...bookingData, name: e.target.value})}
                  />
                  {showErrors && !bookingData.name && (
                    <p className="text-[10px] text-red-500 font-bold mt-1">Full name is required</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-safari-400 flex items-center gap-2">
                    <Mail size={12} /> Email Address <span className="text-red-500">*</span>
                  </label>
                  <input 
                    required
                    type="email"
                    className={`w-full p-4 bg-safari-50 border rounded-md font-bold text-sm outline-none focus:ring-2 focus:ring-safari-200 focus:bg-white transition-all ${
                      showErrors && (!bookingData.email || !isValidEmail(bookingData.email)) ? 'border-red-500' : 'border-safari-100'
                    }`}
                    placeholder="john@example.com"
                    value={bookingData.email}
                    onChange={(e) => setBookingData({...bookingData, email: e.target.value})}
                  />
                  {showErrors && !bookingData.email && (
                    <p className="text-[10px] text-red-500 font-bold mt-1">Email address is required</p>
                  )}
                  {showErrors && bookingData.email && !isValidEmail(bookingData.email) && (
                    <p className="text-[10px] text-red-500 font-bold mt-1">Please enter a valid email address</p>
                  )}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-black uppercase text-safari-400 flex items-center gap-2">
                    <Phone size={12} /> Phone Number
                  </label>
                  <input 
                    type="tel"
                    className="w-full p-4 bg-safari-50 border border-safari-100 rounded-md font-bold text-sm outline-none focus:ring-2 focus:ring-safari-200 focus:bg-white transition-all"
                    placeholder="+1 234 567 890"
                    value={bookingData.phone}
                    onChange={(e) => setBookingData({...bookingData, phone: e.target.value})}
                  />
                </div>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div 
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="space-y-2">
                <h4 className="text-xl font-bold text-safari-900">The Connection</h4>
                <p className="text-sm text-safari-500">Any special requests for your journey?</p>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-safari-400 flex items-center gap-2">
                    <MessageSquare size={12} /> Message / Special Requests
                  </label>
                  <textarea 
                    className="w-full p-4 bg-safari-50 border border-safari-100 rounded-md text-sm h-32 resize-none outline-none focus:ring-2 focus:ring-safari-200 focus:bg-white transition-all"
                    placeholder="Tell us more about your dream safari..."
                    value={bookingData.message}
                    onChange={(e) => setBookingData({...bookingData, message: e.target.value})}
                  />
                </div>

                <div className="p-6 bg-safari-900 rounded-lg text-white space-y-4 shadow-xl">
                  <div className="flex justify-between items-center text-xs font-black uppercase tracking-widest text-safari-400">
                    <span>Trip Summary</span>
                    <span className="text-safari-300">{itinerary.tripTitle}</span>
                  </div>
                  <div className="flex justify-between items-end">
                    <div className="space-y-1">
                      <p className="text-[10px] text-safari-400 uppercase font-bold">Estimated Investment</p>
                      <p className="text-2xl font-title font-bold">{String(itinerary.totalEstimatedCost)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-safari-400 uppercase font-bold">Guests</p>
                      <p className="text-lg font-bold">{bookingData.guests}</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-10 pt-8 border-t border-safari-100">
          {step < 3 ? (
            <button 
              onClick={nextStep}
              className="w-full py-5 bg-safari-900 text-white rounded-md font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3 hover:bg-safari-800 transition-all shadow-xl active:scale-[0.98]"
            >
              Continue to {step === 1 ? 'Contact Details' : 'Final Step'} <ChevronRight size={18} />
            </button>
          ) : (
            <button 
              onClick={handleSubmit}
              disabled={isSubmitting || !bookingData.name || !bookingData.email || !bookingData.preferredDate}
              className="w-full py-5 bg-safari-900 text-white rounded-md font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3 hover:bg-safari-800 transition-all shadow-xl disabled:opacity-50 active:scale-[0.98]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> Finalizing...
                </>
              ) : (
                <>
                  <Send size={18} /> Send Booking Request
                </>
              )}
            </button>
          )}
          <p className="text-[10px] text-center text-safari-400 mt-6 font-medium uppercase tracking-widest">
            No payment required at this stage
          </p>
        </div>
      </div>
    </div>
  );
};

export default BookingForm;
