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
  
  // 1. Simulate LDR Value (0-4095 ADC range) based on weather and time
  let baseLDR = Math.max(0, 4095 * Math.sin((timeOfDay - 6) * (Math.PI / 12)));
  if (timeOfDay < 6 || timeOfDay > 18) baseLDR = 0;

  switch (weather) {
    case 'Clear Sunny': baseLDR *= 0.98; break;
    case 'Partly Cloudy': baseLDR *= (0.6 + Math.random() * 0.2); break;
    case 'Mixed Cloud': baseLDR *= (Math.random() > 0.5 ? 0.9 : 0.5); break;
    case 'Overcast & Rainy': baseLDR *= 0.3; break;
  }
  const ldrValue = Math.floor(baseLDR + Math.random() * 50);
  const intensity = ldrValue; // Same value for compatibility
  const isNight = ldrValue < 3000; // LDR threshold from ESP32 code

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

  // 4. Calculate Power Generated (based on LDR normalized to 0-1000 lux scale)
  const panelMaxPowerW = 100; // 100W panel
  const normalizedIntensity = (intensity / 4095) * 1000; // Convert ADC to lux equivalent
  const powerGeneratedW = (normalizedIntensity / 1000) * panelMaxPowerW * (efficiency / 100);
  const energy = parseFloat((powerGeneratedW / 4).toFixed(1)); // kWh in a 15 min block

  // 5. Simulate Servo Angle (sun tracking during day, center at night)
  let servoAngle = 90;
  if (!isNight && timeOfDay > 6.5 && timeOfDay < 18) {
    servoAngle = Math.round(ldrValue / 4095 * 180); // Map LDR to servo angle (0-180)
  }
  if (specialConditions.isWednesdayEvening) servoAngle = 25; // Pointing West

  // 6. Simulate Distance (ultrasonic sensor)
  const distance = parseFloat((Math.random() * 300).toFixed(1)); // 0-300 cm random
  const motionDetected = distance <= 150; // Motion if distance <= 150cm

  // 7. LED Status (ON only at night when motion detected)
  const ledStatus = isNight && motionDetected;

  // 8. Stateful Battery Simulation
  const batteryCapacityWh = 74; // 10A * 2-cell (3.7V * 2) = 74Wh
  const systemConsumptionW = specialConditions.isWednesdayMorning ? 15 : 5;
  const netPowerW = powerGeneratedW - systemConsumptionW;
  
  const timeDeltaSeconds = (timestamp.getTime() - new Date(previousState.timestamp).getTime()) / 1000;
  const energyDeltaWh = (netPowerW * timeDeltaSeconds) / 3600;
  const batteryDeltaPercent = (energyDeltaWh / batteryCapacityWh) * 100;
  
  const newBatteryLevel = Math.max(0, Math.min(100, previousState.battery + batteryDeltaPercent));

  return {
    timestamp: timestamp.toISOString(),
    ldrValue,
    intensity,
    servoAngle,
    motionDetected,
    distance,
    ledStatus,
    isNight,
    energy,
    efficiency,
    battery: parseFloat(newBatteryLevel.toFixed(1)),
    temperature,
  };
};


// LocalStorage key for historical data
const STORAGE_KEY = 'iot_dashboard_history';
const MAX_HISTORY_DAYS = 7; // Keep last 7 days of data

// Save historical data to localStorage
const saveHistoryToStorage = (data: SolarData[]) => {
  try {
    // Filter data to keep only last 7 days
    const now = Date.now();
    const sevenDaysAgo = now - (MAX_HISTORY_DAYS * 24 * 60 * 60 * 1000);
    const recentData = data.filter(d => new Date(d.timestamp).getTime() > sevenDaysAgo);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(recentData));
  } catch (error) {
    console.error('Failed to save history to localStorage:', error);
  }
};

// Load historical data from localStorage
const loadHistoryFromStorage = (): SolarData[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load history from localStorage:', error);
  }
  return [];
};

export const useSolarData = (isLive: boolean) => {
  const [latestData, setLatestData] = useState<SolarData | null>(null);
  const [historicalData, setHistoricalData] = useState<SolarData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDataAvailable, setIsDataAvailable] = useState<boolean>(false);
  const intervalIdRef = useRef<number | null>(null);
  const lastHistoryUpdate = useRef<number>(0);
  const lastDataUpdateTime = useRef<number>(0); // Track when data was last updated
  
  const batteryLevelRef = useRef<number>(85);
  const lastSimTimestampRef = useRef<number>(Date.now());

  // Load historical data from localStorage on mount
  useEffect(() => {
    const storedHistory = loadHistoryFromStorage();
    if (storedHistory.length > 0) {
      setHistoricalData(storedHistory);
      const lastPoint = storedHistory[storedHistory.length - 1];
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
        // Check if Firebase data has a timestamp field
        const firebaseTimestamp = data.timestamp ? new Date(data.timestamp).getTime() : 0;
        const currentTime = Date.now();
        const dataAge = currentTime - firebaseTimestamp;
        
        // Data is considered "live" if it's less than 10 seconds old
        // If there's no timestamp or data is stale, mark as not available
        const isLiveData = firebaseTimestamp > 0 && dataAge < 10000; // 10 seconds
        
        if (!isLiveData) {
          setIsDataAvailable(false);
          return;
        }
        
        // Update the last data update time
        lastDataUpdateTime.current = currentTime;
        setIsDataAvailable(true);

        // Real hardware values from ESP32
        const ldrValue: number = data.ldrValue ?? data.intensity ?? 0;
        const intensity: number = data.intensity ?? data.ldrValue ?? 0;
        const servoAngle: number = data.servoAngle ?? 90;
        const motionDetected: boolean = data.motionDetected ?? false;
        const distance: number = data.distance ?? 300;
        const ledStatus: boolean = data.ledStatus ?? false;
        const isNight: boolean = data.isNight ?? (ldrValue < 3000);

        // Simulate other values based on authentic LDR/intensity
        const now = new Date();
        const timeOfDay = now.getHours() + now.getMinutes() / 60;
        const minTemp = 10, maxTemp = 28;
        const tempAmplitude = (maxTemp - minTemp) / 2;
        const tempOffset = minTemp + tempAmplitude;
        const baseTemperature = tempOffset + tempAmplitude * Math.sin((timeOfDay - 8) * (Math.PI / 12));
        const simulatedTemperature = parseFloat((baseTemperature + (Math.random() - 0.5) * 1.5 + (intensity / 4095) * 2).toFixed(1));

        let baseEfficiency = 97.5;
        if (simulatedTemperature > 25) baseEfficiency -= (simulatedTemperature - 25) * 0.45;
        if (simulatedTemperature < 20) baseEfficiency += (20 - simulatedTemperature) * 0.1;
        const simulatedEfficiency = Math.max(80, Math.min(99, parseFloat(baseEfficiency.toFixed(1))));

        const panelMaxPowerW = 100;
        const normalizedIntensity = (intensity / 4095) * 1000; // Convert ADC to lux
        const powerGeneratedW = (normalizedIntensity / 1000) * panelMaxPowerW * (simulatedEfficiency / 100);
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
          ldrValue,
          intensity,
          servoAngle,
          motionDetected,
          distance,
          ledStatus,
          isNight,
          energy: simulatedEnergyValue,
          efficiency: simulatedEfficiency,
          battery: simulatedBattery,
          temperature: simulatedTemperature,
          humidity: firebaseData.humidity || 0, // Real DHT11 humidity
        };
        
        setLatestData(mappedData);
        
        // Save to historical data every minute and persist to localStorage
        const currentTimestamp = Date.now();
        if (currentTimestamp - lastHistoryUpdate.current > 60 * 1000) {
            setHistoricalData(prev => {
              const updated = [...prev, mappedData];
              saveHistoryToStorage(updated); // Persist to localStorage
              return updated;
            });
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
        fetchLatestData(); // Fetch immediately
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
    timestamp: new Date().toISOString(),
    ldrValue: 0,
    intensity: 0,
    servoAngle: 0,
    motionDetected: false,
    distance: 0,
    ledStatus: false,
    isNight: false,
    energy: 0,
    efficiency: 0,
    battery: 0,
    temperature: 0,
  };

  return { latestData: latestData ?? defaultData, historicalData, isLoading, isDataAvailable };
};
