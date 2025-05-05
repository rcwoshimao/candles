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
  //const size = Math.max(10, 30 - (18 - zoom) * 2); // example logic
  const size = Math.max(6, Math.min(40, 1 + Math.pow(zoom - 8, 1.7)));

  const candleIcon = L.divIcon({
    className: '',
    html: `<div class="glow-dot" style="width:${size}px;height:${size}px;"></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });

  const formattedUserTime = format(new Date(userTimestamp), 'yyyy-MM-dd HH:mm:ss');
  const formattedCreatorTime = format(new Date(timestamp), 'yyyy-MM-dd HH:mm:ss');

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
