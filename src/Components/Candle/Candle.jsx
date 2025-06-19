import React, { useMemo } from 'react';
import { Marker, Popup, useMap } from 'react-leaflet';
import { format } from 'date-fns';
import L from 'leaflet';
import './Candle.css';

// Map sub-emotions to their parent emotions
const emotionMapping = {
  // Happy sub-emotions
  'amused': 'happy',
  'delighted': 'happy',
  'jovial': 'happy',
  'blissful': 'happy',
  // Sad sub-emotions
  'depressed': 'sad',
  'sorrow': 'sad',
  'grief': 'sad',
  'lonely': 'sad',
  // Angry sub-emotions
  'frustrated': 'angry',
  'annoyed': 'angry',
  'irritated': 'angry',
  'enraged': 'angry',
  // Surprised sub-emotions
  'amazed': 'surprised',
  'astonished': 'surprised',
  'shocked': 'surprised',
  'confused': 'surprised',
  // Disgusted sub-emotions
  'revolted': 'disgusted',
  'contempt': 'disgusted',
  'aversion': 'disgusted',
  'repulsed': 'disgusted',
  // Fearful sub-emotions
  'anxious': 'fearful',
  'scared': 'fearful',
  'terrified': 'fearful',
  'nervous': 'fearful',
  // Tired sub-emotions
  'exhausted': 'tired',
  'drained': 'tired',
  'weary': 'tired',
  'fatigued': 'tired'
};

// Get the parent emotion for any emotion (including sub-emotions)
const getParentEmotion = (emotion) => {
  return emotionMapping[emotion] || emotion;
};

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

  // Get the parent emotion for color purposes
  const parentEmotion = useMemo(() => getParentEmotion(emotion), [emotion]);

  // Memoize size calculations
  const { size, sizeClass } = useMemo(() => {
    const baseSize = 8; // Moderate base size
    const scaleFactor = 1.2; 
    const size = Math.max(8, Math.min(20, baseSize * Math.pow(scaleFactor, zoom - 8))); // Normal scaling
    return {
      size,
      sizeClass: size <= 14 ? "small" : size <= 17 ? "medium" : "large" // Adjusted thresholds
    };
  }, [zoom]);

  // Memoize the icon creation
  const candleIcon = useMemo(() => {
    console.log('Creating candle icon:', { emotion, parentEmotion, sizeClass, size, id });
    
    // Create a div element to test CSS variable application
    const testDiv = document.createElement('div');
    testDiv.className = 'glow-dot';
    testDiv.setAttribute('data-emotion', parentEmotion);
    document.body.appendChild(testDiv);
    
    // Get computed styles to verify CSS variables
    const computedStyle = window.getComputedStyle(testDiv);
    const bgColor = computedStyle.getPropertyValue(`--emotion-${parentEmotion}`).trim();
    const glowEffect = computedStyle.getPropertyValue(`--glow-${parentEmotion}`).trim();
    
    console.log('CSS Variables:', { bgColor, glowEffect });
    
    // Remove test div
    document.body.removeChild(testDiv);

    const iconHtml = `
      <span class="glow-dot-wrap" data-emotion="${parentEmotion}">
        <div class="glow-dot" 
             data-emotion="${parentEmotion}" 
             data-size="${sizeClass}" 
             data-flicker="${getRandomFlicker(id)}"
             style="
               background-color: ${bgColor || 'var(--emotion-' + parentEmotion + ')'}; 
               box-shadow: ${glowEffect || 'var(--glow-' + parentEmotion + ')'};
               width: ${size}px;
               height: ${size}px;
             ">
        </div>
      </span>
    `;
    
    return L.divIcon({
      className: 'candle-marker',
      html: iconHtml,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
      popupAnchor: [0, -size / 2],
    });
  }, [emotion, parentEmotion, sizeClass, size, id]);

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
            setTempMarker([newPos.lat, newPos.lng]);
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
          {emotion !== parentEmotion && (
            <p><small><em>(Category: {parentEmotion})</em></small></p>
          )}
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
