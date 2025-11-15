
export interface SolarData {
  timestamp: string;
  // Real hardware values from ESP32
  ldrValue: number;           // Raw LDR reading (0-4095)
  intensity: number;          // Light intensity (same as ldrValue for compatibility)
  servoAngle: number;         // Servo position (0-180°)
  motionDetected: boolean;    // Motion sensor status
  distance: number;           // Ultrasonic distance in cm
  ledStatus: boolean;         // LED ON/OFF status
  isNight: boolean;           // Day/Night mode
  // DHT11 sensor values
  temperature: number;        // Real DHT11 temperature (°C)
  humidity: number;           // Real DHT11 humidity (%)
  // Simulated/calculated values
  energy: number;             // Calculated energy output
  efficiency: number;         // Calculated solar efficiency
  battery: number;            // Simulated battery level
}

export type ViewType = 'dashboard' | 'analytics';
