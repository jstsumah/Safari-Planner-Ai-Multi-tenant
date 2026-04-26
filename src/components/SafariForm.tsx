
import React, { useState } from 'react';
import { toast } from 'sonner';
import { SafariFormData, BudgetTier, TransportType, BrandingConfig } from '../types';
import { 
  Map, 
  Users, 
  DollarSign, 
  Activity, 
  Truck, 
  CheckCircle,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Plus,
  Minus,
  ChevronDown
} from 'lucide-react';
import { Tooltip } from './ui/Tooltip';

interface SafariFormProps {
  onSubmit: (data: SafariFormData) => void;
  isLoading: boolean;
  initialData?: SafariFormData;
  branding: BrandingConfig;
}

const DEFAULT_DATA: SafariFormData = {
  name: '',
  email: '',
  country: 'United States',
  adults: 2,
  youngAdults: 0,
  children: 0,
  startDate: '',
  durationDays: 7,
  destinations: [],
  customDestinations: '',
  budget: BudgetTier.MidRange,
  activities: [],
  preferredAccommodations: [],
  otherAccommodations: '',
  transport: TransportType.LandCruiser,
  pickupLocation: 'Jomo Kenyatta International Airport (NBO)',
  dropoffLocation: 'Jomo Kenyatta International Airport (NBO)',
  dietaryRequirements: '',
  specialOccasions: ''
};

const SafariForm: React.FC<SafariFormProps> = ({ onSubmit, isLoading, initialData, branding }) => {
  const [step, setStep] = useState(() => {
    const savedStep = sessionStorage.getItem('safari_form_step');
    return savedStep ? parseInt(savedStep) : 1;
  });
  const [formData, setFormData] = useState<SafariFormData>(initialData || DEFAULT_DATA);
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({});

  // Persist step changes
  React.useEffect(() => {
    sessionStorage.setItem('safari_form_step', step.toString());
  }, [step]);

  // Dynamic Options from Branding
  const countries = branding.formOptions?.countries || [
    "United States", "United Kingdom", "Canada", "Australia", "Germany", 
    "France", "Netherlands", "Switzerland", "Italy", "Spain", "Belgium", 
    "Austria", "Sweden", "Norway", "Denmark", "Ireland", "New Zealand", 
    "United Arab Emirates", "India", "China", "Japan", "South Africa", 
    "Brazil", "Mexico", "Other"
  ];

  const destinationsByCountry = branding.formOptions?.destinationsByCountry || {
    "Kenya": ["Masai Mara", "Amboseli", "Lake Nakuru", "Samburu", "Tsavo East/West", "Ol Pejeta"],
    "Tanzania": ["Serengeti", "Ngorongoro Crater", "Tarangire", "Lake Manyara", "Ruaha"],
    "Uganda": ["Bwindi Impenetrable", "Queen Elizabeth", "Murchison Falls", "Kibale Forest"],
    "Rwanda": ["Volcanoes NP", "Akagera", "Nyungwe Forest"]
  };

  const activities = branding.formOptions?.activities || [
    "Game Drives", "Hot Air Balloon", "Nature Walk", 
    "Bush Dinner", "Cultural Visit (Masai Village)", "Photographic Safari",
    "Gorilla Trekking", "Boat Safari"
  ];

  const accommodationTypes = branding.formOptions?.accommodationTypes || ["Lodge", "Tented Camp", "Boutique Hotel", "Private Villa", "Mobile Camp"];

  const updateField = (field: keyof SafariFormData, value: any) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      sessionStorage.setItem('safari_formData', JSON.stringify(newData));
      return newData;
    });
    if (errors[field as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const toggleSelection = (field: 'destinations' | 'activities' | 'preferredAccommodations', item: string) => {
    setFormData(prev => {
      const list = prev[field] as string[];
      let newList;
      if (list.includes(item)) {
        newList = list.filter(i => i !== item);
      } else {
        newList = [...list, item];
      }
      const newData = { ...prev, [field]: newList };
      sessionStorage.setItem('safari_formData', JSON.stringify(newData));
      return newData;
    });
  };

  const nextStep = () => {
    if (step === 1) {
      const newErrors: { name?: string; email?: string } = {};
      if (!formData.name.trim()) {
        newErrors.name = "Full name is required";
      }
      if (!formData.email.trim()) {
        newErrors.email = "Email address is required";
      } else {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
          newErrors.email = "Invalid email format";
        }
      }

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }
    }
    setStep(prev => prev + 1);
  };
  const prevStep = () => setStep(prev => prev - 1);

  const steps = [
    { title: "Traveler Info", icon: Users },
    { title: "Destinations", icon: Map },
    { title: "Budget Style", icon: DollarSign },
    { title: "Experiences", icon: Activity },
    { title: "Transport", icon: Truck },
    { title: "Review", icon: CheckCircle },
  ];

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-safari-800">
        <Loader2 className="w-16 h-16 animate-spin mb-4 text-safari-600" />
        <h3 className="text-xl font-semibold">Designing your dream safari...</h3>
        <p className="text-safari-500 mt-2 text-center max-w-md">
          Consulting maps, checking lodge availability, and optimizing routes. This may take up to 30 seconds.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-md shadow-xl overflow-hidden max-w-4xl mx-auto border border-safari-200">
      {/* Progress Bar */}
      <div className="bg-safari-100 p-4 border-b border-safari-200">
        <div className="flex justify-between items-center">
          {steps.map((s, idx) => {
            const StepIcon = s.icon;
            const isActive = step === idx + 1;
            const isCompleted = step > idx + 1;
            return (
                  <div key={idx} className={`flex flex-col items-center ${isActive ? 'text-safari-800' : 'text-safari-300'}`}>
                    <Tooltip content={s.title}>
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-1 transition-all ${isActive || isCompleted ? 'bg-safari-600 text-white' : 'bg-safari-200'}`}>
                        <StepIcon size={18} />
                      </div>
                    </Tooltip>
                    <span className="text-xs font-medium hidden sm:block">{s.title}</span>
                  </div>
            );
          })}
        </div>
      </div>

      <div className="p-8">
        {/* Step 1: Traveler Info */}
        {step === 1 && (
          <div className="space-y-6 animate-fadeIn">
            <h2 className="text-2xl font-extrabold text-safari-900">Who is traveling?</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-safari-700 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <Tooltip content="Enter your full name as it appears on your passport" side="top">
                  <input 
                    type="text" 
                    required
                    className={`w-full p-3 border rounded focus:ring-2 focus:ring-safari-500 outline-none bg-white text-safari-900 font-medium placeholder:text-safari-300 ${errors.name ? 'border-red-500' : 'border-safari-300'}`}
                    value={formData.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    placeholder="John Doe"
                  />
                </Tooltip>
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-safari-700 mb-1">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <Tooltip content="We'll send your itinerary and updates to this email" side="top">
                  <input 
                    type="email" 
                    required
                    className={`w-full p-3 border rounded focus:ring-2 focus:ring-safari-500 outline-none bg-white text-safari-900 font-medium placeholder:text-safari-300 ${errors.email ? 'border-red-500' : 'border-safari-300'}`}
                    value={formData.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    placeholder="john@example.com"
                  />
                </Tooltip>
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-safari-700 mb-1">Country of Origin</label>
                <div className="relative">
                  <select
                    className="w-full p-3 border border-safari-300 rounded focus:ring-2 focus:ring-safari-500 outline-none bg-white text-safari-900 font-medium appearance-none cursor-pointer"
                    value={formData.country}
                    onChange={(e) => updateField('country', e.target.value)}
                  >
                    {countries.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-safari-900">
                    <ChevronDown size={20} />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-safari-700 mb-1">Start Date</label>
                <input 
                  type="date" 
                  style={{ colorScheme: 'light' }}
                  className="w-full p-3 border border-safari-300 rounded focus:ring-2 focus:ring-safari-500 outline-none bg-white text-safari-900 font-medium cursor-pointer"
                  value={formData.startDate}
                  onChange={(e) => updateField('startDate', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-safari-700 mb-1">Duration (Days)</label>
                <div className="flex items-center border border-safari-300 rounded bg-white overflow-hidden shadow-sm">
                  <button 
                    type="button"
                    onClick={() => updateField('durationDays', Math.max(3, formData.durationDays - 1))}
                    className="p-3 text-safari-900 hover:bg-safari-50 transition-colors border-r border-safari-200"
                  >
                    <Minus size={18} />
                  </button>
                  <input 
                    type="number" min="3" max="30"
                    className="w-full p-3 text-center outline-none bg-white text-safari-900 font-bold appearance-none m-0 [&::-webkit-inner-spin-button]:appearance-none"
                    value={formData.durationDays}
                    onChange={(e) => updateField('durationDays', parseInt(e.target.value) || 3)}
                  />
                  <button 
                    type="button"
                    onClick={() => updateField('durationDays', formData.durationDays + 1)}
                    className="p-3 text-safari-900 hover:bg-safari-50 transition-colors border-l border-safari-200"
                  >
                    <Plus size={18} />
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-3 md:col-span-1">
                <div>
                  <label className="block text-xs font-bold text-safari-500 uppercase mb-1">Adults</label>
                  <div className="flex items-center border border-safari-300 rounded bg-white overflow-hidden shadow-sm">
                    <button 
                      type="button"
                      onClick={() => updateField('adults', Math.max(1, formData.adults - 1))}
                      className="p-3 text-safari-900 hover:bg-safari-50 transition-colors border-r border-safari-200"
                    >
                      <Minus size={14} />
                    </button>
                    <input 
                      type="number" min="1"
                      className="w-full p-3 text-center outline-none bg-white text-safari-900 font-bold text-sm appearance-none m-0 [&::-webkit-inner-spin-button]:appearance-none"
                      value={formData.adults}
                      onChange={(e) => updateField('adults', parseInt(e.target.value) || 1)}
                    />
                    <button 
                      type="button"
                      onClick={() => updateField('adults', formData.adults + 1)}
                      className="p-3 text-safari-900 hover:bg-safari-50 transition-colors border-l border-safari-200"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-safari-500 uppercase mb-1">Teens</label>
                  <div className="flex items-center border border-safari-300 rounded bg-white overflow-hidden shadow-sm">
                    <button 
                      type="button"
                      onClick={() => updateField('youngAdults', Math.max(0, formData.youngAdults - 1))}
                      className="p-3 text-safari-900 hover:bg-safari-50 transition-colors border-r border-safari-200"
                    >
                      <Minus size={14} />
                    </button>
                    <input 
                      type="number" min="0"
                      className="w-full p-3 text-center outline-none bg-white text-safari-900 font-bold text-sm appearance-none m-0 [&::-webkit-inner-spin-button]:appearance-none"
                      value={formData.youngAdults}
                      onChange={(e) => updateField('youngAdults', parseInt(e.target.value) || 0)}
                    />
                    <button 
                      type="button"
                      onClick={() => updateField('youngAdults', formData.youngAdults + 1)}
                      className="p-3 text-safari-900 hover:bg-safari-50 transition-colors border-l border-safari-200"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-safari-500 uppercase mb-1">Child</label>
                  <div className="flex items-center border border-safari-300 rounded bg-white overflow-hidden shadow-sm">
                    <button 
                      type="button"
                      onClick={() => updateField('children', Math.max(0, formData.children - 1))}
                      className="p-3 text-safari-900 hover:bg-safari-50 transition-colors border-r border-safari-200"
                    >
                      <Minus size={14} />
                    </button>
                    <input 
                      type="number" min="0"
                      className="w-full p-3 text-center outline-none bg-white text-safari-900 font-bold text-sm appearance-none m-0 [&::-webkit-inner-spin-button]:appearance-none"
                      value={formData.children}
                      onChange={(e) => updateField('children', parseInt(e.target.value) || 0)}
                    />
                    <button 
                      type="button"
                      onClick={() => updateField('children', formData.children + 1)}
                      className="p-3 text-safari-900 hover:bg-safari-50 transition-colors border-l border-safari-200"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Destinations */}
        {step === 2 && (
          <div className="space-y-6 animate-fadeIn">
            <h2 className="text-2xl font-extrabold text-safari-900">Where do you want to go?</h2>
            <p className="text-safari-600 font-medium">Select your dream parks from the regions below.</p>
            
            <div className="space-y-6">
              {Object.entries(destinationsByCountry).map(([country, parks]) => (
                <div key={country}>
                  <h3 className="text-lg font-bold text-safari-800 mb-2 border-b border-safari-100 pb-1">{country}</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {parks.map(dest => (
                      <Tooltip key={dest} content={`Select ${dest}`}>
                        <button 
                          onClick={() => toggleSelection('destinations', dest)}
                          className={`p-3 rounded border text-sm font-bold transition-all text-left shadow-sm ${
                            formData.destinations.includes(dest) 
                            ? 'bg-safari-600 text-white border-safari-600 shadow-md scale-[1.02]' 
                            : 'bg-white text-safari-900 border-safari-200 hover:border-safari-400'
                          }`}
                        >
                          {dest}
                        </button>
                      </Tooltip>
                    ))}
                  </div>
                </div>
              ))}
              
              <div className="mt-4">
                <label className="block text-sm font-medium text-safari-700 mb-2">Other Destinations (Optional)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Plus size={18} className="text-safari-400" />
                  </div>
                  <input 
                    type="text"
                    className="w-full pl-10 p-3 border border-safari-300 rounded focus:ring-2 focus:ring-safari-500 outline-none bg-white text-safari-900 font-medium placeholder:text-safari-300 shadow-sm"
                    placeholder="e.g. Zanzibar Beach, Giraffe Manor..."
                    value={formData.customDestinations}
                    onChange={(e) => updateField('customDestinations', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Budget Only */}
        {step === 3 && (
          <div className="space-y-6 animate-fadeIn">
            <h2 className="text-2xl font-extrabold text-safari-900">Accommodation Style</h2>
            <p className="text-safari-600 font-medium">Choose your preferred level of comfort and exclusivity.</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              {Object.values(BudgetTier).map((tier) => (
                <Tooltip key={tier} content={`Choose ${tier.split('(')[0]} budget level`}>
                  <div 
                    onClick={() => updateField('budget', tier)}
                    className={`p-6 rounded-md border cursor-pointer transition-all shadow-sm ${
                      formData.budget === tier 
                      ? 'border-safari-600 bg-safari-50 ring-1 ring-safari-600 scale-[1.02] shadow-md' 
                      : 'border-safari-200 hover:bg-safari-50 bg-white'
                    }`}
                  >
                    <div className="font-bold text-safari-900 mb-2">{tier.split('(')[0]}</div>
                    <div className="text-xs text-safari-600 font-medium">{tier.split('(')[1].replace(')', '')}</div>
                  </div>
                </Tooltip>
              ))}
            </div>

            <div className="pt-8 mt-8 border-t border-safari-100">
              <h3 className="text-xl font-bold text-safari-900 mb-2">Lodge Preferences</h3>
              <p className="text-safari-600 mb-4 font-medium">Select any styles you prefer. This helps the AI refine its choices.</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {accommodationTypes.map(type => (
                  <Tooltip key={type} content={`Prefer ${type} style`}>
                    <button 
                      onClick={() => toggleSelection('preferredAccommodations', type)}
                      className={`p-4 rounded-md border text-sm font-bold transition-all text-left shadow-sm ${
                        formData.preferredAccommodations.includes(type) 
                        ? 'bg-safari-600 text-white border-safari-600 shadow-md' 
                        : 'bg-white text-safari-900 border-safari-200 hover:border-safari-400'
                      }`}
                    >
                      {type}
                    </button>
                  </Tooltip>
                ))}
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-safari-700 mb-2">Other Style Details (Optional)</label>
                <input 
                  type="text"
                  className="w-full p-3 border border-safari-300 rounded focus:ring-2 focus:ring-safari-500 outline-none bg-white text-safari-900 font-medium placeholder:text-safari-300 shadow-sm"
                  placeholder="e.g. Eco-friendly, Family-run, specific views..."
                  value={formData.otherAccommodations}
                  onChange={(e) => updateField('otherAccommodations', e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Activities */}
        {step === 4 && (
          <div className="space-y-6 animate-fadeIn">
            <h2 className="text-2xl font-extrabold text-safari-900">Add Experiences</h2>
            <p className="text-safari-600 font-medium">Customize your days with curated safari activities.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activities.map(act => (
                <Tooltip key={act} content={`Add ${act} to your itinerary`}>
                  <div 
                    onClick={() => toggleSelection('activities', act)}
                    className={`flex items-center p-4 rounded-md border cursor-pointer transition-all shadow-sm ${
                      formData.activities.includes(act)
                      ? 'bg-safari-100 border-safari-500 shadow-md'
                      : 'border-safari-200 hover:bg-safari-50 bg-white'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded border mr-3 flex items-center justify-center transition-colors ${
                      formData.activities.includes(act) ? 'bg-safari-600 border-safari-600' : 'border-safari-300 bg-white'
                    }`}>
                      {formData.activities.includes(act) && <CheckCircle size={14} className="text-white" />}
                    </div>
                    <span className="text-safari-900 font-bold">{act}</span>
                  </div>
                </Tooltip>
              ))}
            </div>
          </div>
        )}

        {/* Step 5: Transport */}
        {step === 5 && (
          <div className="space-y-6 animate-fadeIn">
            <h2 className="text-2xl font-extrabold text-safari-900">Logistics & Details</h2>
            
            <div className="space-y-4">
              <label className="block text-sm font-medium text-safari-700">Preferred Transport Mode</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.values(TransportType).map((t) => (
                  <Tooltip key={t} content={`Select ${t} as transport`}>
                    <button
                      onClick={() => updateField('transport', t)}
                      className={`p-3 rounded border text-sm font-bold shadow-sm transition-all ${
                        formData.transport === t ? 'bg-safari-600 text-white shadow-md' : 'bg-white text-safari-900 border-safari-300 hover:border-safari-500'
                      }`}
                    >
                      {t}
                    </button>
                  </Tooltip>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
               <div>
                <label className="block text-sm font-medium text-safari-700 mb-1">Pickup Location</label>
                <input 
                  type="text" 
                  className="w-full p-3 border border-safari-300 rounded outline-none bg-white text-safari-900 font-bold placeholder:text-safari-300 shadow-sm"
                  value={formData.pickupLocation}
                  onChange={(e) => updateField('pickupLocation', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-safari-700 mb-1">Drop-off Location</label>
                <input 
                  type="text" 
                  className="w-full p-3 border border-safari-300 rounded outline-none bg-white text-safari-900 font-bold placeholder:text-safari-300 shadow-sm"
                  value={formData.dropoffLocation}
                  onChange={(e) => updateField('dropoffLocation', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 mt-4">
              <div>
                <label className="block text-sm font-medium text-safari-700 mb-1">Dietary Requirements</label>
                <textarea 
                  className="w-full p-3 border border-safari-300 rounded outline-none h-20 bg-white text-safari-900 font-bold placeholder:text-safari-300 shadow-sm resize-none"
                  placeholder="Vegetarian, Gluten-free, Allergies..."
                  value={formData.dietaryRequirements}
                  onChange={(e) => updateField('dietaryRequirements', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-safari-700 mb-1">Special Occasions</label>
                <textarea 
                  className="w-full p-3 border border-safari-300 rounded outline-none h-20 bg-white text-safari-900 font-bold placeholder:text-safari-300 shadow-sm resize-none"
                  placeholder="Honeymoon, Birthday, Anniversary..."
                  value={formData.specialOccasions}
                  onChange={(e) => updateField('specialOccasions', e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 6: Review */}
        {step === 6 && (
          <div className="space-y-6 animate-fadeIn">
            <h2 className="text-2xl font-extrabold text-safari-900">Review Your Plans</h2>
            <div className="bg-white p-8 rounded-lg border border-safari-200 text-sm space-y-4 shadow-lg">
              <div className="flex justify-between border-b border-safari-100 pb-3">
                <span className="text-safari-500 font-bold uppercase tracking-wider text-[10px]">Traveler</span>
                <span className="font-extrabold text-safari-900">{formData.name} from {formData.country}</span>
              </div>
               <div className="flex justify-between border-b border-safari-100 pb-3">
                <span className="text-safari-500 font-bold uppercase tracking-wider text-[10px]">Email</span>
                <span className="font-extrabold text-safari-900">{formData.email}</span>
              </div>
              <div className="flex justify-between border-b border-safari-100 pb-3">
                <span className="text-safari-500 font-bold uppercase tracking-wider text-[10px]">Dates</span>
                <span className="font-extrabold text-safari-900">{formData.startDate} for {formData.durationDays} Days</span>
              </div>
               <div className="flex justify-between border-b border-safari-100 pb-3">
                <span className="text-safari-500 font-bold uppercase tracking-wider text-[10px]">Party Composition</span>
                <span className="font-extrabold text-safari-900">{formData.adults} Adults, {formData.youngAdults} Teens, {formData.children} Children</span>
              </div>
              <div className="flex justify-between border-b border-safari-100 pb-3">
                <span className="text-safari-500 font-bold uppercase tracking-wider text-[10px]">Destinations</span>
                <span className="font-extrabold text-right text-safari-900 max-w-[200px]">
                  {formData.destinations.join(', ') || 'Planner Choice'}
                  {formData.customDestinations && `, ${formData.customDestinations}`}
                </span>
              </div>
              <div className="flex justify-between border-b border-safari-100 pb-3">
                <span className="text-safari-500 font-bold uppercase tracking-wider text-[10px]">Budget Level</span>
                <span className="font-extrabold text-safari-900">{formData.budget.split('(')[0]}</span>
              </div>
              {(formData.preferredAccommodations.length > 0 || formData.otherAccommodations) && (
              <div className="flex justify-between border-b border-safari-100 pb-3">
                <span className="text-safari-500 font-bold uppercase tracking-wider text-[10px]">Preferred Styles</span>
                <span className="font-extrabold text-right text-safari-900 max-w-[200px]">
                  {[...formData.preferredAccommodations, formData.otherAccommodations].filter(Boolean).join(', ')}
                </span>
              </div>
              )}
              <div className="flex justify-between">
                <span className="text-safari-500 font-bold uppercase tracking-wider text-[10px]">Transport Mode</span>
                <span className="font-extrabold text-safari-900">{formData.transport}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Navigation */}
      <div className="p-6 bg-safari-50 border-t border-safari-200 flex justify-between">
        <Tooltip content="Go back to the previous step" side="right">
          <button 
            onClick={prevStep}
            disabled={step === 1}
            className={`flex items-center px-6 py-3 rounded-md font-bold transition-all w-fit ${
              step === 1 ? 'opacity-0 pointer-events-none' : 'text-safari-700 hover:bg-safari-200 active:scale-95'
            }`}
          >
            <ChevronLeft size={20} className="mr-2" /> Back
          </button>
        </Tooltip>
        
        {step < 6 ? (
           <Tooltip content="Proceed to the next step" side="left">
             <button 
              onClick={nextStep}
              className="flex items-center px-8 py-3 bg-safari-600 text-white rounded font-bold hover:bg-safari-700 transition-all shadow-lg active:scale-95 w-fit"
            >
              Next Step <ChevronRight size={20} className="ml-2" />
            </button>
           </Tooltip>
        ) : (
          <Tooltip content="Submit your preferences and generate your custom safari itinerary" side="left">
            <button 
              onClick={() => {
                const newErrors: { name?: string; email?: string } = {};
                if (!formData.name.trim()) newErrors.name = "Required";
                if (!formData.email.trim()) newErrors.email = "Required";
                
                if (Object.keys(newErrors).length > 0) {
                  setErrors(newErrors);
                  setStep(1);
                  toast.error("Please complete required fields");
                  return;
                }
                onSubmit(formData);
              }}
              className="flex items-center px-10 py-3 bg-green-700 text-white rounded font-black uppercase tracking-widest text-xs hover:bg-green-800 transition-all shadow-xl active:scale-95 w-fit"
            >
              Curate my safari <Activity size={18} className="ml-2" />
            </button>
          </Tooltip>
        )}
      </div>
    </div>
  );
};

export default SafariForm;
