import React, { useState, useMemo } from 'react';
import type { SolarData } from '../types';
import AnalyticsCharts from '../components/AnalyticsCharts';

interface AnalyticsViewProps {
  data: SolarData[];
}

type Timeframe = 'Weekly' | 'Monthly' | 'Yearly';

const AnalyticsView: React.FC<AnalyticsViewProps> = ({ data }) => {
  const [timeframe, setTimeframe] = useState<Timeframe>('Weekly');

  const filteredData = useMemo(() => {
    if (!data) return [];
    const now = new Date();
    if (timeframe === 'Weekly') {
      const oneWeekAgo = new Date(now.setDate(now.getDate() - 7));
      return data.filter(d => new Date(d.timestamp) > oneWeekAgo);
    }
    if (timeframe === 'Monthly') {
      const oneMonthAgo = new Date(now.setMonth(now.getMonth() - 1));
      return data.filter(d => new Date(d.timestamp) > oneMonthAgo);
    }
    // Yearly - use all data
    return data;
  }, [data, timeframe]);
  
  const timeframes: Timeframe[] = ['Weekly', 'Monthly', 'Yearly'];

  return (
    <div>
        <div className="mb-6 bg-slate-900/50 p-2 rounded-lg border border-slate-700 max-w-sm">
            <div className="flex items-center justify-center space-x-2">
            {timeframes.map(t => (
                <button
                key={t}
                onClick={() => setTimeframe(t)}
                className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors duration-200 w-full ${
                    timeframe === t
                    ? 'bg-cyan-500 text-white shadow-md'
                    : 'text-slate-300 hover:bg-slate-700'
                }`}
                >
                {t}
                </button>
            ))}
            </div>
        </div>

        <AnalyticsCharts data={filteredData} timeframe={timeframe} />
    </div>
  );
};

export default AnalyticsView;
