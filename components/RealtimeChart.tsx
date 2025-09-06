
import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface RealtimeChartProps {
  dataPoint1: number;
  dataPoint2: number;
  label1: string;
  label2: string;
  color1: string;
  color2: string;
  title: string;
}

interface ChartData {
  time: string;
  [key: string]: string | number;
}

const RealtimeChart: React.FC<RealtimeChartProps> = ({ dataPoint1, dataPoint2, label1, label2, color1, color2, title }) => {
  const [data, setData] = useState<ChartData[]>([]);

  useEffect(() => {
    const now = new Date();
    const newEntry = {
      time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      [label1]: dataPoint1,
      [label2]: dataPoint2
    };

    setData(currentData => {
      const newData = [...currentData, newEntry];
      return newData.length > 20 ? newData.slice(1) : newData; // Keep only last 20 points
    });
  }, [dataPoint1, dataPoint2, label1, label2]);

  return (
    <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700 shadow-lg h-80">
      <h3 className="text-md font-semibold text-slate-300 mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey="time" stroke="#9ca3af" fontSize={12} />
          <YAxis yAxisId="left" stroke="#9ca3af" fontSize={12} />
          <YAxis yAxisId="right" orientation="right" stroke="#9ca3af" fontSize={12} />
          <Tooltip 
            contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #4b5563' }} 
            labelStyle={{ color: '#d1d5db' }}
          />
          <Legend wrapperStyle={{ color: '#d1d5db', bottom: 0 }} />
          <Line yAxisId="left" type="monotone" dataKey={label1} stroke={color1} strokeWidth={2} dot={false} isAnimationActive={false}/>
          <Line yAxisId="right" type="monotone" dataKey={label2} stroke={color2} strokeWidth={2} dot={false} isAnimationActive={false}/>
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default RealtimeChart;
