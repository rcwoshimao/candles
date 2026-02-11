import React, { useMemo, useRef, useEffect } from 'react';
import { CircleMarker, Popup, Marker } from 'react-leaflet';
import { format } from 'date-fns';
import './Candle.css';
import emotionParentMap from '../../lib/emotionParentMap';
import emotions from '../../lib/emotions.json';

// Get the parent emotion for any emotion (including sub-emotions)
const getParentEmotion = (emotion) => {
  return emotionParentMap[emotion] || emotion;
};

// Get the full emotion hierarchy path (main > mid > leaf)
const getEmotionBreadcrumb = (emotion) => {
  // Check if it's a main emotion
  if (emotions[emotion]) {
    return emotion;
  }
  
  // Search through the hierarchy to find the path
  for (const [main, midLevels] of Object.entries(emotions)) {
    // Check if it's a mid-level emotion
    if (midLevels[emotion]) {
      return `${main} > ${emotion}`;
    }
    
    // Check if it's a leaf emotion
    for (const [mid, leaves] of Object.entries(midLevels)) {
      if (leaves.includes(emotion)) {
        return `${main} > ${mid} > ${emotion}`;
      }
    }
  }
  
  // Fallback: if not found, return just the emotion
  return emotion;
};

// Memoize the random flicker function to avoid recalculation
// Now only returns 1 or 2 (simplified from 3 options)
const getRandomFlicker = (() => {
  const flickers = new Map();
  return (id) => {
    if (!flickers.has(id)) {
      flickers.set(id, Math.floor(Math.random() * 2) + 1); // Returns 1 or 2
    }
    return flickers.get(id);
  };
})();

// Cache CSS variable values once (no DOM manipulation per icon)
const getEmotionColor = (() => {
  const colorCache = new Map();
  
  // Get color from CSS variable once and cache it
  const getColor = (emotion) => {
    if (colorCache.has(emotion)) {
      return colorCache.get(emotion);
    }
    
    // Create a one-time element to read CSS variable (only on first call)
    if (typeof window !== 'undefined') {
      const testDiv = document.createElement('div');
      testDiv.className = 'glow-dot';
      testDiv.setAttribute('data-emotion', emotion);
      testDiv.style.position = 'absolute';
      testDiv.style.visibility = 'hidden';
      document.body.appendChild(testDiv);
      
      const computedStyle = window.getComputedStyle(testDiv);
      const bgColor = computedStyle.getPropertyValue(`--emotion-${emotion}`).trim() || 
                      computedStyle.getPropertyValue('background-color');
      
      document.body.removeChild(testDiv);
      
      // Resolve CSS variable references if needed
      let resolvedColor = bgColor;
      if (bgColor.startsWith('var(')) {
        // Fallback to direct color mapping
        const colorMap = {
          'happy': '#ffd24d',
          'sad': '#6b74ff',
          'disgusted': '#44de70',
          'angry': '#ff5a52',
          'surprised': '#33e0d7',
          'bad': '#9a76ff',
          'fearful': '#ff77e3',
        };
        resolvedColor = colorMap[emotion] || '#999';
      }
      
      colorCache.set(emotion, resolvedColor);
      return resolvedColor;
    }
  };
  
  return getColor;
})();

const Candle = React.memo(({
  id,
  position,
  emotion,
  handleDelete,
  isTemp,
  handleSave,
  userTimestamp,
  timestamp,
  isUserCandle,
  zoomLevel,
}) => {
  // IMPORTANT: `useMap().getZoom()` is not reactive, and this component is memoized.
  // We pass `zoomLevel` down from `MapComponent` so candles can resize on zoom.
  const zoom = typeof zoomLevel === 'number' ? zoomLevel : 8;

  // Get the parent emotion for color purposes
  const parentEmotion = useMemo(() => getParentEmotion(emotion), [emotion]);
  
  // Get the full emotion breadcrumb path
  const emotionBreadcrumb = useMemo(() => getEmotionBreadcrumb(emotion), [emotion]);
  
  // Get flicker animation number for this candle
  const flickerNumber = useMemo(() => getRandomFlicker(id), [id]);
  
  // Ref to CircleMarker for animation
  const circleRef = useRef(null);

  // Memoize size and color calculations
  const { radius, color } = useMemo(() => {
    const baseZoom = 8;
    // Size at `baseZoom`. Keep this >= your desired "normal" size.
    const baseSize = 10;
    const scalePerZoom = 1.15; // 15% bigger per zoom level
    const raw = baseSize * Math.pow(scalePerZoom, zoom - baseZoom);
    // IMPORTANT: keep the min small, otherwise candles can't shrink when zooming out.
    // CircleMarker radius is in meters, but we'll use pixel-like sizing
    const radius = Math.max(2, Math.min(20, raw)) / 2; // Divide by 2 for radius
    
    // Get emotion color (cached, no DOM manipulation)
    const emotionColor = getEmotionColor(parentEmotion);
    
    return { radius, color: emotionColor };
  }, [zoom, parentEmotion]);

  // Memoize formatted dates
  const { formattedUserTime, formattedCreatorTime } = useMemo(() => {
    let userTime = 'Invalid date';
    let creatorTime = 'Invalid date';
    
    try {
      userTime = format(new Date(userTimestamp), 'yyyy-MM-dd HH:mm:ss');
    } catch (err) {
      console.warn('Invalid userTimestamp:', userTimestamp, err);
    }
    
    try {
      creatorTime = format(new Date(timestamp), 'yyyy-MM-dd HH:mm:ss');
    } catch (err) {
      console.warn('Invalid creatorTimestamp:', timestamp, err);
    }

    return { formattedUserTime: userTime, formattedCreatorTime: creatorTime };
  }, [userTimestamp, timestamp]);

  // Conditionally apply flicker - disable when zoomed out for better performance
  // Only animate when zoom >= 7 (when candles are large enough to see flicker)
  const shouldFlicker = zoom >= 7;
  
  useEffect(() => {
    if (!circleRef.current || isTemp || !shouldFlicker) return;
    
    const circleMarker = circleRef.current.leafletElement;
    if (!circleMarker) return;

    const applyFlicker = () => {
      const element = circleMarker.getElement();
      if (element) {
        const path = element.querySelector('path');
        if (path) {
          path.setAttribute('data-flicker', flickerNumber);
          path.setAttribute('class', `glow-dot-flicker flicker-${flickerNumber}`);
        }
      }
    };

    // Try after a delay to ensure DOM is ready
    const timer = setTimeout(applyFlicker, 50);
    return () => clearTimeout(timer);
  }, [flickerNumber, isTemp, position, shouldFlicker, zoom]);

  // CircleMarker path options - optimized for performance
  const pathOptions = useMemo(() => ({
    fillColor: color,
    color: color,
    fillOpacity: 0.8,
    opacity: 1,
    weight: 0,
    className: `candle-circle flicker-${flickerNumber}`, // Add class for CSS targeting
  }), [color, flickerNumber]);

  // For temporary candles, use CircleMarker (without flicker)
  if (isTemp) {
    return (
      <CircleMarker 
        center={position}
        radius={radius}
        pathOptions={{ ...pathOptions, className: 'candle-circle' }}
        eventHandlers={{
          click: handleSave
        }}
      >
        {/* Note: Dragging not well supported with CircleMarker - consider alternative for temp candles */}
      </CircleMarker>
    );
  }

  // For permanent candles, use CircleMarker (much faster) with flicker
  return (
    <CircleMarker 
      ref={circleRef}
      center={position}
      radius={radius}
      pathOptions={pathOptions}
      eventHandlers={{
        add: () => {
          // When CircleMarker is added to map, apply flicker (only if zoomed in enough)
          if (circleRef.current && !isTemp && shouldFlicker) {
            const circleMarker = circleRef.current.leafletElement;
            if (circleMarker) {
              const element = circleMarker.getElement();
              if (element) {
                const path = element.querySelector('path');
                if (path) {
                  path.setAttribute('data-flicker', flickerNumber);
                  path.setAttribute('class', `flicker-${flickerNumber}`);
                }
              }
            }
          }
        }
      }}
    >
      <Popup>
        <div>
          <p> <strong> {emotionBreadcrumb} </strong></p>
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
    </CircleMarker>
  );
});

Candle.displayName = 'Candle';

export default Candle;
