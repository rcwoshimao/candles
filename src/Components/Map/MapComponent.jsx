import React, { useState, useRef, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './MapComponent.css'; 
import Sidebar from '../Sidebar/Sidebar';
import Candle from '../Candle/Candle';
import { supabase } from '../../lib/supabase';

const defaultCenter = [38.9072, -77.0369];
const defaultZoom = 8;

if (!localStorage.getItem("userID")) {
  localStorage.setItem("userID", crypto.randomUUID());
}

const currentUserID = localStorage.getItem("userID");
console.log("Current User ID:", currentUserID);

const USER_CANDLES_KEY = 'userCandles';

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
  const [markers, setMarkers] = useState([]);
  const [tempMarker, setTempMarker] = useState(null);
  const [lastAction, setLastAction] = useState('');
  const [userCandles, setUserCandles] = useState(() => {
    const saved = localStorage.getItem(USER_CANDLES_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  // Save user's candles to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(USER_CANDLES_KEY, JSON.stringify(userCandles));
  }, [userCandles]);

  // Fetch markers from Supabase on component mount
  useEffect(() => {
    const fetchMarkers = async () => {
      try {
        const { data, error } = await supabase
          .from('markers')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;

        if (data) {
          const markersWithUserInfo = data.map(marker => ({
            ...marker,
            userTimestamp: new Date(marker.user_timestamp),
            isUserCandle: marker.user_id === currentUserID
          }));
          setMarkers(markersWithUserInfo);
        }
      } catch (error) {
        console.error('Error fetching markers:', error);
        setLastAction('Error fetching markers');
      }
    };

    fetchMarkers();
  }, []);

  const handleMapClick = (latlng) => {
    const creatorTimestamp = new Date().toISOString();
    const userTimestamp = new Date();
  
    setTempMarker({
      position: [latlng.lat, latlng.lng],
      emotion: '',
      timestamp: creatorTimestamp,
      userTimestamp: userTimestamp,
      userID: currentUserID,
    });
  
    setLastAction(`Marker placed at ${latlng.lat.toFixed(4)}, ${latlng.lng.toFixed(4)}`);
  };
  
  const handleSave = async () => {
    if (!tempMarker?.emotion) {
      alert("Please select an emotion.");
      return;
    }
  
    try {
      const { data, error } = await supabase
        .from('markers')
        .insert([
          {
            position: tempMarker.position,
            emotion: tempMarker.emotion,
            timestamp: tempMarker.timestamp,
            user_timestamp: tempMarker.userTimestamp.toISOString(),
            user_id: tempMarker.userID,
          }
        ])
        .select()
        .single();

      if (error) throw error;

      if (data) {
        const newMarker = {
          ...data,
          userTimestamp: new Date(data.user_timestamp),
          isUserCandle: true
        };
        setMarkers(prev => [...prev, newMarker]);
        setTempMarker(null);
        setLastAction(`Marker saved at ${tempMarker.position[0].toFixed(4)}, ${tempMarker.position[1].toFixed(4)}`);
      }
    } catch (error) {
      console.error('Error saving marker:', error);
      setLastAction('Error saving marker');
    }
  };

  const handleDelete = async (idToDelete) => {
    // Find the marker to check ownership
    const markerToDelete = markers.find(marker => marker.id === idToDelete);
    
    if (!markerToDelete || markerToDelete.user_id !== currentUserID) {
      setLastAction('You can only delete your own candles');
      return;
    }

    try {
      const { error } = await supabase
        .from('markers')
        .delete()
        .eq('id', idToDelete)
        .eq('user_id', currentUserID); // Extra safety check on the database level

      if (error) throw error;

      setMarkers(prev => prev.filter(marker => marker.id !== idToDelete));
      setLastAction(`Your candle deleted`);
    } catch (error) {
      console.error('Error deleting marker:', error);
      setLastAction('Error deleting marker');
    }
  };

  const worldBounds = [
    [-85, -180], // Southwest
    [85, 180]    // Northeast
  ];
  
  return (
    <>
      <div className="debug-panel">
        <div><strong>Debug Panel</strong></div>
        <div>User ID: {currentUserID}</div>
        <div>Markers: {markers.length}</div>
        <div>Last Action: {lastAction || 'No action yet'}</div>
      </div>

      <div className="marker-actions-panel">
        <button onClick={async () => {
          try {
            // Delete all markers from Supabase
            const { error } = await supabase
              .from('markers')
              .delete()
              .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all markers

            if (error) throw error;

            setMarkers([]);
            setUserCandles([]);
            setLastAction('All markers deleted');
          } catch (error) {
            console.error('Error deleting all markers:', error);
            setLastAction('Error deleting all markers');
          }
        }}>
          Clear All Markers
        </button>

        <button onClick={async () => {
          try {
            const randomOffset = (scale = 5) => (Math.random() - 0.5) * scale;
            const sampleMarker = {
              position: [
                38.9072 + randomOffset(), // random latitude near DC
                -77.0369 + randomOffset() // random longitude near DC
              ],
              emotion: ['happy', 'sad', 'disgusted', 'angry', 'surprised', 'tired', 'fearful'][Math.floor(Math.random() * 7)], // random emotion from new set
              timestamp: new Date().toISOString(),
              user_timestamp: new Date().toISOString(),
              user_id: currentUserID,
            };

            const { data, error } = await supabase
              .from('markers')
              .insert([sampleMarker])
              .select()
              .single();

            if (error) throw error;

            if (data) {
              const newMarker = {
                ...data,
                userTimestamp: new Date(data.user_timestamp),
                isUserCandle: true
              };
              setMarkers(prev => [...prev, newMarker]);
              // Add to user's candles
              setUserCandles(prev => [...prev, data.id]);
              setLastAction('Random sample marker added');
            }
          } catch (error) {
            console.error('Error adding random marker:', error);
            setLastAction('Error adding random marker');
          }
        }}>
          Add Random Sample Marker
        </button>
      </div>

      <Sidebar markers={markers}/>
      <MapContainer
        ref={mapRef}
        center={defaultCenter}
        zoom={defaultZoom}
        minZoom={0}
        maxZoom={18}
        maxBounds={worldBounds}
        maxBoundsViscosity={1.0}
        className="MapContainer map-container"
      >
        <TileLayer
          className='tile-layer'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        <MapClickHandler onMapClick={handleMapClick} />

        {markers.map(marker => (
          marker && (
            <Candle
              key={marker.id}
              id={marker.id}
              position={marker.position}
              emotion={marker.emotion}
              timestamp={marker.timestamp}
              userTimestamp={marker.userTimestamp}
              handleDelete={handleDelete}
              isUserCandle={marker.isUserCandle}
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
            userTimestamp={tempMarker.userTimestamp}
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
