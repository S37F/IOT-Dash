import React from 'react';
import { BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { SolarData } from '../types';

interface AnalyticsChartsProps {
  data: SolarData[];
  timeframe: string;
}

const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({ data, timeframe }) => {

    const aggregateDataByHour = () => {
        if (!data || data.length === 0) return [];
        const aggregated: {[key: string]: {energy: number, efficiency: number, count: number}} = {};

        // Initialize all 24 hours
        for (let i = 0; i < 24; i++) {
            const key = i.toString().padStart(2, '0') + ':00';
            aggregated[key] = { energy: 0, efficiency: 0, count: 0 };
        }

        data.forEach(d => {
            const date = new Date(d.timestamp);
            const hour = date.getHours();
            const key = hour.toString().padStart(2, '0') + ':00';

            if (aggregated[key]) {
                aggregated[key].energy += d.energy;
                aggregated[key].efficiency += d.efficiency;
                aggregated[key].count += 1;
            }
        });

        return Object.keys(aggregated).map(key => ({
            name: key,
            'Avg Energy': aggregated[key].count > 0 ? parseFloat((aggregated[key].energy / aggregated[key].count).toFixed(1)) : 0,
            'Avg Efficiency': aggregated[key].count > 0 ? parseFloat((aggregated[key].efficiency / aggregated[key].count).toFixed(1)) : 0,
        }));
    };

    const chartData = aggregateDataByHour();
    const title = `${timeframe}'s Performance`;
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700 shadow-lg h-96">
        <h3 className="text-md font-semibold text-slate-300 mb-4">{title} - Energy Output (Avg kWh)</h3>
        <ResponsiveContainer width="100%" height="85%">
          <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} angle={-45} textAnchor="end" />
            <YAxis stroke="#9ca3af" fontSize={12} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #4b5563' }} 
              labelStyle={{ color: '#d1d5db' }}
            />
            <Legend wrapperStyle={{ color: '#d1d5db', bottom: -5 }} />
            <Bar dataKey="Avg Energy" fill="#facc15" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700 shadow-lg h-96">
        <h3 className="text-md font-semibold text-slate-300 mb-4">{title} - Solar Efficiency (Avg %)</h3>
        <ResponsiveContainer width="100%" height="85%">
            <AreaChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 20 }}>
                <defs>
                    <linearGradient id="colorEfficiency" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/>
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} angle={-45} textAnchor="end" />
                <YAxis stroke="#9ca3af" fontSize={12} domain={[75, 100]} />
                <Tooltip 
                    contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #4b5563' }} 
                    labelStyle={{ color: '#d1d5db' }}
                />
                <Legend wrapperStyle={{ color: '#d1d5db', bottom: -5 }} />
                <Area type="monotone" dataKey="Avg Efficiency" stroke="#22d3ee" fillOpacity={1} fill="url(#colorEfficiency)" />
            </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default AnalyticsCharts;
