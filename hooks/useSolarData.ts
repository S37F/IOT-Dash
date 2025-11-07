import { useState, useEffect, useRef, useCallback } from 'react';
import type { SolarData } from '../types';

/**
 * A stateful, continuous simulation function to generate the next data point.
 * @param previousState The last known data state.
 * @param timestamp The timestamp for the new data point.
 * @param weather The weather profile for the day ('Clear Sunny', 'Partly Cloudy', etc.).
 * @param specialConditions Flags for unique events, like the specific Wednesday scenario.
 * @returns A new, simulated SolarData object.
 */
const simulateNextDataPoint = (
  previousState: SolarData,
  timestamp: Date,
  weather: 'Clear Sunny' | 'Partly Cloudy' | 'Overcast & Rainy' | 'Mixed Cloud',
  specialConditions: { isWednesdayMorning: boolean; isWednesdayEvening: boolean }
): SolarData => {
  const timeOfDay = timestamp.getHours() + timestamp.getMinutes() / 60;
  
  // 1. Simulate Light Intensity based on weather and time
  let baseIntensity = Math.max(0, 1100 * Math.sin((timeOfDay - 6) * (Math.PI / 12)));
  if (timeOfDay < 6 || timeOfDay > 18) baseIntensity = 0;

  switch (weather) {
    case 'Clear Sunny': baseIntensity *= 0.98; break;
    case 'Partly Cloudy': baseIntensity *= (0.6 + Math.random() * 0.2); break;
    case 'Mixed Cloud': baseIntensity *= (Math.random() > 0.5 ? 0.9 : 0.5); break;
    case 'Overcast & Rainy': baseIntensity *= 0.3; break;
  }
  const intensity = Math.floor(baseIntensity + Math.random() * 15);

  // 2. Simulate Temperature
  const tempProfiles = { 'Clear Sunny': [18, 32], 'Partly Cloudy': [15, 26], 'Mixed Cloud': [16, 28], 'Overcast & Rainy': [12, 18] };
  const [minTemp, maxTemp] = tempProfiles[weather];
  const tempAmplitude = (maxTemp - minTemp) / 2;
  const tempOffset = minTemp + tempAmplitude;
  const baseTemperature = tempOffset + tempAmplitude * Math.sin((timeOfDay - 8) * (Math.PI / 12));
  const temperature = parseFloat((baseTemperature + (Math.random() - 0.5) * 1.5).toFixed(1));

  // 3. Simulate Solar Panel Efficiency
  let baseEfficiency = 97.5;
  if (temperature > 25) baseEfficiency -= (temperature - 25) * 0.45; // Temp degradation
  if (temperature < 20) baseEfficiency += (20 - temperature) * 0.1; // Cooler is better
  if (intensity < 100 && intensity > 0) baseEfficiency -= (100 - intensity) / 15; // Low light penalty
  if (specialConditions.isWednesdayEvening) baseEfficiency = Math.min(99, baseEfficiency + 2); // Special efficiency boost
  const efficiency = Math.max(78, Math.min(99, parseFloat(baseEfficiency.toFixed(1))));

  // 4. Calculate Power Generated
  const panelMaxPowerW = 100; // 100W panel
  const powerGeneratedW = (intensity / 1000) * panelMaxPowerW * (efficiency / 100);
  const energy = parseFloat((powerGeneratedW / 4).toFixed(1)); // kWh in a 15 min block

  // 5. Simulate Servo Angle (sun tracking)
  let servoAngle = 45;
  if (timeOfDay > 6.5 && timeOfDay < 18) {
    servoAngle = Math.round(170 - 160 * ((timeOfDay - 6.5) / 11.5)); // East (170) to West (10)
  } else {
    servoAngle = 90; // Rest position
  }
  if (specialConditions.isWednesdayEvening) servoAngle = 25; // Pointing West

  // 6. Stateful Battery Simulation
  const batteryCapacityWh = 74; // 10A * 2-cell (3.7V * 2) = 74Wh
  // System consumes more power when actively tracking the sun
  const systemConsumptionW = specialConditions.isWednesdayMorning ? 15 : 5;
  const netPowerW = powerGeneratedW - systemConsumptionW;
  
  const timeDeltaSeconds = (timestamp.getTime() - new Date(previousState.timestamp).getTime()) / 1000;
  const energyDeltaWh = (netPowerW * timeDeltaSeconds) / 3600;
  const batteryDeltaPercent = (energyDeltaWh / batteryCapacityWh) * 100;
  
  const newBatteryLevel = Math.max(0, Math.min(100, previousState.battery + batteryDeltaPercent));

  return {
    timestamp: timestamp.toISOString(),
    energy,
    efficiency,
    battery: parseFloat(newBatteryLevel.toFixed(1)),
    intensity,
    temperature,
    servoAngle,
    motionDetected: Math.random() < 0.01, // Low chance of random motion
    gps: { lat: 51.5074 + (Math.random() - 0.5) / 1000, lng: -0.1278 + (Math.random() - 0.5) / 1000 },
  };
};


export const useSolarData = (isLive: boolean) => {
  const [latestData, setLatestData] = useState<SolarData | null>(null);
  const [historicalData, setHistoricalData] = useState<SolarData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDataAvailable, setIsDataAvailable] = useState<boolean>(false);
  const intervalIdRef = useRef<number | null>(null);
  const lastHistoryUpdate = useRef<number>(0);
  
  const batteryLevelRef = useRef<number>(85);
  const lastSimTimestampRef = useRef<number>(Date.now());

  // Generate historical data on mount
  useEffect(() => {
    const history: SolarData[] = [];
    const now = new Date();

    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); // Go back to the most recent Sunday
    startOfWeek.setHours(0, 0, 0, 0);

    // Consistent weather profiles for the week
    const weatherProfiles: ('Clear Sunny' | 'Partly Cloudy' | 'Overcast & Rainy' | 'Mixed Cloud')[] = 
      ['Clear Sunny', 'Partly Cloudy', 'Mixed Cloud', 'Overcast & Rainy', 'Clear Sunny', 'Partly Cloudy', 'Mixed Cloud'];

    let currentState: SolarData = {
      timestamp: new Date(startOfWeek.getTime() - 1).toISOString(),
      energy: 0, efficiency: 90, battery: 85, intensity: 0, temperature: 15,
      gps: { lat: 51.5074, lng: -0.1278 }, servoAngle: 90, motionDetected: false,
    };

    for (let d = new Date(startOfWeek); d <= now; d.setMinutes(d.getMinutes() + 15)) {
      const currentDay = d.getDay(); // 0=Sun, 3=Wed
      const currentHour = d.getHours();
      const currentMinute = d.getMinutes();

      // Wednesday: Simulate device being offline between 9am and 5:30pm
      if (currentDay === 3) {
        const time = currentHour + currentMinute / 60;
        if (time >= 9 && time < 17.5) {
          // To maintain battery drain during offline, simulate a single point of consumption
          if(history[history.length-1].timestamp.startsWith(d.toISOString().split('T')[0])) {
             const lastRecordTime = new Date(history[history.length - 1].timestamp).getHours() + new Date(history[history.length - 1].timestamp).getMinutes()/60;
             if(lastRecordTime < 9) { // only add this drain point once
                const offlineDrainTime = new Date(d);
                offlineDrainTime.setHours(9,0,0,0);
                currentState.timestamp = offlineDrainTime.toISOString();
                currentState.battery = Math.max(0, currentState.battery - 15); // Simulate base drain over ~8 hours
             }
          }
          continue; // Skip data generation for this interval
        }
      }

      const specialConditions = {
        isWednesdayMorning: currentDay === 3 && currentHour >= 8 && currentHour < 9,
        isWednesdayEvening: currentDay === 3 && (currentHour === 17 && currentMinute >= 30 || (currentHour >= 18 && currentHour < 19)),
      };

      currentState = simulateNextDataPoint(currentState, new Date(d), weatherProfiles[currentDay], specialConditions);
      history.push(currentState);
    }

    if (history.length > 0) {
      setHistoricalData(history);
      const lastPoint = history[history.length - 1];
      setLatestData(lastPoint);
      batteryLevelRef.current = lastPoint.battery;
      lastHistoryUpdate.current = new Date(lastPoint.timestamp).getTime();
    }
    setIsLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchLatestData = useCallback(async () => {
    try {
      const response = await fetch('https://dashboard-s37f-default-rtdb.firebaseio.com/.json');
      if (!response.ok) throw new Error(`Firebase fetch failed: ${response.statusText}`);
      const data = await response.json();

      if (data) {
        setIsDataAvailable(true);

        // Authentic data points from hardware
        const intensity: number = data.intensity ?? 0;
        const servoAngle: number = data.servoAngle ?? 45;
        const motionDetected: boolean = data.motionDetected ?? false;
        const gps = data.gps ?? { lat: 51.5074, lng: -0.1278 };

        // Simulate other values based on authentic intensity
        const now = new Date();
        const timeOfDay = now.getHours() + now.getMinutes() / 60;
        const minTemp = 10, maxTemp = 28;
        const tempAmplitude = (maxTemp - minTemp) / 2;
        const tempOffset = minTemp + tempAmplitude;
        const baseTemperature = tempOffset + tempAmplitude * Math.sin((timeOfDay - 8) * (Math.PI / 12));
        const simulatedTemperature = parseFloat((baseTemperature + (Math.random() - 0.5) * 1.5 + (intensity / 1000) * 2).toFixed(1));

        let baseEfficiency = 97.5;
        if (simulatedTemperature > 25) baseEfficiency -= (simulatedTemperature - 25) * 0.45;
        // FIX: Use simulatedTemperature variable which is defined in this scope.
        if (simulatedTemperature < 20) baseEfficiency += (20 - simulatedTemperature) * 0.1;
        const simulatedEfficiency = Math.max(80, Math.min(99, parseFloat(baseEfficiency.toFixed(1))));

        const panelMaxPowerW = 100;
        const powerGeneratedW = (intensity / 1000) * panelMaxPowerW * (simulatedEfficiency / 100);
        const simulatedEnergyValue = parseFloat((powerGeneratedW / 4).toFixed(1));

        const batteryCapacityWh = 74;
        const systemConsumptionW = 5;
        const netPowerW = powerGeneratedW - systemConsumptionW;
        
        const nowMillis = Date.now();
        const timeDeltaSeconds = (nowMillis - lastSimTimestampRef.current) / 1000;
        lastSimTimestampRef.current = nowMillis;

        const energyDeltaWh = (netPowerW * timeDeltaSeconds) / 3600;
        const batteryDeltaPercent = (energyDeltaWh / batteryCapacityWh) * 100;
        
        batteryLevelRef.current = Math.max(0, Math.min(100, batteryLevelRef.current + batteryDeltaPercent));
        const simulatedBattery = parseFloat(batteryLevelRef.current.toFixed(1));

        const mappedData: SolarData = {
          timestamp: new Date().toISOString(),
          energy: simulatedEnergyValue, efficiency: simulatedEfficiency, battery: simulatedBattery,
          temperature: simulatedTemperature, intensity: intensity, servoAngle: servoAngle,
          motionDetected: motionDetected, gps: gps,
        };
        
        setLatestData(mappedData);
        
        const currentTimestamp = Date.now();
        if (currentTimestamp - lastHistoryUpdate.current > 60 * 1000) {
            setHistoricalData(prev => [...prev, mappedData]);
            lastHistoryUpdate.current = currentTimestamp;
        }

      } else {
        setIsDataAvailable(false);
      }
    } catch (error) {
      console.error("Failed to fetch or process solar data:", error);
      setIsDataAvailable(false);
    }
  }, []);

  useEffect(() => {
    if (isLive) {
      if (intervalIdRef.current === null) {
        lastSimTimestampRef.current = Date.now();
        fetchLatestData();
        intervalIdRef.current = window.setInterval(fetchLatestData, 2000);
      }
    } else {
      if (intervalIdRef.current !== null) {
        clearInterval(intervalIdRef.current);
        intervalIdRef.current = null;
      }
    }

    return () => {
      if (intervalIdRef.current !== null) clearInterval(intervalIdRef.current);
    };
  }, [isLive, fetchLatestData]);

  const defaultData: SolarData = {
    timestamp: new Date().toISOString(), energy: 0, efficiency: 0, battery: 0,
    intensity: 0, temperature: 0, servoAngle: 45, motionDetected: false,
    gps: { lat: 51.5074, lng: -0.1278 },
  };

  return { latestData: latestData ?? defaultData, historicalData, isLoading, isDataAvailable };
};
