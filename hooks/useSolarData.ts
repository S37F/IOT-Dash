
import { useState, useEffect, useRef, useCallback } from 'react';
import type { SolarData } from '../types';

const generateHistoricalData = (): SolarData[] => {
  const data: SolarData[] = [];
  const now = new Date();
  for (let i = 365 * 24; i > 0; i--) { // a year of hourly data
    const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000);
    const hour = timestamp.getHours();
    
    // Simulate day/night cycle for energy, intensity
    const isDay = hour > 6 && hour < 20;
    const intensity = isDay ? Math.random() * 800 + 200 : Math.random() * 50;
    const energy = isDay ? parseFloat((Math.random() * 15 + 10 + Math.sin(hour/24 * Math.PI) * 10).toFixed(1)) : 0;
    const servoAngle = isDay ? Math.round(90 + 75 * Math.sin(((hour - 6) / 14) * Math.PI)) : 0;
    
    data.push({
      timestamp: timestamp.toISOString(),
      energy: energy,
      efficiency: parseFloat((Math.random() * 15 + 80).toFixed(0)),
      battery: parseFloat((Math.random() * 40 + 60).toFixed(0)), // Assume mostly charged
      intensity: parseFloat(intensity.toFixed(0)),
      temperature: parseFloat((Math.random() * 15 + 15).toFixed(0)),
      servoAngle: servoAngle,
      motionDetected: Math.random() < 0.05, // 5% chance of motion detection in the past
      gps: { lat: 51.5074, lng: -0.1278 }, // Static London location
    });
  }
  return data;
};

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
  const intervalIdRef = useRef<number | null>(null);

  const fetchLatestData = useCallback(async () => {
    try {
      const response = await fetch('https://dashboard-s37f-default-rtdb.firebaseio.com/.json');
      if (!response.ok) {
        throw new Error(`Firebase fetch failed: ${response.statusText}`);
      }
      const data = await response.json();
      if (data) {
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
      }
    } catch (error) {
      console.error("Failed to fetch latest solar data:", error);
    }
  }, []);

  useEffect(() => {
    setHistoricalData(generateHistoricalData());
    fetchLatestData();
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

  return { latestData, historicalData };
};
