import React, { useRef } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './MapComponent.css'; 
import Candle from '../Candle/Candle';

const mockMarkers = [
  {
    id: 1,
    position: [38.9072, -77.0369],
    emotion: 'joy',
    timestamp: '2025-04-25T10:45:00Z'
  },
  // more...
];



const defaultCenter = [38.9072, -77.0369];
const defaultZoom = 8;

const MapComponent = () => {
  const mapRef = useRef();

  return (
    <MapContainer
      ref={mapRef}
      center={defaultCenter}
      zoom={defaultZoom}
      style={{ height: '100vh', width: '100vw' }}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />

      {mockMarkers.map(marker => (
        <Candle
          key={marker.id}
          id={marker.id}
          position={marker.position}
          emotion={marker.emotion}
          note={marker.note}
          timestamp={marker.timestamp}
        />
      ))}
    </MapContainer>
  );
};

export default MapComponent;
