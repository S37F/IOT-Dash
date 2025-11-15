
import React, { useState, useEffect } from 'react';
import type { SolarData } from '../types';
import DataCard from '../components/DataCard';
import Gauge from '../components/Gauge';
import BatteryGauge from '../components/BatteryGauge';
import RealtimeChart from '../components/RealtimeChart';
import PausableWrapper from '../components/PausableWrapper';
import { SunIcon, ZapIcon, ThermometerIcon, AngleIcon, MotionSensorIcon, SatelliteIcon, DistanceIcon, LedIcon, MoonIcon, LdrIcon, HumidityIcon } from '../components/icons/Icons';

interface DashboardViewProps {
  data: SolarData;
  isLive: boolean;
  isLoading: boolean;
  isDataAvailable: boolean;
}

const DashboardView: React.FC<DashboardViewProps> = ({ data, isLive, isLoading, isDataAvailable }) => {
  const [pausedStates, setPausedStates] = useState<Record<string, boolean>>({});
  const [displayData, setDisplayData] = useState<SolarData>(data);

  useEffect(() => {
    // This effect synchronizes the display data with the incoming live data, respecting paused states.
    // It runs whenever a new `data` prop is received.
    setDisplayData(currentDisplayData => ({
      timestamp: data.timestamp, // Always update timestamp
      ldrValue: pausedStates.ldrValue ? currentDisplayData.ldrValue : data.ldrValue,
      intensity: pausedStates.envChart ? currentDisplayData.intensity : (pausedStates.intensity ? currentDisplayData.intensity : data.intensity),
      servoAngle: pausedStates.servoAngle ? currentDisplayData.servoAngle : data.servoAngle,
      motionDetected: pausedStates.motion ? currentDisplayData.motionDetected : data.motionDetected,
      distance: pausedStates.distance ? currentDisplayData.distance : data.distance,
      ledStatus: pausedStates.ledStatus ? currentDisplayData.ledStatus : data.ledStatus,
      isNight: pausedStates.isNight ? currentDisplayData.isNight : data.isNight,
      energy: pausedStates.energy ? currentDisplayData.energy : data.energy,
      efficiency: pausedStates.efficiency ? currentDisplayData.efficiency : data.efficiency,
      battery: pausedStates.battery ? currentDisplayData.battery : data.battery,
      temperature: pausedStates.envChart ? currentDisplayData.temperature : (pausedStates.temperature ? currentDisplayData.temperature : data.temperature),
      humidity: pausedStates.humidity ? currentDisplayData.humidity : data.humidity,
    }));
  }, [data, pausedStates]);

  const togglePause = (id: string) => {
    setPausedStates(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="relative">
      {isLoading && (
        <div className="absolute inset-0 bg-slate-800/80 backdrop-blur-sm flex items-center justify-center z-40 rounded-lg">
          <div className="text-center p-8">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-cyan-400 mx-auto"></div>
            <h2 className="text-2xl font-bold text-slate-200 mt-4">Connecting to Database...</h2>
          </div>
        </div>
      )}

      {!isLoading && !isDataAvailable && (
        <div className="absolute inset-0 bg-slate-800/95 backdrop-blur-md flex items-center justify-center z-30 rounded-lg">
          <div className="text-center p-8 bg-slate-900 rounded-xl shadow-lg border border-slate-700 max-w-md">
            <SatelliteIcon />
            <h2 className="text-2xl font-bold text-cyan-400 my-2">Connect Your IoT Device</h2>
            <p className="text-slate-300 mb-2">Dashboard is ready and waiting for real-time data from your ESP32.</p>
            <p className="text-sm text-slate-500 mb-4">No simulated data will be shown. Start your device to see live metrics.</p>
            <div className="bg-slate-800 p-3 rounded-lg border border-slate-600 text-left">
              <p className="text-xs text-cyan-400 font-mono mb-1">Firebase URL:</p>
              <p className="text-xs text-slate-400 font-mono break-all">dashboard-s37f-default-rtdb.firebaseio.com</p>
            </div>
          </div>
        </div>
      )}
      
       {!isLive && isDataAvailable && (
        <div className="absolute inset-0 bg-slate-800/80 backdrop-blur-sm flex items-center justify-center z-30 rounded-lg">
          <div className="text-center p-8 bg-slate-900 rounded-xl shadow-lg border border-slate-700">
            <h2 className="text-2xl font-bold text-yellow-400 mb-2">Data Paused</h2>
            <p className="text-slate-300">Real-time updates are paused. Press 'Live' in the header to resume.</p>
          </div>
        </div>
      )}
      
      {/* Data Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6 mb-4 md:mb-6">
        <PausableWrapper isPaused={!!pausedStates.ldrValue} onTogglePause={() => togglePause('ldrValue')} isLive={isLive}>
          <DataCard title="LDR Value" value={displayData.ldrValue} unit="ADC" icon={<LdrIcon />} colorClass="text-cyan-400"/>
        </PausableWrapper>
        <PausableWrapper isPaused={!!pausedStates.intensity} onTogglePause={() => togglePause('intensity')} isLive={isLive}>
          <DataCard title="Light Intensity" value={displayData.intensity} unit="lux" icon={<SunIcon />} colorClass="text-orange-400"/>
        </PausableWrapper>
        <PausableWrapper isPaused={!!pausedStates.distance} onTogglePause={() => togglePause('distance')} isLive={isLive}>
          <DataCard title="Distance" value={displayData.distance} unit="cm" icon={<DistanceIcon />} colorClass="text-blue-400"/>
        </PausableWrapper>
        <PausableWrapper isPaused={!!pausedStates.servoAngle} onTogglePause={() => togglePause('servoAngle')} isLive={isLive}>
          <DataCard title="Servo Angle" value={displayData.servoAngle} unit="°" icon={<AngleIcon />} colorClass="text-purple-400"/>
        </PausableWrapper>
        <PausableWrapper isPaused={!!pausedStates.ledStatus} onTogglePause={() => togglePause('ledStatus')} isLive={isLive}>
          <DataCard 
            title="LED Status" 
            value={displayData.ledStatus ? 'ON' : 'OFF'} 
            unit="" 
            icon={<LedIcon />} 
            colorClass={displayData.ledStatus ? 'text-yellow-400' : 'text-gray-400'}
          />
        </PausableWrapper>
        <PausableWrapper isPaused={!!pausedStates.motion} onTogglePause={() => togglePause('motion')} isLive={isLive}>
          <DataCard 
            title="Motion Sensor" 
            value={displayData.motionDetected ? 'Detected' : 'Clear'} 
            unit="" 
            icon={<MotionSensorIcon />} 
            colorClass={displayData.motionDetected ? 'text-red-400' : 'text-green-400'}
          />
        </PausableWrapper>
        <PausableWrapper isPaused={!!pausedStates.isNight} onTogglePause={() => togglePause('isNight')} isLive={isLive}>
          <DataCard 
            title="Mode" 
            value={displayData.isNight ? 'Night' : 'Day'} 
            unit="" 
            icon={displayData.isNight ? <MoonIcon /> : <SunIcon />} 
            colorClass={displayData.isNight ? 'text-indigo-400' : 'text-yellow-400'}
          />
        </PausableWrapper>
        <PausableWrapper isPaused={!!pausedStates.energy} onTogglePause={() => togglePause('energy')} isLive={isLive}>
          <DataCard title="Energy Output" value={displayData.energy} unit="kWh" icon={<ZapIcon />} colorClass="text-yellow-400"/>
        </PausableWrapper>
        <PausableWrapper isPaused={!!pausedStates.temperature} onTogglePause={() => togglePause('temperature')} isLive={isLive}>
          <DataCard title="Temperature" value={displayData.temperature} unit="°C" icon={<ThermometerIcon />} colorClass="text-red-400"/>
        </PausableWrapper>
        <PausableWrapper isPaused={!!pausedStates.humidity} onTogglePause={() => togglePause('humidity')} isLive={isLive}>
          <DataCard title="Humidity" value={displayData.humidity} unit="%" icon={<HumidityIcon />} colorClass="text-blue-400"/>
        </PausableWrapper>
      </div>
      
      {/* Main Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {/* Gauges */}
        <div className="md:col-span-1 lg:col-span-2">
          <PausableWrapper isPaused={!!pausedStates.efficiency} onTogglePause={() => togglePause('efficiency')} isLive={isLive}>
            <Gauge value={displayData.efficiency} label="Solar Efficiency" color="#22d3ee" />
          </PausableWrapper>
        </div>
        <div className="md:col-span-1 lg:col-span-2">
          <PausableWrapper isPaused={!!pausedStates.battery} onTogglePause={() => togglePause('battery')} isLive={isLive}>
            <BatteryGauge percentage={Math.round(displayData.battery)} isCharging={displayData.energy > 5} />
          </PausableWrapper>
        </div>
        
        {/* Realtime Chart */}
        <div className="md:col-span-2 lg:col-span-4">
          <PausableWrapper isPaused={!!pausedStates.envChart} onTogglePause={() => togglePause('envChart')} isLive={isLive}>
            <RealtimeChart 
              title="Live Environment Data"
              dataPoint1={displayData.temperature} 
              label1="Temperature (°C)" 
              color1="#f87171" 
              dataPoint2={displayData.intensity} 
              label2="Intensity (lux)" 
              color2="#fb923c"
            />
          </PausableWrapper>
        </div>
      </div>
    </div>
  );
};

export default DashboardView;
