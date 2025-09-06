
export interface GPS {
  lat: number;
  lng: number;
}

export interface SolarData {
  timestamp: string;
  energy: number;
  efficiency: number;
  battery: number;
  intensity: number;
  temperature: number;
  gps: GPS;
}

export type ViewType = 'dashboard' | 'analytics';
