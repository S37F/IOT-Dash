import React from 'react';
import type { SolarData } from '../types';
import DataCard from '../components/DataCard';
import Gauge from '../components/Gauge';
import BatteryGauge from '../components/BatteryGauge';
import RealtimeChart from '../components/RealtimeChart';
import MapView from '../components/MapView';
import { SunIcon, ZapIcon, ThermometerIcon, AngleIcon } from '../components/icons/Icons';

interface DashboardViewProps {
  data: SolarData;
  isLive: boolean;
}

const DashboardView: React.FC<DashboardViewProps> = ({ data, isLive }) => {
  return (
    <div className="relative">
       {!isLive && (
        <div className="absolute inset-0 bg-slate-800/80 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg">
          <div className="text-center p-8 bg-slate-900 rounded-xl shadow-lg border border-slate-700">
            <h2 className="text-2xl font-bold text-yellow-400 mb-2">Data Paused</h2>
            <p className="text-slate-300">Real-time updates are paused. Press 'Live' in the header to resume.</p>
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {/* Data Cards */}
        <DataCard title="Energy Output" value={data.energy} unit="kWh" icon={<ZapIcon />} colorClass="text-yellow-400"/>
        <DataCard title="Light Intensity" value={data.intensity} unit="lux" icon={<SunIcon />} colorClass="text-orange-400"/>
        <DataCard title="Temperature" value={data.temperature} unit="°C" icon={<ThermometerIcon />} colorClass="text-red-400"/>
        <DataCard title="Servo Angle" value={data.servoAngle} unit="°" icon={<AngleIcon />} colorClass="text-purple-400"/>

        {/* Gauges */}
        <div className="md:col-span-1 lg:col-span-2">
          <Gauge value={data.efficiency} label="Solar Efficiency" color="#22d3ee" />
        </div>
        <div className="md:col-span-1 lg:col-span-2">
          <BatteryGauge percentage={Math.round(data.battery)} isCharging={data.energy > 5} />
        </div>
        
        {/* Realtime Chart */}
        <div className="md:col-span-2 lg:col-span-4">
          <RealtimeChart 
            title="Live Environment Data"
            dataPoint1={data.temperature} 
            label1="Temperature (°C)" 
            color1="#f87171" 
            dataPoint2={data.intensity} 
            label2="Intensity (lux)" 
            color2="#fb923c"
          />
        </div>

        {/* Map */}
        <div className="md:col-span-2 lg:col-span-4">
          <MapView gps={data.gps} />
        </div>
      </div>
    </div>
  );
};

export default DashboardView;
