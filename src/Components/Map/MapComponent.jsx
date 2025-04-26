import React, { useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './MapComponent.css'; 
import Sidebar from '../Sidebar/Sidebar';
import Candle from '../Candle/Candle';

const defaultCenter = [38.9072, -77.0369];
const defaultZoom = 8;

if (!localStorage.getItem("userID")) {
  localStorage.setItem("userID", crypto.randomUUID());
}

const currentUserID = localStorage.getItem("userID");
console.log("Current User ID:", currentUserID);

const MapClickHandler = ({ onMapClick }) => {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng);
    },
  });
  return null;
};

const MapComponent = () => {
  const mapRef = useRef();
  const [markers, setMarkers] = useState(() => {
    const stored = localStorage.getItem('candleMarkers');
    if (stored) {
      return JSON.parse(stored)
        .filter(marker => marker !== null)
        .map(marker => ({
          ...marker,
          userTimestamp: marker.userTimestamp ? marker.userTimestamp : marker.timestamp // fallback if missing
        }));
    }
    return [];
  });
  

  const [tempMarker, setTempMarker] = useState(null);
  const [lastAction, setLastAction] = useState('');

  const handleMapClick = (latlng) => {
    const creatorTimestamp = new Date().toISOString(); // UTC timestamp
    const userTimestamp = new Date(); // Local user timestamp as a Date object
  
    setTempMarker({
      id: crypto.randomUUID(),
      position: [latlng.lat, latlng.lng],
      emotion: '',
      timestamp: creatorTimestamp,  // UTC timestamp
      userTimestamp: userTimestamp, // Local timestamp as Date object
      userID: currentUserID,
    });
  
    setLastAction(`Marker placed at ${latlng.lat.toFixed(4)}, ${latlng.lng.toFixed(4)}`);
  };
  

  const handleSave = () => {
    if (!tempMarker?.emotion) {
      alert("Please select an emotion.");
      return;
    }

    const updatedMarkers = [...markers, tempMarker];
    setMarkers(updatedMarkers);

    localStorage.setItem('candleMarkers', JSON.stringify(updatedMarkers));
    setTempMarker(null);
    setLastAction(`Marker saved at ${tempMarker.position[0].toFixed(4)}, ${tempMarker.position[1].toFixed(4)}`);
  };

  const handleDelete = (idToDelete) => {
    const updatedMarkers = markers.filter(marker => marker.id !== idToDelete);
    setMarkers(updatedMarkers);
    localStorage.setItem('candleMarkers', JSON.stringify(updatedMarkers)); 
    setLastAction(`Marker with ID ${idToDelete} deleted`);
  };

  return (
    <>
      <div style={{
        position: 'fixed',
        bottom: '10px',
        left: '10px',
        backgroundColor: 'rgba(0,0,0,0.7)',
        color: 'white',
        padding: '10px',
        borderRadius: '8px',
        fontSize: '12px',
        zIndex: 1000
      }}>
        <div><strong>Debug Panel</strong></div>
        <div>User ID: {currentUserID}</div>
        <div>Markers: {markers.length}</div>
        <div>Last Action: {lastAction || 'No action yet'}</div>
      </div>

      <Sidebar />
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

        <MapClickHandler onMapClick={handleMapClick} />

        {/* Existing markers */}
        {markers.map(marker => (
          marker && (
            <Candle
              key={marker.id}
              id={marker.id}
              position={marker.position}
              emotion={marker.emotion}
              timestamp={marker.timestamp}
              userTimestamp={marker.userTimestamp} // Pass user time to Candle
              handleDelete={handleDelete}
            />
          )
        ))}

        {tempMarker && (
          <Candle
            key={tempMarker.id}
            id={tempMarker.id}
            position={tempMarker.position}
            emotion={tempMarker.emotion}
            timestamp={tempMarker.timestamp}
            userTimestamp={tempMarker.userTimestamp} // Pass user time to Candle
            isTemp={true}
            setTempMarker={setTempMarker}
            handleSave={handleSave}
          />
        )}
      </MapContainer>
    </>
  );
};

export default MapComponent;
