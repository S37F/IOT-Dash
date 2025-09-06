
import React from 'react';

interface DataCardProps {
  title: string;
  value: string | number;
  unit: string;
  icon: React.ReactNode;
  colorClass?: string;
}

const DataCard: React.FC<DataCardProps> = ({ title, value, unit, icon, colorClass = 'text-cyan-400' }) => {
  return (
    <div className="bg-slate-900/50 rounded-xl p-4 md:p-6 flex items-center space-x-4 border border-slate-700 shadow-lg transition-all duration-300 hover:bg-slate-800/60 hover:shadow-cyan-500/10 hover:border-cyan-500/50">
      <div className={`p-3 rounded-full bg-slate-800 ${colorClass}`}>
        {icon}
      </div>
      <div>
        <h3 className="text-sm font-medium text-slate-400">{title}</h3>
        <p className="text-2xl font-bold text-white">
          {value} <span className="text-lg font-normal text-slate-300">{unit}</span>
        </p>
      </div>
    </div>
  );
};

export default DataCard;
