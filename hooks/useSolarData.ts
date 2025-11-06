
import { useState, useEffect, useRef, useCallback } from 'react';
import type { SolarData } from '../types';

const initialData: SolarData = {
  timestamp: new Date().toISOString(),
  energy: 0,
  efficiency: 0,
  battery: 0,
  intensity: 0,
  temperature: 0,
  servoAngle: 45,
  motionDetected: false,
  gps: { lat: 51.5074, lng: -0.1278 },
};

export const useSolarData = (isLive: boolean) => {
  const [latestData, setLatestData] = useState<SolarData>(initialData);
  const [historicalData, setHistoricalData] = useState<SolarData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDataAvailable, setIsDataAvailable] = useState<boolean>(false);
  const intervalIdRef = useRef<number | null>(null);
  const lastHistoryUpdate = useRef<number>(0);

  const fetchLatestData = useCallback(async () => {
    try {
      const response = await fetch('https://dashboard-s37f-default-rtdb.firebaseio.com/.json');
      if (!response.ok) {
        throw new Error(`Firebase fetch failed: ${response.statusText}`);
      }
      const data = await response.json();
      if (data) {
        setIsDataAvailable(true);
        const mappedData: SolarData = {
          timestamp: new Date().toISOString(),
          energy: data.energy ?? 0,
          efficiency: data.efficiency ?? 0,
          battery: data.battery ?? 0,
          intensity: data.intensity ?? 0,
          temperature: data.temperature ?? 0,
          servoAngle: data.servoAngle ?? 45,
          motionDetected: data.motionDetected ?? false,
          gps: data.gps ?? { lat: 51.5074, lng: -0.1278 },
        };
        setLatestData(mappedData);
        
        // To build up historical data for analytics, we add a data point
        // periodically. Throttled to once per minute to avoid excessive memory usage.
        const now = Date.now();
        if (now - lastHistoryUpdate.current > 60 * 1000) {
            setHistoricalData(prev => [...prev, mappedData]);
            lastHistoryUpdate.current = now;
        }

      } else {
        setIsDataAvailable(false);
      }
    } catch (error) {
      console.error("Failed to fetch latest solar data:", error);
      setIsDataAvailable(false);
    }
  }, []);

  useEffect(() => {
    const initialFetch = async () => {
      await fetchLatestData();
      setIsLoading(false);
    };
    
    // Historical data is now collected in real-time instead of being generated.
    initialFetch();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchLatestData]);

  useEffect(() => {
    if (isLive) {
      if (intervalIdRef.current === null) {
        intervalIdRef.current = window.setInterval(() => {
            fetchLatestData();
        }, 2000);
      }
    } else {
      if (intervalIdRef.current !== null) {
        clearInterval(intervalIdRef.current);
        intervalIdRef.current = null;
      }
    }

    return () => {
      if (intervalIdRef.current !== null) {
        clearInterval(intervalIdRef.current);
      }
    };
  }, [isLive, fetchLatestData]);

  return { latestData, historicalData, isLoading, isDataAvailable };
};
