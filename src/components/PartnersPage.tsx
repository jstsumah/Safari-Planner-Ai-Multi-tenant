import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Search, 
  MapPin, 
  Globe, 
  ArrowRight,
  ShieldCheck,
  Star,
  Users,
  Compass,
  ArrowLeft
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Company, BrandingConfig } from '../types';

interface PartnersPageProps {
  onBack: () => void;
  onViewProfile: (companyId: string, branding: BrandingConfig) => void;
  branding: BrandingConfig;
}

const PartnersPage: React.FC<PartnersPageProps> = ({ onBack, onViewProfile, branding }) => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchCompanies = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('status', 'active')
        .order('name');
      
      if (error) throw error;
      setCompanies(data || []);
    } catch (err) {
      console.error("Failed to fetch companies:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      await fetchCompanies();
    };
    load();
  }, []);

  const filteredCompanies = companies.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.branding?.agencyDescription?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-safari-50 text-safari-900 selection:bg-safari-200">
      {/* Header */}
      <header className="bg-white border-b border-safari-100 sticky top-0 z-[60]">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <button 
            onClick={onBack}
            className="flex items-center gap-2 text-safari-400 hover:text-safari-900 transition-colors font-bold text-xs uppercase tracking-widest"
          >
            <ArrowLeft size={16} /> Back to Hub
          </button>
          
          <div className="flex items-center gap-2">
            <Compass className="text-safari-600" size={28} />
            <span className="text-lg font-extrabold tracking-tight">Partner<span className="text-safari-500">Directory</span></span>
          </div>

          <div className="w-24" /> {/* Spacer */}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12 space-y-12">
        {/* Title & Search */}
        <div className="text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tighter">Verified Agency Partners</h1>
            <p className="text-safari-600 font-medium max-w-2xl mx-auto leading-relaxed text-lg">
              Discover the most trusted names in African safari curation. Our partners are vetted for expertise, reliability, and local conservation impact.
            </p>
          </div>

          <div className="relative max-w-xl mx-auto">
            <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-safari-400">
              <Search size={20} />
            </div>
            <input 
              type="text"
              placeholder="Search by agency name, location, or expertise..."
              className="w-full pl-14 pr-6 py-5 bg-white border border-safari-200 rounded-2xl shadow-xl shadow-safari-900/5 focus:border-safari-500 outline-none transition-all font-bold text-safari-900"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Results Info */}
        <div className="flex items-center justify-between border-b border-safari-100 pb-6 text-[10px] font-black uppercase tracking-[0.2em] text-safari-400">
          <span>{filteredCompanies.length} Active Partners</span>
          <span>Alphabetical Order</span>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="bg-white h-96 rounded-[2.5rem] border border-safari-100 animate-pulse" />
            ))}
          </div>
        ) : filteredCompanies.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredCompanies.map((company) => (
              <div 
                key={company.id}
                className="group bg-white rounded-[2.5rem] p-8 border border-safari-100 hover:shadow-2xl hover:shadow-safari-900/10 transition-all duration-300 relative flex flex-col justify-between overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-safari-50 rounded-bl-full pointer-events-none -mr-16 -mt-16 group-hover:bg-safari-100 transition-colors" />
                
                <div className="space-y-6 relative">
                  <div className="flex items-start justify-between">
                    <div className="w-16 h-16 bg-safari-50 rounded-2xl flex items-center justify-center text-safari-600 shadow-sm border border-safari-100 group-hover:scale-110 transition-transform">
                      {company.branding?.heroImage ? (
                        <div className="w-12 h-12 rounded-xl overflow-hidden">
                          <img src={company.branding.heroImage} className="w-full h-full object-cover" alt="" />
                        </div>
                      ) : (
                        <Building2 size={32} />
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-green-100">
                      <ShieldCheck size={12} strokeWidth={3} /> Verified
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold text-safari-900 tracking-tight leading-none">{company.name}</h3>
                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-safari-400">
                      <MapPin size={12} /> {company.branding?.contactAddress || 'Nairobi, Kenya'}
                    </div>
                  </div>

                  <p className="text-safari-600 text-sm font-medium line-clamp-3 leading-relaxed">
                    {company.branding?.agencyDescription || "A leading provider of bespoke safari experiences, dedicated to showcasing the rhythm of Africa through sustainable and local expertise."}
                  </p>

                  <div className="flex flex-wrap gap-2 pt-2">
                    {['Luxury', 'Local Experts', 'Eco-Conscious'].map(tag => (
                      <span key={tag} className="text-[9px] font-black uppercase text-safari-300 tracking-tighter border border-safari-100 px-2 py-0.5 rounded-md">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-8 mt-8 border-t border-safari-50 relative">
                  <button 
                    onClick={() => onViewProfile(company.id, company.branding || branding)}
                    className="w-full py-4 bg-safari-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-safari-800 transition-all flex items-center justify-center gap-3 active:scale-95 shadow-lg shadow-safari-900/10 group/btn"
                  >
                    View Company Profile <ArrowRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-24 text-center space-y-6">
            <div className="w-20 h-20 bg-safari-100 rounded-full flex items-center justify-center text-safari-300 mx-auto">
              <Search size={40} />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-safari-900">No Partners Found</h3>
              <p className="text-safari-500 font-medium italic">We couldn't find any partners matching "{searchQuery}"</p>
            </div>
            <button 
              onClick={() => setSearchQuery('')}
              className="px-8 py-3 bg-white border border-safari-200 text-safari-900 rounded-full font-bold text-xs uppercase tracking-widest hover:bg-safari-50"
            >
              Clear Search
            </button>
          </div>
        )}

        {/* Footer info */}
        <section className="bg-safari-900 rounded-[3rem] p-12 text-white overflow-hidden relative">
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-safari-800 rounded-tl-full -mr-32 -mb-32 opacity-30" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 rounded-full text-safari-400 font-bold text-[10px] uppercase tracking-widest border border-white/5">
                <Globe size={14} /> Partner With Us
              </div>
              <h2 className="text-4xl font-extrabold tracking-tighter leading-none">Are you a Safari Agency?</h2>
              <p className="text-safari-300 font-medium text-lg leading-relaxed">
                Join the network of the continent's most modern operators. Scale your operations with our AI-assisted logistic engine and provide expert branding to your clients.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <button className="bg-white text-safari-900 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-safari-100 transition-all flex items-center justify-center gap-2 shadow-xl">
                  Register Your Agency <ArrowRight size={16} />
                </button>
                <div className="flex items-center gap-4 px-6 text-safari-400 font-bold text-sm">
                  <Users size={20} /> Over 50+ Partners
                </div>
              </div>
            </div>
            <div className="hidden lg:grid grid-cols-2 gap-4">
               {[
                 { icon: <ShieldCheck className="text-green-400" />, label: 'Verified Listing' },
                 { icon: <Star className="text-amber-400" />, label: 'Reputation Scoring' },
                 { icon: <Building2 className="text-blue-400" />, label: 'Agent Dashboard' },
                 { icon: <Users className="text-purple-400" />, label: 'Lead CRM' }
               ].map((feat, idx) => (
                 <div key={idx} className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-3xl flex items-center gap-4">
                   <div className="p-3 bg-white/5 rounded-xl">{feat.icon}</div>
                   <span className="font-bold text-xs uppercase tracking-widest">{feat.label}</span>
                 </div>
               ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-12 border-t border-safari-100 text-center text-[10px] font-black uppercase tracking-[0.3em] text-safari-400">
        © {new Date().getFullYear()} SafariPlanner.ai Partner Ecosystem
      </footer>
    </div>
  );
};

export default PartnersPage;
