import React, { useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './MapComponent.css'; 
import Candle from '../Candle/Candle';

const defaultCenter = [38.9072, -77.0369];
const defaultZoom = 8;

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
    const saved = localStorage.getItem('candleMarkers');
    return saved ? JSON.parse(saved) : [];
  });

  

  const [tempMarker, setTempMarker] = useState(null);
  const [formData, setFormData] = useState({ emotion: '' });


  const handleMapClick = (latlng) => {
    setTempMarker(latlng);
    setFormData({ emotion: '', note: '' });
  };

  const handleSubmit = () => {
    const newMarker = {
      id: Date.now(),
      position: [tempMarker.lat, tempMarker.lng],
      emotion: formData.emotion,
      timestamp: new Date().toISOString(),
    };
    const updatedMarkers = [...markers, newMarker];
    setMarkers(updatedMarkers);
    localStorage.setItem('candleMarkers', JSON.stringify(updatedMarkers));
    setTempMarker(null);
  };
  
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

      <MapClickHandler onMapClick={handleMapClick} />

      {markers.map(marker => (
        <Candle
          key={marker.id}
          id={marker.id}
          position={marker.position}
          emotion={marker.emotion}
          note={marker.note}
          timestamp={marker.timestamp}
        />
      ))}

      {tempMarker && (
        <Marker position={[tempMarker.lat, tempMarker.lng]}>
          <Popup>
            <div>
              <label>
                Emotion:
                <select
                  value={formData.emotion}
                  onChange={(e) => setFormData({ ...formData, emotion: e.target.value })}
                >
                  <option value="">Select</option>
                  <option value="joy">Joy</option>
                  <option value="sadness">Sadness</option>
                  <option value="love">Love</option>
                  <option value="anger">Anger</option>
                  <option value="lonely">Lonely</option>
                </select>
              </label>
              <br />
              <button onClick={handleSubmit}>Save Candle</button>
            </div>
          </Popup>

        </Marker>
      )}
    </MapContainer>
  );
};

export default MapComponent;
