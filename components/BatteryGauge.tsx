
import React from 'react';
import { BatteryFullIcon, BatteryChargingIcon, BatteryWarningIcon, BatteryLowIcon } from './icons/Icons';

interface BatteryGaugeProps {
  percentage: number;
  isCharging: boolean;
}

const BatteryGauge: React.FC<BatteryGaugeProps> = ({ percentage, isCharging }) => {
  const getBatteryInfo = () => {
    if (isCharging) return { color: 'text-green-400', icon: <BatteryChargingIcon /> };
    if (percentage > 70) return { color: 'text-green-500', icon: <BatteryFullIcon /> };
    if (percentage > 30) return { color: 'text-yellow-400', icon: <BatteryWarningIcon /> };
    return { color: 'text-red-500', icon: <BatteryLowIcon /> };
  };

  const { color, icon } = getBatteryInfo();
  const barColor = isCharging ? 'bg-green-400' : 
                   percentage > 70 ? 'bg-green-500' : 
                   percentage > 30 ? 'bg-yellow-400' : 'bg-red-500';

  return (
    <div className="bg-slate-900/50 rounded-xl p-4 md:p-6 border border-slate-700 shadow-lg h-full flex flex-col justify-between">
      <div>
        <h3 className="text-md font-semibold text-slate-300 mb-2">Battery Status</h3>
        <div className="flex items-baseline space-x-2">
            <span className={`text-4xl font-bold ${color}`}>{percentage}%</span>
            <span className={`text-lg font-semibold ${color}`}>{isCharging ? 'Charging' : 'Discharging'}</span>
        </div>
      </div>
      <div className="flex items-center space-x-4 mt-4">
        <div className={`w-12 h-12 ${color}`}>{icon}</div>
        <div className="w-full bg-slate-700 rounded-full h-4">
          <div
            className={`${barColor} h-4 rounded-full transition-all duration-500`}
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default BatteryGauge;
