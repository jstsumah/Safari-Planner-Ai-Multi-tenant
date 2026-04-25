import React, { useState, useEffect, useCallback } from 'react';
import { 
  Building2, 
  Users, 
  Star, 
  MapPin, 
  Mail, 
  Phone, 
  Globe, 
  MessageSquare,
  Award,
  Shield,
  Heart,
  Plus
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

interface Review {
  id: string;
  author_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

interface TeamMember {
  id: string;
  full_name: string;
  role: string;
  avatar_url?: string;
}

interface CompanyProfileProps {
  companyId: string;
  branding: any;
  onClose: () => void;
}

const CompanyProfile: React.FC<CompanyProfileProps> = ({ companyId, branding: defaultBranding, onClose }) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [newReview, setNewReview] = useState({ author_name: '', rating: 5, comment: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [companyInfo, setCompanyInfo] = useState<any>(null);

  // Combine default branding from props with specific company branding
  const branding = companyInfo?.branding || defaultBranding;

  const primaryColor = branding?.primaryColor || '#8f8664';
  const secondaryColor = branding?.secondaryColor || '#413c31';

  const fetchCompanyData = useCallback(async () => {
    const { data } = await supabase.from('companies').select('*').eq('id', companyId).single();
    if (data) setCompanyInfo(data);
  }, [companyId]);

  const fetchReviews = useCallback(async () => {
    const { data } = await supabase
      .from('reviews')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });
    if (data) setReviews(data);
  }, [companyId]);

  const fetchTeam = useCallback(async () => {
    const { data } = await supabase
      .from('team_members')
      .select('id, name, role, photo_url')
      .eq('company_id', companyId)
      .limit(6);
    if (data) {
      setTeam(data.map(m => ({
        id: m.id,
        full_name: m.name,
        role: m.role,
        avatar_url: m.photo_url
      })));
    }
  }, [companyId]);

  useEffect(() => {
    const init = async () => {
      await fetchCompanyData();
      await fetchReviews();
      await fetchTeam();
    };
    init();
  }, [fetchCompanyData, fetchReviews, fetchTeam]);

  const handleAddReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReview.author_name || !newReview.comment) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('reviews').insert([{
        company_id: companyId,
        ...newReview
      }]);
      if (error) throw error;
      toast.success("Review posted successfully!");
      setNewReview({ author_name: '', rating: 5, comment: '' });
      fetchReviews();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'heart': return <Heart className="text-red-500" />;
      case 'globe': return <Globe className="text-blue-500" />;
      case 'shield': return <Shield className="text-green-500" />;
      case 'award': return <Award className="text-amber-500" />;
      case 'users': return <Users className="text-purple-500" />;
      case 'star': return <Star className="text-amber-400" />;
      default: return <Star className="text-safari-400" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-safari-100/80 backdrop-blur-md z-[150] overflow-y-auto animate-fadeIn">
      <div className="max-w-6xl mx-auto px-4 py-12 space-y-16">
        {/* Header Navigation */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white rounded-2xl shadow-xl flex items-center justify-center border border-safari-100">
              <Building2 style={{ color: primaryColor }} size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-safari-900 font-serif italic tracking-tight" style={{ color: secondaryColor }}>
                {branding?.agencyName || companyInfo?.name || 'Your Company Profile'}
              </h1>
              <p className="text-safari-400 text-sm font-medium uppercase tracking-widest">{companyInfo?.slug || 'agency-portal'}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="px-6 py-2.5 bg-white border border-safari-200 text-safari-600 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-safari-50 transition-all shadow-sm"
          >
            Close Profile
          </button>
        </div>

        {/* Hero Section */}
        <section className="relative h-96 rounded-[3rem] overflow-hidden shadow-2xl group">
          <img 
            src={branding?.heroImage || "https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&q=80&w=2000"} 
            className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-[2s]"
            alt="Safari Landscape"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-safari-900 via-transparent to-transparent opacity-90" />
          <div className="absolute bottom-12 left-12 space-y-4 max-w-2xl">
            <div className="flex gap-4">
              <span className="px-4 py-1.5 bg-white/20 backdrop-blur-md text-white rounded-full text-[10px] font-black uppercase tracking-widest border border-white/30">
                {branding?.establishedYear ? `Established ${branding.establishedYear}` : 'Established 2012'}
              </span>
              <span className="px-4 py-1.5 bg-safari-600/40 backdrop-blur-md text-white rounded-full text-[10px] font-black uppercase tracking-widest border border-safari-400/30">
                Premium Provider
              </span>
            </div>
            <h2 className="text-5xl font-bold text-white font-serif leading-tight">
              {branding?.heroTitle || `Crafting Unforgettable African Odysseys.`}
            </h2>
            {branding?.heroDescription && (
              <p className="text-safari-100 text-lg font-medium max-w-xl">
                {branding.heroDescription}
              </p>
            )}
          </div>
        </section>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {(branding?.statistics && branding.statistics.length > 0) ? (
            branding.statistics.map((stat: any, idx: number) => (
              <div key={idx} className="bg-white p-8 rounded-[2rem] shadow-sm border border-safari-50 flex flex-col items-center text-center space-y-3 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <div className="p-4 bg-safari-50 rounded-2xl">
                  {React.cloneElement(getIcon(stat.iconType) as React.ReactElement, { size: 24 })}
                </div>
                <div>
                  <p className="text-3xl font-black text-safari-900">{stat.value}</p>
                  <p className="text-xs font-black text-safari-400 uppercase tracking-widest">{stat.label}</p>
                </div>
              </div>
            ))
          ) : (
            [
              { label: 'Happy Clients', value: '1,200+', icon: <Heart className="text-red-500" /> },
              { label: 'Safari Days', value: '8,500+', icon: <Globe className="text-blue-500" /> },
              { label: 'Wildlife Guides', value: '45+', icon: <Shield className="text-green-500" /> },
              { label: 'Awards Won', value: '12', icon: <Award className="text-amber-500" /> },
            ].map((stat, idx) => (
              <div key={idx} className="bg-white p-8 rounded-[2rem] shadow-sm border border-safari-50 flex flex-col items-center text-center space-y-3 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <div className="p-4 bg-safari-50 rounded-2xl">
                  {React.cloneElement(stat.icon as React.ReactElement, { size: 24 })}
                </div>
                <div>
                  <p className="text-3xl font-black text-safari-900">{stat.value}</p>
                  <p className="text-xs font-black text-safari-400 uppercase tracking-widest">{stat.label}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* About & Contact Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* About Column */}
          <div className="lg:col-span-2 space-y-8">
            <div className="space-y-4">
              <h3 className="text-3xl font-bold text-safari-900 font-serif italic tracking-tight">Our Ethos</h3>
              <div className="prose prose-safari max-w-none text-safari-600 leading-relaxed space-y-4 whitespace-pre-wrap">
                {branding?.agencyDescription || (
                  <>
                    <p>
                      At {branding?.agencyName || companyInfo?.name}, we believe a safari isn't just a trip—it's a transformation. Founded on the principles of ethical conservation and hyper-personalized luxury, we've spent a decade mapping the most remote corners of the continent to bring you closer to the rhythm of the wild.
                    </p>
                    <p>
                      Every itinerary we craft is a unique tapestry of landscape, luxury, and legend. From the crimson sands of the Namib to the emerald floodplains of the Okavango, we don't just show you Africa; we help you find yourself within it.
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Team Section */}
            <div className="space-y-6 pt-8">
              <div className="flex justify-between items-end">
                <h3 className="text-2xl font-bold text-safari-900 font-serif tracking-tight">The Visionaries</h3>
                <p className="text-safari-400 text-xs font-black uppercase tracking-widest">Our Global Team</p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                {team.length > 0 ? team.map((member) => (
                  <div key={member.id} className="group text-center space-y-3">
                    <div className="relative aspect-square rounded-[2rem] overflow-hidden shadow-lg border-4 border-white">
                      <img 
                        src={member.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${member.full_name}`} 
                        className="w-full h-full object-cover"
                        alt={member.full_name}
                      />
                      <div className="absolute inset-0 bg-safari-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Users className="text-white" size={24} />
                      </div>
                    </div>
                    <div>
                      <p className="font-bold text-safari-900">{member.full_name}</p>
                      <p className="text-[10px] font-black text-safari-400 uppercase tracking-widest">{member.role}</p>
                    </div>
                  </div>
                )) : (
                  <div className="col-span-full py-12 text-center border-2 border-dashed border-safari-100 rounded-[2rem]">
                    <p className="text-safari-300 text-sm italic">Our team list is arriving soon from across the savannah...</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Contact Sidebar */}
          <div className="bg-safari-900 rounded-[3rem] p-10 text-white space-y-10 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-safari-800 rounded-bl-full -mr-10 -mt-10 opacity-50" />
            
            <div className="space-y-2">
              <h3 className="text-2xl font-bold font-serif italic tracking-tight">Connect With Us</h3>
              <p className="text-safari-300 text-sm italic">We're available 24/7 for our travelers.</p>
            </div>

            <div className="space-y-6">
              {[
                { icon: <MapPin size={20} />, label: 'Location', value: branding?.contactAddress || 'Nairobi, Kenya' },
                { icon: <Mail size={20} />, label: 'Email', value: branding?.contactEmail || 'concierge@agency.com' },
                { icon: <Phone size={20} />, label: 'Phone', value: branding?.contactPhone || '+254 700 000000' },
                { icon: <Globe size={20} />, label: 'WhatsApp', value: branding?.whatsappNumber || 'Available' }
              ].map((item, idx) => (
                <div key={idx} className="flex items-start gap-4 p-4 rounded-2xl hover:bg-white/5 transition-all cursor-default">
                  <div className="p-3 bg-white/10 rounded-xl text-safari-300">
                    {item.icon}
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-safari-400 tracking-widest mb-1">{item.label}</p>
                    <p className="font-bold text-safari-50 tracking-tight">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4">
              <button className="w-full py-4 bg-white text-safari-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-safari-100 transition-all shadow-xl shadow-black/20">
                Book a Consultation
              </button>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <section className="space-y-10">
          <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-6 text-center md:text-left">
            <div>
              <h3 className="text-3xl font-bold text-safari-900 font-serif italic tracking-tight">Traveler Diaries</h3>
              <p className="text-safari-500 font-medium italic tracking-tight">First-hand accounts of the wilde experience.</p>
            </div>
            <div className="flex items-center justify-center gap-4">
              <div className="flex text-amber-500">
                {[1,2,3,4,5].map(i => <Star key={i} fill="currentColor" size={20} />)}
              </div>
              <span className="text-2xl font-black text-safari-900">4.9/5.0</span>
              <span className="px-3 py-1 bg-safari-100 text-safari-600 rounded-full text-[10px] font-black uppercase tracking-widest">Verified</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Review Form */}
            <div className="bg-white p-8 rounded-[2rem] border-2 border-dashed border-safari-200 flex flex-col justify-center items-center text-center space-y-6">
              <div className="p-4 bg-safari-50 rounded-full text-safari-500">
                <MessageSquare size={32} />
              </div>
              <div>
                <h4 className="font-bold text-safari-900">Share Your Story</h4>
                <p className="text-sm text-safari-400 italic">How was your wild experience?</p>
              </div>
              
              <form onSubmit={handleAddReview} className="w-full space-y-4">
                <input 
                  type="text"
                  placeholder="Your Name"
                  className="w-full px-4 py-3 bg-safari-50 border border-safari-100 rounded-xl text-sm focus:ring-2 focus:ring-safari-500 outline-none transition-all"
                  value={newReview.author_name}
                  onChange={e => setNewReview({...newReview, author_name: e.target.value})}
                />
                <select 
                  className="w-full px-4 py-3 bg-safari-50 border border-safari-100 rounded-xl text-sm focus:ring-2 focus:ring-safari-500 outline-none transition-all"
                  value={newReview.rating}
                  onChange={e => setNewReview({...newReview, rating: Number(e.target.value)})}
                >
                  <option value="5">5 Stars - Perfection</option>
                  <option value="4">4 Stars - Amazing</option>
                  <option value="3">3 Stars - Good</option>
                </select>
                <textarea 
                  placeholder="Tell us about the wildlife..."
                  rows={3}
                  className="w-full px-4 py-3 bg-safari-50 border border-safari-100 rounded-xl text-sm focus:ring-2 focus:ring-safari-500 outline-none transition-all resize-none"
                  value={newReview.comment}
                  onChange={e => setNewReview({...newReview, comment: e.target.value})}
                />
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 bg-safari-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-safari-800 transition-all flex items-center justify-center gap-2"
                >
                  {isSubmitting ? 'Posting...' : <><Plus size={14} /> Post Review</>}
                </button>
              </form>
            </div>

            {/* Review Cards */}
            {reviews.map((review) => (
              <div key={review.id} className="bg-white p-8 rounded-[2rem] shadow-sm border border-safari-50 space-y-4 relative group hover:shadow-xl transition-all">
                <div className="absolute -top-4 -right-4 w-12 h-12 bg-safari-50 rounded-2xl flex items-center justify-center text-safari-200 group-hover:text-safari-400 group-hover:rotate-12 transition-all">
                  <MessageSquare size={20} />
                </div>
                <div className="flex text-amber-500 gap-1">
                  {[...Array(review.rating)].map((_, i) => <Star key={i} fill="currentColor" size={14} />)}
                </div>
                <p className="text-safari-700 italic leading-relaxed">"{review.comment}"</p>
                <div className="pt-4 border-t border-safari-50 flex justify-between items-center">
                  <p className="font-bold text-safari-900">{review.author_name}</p>
                  <p className="text-[10px] font-black text-safari-300 uppercase">{new Date(review.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="pt-12 border-t border-safari-200 text-center space-y-6">
          <div className="flex justify-center gap-8 text-safari-400 font-black text-[10px] uppercase tracking-widest">
            <a href="#" className="hover:text-safari-900 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-safari-900 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-safari-900 transition-colors">Conservation Fund</a>
          </div>
          <p className="text-safari-300 text-xs italic">
            © {new Date().getFullYear()} {companyInfo?.name}. Designed for the wild at heart.
          </p>
        </footer>
      </div>
    </div>
  );
};

export default CompanyProfile;
