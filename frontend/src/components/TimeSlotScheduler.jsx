import React from 'react';
import { Clock, Sun, Sunrise, Sunset } from 'lucide-react';

const TimeSlotScheduler = ({ slots = [], selectedSlot = null, onSelectSlot, loading = false }) => {
  // Group slots by period
  const groupedSlots = {
    morning: [],
    afternoon: [],
    evening: [],
  };

  slots.forEach((slot) => {
    const hour = new Date(slot.start_time).getHours();
    if (hour < 12) {
      groupedSlots.morning.push(slot);
    } else if (hour < 17) {
      groupedSlots.afternoon.push(slot);
    } else {
      groupedSlots.evening.push(slot);
    }
  });

  const formatTime = (timeStr) => {
    const date = new Date(timeStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const renderSlotSection = (title, items, icon) => {
    if (items.length === 0) return null;

    return (
      <div className="mb-6 last:mb-0">
        <h4 className="flex items-center gap-2 text-sm font-semibold text-slate-500 dark:text-slate-400 mb-3 capitalize">
          {icon}
          {title} ({items.length})
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {items.map((slot) => {
            const isSelected = selectedSlot?.availability_id === slot.availability_id;
            const isAvailable = !slot.status || slot.status.toLowerCase() === 'available';
            
            return (
              <button
                key={slot.availability_id}
                type="button"
                disabled={!isAvailable}
                onClick={() => onSelectSlot && onSelectSlot(slot)}
                className={`
                  flex flex-col items-center justify-center p-3 rounded-xl border text-sm font-medium transition-all duration-200
                  ${isAvailable 
                    ? isSelected
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-100 dark:shadow-none translate-y-[-2px]'
                      : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-indigo-400 text-slate-700 cursor-pointer hover:translate-y-[-1px]'
                    : 'bg-slate-100 border-slate-100 text-slate-400 cursor-not-allowed opacity-60'
                  }
                `}
              >
                <span className="font-semibold">{formatTime(slot.start_time)}</span>
                <span className="text-xs mt-1 opacity-80">
                  {formatTime(slot.end_time)}
                </span>
                {slot.interviewer_name && (
                  <span className={`text-xs mt-1 truncate max-w-full font-medium ${isSelected ? 'text-indigo-100' : 'text-slate-500'}`}>
                    {slot.interviewer_name}
                  </span>
                )}
                <span className={`text-[10px] mt-1.5 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider
                  ${isAvailable 
                    ? isSelected 
                      ? 'bg-indigo-500 text-white' 
                      : 'bg-emerald-50 text-emerald-700' 
                    : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  {slot.status}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 bg-slate-50/50 rounded-2xl border border-slate-100">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-3"></div>
        <p className="text-slate-500 text-sm font-medium animate-pulse">Loading available time slots...</p>
      </div>
    );
  }

  const hasSlots = slots.length > 0;

  if (!hasSlots) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 bg-slate-50/50 rounded-2xl border border-slate-100 text-center">
        <div className="p-3 bg-slate-100 rounded-full text-slate-400 mb-3">
          <Clock size={24} />
        </div>
        <h3 className="font-semibold text-slate-800 text-base mb-1">No Time Slots Available</h3>
        <p className="text-slate-500 text-sm max-w-xs">
          There are no scheduled slots for the selected selection.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-slate-50/30 dark:bg-slate-900/10 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
      {renderSlotSection('Morning Slots', groupedSlots.morning, <Sunrise size={16} className="text-amber-500" />)}
      {renderSlotSection('Afternoon Slots', groupedSlots.afternoon, <Sun size={16} className="text-orange-500" />)}
      {renderSlotSection('Evening Slots', groupedSlots.evening, <Sunset size={16} className="text-indigo-500" />)}
    </div>
  );
};

export default TimeSlotScheduler;
