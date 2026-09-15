'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createTurf } from '@/services/api';
import { 
  CheckCircle2, MapPin, Info, Image as ImageIcon, IndianRupee, Clock,
  Trophy, Car, Wifi, Shield, ArrowRight, ArrowLeft, Building
} from 'lucide-react';
import { cn } from '@/lib/utils';

const STEPS = [
  { id: 'basic', label: 'Basic Info', icon: Info },
  { id: 'facilities', label: 'Sports & Amenities', icon: Trophy },
  { id: 'media', label: 'Photos', icon: ImageIcon },
  { id: 'pricing', label: 'Pricing & Hours', icon: IndianRupee }
];

const SPORTS_OPTIONS = [
  { id: 'football', label: 'Football', icon: Trophy },
  { id: 'cricket', label: 'Cricket', icon: Trophy },
  { id: 'tennis', label: 'Tennis', icon: Trophy },
  { id: 'badminton', label: 'Badminton', icon: Trophy },
  { id: 'basketball', label: 'Basketball', icon: Trophy }
];

const FACILITY_OPTIONS = [
  { id: 'parking', label: 'Parking', icon: Car },
  { id: 'washroom', label: 'Washroom', icon: Building },
  { id: 'wifi', label: 'Wi-Fi', icon: Wifi },
  { id: 'security', label: '24/7 Security', icon: Shield },
];

export default function CreateTurfWizard() {
  const router = useRouter();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    locationDetails: '',
    city: 'Tirunelveli',
    lat: '8.7139',
    lng: '77.7567',
    contactNumber: '',
    sports: [] as string[],
    facilities: [] as string[],
    images: [] as string[],
    basePrice: '1000',
    openingTime: '06:00',
    closingTime: '22:00'
  });

  const currentStep = STEPS[currentStepIndex];
  const isLastStep = currentStepIndex === STEPS.length - 1;

  const toggleArrayItem = (field: 'sports' | 'facilities', value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(value) 
        ? prev[field].filter(item => item !== value)
        : [...prev[field], value]
    }));
  };

  const handleNext = () => {
    if (isLastStep) {
      handleSubmit();
    } else {
      setCurrentStepIndex(prev => prev + 1);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    
    try {
      const payload = {
        name: formData.name,
        locationDetails: formData.locationDetails,
        city: formData.city,
        location: {
          type: 'Point' as 'Point',
          coordinates: [parseFloat(formData.lng), parseFloat(formData.lat)] as [number, number]
        },
        contactNumber: formData.contactNumber,
        sports: formData.sports.length > 0 ? formData.sports : ['Football'],
        facilities: formData.facilities,
        images: formData.images.length > 0 ? formData.images : ['https://images.unsplash.com/photo-1575361204480-aadea25e6e68?q=80&w=1000&auto=format&fit=crop']
      };
      
      const res = await createTurf(payload);
      if (res.data.success) {
        // Successfully created! Navigate to slots generator for the new turf
        router.push(`/turfs/${res.data.data._id}/slots`);
      }
    } catch (err: any) {
       setError(err.response?.data?.message || 'Failed to create turf');
       setCurrentStepIndex(0); // Go back to first step to show error if needed
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-12">
      
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Onboard New Facility</h1>
        <p className="mt-2 text-sm text-muted-foreground">Complete the profile to start accepting bookings.</p>
      </div>

      {/* Stepper Progress */}
      <div className="flex items-center mb-8 overflow-x-auto no-scrollbar pb-4">
        {STEPS.map((step, idx) => {
          const isActive = idx === currentStepIndex;
          const isCompleted = idx < currentStepIndex;
          return (
            <div key={step.id} className="flex items-center shrink-0">
              <div className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-colors",
                isActive ? "bg-primary text-primary-foreground shadow-sm" 
                : isCompleted ? "bg-success/10 text-success" 
                : "bg-muted text-muted-foreground"
              )}>
                {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : <step.icon className="w-4 h-4" />}
                {step.label}
              </div>
              {idx < STEPS.length - 1 && (
                <div className={cn(
                  "w-12 h-0.5 mx-2",
                  isCompleted ? "bg-success" : "bg-border"
                )} />
              )}
            </div>
          );
        })}
      </div>

      {/* Main Card */}
      <div className="bg-card border border-border rounded-3xl shadow-xl overflow-hidden min-h-[400px] flex flex-col">
        <div className="p-8 flex-1">
          {error && (
            <div className="mb-6 p-4 bg-danger/10 border border-danger/20 rounded-xl text-danger text-sm font-bold flex items-center">
              <Info className="w-5 h-5 mr-2" />
              {error}
            </div>
          )}

          {/* STEP 1: Basic Info */}
          {currentStep.id === 'basic' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="space-y-1">
                <label className="text-sm font-bold text-foreground">Facility Name *</label>
                <input 
                  className="w-full px-4 py-3 bg-muted/50 border border-border rounded-xl text-foreground focus:border-primary focus:bg-transparent outline-none transition-all"
                  placeholder="e.g. Downtown Sports Arena" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
              
              <div className="space-y-1">
                <label className="text-sm font-bold text-foreground">Street Address *</label>
                <input 
                  className="w-full px-4 py-3 bg-muted/50 border border-border rounded-xl text-foreground focus:border-primary focus:bg-transparent outline-none transition-all"
                  placeholder="123 Main Street, Area" 
                  value={formData.locationDetails}
                  onChange={(e) => setFormData({...formData, locationDetails: e.target.value})}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-sm font-bold text-foreground">City</label>
                  <input 
                    className="w-full px-4 py-3 bg-muted/50 border border-border rounded-xl text-foreground focus:border-primary focus:bg-transparent outline-none transition-all"
                    value={formData.city}
                    onChange={(e) => setFormData({...formData, city: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-bold text-foreground">Contact Phone</label>
                  <input 
                    className="w-full px-4 py-3 bg-muted/50 border border-border rounded-xl text-foreground focus:border-primary focus:bg-transparent outline-none transition-all"
                    value={formData.contactNumber}
                    placeholder="+91"
                    onChange={(e) => setFormData({...formData, contactNumber: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl">
                 <h4 className="text-sm font-bold text-foreground mb-3 flex items-center">
                   <MapPin className="w-4 h-4 mr-2 text-primary" /> Map Coordinates (For Player App Search)
                 </h4>
                 <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground">Latitude</label>
                    <input 
                      type="number"
                      step="any"
                      className="w-full px-3 py-2 bg-card border border-border rounded-lg text-sm outline-none focus:border-primary"
                      value={formData.lat}
                      onChange={(e) => setFormData({...formData, lat: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground">Longitude</label>
                    <input 
                      type="number"
                      step="any"
                      className="w-full px-3 py-2 bg-card border border-border rounded-lg text-sm outline-none focus:border-primary"
                      value={formData.lng}
                      onChange={(e) => setFormData({...formData, lng: e.target.value})}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Facilities */}
          {currentStep.id === 'facilities' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              <div>
                <h3 className="text-lg font-bold text-foreground mb-4">Supported Sports</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                  {SPORTS_OPTIONS.map(sport => {
                    const isSelected = formData.sports.includes(sport.label);
                    return (
                      <div 
                        key={sport.id}
                        onClick={() => toggleArrayItem('sports', sport.label)}
                        className={cn(
                          "cursor-pointer border rounded-xl p-4 flex flex-col items-center justify-center gap-2 transition-all text-center",
                          isSelected ? "bg-primary/10 border-primary text-primary shadow-sm" : "bg-card border-border text-muted-foreground hover:bg-muted"
                        )}
                      >
                        <sport.icon className="w-6 h-6" />
                        <span className="text-sm font-bold">{sport.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-foreground mb-4">Available Amenities</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {FACILITY_OPTIONS.map(fac => {
                    const isSelected = formData.facilities.includes(fac.label);
                    return (
                      <div 
                        key={fac.id}
                        onClick={() => toggleArrayItem('facilities', fac.label)}
                        className={cn(
                          "cursor-pointer border rounded-xl p-4 flex items-center gap-3 transition-all",
                          isSelected ? "bg-primary/10 border-primary text-primary shadow-sm" : "bg-card border-border text-muted-foreground hover:bg-muted"
                        )}
                      >
                        <fac.icon className="w-5 h-5 shrink-0" />
                        <span className="text-sm font-bold">{fac.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Media */}
          {currentStep.id === 'media' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
               <div className="border-2 border-dashed border-border rounded-2xl p-12 flex flex-col items-center justify-center text-center hover:bg-muted/50 transition-colors cursor-pointer group">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <ImageIcon className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-1">Upload Turf Photos</h3>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    Drag and drop high-quality images of your ground, or click to browse. Max 5MB per image.
                  </p>
                  <button className="mt-6 px-6 py-2 bg-card border border-border rounded-lg text-sm font-bold shadow-sm group-hover:border-primary transition-colors">
                    Browse Files
                  </button>
               </div>
               <p className="text-xs text-center text-muted-foreground">
                 * For MVP, a gorgeous stock image will be automatically assigned if you skip this step.
               </p>
            </div>
          )}

          {/* STEP 4: Pricing & Hours */}
          {currentStep.id === 'pricing' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
               <div className="p-6 bg-primary/5 border border-primary/20 rounded-2xl flex gap-4 items-start">
                  <div className="mt-1"><Info className="w-5 h-5 text-primary" /></div>
                  <div>
                    <h4 className="font-bold text-foreground mb-1">Visual Pricing Engine (Preview)</h4>
                    <p className="text-sm text-muted-foreground">
                      Define your global base rate and operating hours here. You will be able to set granular peak/weekend overrides in the Pricing Engine later.
                    </p>
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-1">
                   <label className="text-sm font-bold text-foreground flex items-center"><IndianRupee className="w-4 h-4 mr-1"/> Base Hourly Rate</label>
                   <div className="relative">
                     <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-muted-foreground">₹</span>
                     <input 
                       type="number"
                       className="w-full pl-8 pr-4 py-3 bg-muted/50 border border-border rounded-xl text-foreground font-bold focus:border-primary focus:bg-transparent outline-none transition-all text-lg"
                       value={formData.basePrice}
                       onChange={(e) => setFormData({...formData, basePrice: e.target.value})}
                     />
                   </div>
                 </div>
               </div>

               <div className="border-t border-border pt-6">
                 <h4 className="text-sm font-bold text-foreground mb-4 flex items-center"><Clock className="w-4 h-4 mr-1"/> Operating Hours</h4>
                 <div className="flex items-center gap-4">
                    <div className="flex-1 space-y-1">
                      <label className="text-xs font-bold text-muted-foreground">Opens At</label>
                      <input 
                        type="time"
                        className="w-full px-4 py-3 bg-muted/50 border border-border rounded-xl text-foreground focus:border-primary focus:bg-transparent outline-none transition-all"
                        value={formData.openingTime}
                        onChange={(e) => setFormData({...formData, openingTime: e.target.value})}
                      />
                    </div>
                    <div className="mt-5 text-muted-foreground font-bold">to</div>
                    <div className="flex-1 space-y-1">
                      <label className="text-xs font-bold text-muted-foreground">Closes At</label>
                      <input 
                        type="time"
                        className="w-full px-4 py-3 bg-muted/50 border border-border rounded-xl text-foreground focus:border-primary focus:bg-transparent outline-none transition-all"
                        value={formData.closingTime}
                        onChange={(e) => setFormData({...formData, closingTime: e.target.value})}
                      />
                    </div>
                 </div>
               </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-border bg-muted/10 flex items-center justify-between">
          <button 
            onClick={() => setCurrentStepIndex(prev => Math.max(0, prev - 1))}
            className={cn(
              "px-6 py-2.5 rounded-xl font-bold transition-all flex items-center",
              currentStepIndex === 0 ? "opacity-0 pointer-events-none" : "bg-card border border-border text-foreground hover:bg-muted"
            )}
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </button>
          
          <button 
            onClick={handleNext}
            disabled={loading || (currentStepIndex === 0 && (!formData.name || !formData.locationDetails))}
            className="px-8 py-2.5 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary-hover shadow-sm transition-all flex items-center disabled:opacity-50"
          >
            {loading ? 'Processing...' : isLastStep ? 'Launch Facility 🚀' : 'Continue'}
            {!isLastStep && !loading && <ArrowRight className="w-4 h-4 ml-2" />}
          </button>
        </div>
      </div>
      
    </div>
  );
}
