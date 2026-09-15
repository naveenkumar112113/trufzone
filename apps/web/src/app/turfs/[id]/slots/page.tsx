'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { generateSlots } from '@/services/api';
import { use } from 'react';
import { cn } from '@/lib/utils';

export default function GenerateSlotsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id: turfId } = use(params);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    startTime: '06:00',
    endTime: '22:00',
    intervalMinutes: '60',
    price: '1000',
    pricingType: 'WEEKDAY'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const payload = {
        turfId,
        date: formData.date,
        startTime: formData.startTime,
        endTime: formData.endTime,
        intervalMinutes: parseInt(formData.intervalMinutes),
        price: parseInt(formData.price),
        pricingType: formData.pricingType
      };
      
      const res = await generateSlots(payload);
      if (res.data.success) {
        alert((res.data as any).message || 'Slots generated successfully!');
        router.push('/');
      }
    } catch (err: any) {
       setError(err.response?.data?.message || 'Failed to generate slots');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">Generate Slots</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">Batch create time slots for your turf.</p>
      </div>

      <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-sm border border-zinc-200 dark:border-white/10 overflow-hidden">
        <div className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-700 px-6 py-4">
           <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Slot Configuration</h2>
        </div>
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && <p className="text-red-500 text-sm">{error}</p>}
            
            <div className="space-y-1">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Date</label>
              <input 
                type="date"
                className="w-full px-4 py-2 bg-transparent border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm outline-none focus:border-indigo-500"
                value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Start Time</label>
                <input 
                  type="time"
                  className="w-full px-4 py-2 bg-transparent border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm outline-none focus:border-indigo-500"
                  value={formData.startTime}
                  onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">End Time</label>
                <input 
                  type="time"
                  className="w-full px-4 py-2 bg-transparent border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm outline-none focus:border-indigo-500"
                  value={formData.endTime}
                  onChange={(e) => setFormData({...formData, endTime: e.target.value})}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Slot Duration (Minutes)</label>
                <input 
                  type="number"
                  className="w-full px-4 py-2 bg-transparent border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm outline-none focus:border-indigo-500"
                  value={formData.intervalMinutes}
                  onChange={(e) => setFormData({...formData, intervalMinutes: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Price (₹)</label>
                <input 
                  type="number"
                  className="w-full px-4 py-2 bg-transparent border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm outline-none focus:border-indigo-500"
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: e.target.value})}
                  required
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Pricing Type</label>
              <select 
                className="w-full px-4 py-2 bg-transparent border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm outline-none focus:border-indigo-500"
                value={formData.pricingType}
                onChange={(e) => setFormData({...formData, pricingType: e.target.value})}
              >
                <option value="WEEKDAY">Weekday</option>
                <option value="WEEKEND">Weekend</option>
                <option value="PEAK">Peak</option>
              </select>
            </div>

            <button type="submit" disabled={loading} className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg disabled:opacity-50">
              {loading ? 'Generating...' : 'Generate Slots'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
