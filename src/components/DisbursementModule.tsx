
import React, { useState, useMemo } from 'react';
import { 
  Wallet, ArrowLeft, Printer, Building, Truck, Ticket, Sparkles, Hash, Plus
} from 'lucide-react';
import { CostingLineItem, CostingItemType } from '../types';
import { generateSupplierVoucherPDF } from '../services/pdfService';

interface DisbursementModuleProps {
  itineraries: any[];
  branding: BrandingConfig;
  onBack: () => void;
}

const DisbursementModule: React.FC<DisbursementModuleProps> = ({ itineraries, branding = {} as BrandingConfig, onBack }) => {
  const [selectedItinerary, setSelectedItinerary] = useState<any | null>(null);

  const groupedItems = useMemo(() => {
    if (!selectedItinerary || !selectedItinerary.costing_report) return null;
    
    const items = selectedItinerary.costing_report.items as CostingLineItem[];
    const groups: Record<CostingItemType, { items: CostingLineItem[], subtotal: number }> = {
      'Accommodation': { items: [], subtotal: 0 },
      'Activity': { items: [], subtotal: 0 },
      'Transport': { items: [], subtotal: 0 },
      'Fee': { items: [], subtotal: 0 },
      'Extra': { items: [], subtotal: 0 }
    };

    items.forEach(item => {
      if (groups[item.type]) {
        groups[item.type].items.push(item);
        groups[item.type].subtotal += item.total;
      }
    });

    return groups;
  }, [selectedItinerary]);

  const grandTotal = useMemo(() => {
    if (!groupedItems) return 0;
    return Object.values(groupedItems).reduce((sum, group: any) => sum + group.subtotal, 0);
  }, [groupedItems]);

  const handlePrint = () => {
    if (!selectedItinerary || !groupedItems) return;
    
    const blob = generateSupplierVoucherPDF({
        id: `VCH-${Date.now()}`,
        itineraryId: selectedItinerary.id,
        amount: grandTotal,
        date: new Date().toISOString(),
        method: 'Disbursement Plan',
        reference: `Supplier Allocation: ${selectedItinerary.customer_name}`,
        customerName: 'Agency Accounts',
        tripTitle: selectedItinerary.trip_title
    }, groupedItems, branding);
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Supplier_Voucher_${selectedItinerary.id.slice(0,8)}.pdf`;
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
              <Wallet className="text-safari-500" /> Supplier Payment Manager
            </h1>
            <p className="text-xs text-safari-500 font-bold uppercase tracking-widest">Calculate allocations to external partners</p>
          </div>
        </div>
        {selectedItinerary && (
            <button onClick={handlePrint} className="px-6 py-2 bg-safari-800 text-white rounded-lg font-bold text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-safari-900 shadow-md transition-all">
                <Printer size={16} /> Export Voucher Plan
            </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Selector */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-xl shadow-lg border border-safari-100 p-8">
             <h3 className="text-[10px] font-black uppercase text-safari-400 mb-6 tracking-widest flex items-center gap-2"><Hash size={14} /> Select Confirmed Trip</h3>
             <div className="space-y-2">
                {itineraries.length === 0 ? (
                    <p className="text-xs text-safari-400 italic">No confirmed/costed itineraries found.</p>
                ) : itineraries.map(itin => (
                    <button 
                        key={itin.id}
                        onClick={() => setSelectedItinerary(itin)}
                        className={`w-full text-left p-4 rounded-lg border transition-all ${selectedItinerary?.id === itin.id ? 'border-safari-600 bg-safari-50 ring-1 ring-safari-600' : 'border-safari-100 hover:border-safari-300'}`}
                    >
                        <p className="text-sm font-black text-safari-900 truncate">{itin.customer_name}</p>
                        <p className="text-[10px] text-safari-500 truncate">{itin.trip_title}</p>
                        <div className="mt-2 flex justify-between items-center">
                            <span className="text-[9px] font-bold text-safari-400">{new Date(itin.updated_at).toLocaleDateString()}</span>
                            <span className="text-[10px] font-black text-safari-700">${Math.round(itin.costing_report?.total || 0).toLocaleString()}</span>
                        </div>
                    </button>
                ))}
             </div>
          </div>
        </div>

        {/* Detailed Breakdown */}
        <div className="lg:col-span-2">
            {!selectedItinerary ? (
                <div className="bg-white rounded-xl border-2 border-dashed border-safari-100 p-20 text-center text-safari-300">
                    <Wallet size={48} className="mx-auto mb-4 opacity-10" />
                    <p className="font-bold">Select an itinerary to view disbursement breakdown</p>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-safari-100 overflow-hidden animate-fadeIn">
                    <div className="bg-safari-900 p-8 text-white">
                        <h2 className="text-2xl font-black">{selectedItinerary.customer_name}</h2>
                        <p className="text-safari-300 text-xs font-bold uppercase tracking-widest mt-1">{selectedItinerary.trip_title}</p>
                    </div>

                    <div className="p-8 space-y-8">
                        {groupedItems && Object.entries(groupedItems).map(([type, group]: [string, any]) => group.items.length > 0 && (
                            <section key={type} className="animate-fadeIn">
                                <div className="flex justify-between items-end border-b border-safari-100 pb-2 mb-4">
                                    <h3 className="text-sm font-black uppercase text-safari-800 flex items-center gap-2">
                                        {type === 'Accommodation' && <Building size={16} className="text-blue-500" />}
                                        {type === 'Transport' && <Truck size={16} className="text-orange-500" />}
                                        {type === 'Activity' && <Sparkles size={16} className="text-green-500" />}
                                        {type === 'Fee' && <Ticket size={16} className="text-red-500" />}
                                        {type === 'Extra' && <Plus size={16} className="text-gray-500" />}
                                        {type} Payments
                                    </h3>
                                    <span className="text-[10px] font-black text-safari-400">CATEGORY SUBTOTAL</span>
                                </div>
                                <div className="space-y-3">
                                    {group.items.map((item: any) => (
                                        <div key={item.id} className="flex justify-between items-center text-sm py-1">
                                            <div className="flex-1">
                                                <p className="font-bold text-safari-900">{item.description}</p>
                                                <p className="text-[10px] text-safari-400">Qty: {item.quantity} x ${item.unitPrice.toLocaleString()}</p>
                                            </div>
                                            <span className="font-black text-safari-700">${item.total.toLocaleString()}</span>
                                        </div>
                                    ))}
                                    <div className="pt-3 border-t border-dotted border-safari-100 flex justify-end">
                                        <div className="text-right">
                                            <p className="text-[10px] font-black text-safari-400 uppercase">Subtotal {type}</p>
                                            <p className="text-lg font-black text-safari-900">${group.subtotal.toLocaleString()}</p>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        ))}

                        <div className="pt-8 border-t-4 border-safari-900 flex justify-between items-start">
                            <div className="space-y-1">
                                <h4 className="text-xl font-black text-safari-900">Total Net Disbursement</h4>
                                <p className="text-xs text-safari-500 italic max-w-sm">This reflects the base cost to be paid to external clients (suppliers) before internal markups.</p>
                            </div>
                            <div className="text-right">
                                <span className="text-[10px] font-black text-safari-400 uppercase tracking-widest">GRAND TOTAL (NET)</span>
                                <p className="text-4xl font-black text-safari-900">${grandTotal.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default DisbursementModule;
