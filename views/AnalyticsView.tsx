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
        <h2 className="text-2xl font-bold text-slate-200 mb-2">Historical Analytics</h2>
        <p className="text-sm text-slate-400 mb-4">Real data from your ESP32 device, updated every minute and stored for 7 days</p>
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
            <>
              <div className="mb-4 bg-slate-900/50 p-3 rounded-lg border border-slate-700">
                <p className="text-sm text-slate-300">
                  📊 Showing <span className="font-bold text-cyan-400">{filteredData.length} data points</span> for {selectedDay}
                </p>
              </div>
              <AnalyticsCharts data={filteredData} timeframe={selectedDay} />
            </>
        ) : (
            <div className="text-center py-10 bg-slate-900/50 rounded-lg border border-slate-700">
                <div className="max-w-md mx-auto">
                  <svg className="w-16 h-16 text-slate-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <p className="text-slate-400 font-semibold mb-2">No data available for {selectedDay}</p>
                  <p className="text-sm text-slate-500">
                    Data is collected from your ESP32 device every 2 seconds and saved to history every minute.
                    Start your device to begin collecting analytics data.
                  </p>
                </div>
            </div>
        )}
    </div>
  );
};

export default AnalyticsView;
