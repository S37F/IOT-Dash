import React, { useState, useMemo } from 'react';
import type { SolarData } from '../types';
import AnalyticsCharts from '../components/AnalyticsCharts';

interface AnalyticsViewProps {
  data: SolarData[];
}

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const AnalyticsView: React.FC<AnalyticsViewProps> = ({ data }) => {
  const todayIndex = useMemo(() => new Date().getDay(), []);
  const [selectedDay, setSelectedDay] = useState<string>(dayNames[todayIndex]);

  const availableDays = useMemo(() => dayNames.slice(0, todayIndex + 1), [todayIndex]);

  const filteredData = useMemo(() => {
    if (!data) return [];
    
    const dayIndex = dayNames.indexOf(selectedDay);
    if (dayIndex === -1) return [];

    const now = new Date();
    // This logic correctly finds the date for the selected day in the current week
    const targetDate = new Date(now);
    targetDate.setDate(now.getDate() - (todayIndex - dayIndex));

    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    return data.filter(d => {
        const recordDate = new Date(d.timestamp);
        return recordDate >= startOfDay && recordDate <= endOfDay;
    });

  }, [data, selectedDay, todayIndex]);
  
  return (
    <div>
        <h2 className="text-2xl font-bold text-slate-200 mb-4">Weekly Performance</h2>
        <div className="mb-6 bg-slate-900/50 p-2 rounded-lg border border-slate-700 max-w-full lg:max-w-xl">
            <div className="flex items-center justify-center flex-wrap gap-2">
            {availableDays.map(day => (
                <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors duration-200 flex-grow text-center ${
                    selectedDay === day
                    ? 'bg-cyan-500 text-white shadow-md'
                    : 'text-slate-300 hover:bg-slate-700'
                }`}
                >
                {day}
                </button>
            ))}
            </div>
        </div>

        {filteredData.length > 0 ? (
            <AnalyticsCharts data={filteredData} timeframe={selectedDay} />
        ) : (
            <div className="text-center py-10 bg-slate-900/50 rounded-lg border border-slate-700">
                <p className="text-slate-400">No data available for {selectedDay}.</p>
            </div>
        )}
    </div>
  );
};

export default AnalyticsView;
