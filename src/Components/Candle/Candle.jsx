import React from 'react';
import { Marker, Popup } from 'react-leaflet';

import { format } from 'date-fns';  // Or use moment.js if preferred

const Candle = ({ 
  id, 
  position, 
  emotion, 
  handleDelete, 
  isTemp, 
  setTempMarker, 
  handleSave, 
  userTimestamp,   
  timestamp // <-- here (instead of creatorTime)
}) => {
  const formattedUserTime = format(new Date(userTimestamp), 'yyyy-MM-dd HH:mm:ss'); 
  const formattedCreatorTime = format(new Date(timestamp), 'yyyy-MM-dd HH:mm:ss');

  return (
    <Marker position={position}>
      <Popup>
        {isTemp ? (
          <div>
            <label>
              Emotion:
              <select
                value={emotion}
                onChange={(e) => setTempMarker(prev => ({ ...prev, emotion: e.target.value }))}
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
