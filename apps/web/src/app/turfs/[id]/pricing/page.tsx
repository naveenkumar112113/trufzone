'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  IndianRupee, Clock, Plus, Trash2, Save, Calendar, 
  ArrowLeft, CheckCircle2, Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';

type TimeBlock = {
  id: string;
  startTime: string;
  endTime: string;
  price: string;
};

type PricingCategory = 'WEEKDAY' | 'WEEKEND' | 'PEAK';

export default function VisualPricingEngine() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<PricingCategory>('WEEKDAY');
  const [loading, setLoading] = useState(false);
  
  // State for different pricing categories
  const [pricing, setPricing] = useState<Record<PricingCategory, TimeBlock[]>>({
    WEEKDAY: [
      { id: '1', startTime: '06:00', endTime: '16:00', price: '800' },
      { id: '2', startTime: '16:00', endTime: '22:00', price: '1200' },
    ],
    WEEKEND: [
      { id: '3', startTime: '06:00', endTime: '23:00', price: '1500' }
    ],
    PEAK: []
  });

  const addBlock = () => {
    const newBlock: TimeBlock = {
      id: Math.random().toString(36).substr(2, 9),
      startTime: '12:00',
      endTime: '13:00',
      price: '1000'
    };
    setPricing(prev => ({
      ...prev,
      [activeTab]: [...prev[activeTab], newBlock]
    }));
  };

  const removeBlock = (id: string) => {
    setPricing(prev => ({
      ...prev,
      [activeTab]: prev[activeTab].filter(b => b.id !== id)
    }));
  };

  const updateBlock = (id: string, field: keyof TimeBlock, value: string) => {
    setPricing(prev => ({
      ...prev,
      [activeTab]: prev[activeTab].map(b => b.id === id ? { ...b, [field]: value } : b)
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      alert('Pricing Engine Rules saved successfully!');
    }, 1000);
  };

  const TABS: { id: PricingCategory, label: string, icon: any, desc: string }[] = [
    { id: 'WEEKDAY', label: 'Weekdays', icon: Calendar, desc: 'Monday to Friday base rates.' },
    { id: 'WEEKEND', label: 'Weekends', icon: Calendar, desc: 'Saturday and Sunday rates.' },
    { id: 'PEAK', label: 'Peak / Holidays', icon: Zap, desc: 'Overrides for national holidays or tournaments.' }
  ];

  return (
    <div className="max-w-5xl mx-auto pb-12">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <button onClick={() => router.back()} className="text-sm font-bold text-muted-foreground flex items-center hover:text-foreground mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Turf
          </button>
          <h1 className="text-3xl font-bold text-foreground">Visual Pricing Engine</h1>
          <p className="mt-2 text-sm text-muted-foreground">Construct dynamic pricing blocks based on time and day.</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={loading}
          className="flex items-center px-6 py-3 bg-success text-success-foreground font-bold rounded-xl hover:bg-success/90 transition-colors shadow-sm disabled:opacity-50"
        >
          {loading ? 'Saving...' : <><Save className="w-4 h-4 mr-2" /> Save Rules</>}
        </button>
      </div>

      {/* Main Interface */}
      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Left: Category Tabs */}
        <div className="w-full lg:w-64 shrink-0 flex flex-col gap-2">
          {TABS.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "p-4 rounded-2xl text-left border transition-all duration-300 relative overflow-hidden group",
                  isActive 
                    ? "bg-primary text-primary-foreground border-primary shadow-md" 
                    : "bg-card border-border hover:bg-muted text-foreground"
                )}
              >
                {isActive && <div className="absolute inset-0 bg-white/10" />}
                <div className="flex items-center gap-3 mb-2 relative z-10">
                  <tab.icon className={cn("w-5 h-5", isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-primary")} />
                  <span className="font-bold">{tab.label}</span>
                </div>
                <p className={cn("text-xs relative z-10", isActive ? "text-primary-foreground/80" : "text-muted-foreground")}>
                  {tab.desc}
                </p>
                {pricing[tab.id].length > 0 && (
                  <Badge variant={isActive ? 'default' : 'primary'} className={cn("absolute top-4 right-4 text-[10px]", isActive && "bg-white/20 text-white")}>
                    {pricing[tab.id].length} blocks
                  </Badge>
                )}
              </button>
            );
          })}
        </div>

        {/* Right: Block Editor */}
        <div className="flex-1 bg-card border border-border rounded-3xl p-6 md:p-8 shadow-sm">
          
          <div className="flex items-center justify-between mb-8 pb-6 border-b border-border">
             <div>
               <h2 className="text-xl font-bold text-foreground flex items-center">
                 {TABS.find(t => t.id === activeTab)?.label} Pricing
               </h2>
               <p className="text-sm text-muted-foreground mt-1">Define hourly rates for this category.</p>
             </div>
             <button 
               onClick={addBlock}
               className="flex items-center px-4 py-2 bg-primary/10 text-primary font-bold rounded-lg hover:bg-primary hover:text-primary-foreground transition-colors"
             >
               <Plus className="w-4 h-4 mr-2" /> Add Time Block
             </button>
          </div>

          <div className="space-y-4">
            {pricing[activeTab].length === 0 ? (
              <div className="p-12 text-center border-2 border-dashed border-border rounded-2xl">
                 <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                   <Clock className="w-8 h-8 text-muted-foreground" />
                 </div>
                 <h3 className="font-bold text-foreground">No Pricing Blocks</h3>
                 <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto mb-6">
                   You haven't defined any specific pricing blocks for this category. The base rate will apply.
                 </p>
                 <button onClick={addBlock} className="px-6 py-2 bg-foreground text-background font-bold rounded-lg text-sm">
                   Create First Block
                 </button>
              </div>
            ) : (
              pricing[activeTab].map((block, idx) => (
                <div key={block.id} className="group relative flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl bg-muted/30 border border-border hover:border-primary/50 transition-colors">
                  
                  {/* Visual Timeline Connector */}
                  <div className="hidden sm:flex absolute -left-4 w-4 border-t-2 border-border" />
                  
                  <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Start Time</label>
                      <input 
                        type="time" 
                        value={block.startTime}
                        onChange={e => updateBlock(block.id, 'startTime', e.target.value)}
                        className="w-full px-4 py-2.5 bg-card border border-border rounded-xl text-foreground font-bold focus:border-primary outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">End Time</label>
                      <input 
                        type="time" 
                        value={block.endTime}
                        onChange={e => updateBlock(block.id, 'endTime', e.target.value)}
                        className="w-full px-4 py-2.5 bg-card border border-border rounded-xl text-foreground font-bold focus:border-primary outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="flex items-end gap-3 w-full sm:w-auto mt-4 sm:mt-0">
                    <div className="flex-1 sm:w-48 space-y-1">
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Hourly Rate</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-muted-foreground">₹</span>
                        <input 
                          type="number" 
                          value={block.price}
                          onChange={e => updateBlock(block.id, 'price', e.target.value)}
                          className="w-full pl-8 pr-4 py-2.5 bg-success/10 border border-success/30 rounded-xl text-success font-bold text-lg focus:border-success outline-none transition-all"
                        />
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => removeBlock(block.id)}
                      className="p-3 bg-danger/10 text-danger rounded-xl hover:bg-danger hover:text-white transition-colors shrink-0"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
          
          {pricing[activeTab].length > 0 && (
            <div className="mt-8 p-4 bg-muted/50 rounded-xl flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">Pro Tip:</strong> Any unmapped hours will automatically fall back to your Turf's global base rate. Ensure your blocks don't overlap.
              </p>
            </div>
          )}
          
        </div>
      </div>
    </div>
  );
}
