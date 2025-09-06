
import React, { useEffect, useRef } from 'react';
import type { GPS } from '../types';

declare const L: any; // Use Leaflet from global scope

interface MapViewProps {
  gps: GPS;
}

const MapView: React.FC<MapViewProps> = ({ gps }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  useEffect(() => {
    if (mapContainerRef.current && !mapRef.current) {
      const map = L.map(mapContainerRef.current).setView([gps.lat, gps.lng], 13);
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20
      }).addTo(map);

      const icon = L.divIcon({
          className: 'custom-div-icon',
          html: "<div class='marker-pin'></div><div class='marker-pulse'></div>",
          iconSize: [30, 42],
          iconAnchor: [15, 42]
      });
      
      const marker = L.marker([gps.lat, gps.lng], { icon }).addTo(map);

      mapRef.current = map;
      markerRef.current = marker;
      
      const style = document.createElement('style');
      style.innerHTML = `
        .marker-pin {
            width: 30px;
            height: 30px;
            border-radius: 50% 50% 50% 0;
            background: #0ea5e9; /* sky-500 */
            position: absolute;
            transform: rotate(-45deg);
            left: 50%;
            top: 50%;
            margin: -15px 0 0 -15px;
        }
        .marker-pin::after {
            content: '';
            width: 14px;
            height: 14px;
            margin: 8px 0 0 8px;
            background: #020617; /* slate-900 */
            position: absolute;
            border-radius: 50%;
        }
        .marker-pulse {
            background: rgba(14, 165, 233, 0.5);
            border-radius: 50%;
            height: 40px;
            width: 40px;
            position: absolute;
            left: 50%;
            top: 50%;
            margin: -20px 0 0 -20px;
            transform: rotateX(55deg);
            z-index: -2;
            animation: pulsate 1.5s ease-out infinite;
        }
        @keyframes pulsate {
            0% { transform: scale(0.1, 0.1); opacity: 0; }
            50% { opacity: 1; }
            100% { transform: scale(1.2, 1.2); opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (mapRef.current && markerRef.current) {
        const newLatLng = L.latLng(gps.lat, gps.lng);
        markerRef.current.setLatLng(newLatLng);
        mapRef.current.panTo(newLatLng);
    }
  }, [gps]);

  return <div ref={mapContainerRef} className="bg-slate-900/50 rounded-xl border border-slate-700 shadow-lg h-full min-h-[250px] z-0" />;
};

export default MapView;
