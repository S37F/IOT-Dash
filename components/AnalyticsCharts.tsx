import React from 'react';
import { BarChart, Bar, AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { SolarData } from '../types';

interface AnalyticsChartsProps {
  data: SolarData[];
  timeframe: string;
}

const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({ data, timeframe }) => {

    const aggregateDataByHour = () => {
        if (!data || data.length === 0) return [];
        const aggregated: {
          [key: string]: {
            ldrValue: number,
            distance: number,
            energy: number,
            efficiency: number,
            temperature: number,
            ledOnCount: number,
            motionCount: number,
            nightModeCount: number,
            count: number
          }
        } = {};

        // Initialize all 24 hours
        for (let i = 0; i < 24; i++) {
            const key = i.toString().padStart(2, '0') + ':00';
            aggregated[key] = { 
              ldrValue: 0, 
              distance: 0, 
              energy: 0, 
              efficiency: 0, 
              temperature: 0,
              ledOnCount: 0,
              motionCount: 0,
              nightModeCount: 0,
              count: 0 
            };
        }

        data.forEach(d => {
            const date = new Date(d.timestamp);
            const hour = date.getHours();
            const key = hour.toString().padStart(2, '0') + ':00';

            if (aggregated[key]) {
                aggregated[key].ldrValue += d.ldrValue || 0;
                aggregated[key].distance += d.distance || 0;
                aggregated[key].energy += d.energy || 0;
                aggregated[key].efficiency += d.efficiency || 0;
                aggregated[key].temperature += d.temperature || 0;
                aggregated[key].ledOnCount += d.ledStatus ? 1 : 0;
                aggregated[key].motionCount += d.motionDetected ? 1 : 0;
                aggregated[key].nightModeCount += d.isNight ? 1 : 0;
                aggregated[key].count += 1;
            }
        });

        return Object.keys(aggregated).map(key => ({
            name: key,
            'Avg LDR': aggregated[key].count > 0 ? Math.round(aggregated[key].ldrValue / aggregated[key].count) : 0,
            'Avg Distance (cm)': aggregated[key].count > 0 ? parseFloat((aggregated[key].distance / aggregated[key].count).toFixed(1)) : 0,
            'Avg Energy (kWh)': aggregated[key].count > 0 ? parseFloat((aggregated[key].energy / aggregated[key].count).toFixed(1)) : 0,
            'Avg Efficiency (%)': aggregated[key].count > 0 ? parseFloat((aggregated[key].efficiency / aggregated[key].count).toFixed(1)) : 0,
            'Avg Temp (°C)': aggregated[key].count > 0 ? parseFloat((aggregated[key].temperature / aggregated[key].count).toFixed(1)) : 0,
            'LED ON %': aggregated[key].count > 0 ? Math.round((aggregated[key].ledOnCount / aggregated[key].count) * 100) : 0,
            'Motion %': aggregated[key].count > 0 ? Math.round((aggregated[key].motionCount / aggregated[key].count) * 100) : 0,
            'Night Mode %': aggregated[key].count > 0 ? Math.round((aggregated[key].nightModeCount / aggregated[key].count) * 100) : 0,
        }));
    };

    const chartData = aggregateDataByHour();
    const title = `${timeframe}'s Performance`;
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* LDR Sensor Values */}
      <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700 shadow-lg h-96">
        <h3 className="text-md font-semibold text-slate-300 mb-4">{title} - LDR Sensor (Avg ADC)</h3>
        <ResponsiveContainer width="100%" height="85%">
          <AreaChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 20 }}>
            <defs>
              <linearGradient id="colorLDR" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} angle={-45} textAnchor="end" />
            <YAxis stroke="#9ca3af" fontSize={12} domain={[0, 4095]} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #4b5563' }} 
              labelStyle={{ color: '#d1d5db' }}
            />
            <Legend wrapperStyle={{ color: '#d1d5db', bottom: -5 }} />
            <Area type="monotone" dataKey="Avg LDR" stroke="#06b6d4" fillOpacity={1} fill="url(#colorLDR)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Distance Sensor */}
      <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700 shadow-lg h-96">
        <h3 className="text-md font-semibold text-slate-300 mb-4">{title} - Distance Sensor (Avg cm)</h3>
        <ResponsiveContainer width="100%" height="85%">
          <LineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} angle={-45} textAnchor="end" />
            <YAxis stroke="#9ca3af" fontSize={12} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #4b5563' }} 
              labelStyle={{ color: '#d1d5db' }}
            />
            <Legend wrapperStyle={{ color: '#d1d5db', bottom: -5 }} />
            <Line type="monotone" dataKey="Avg Distance (cm)" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6' }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Motion & LED Activity */}
      <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700 shadow-lg h-96">
        <h3 className="text-md font-semibold text-slate-300 mb-4">{title} - Motion & LED Activity (%)</h3>
        <ResponsiveContainer width="100%" height="85%">
          <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} angle={-45} textAnchor="end" />
            <YAxis stroke="#9ca3af" fontSize={12} domain={[0, 100]} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #4b5563' }} 
              labelStyle={{ color: '#d1d5db' }}
            />
            <Legend wrapperStyle={{ color: '#d1d5db', bottom: -5 }} />
            <Bar dataKey="Motion %" fill="#ef4444" />
            <Bar dataKey="LED ON %" fill="#facc15" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Day/Night Mode */}
      <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700 shadow-lg h-96">
        <h3 className="text-md font-semibold text-slate-300 mb-4">{title} - Night Mode Activity (%)</h3>
        <ResponsiveContainer width="100%" height="85%">
          <AreaChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 20 }}>
            <defs>
              <linearGradient id="colorNight" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} angle={-45} textAnchor="end" />
            <YAxis stroke="#9ca3af" fontSize={12} domain={[0, 100]} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #4b5563' }} 
              labelStyle={{ color: '#d1d5db' }}
            />
            <Legend wrapperStyle={{ color: '#d1d5db', bottom: -5 }} />
            <Area type="monotone" dataKey="Night Mode %" stroke="#6366f1" fillOpacity={1} fill="url(#colorNight)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Energy Output */}
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
            <Bar dataKey="Avg Energy (kWh)" fill="#facc15" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Temperature */}
      <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700 shadow-lg h-96">
        <h3 className="text-md font-semibold text-slate-300 mb-4">{title} - Temperature (Avg °C)</h3>
        <ResponsiveContainer width="100%" height="85%">
          <LineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} angle={-45} textAnchor="end" />
            <YAxis stroke="#9ca3af" fontSize={12} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #4b5563' }} 
              labelStyle={{ color: '#d1d5db' }}
            />
            <Legend wrapperStyle={{ color: '#d1d5db', bottom: -5 }} />
            <Line type="monotone" dataKey="Avg Temp (°C)" stroke="#f87171" strokeWidth={2} dot={{ fill: '#f87171' }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default AnalyticsCharts;
