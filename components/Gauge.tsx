
import React from 'react';
import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer } from 'recharts';

interface GaugeProps {
  value: number;
  label: string;
  color: string;
}

const Gauge: React.FC<GaugeProps> = ({ value, label, color }) => {
  const data = [{ name: label, value: value }];

  return (
    <div className="bg-slate-900/50 rounded-xl p-4 flex flex-col items-center justify-center border border-slate-700 shadow-lg h-full">
      <h3 className="text-md font-semibold text-slate-300 mb-2">{label}</h3>
      <div className="w-full h-40 relative">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            innerRadius="80%"
            outerRadius="100%"
            data={data}
            startAngle={180}
            endAngle={0}
            barSize={15}
          >
            <PolarAngleAxis
              type="number"
              domain={[0, 100]}
              angleAxisId={0}
              tick={false}
            />
            <RadialBar
              background={{ fill: '#334155' }}
              dataKey="value"
              cornerRadius={10}
              fill={color}
            />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/3 text-center">
            <span className="text-4xl font-bold text-white">{value}</span>
            <span className="text-xl text-slate-400">%</span>
        </div>
      </div>
    </div>
  );
};

export default Gauge;
