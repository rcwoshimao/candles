import React from 'react';
import { Marker, Popup, useMap } from 'react-leaflet';
import { format } from 'date-fns';
import L from 'leaflet';
import './Candle.css';

const Candle = ({
  id,
  position,
  emotion,
  handleDelete,
  isTemp,
  setTempMarker,
  handleSave,
  userTimestamp,
  timestamp,
}) => {
  const map = useMap();
  const zoom = map.getZoom();

  // Scale marker size based on zoom level (but not 1:1)
  //const safeZoom = !isNaN(zoom) ? zoom : 8;  // Fallback to 8 if zoom is invalid
  const baseSize = 10;  // Base size at zoom 0
  const scaleFactor = 1.2; // Determines how quickly the size increases with zoom

  // Logarithmic scale for smoother scaling
  const size = Math.max(10, Math.min(1, baseSize * Math.pow(scaleFactor, zoom)));



  console.log("zoom", zoom, "size", size); // Now should never show NaN


  const candleIcon = L.divIcon({
    className: '',
    html: `<div class="glow-dot" style="width:${size}px;height:${size}px;"></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });

  let formattedUserTime = 'Invalid date';
  let formattedCreatorTime = 'Invalid date';
  
  try {
    formattedUserTime = format(new Date(userTimestamp), 'yyyy-MM-dd HH:mm:ss');
  } catch (e) {
    console.warn('Invalid userTimestamp:', userTimestamp);
  }
  
  try {
    formattedCreatorTime = format(new Date(timestamp), 'yyyy-MM-dd HH:mm:ss');
  } catch (e) {
    console.warn('Invalid creatorTimestamp:', timestamp);
  }
  
  return (
    <Marker position={position} icon={candleIcon}>
      <Popup>
        {isTemp ? (
          <div>
            <label>
              Emotion:
              <select
                value={emotion}
                onChange={(e) => setTempMarker((prev) => ({ ...prev, emotion: e.target.value }))}
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
            <button onClick={handleSave}>Save Candle</button>
            <button onClick={() => setTempMarker(null)} style={{ marginLeft: '8px' }}>
              Cancel
            </button>
          </div>
        ) : (
          <div>
            <p><strong>Emotion:</strong> {emotion}</p>
            <p><small><strong>Viewed at (Your Local Time):</strong> {formattedUserTime}</small></p>
            <p><small><strong>Placed at (Creator's Time):</strong> {formattedCreatorTime}</small></p>
            <button onClick={() => handleDelete(id)}>Delete</button>
          </div>
        )}
      </Popup>
    </Marker>
  );
};

export default Candle;
