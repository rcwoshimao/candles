import React from 'react';
import { Marker, Popup } from 'react-leaflet';

const Candle = ({ id, position, emotion, timestamp }) => {
  return (
    <Marker position={position}>
      <Popup>
        <small>{emotion}</small>
        <br />
        <small>{new Date(timestamp).toLocaleString()}</small>
      </Popup>
    </Marker>
  );
};

export default Candle;
