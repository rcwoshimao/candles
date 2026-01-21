import React from 'react';
import { supabase } from '../../lib/supabase';
import './DebugPanel.css';

const DebugPanel = ({
  currentUserID,
  markers,
  lastAction,
  isPopupOpen,
  currentStep,
  selectedEmotion,
  tempPosition,
  zoomLevel,
  setMarkers,
  setUserCandles,
  setLastAction,
  getRandomLeafEmotion,
}) => {
  const handleClearAllMarkers = async () => {
    try {
      const { error } = await supabase
        .from('markers')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

      if (error) throw error;

      setMarkers([]);
      setUserCandles([]);
      setLastAction('All markers deleted');
    } catch (error) {
      console.error('Error deleting all markers:', error);
      setLastAction('Error deleting all markers');
    }
  };

  const handleAddRandomMarker = async () => {
    try {
      const randomOffset = (scale = 20) => (Math.random() - 0.5) * scale;
      const nowIso = new Date().toISOString();
      const sampleMarker = {
        position: [
          38.9072 + randomOffset(),
          -77.0369 + randomOffset()
        ],
        emotion: getRandomLeafEmotion(),
        timestamp: nowIso,
        user_timestamp: nowIso,
        user_id: currentUserID,
      };

      console.log('Adding random marker:', sampleMarker);

      const { data, error } = await supabase.rpc('create_marker_rate_limited', {
        _emotion: sampleMarker.emotion,
        _position: sampleMarker.position,
        _timestamp: sampleMarker.timestamp,
        _user_id: sampleMarker.user_id,
        _user_timestamp: sampleMarker.user_timestamp,
      });

      if (error) {
        console.error('Error adding random marker:', error);
        const msg = error?.message || 'Error adding random marker';
        setLastAction(msg);
        
        // Log rejections (especially rate-limit errors) to database
        const isRateLimit = msg.toLowerCase().includes('rate limit') || 
                            error?.code === 'P0001' ||
                            error?.details?.includes('P0001');
        
        if (isRateLimit) {
          console.log('Logging rejection from random marker button...', { 
            user_id: currentUserID, 
            reason: msg,
            payload: sampleMarker
          });
          
          if (currentUserID) {
            supabase.rpc('log_marker_rejection', {
              _user_id: currentUserID,
              _reason: msg,
              _payload: {
                emotion: sampleMarker.emotion,
                position: sampleMarker.position,
                timestamp: sampleMarker.timestamp,
              },
            }).then(({ error: logError }) => {
              if (logError) {
                console.error('Failed to log rejection - RPC error:', logError);
              } else {
                console.log('Rejection logged successfully from random marker');
              }
            }).catch((logError) => {
              console.error('Exception while logging rejection:', logError);
            });
          }
        }
        return;
      }

      if (data) {
        const newMarker = {
          ...data,
          userTimestamp: new Date(data.user_timestamp),
          isUserCandle: true
        };
        console.log('Random marker added successfully:', newMarker);
        setMarkers(prev => [...prev, newMarker]);
        setUserCandles(prev => [...prev, data.id]);
        setLastAction('Random sample marker added');
      }
    } catch (error) {
      console.error('Error in random marker button:', error);
      setLastAction('Error adding random marker');
    }
  };

  const calculateCandleSize = () => {
    const baseSize = 5;
    const scaleFactor = 0.5;
    const size = Math.max(
      2,
      Math.min(
        20,
        baseSize * Math.pow(scaleFactor, 8 - zoomLevel)
      )
    );
    return `${size.toFixed(1)}px (${size <= 4 ? 'small' : size <= 7 ? 'medium' : 'large'})`;
  };

  return (
    <div className="debug-panel">
      <button onClick={handleClearAllMarkers}>
        Clear All Markers
      </button>
      <button onClick={handleAddRandomMarker}>
        Add Random Sample Marker
      </button>
      <div><strong>Debug Panel</strong></div>
      <div>User ID: {currentUserID}</div>
      <div>Markers: {markers.length}</div>
      <div>Last Action: {lastAction || 'No action yet'}</div>
      <div>Popup Open: {isPopupOpen ? 'Yes' : 'No'}</div>
      <div>Current Step: {currentStep}</div>
      <div>Selected Emotion: {selectedEmotion || 'None'}</div>
      <div>Temp Position: {tempPosition ? `${tempPosition[0].toFixed(4)}, ${tempPosition[1].toFixed(4)}` : 'None'}</div>
      <div>Zoom Level: {zoomLevel}</div>
      <div>Candle Size: {calculateCandleSize()}</div>
    </div>
  );
};

export default DebugPanel;
