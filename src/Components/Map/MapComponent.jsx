import React, { useRef } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './MapComponent.css'; 

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
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
    </MapContainer>
  );
};

export default MapComponent;
