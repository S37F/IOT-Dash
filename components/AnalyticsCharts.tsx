
import React from 'react';
import { BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { SolarData } from '../types';

interface AnalyticsChartsProps {
  data: SolarData[];
  timeframe: 'Weekly' | 'Monthly' | 'Yearly';
}

const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({ data, timeframe }) => {

    const aggregateData = () => {
        if (!data || data.length === 0) return [];
        const aggregated: {[key: string]: {energy: number, efficiency: number, count: number}} = {};

        data.forEach(d => {
            const date = new Date(d.timestamp);
            let key: string;

            if (timeframe === 'Weekly') {
                const day = date.getDay();
                const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                key = dayNames[day];
            } else if (timeframe === 'Monthly') {
                 key = `W${Math.ceil(date.getDate() / 7)}`;
            } else { // Yearly
                const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                key = monthNames[date.getMonth()];
            }

            if (!aggregated[key]) {
                aggregated[key] = { energy: 0, efficiency: 0, count: 0 };
            }
            aggregated[key].energy += d.energy;
            aggregated[key].efficiency += d.efficiency;
            aggregated[key].count += 1;
        });

        return Object.keys(aggregated).map(key => ({
            name: key,
            'Total Energy': parseFloat(aggregated[key].energy.toFixed(1)),
            'Avg Efficiency': parseFloat((aggregated[key].efficiency / aggregated[key].count).toFixed(1)),
        }));
    };

    const chartData = aggregateData();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700 shadow-lg h-96">
        <h3 className="text-md font-semibold text-slate-300 mb-4">{timeframe} Total Energy (kWh)</h3>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
            <YAxis stroke="#9ca3af" fontSize={12} />
            <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #4b5563' }} />
            <Legend wrapperStyle={{ color: '#d1d5db', bottom: 0 }}/>
            <Bar dataKey="Total Energy" fill="#0ea5e9" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700 shadow-lg h-96">
        <h3 className="text-md font-semibold text-slate-300 mb-4">{timeframe} Average Efficiency (%)</h3>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 20 }}>
            <defs>
                <linearGradient id="colorEfficiency" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/>
                </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
            <YAxis stroke="#9ca3af" fontSize={12} domain={[70, 100]} />
            <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #4b5563' }} />
            <Legend wrapperStyle={{ color: '#d1d5db', bottom: 0 }}/>
            <Area type="monotone" dataKey="Avg Efficiency" stroke="#22d3ee" fill="url(#colorEfficiency)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default AnalyticsCharts;
