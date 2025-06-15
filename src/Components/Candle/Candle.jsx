import React, { useMemo } from 'react';
import { Marker, Popup, useMap } from 'react-leaflet';
import { format } from 'date-fns';
import L from 'leaflet';
import './Candle.css';

// Memoize the random flicker function to avoid recalculation
const getRandomFlicker = (() => {
  const flickers = new Map();
  return (id) => {
    if (!flickers.has(id)) {
      flickers.set(id, Math.floor(Math.random() * 3) + 1);
    }
    return flickers.get(id);
  };
})();

const Candle = React.memo(({
  id,
  position,
  emotion,
  handleDelete,
  isTemp,
  setTempMarker,
  handleSave,
  userTimestamp,
  timestamp,
  isUserCandle,
}) => {
  const map = useMap();
  const zoom = map.getZoom();

  // Memoize size calculations
  const { size, sizeClass } = useMemo(() => {
    const baseSize = 10;
    const scaleFactor = 1.2;
    const size = Math.max(10, Math.min(1, baseSize * Math.pow(scaleFactor, zoom)));
    return {
      size,
      sizeClass: size <= 10 ? "small" : size <= 15 ? "medium" : "large"
    };
  }, [zoom]);

  // Memoize the icon creation
  const candleIcon = useMemo(() => {
    return L.divIcon({
      className: '',
      html: `<div class="glow-dot" data-emotion="${emotion}" data-size="${sizeClass}" data-flicker="${getRandomFlicker(id)}"></div>`,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
      popupAnchor: [0, -size / 2],
    });
  }, [emotion, sizeClass, size, id]);

  // Memoize formatted dates
  const { formattedUserTime, formattedCreatorTime } = useMemo(() => {
    let userTime = 'Invalid date';
    let creatorTime = 'Invalid date';
    
    try {
      userTime = format(new Date(userTimestamp), 'yyyy-MM-dd HH:mm:ss');
    } catch (e) {
      console.warn('Invalid userTimestamp:', userTimestamp);
    }
    
    try {
      creatorTime = format(new Date(timestamp), 'yyyy-MM-dd HH:mm:ss');
    } catch (e) {
      console.warn('Invalid creatorTimestamp:', timestamp);
    }

    return { formattedUserTime: userTime, formattedCreatorTime: creatorTime };
  }, [userTimestamp, timestamp]);

  // For temporary candles, we don't show a popup
  if (isTemp) {
    return (
      <Marker 
        position={position} 
        icon={candleIcon}
        draggable={true}
        eventHandlers={{
          dragend: (e) => {
            const newPos = e.target.getLatLng();
            setTempMarker(prev => ({
              ...prev,
              position: [newPos.lat, newPos.lng]
            }));
          },
          click: handleSave
        }}
      />
    );
  }

  // For permanent candles, show the info popup
  return (
    <Marker position={position} icon={candleIcon}>
      <Popup>
        <div>
          <p><strong>Emotion:</strong> {emotion}</p>
          <p><small><strong>Viewed at (Your Local Time):</strong> {formattedUserTime}</small></p>
          <p><small><strong>Placed at (Creator's Time):</strong> {formattedCreatorTime}</small></p>
          {isUserCandle && (
            <button 
              onClick={() => handleDelete(id)}
              className="delete-button"
            >
              Delete My Candle
            </button>
          )}
        </div>
      </Popup>
    </Marker>
  );
});

Candle.displayName = 'Candle';

export default Candle;
