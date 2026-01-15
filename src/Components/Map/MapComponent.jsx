import React, { useState, useRef, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './MapComponent.css'; 
import Sidebar from '../Sidebar/Sidebar';
import Candle from '../Candle/Candle';
import CreateCandleControls from '../CreateCandle/CreateCandleControls';
import emotions from '../Candle/emotions.json';
import { supabase } from '../../lib/supabase';
import L from 'leaflet';

const defaultCenter = [38.9072, -77.0369];
const defaultZoom = 8;

if (!localStorage.getItem("userID")) {
  localStorage.setItem("userID", crypto.randomUUID());
}

const currentUserID = localStorage.getItem("userID");
console.log("Current User ID:", currentUserID);

const USER_CANDLES_KEY = 'userCandles';

const ALL_EMOTION_LEAVES = Object.values(emotions).flatMap((midLevels) =>
  Object.values(midLevels).flat()
);

const getRandomLeafEmotion = () => {
  return ALL_EMOTION_LEAVES[Math.floor(Math.random() * ALL_EMOTION_LEAVES.length)];
};

// Create a separate component for map click handling
const MapClickHandler = ({ onMapClick, currentStep }) => {
  useMapEvents({
    click: (e) => {
      console.log('Map click event triggered, current step:', currentStep);
      if (currentStep === 2) {
        const { lat, lng } = e.latlng;
        console.log('Setting temp position:', [lat, lng]);
        onMapClick([lat, lng]);
      }
    }
  });
  return null;
};

// Create a separate component for zoom tracking
const ZoomTracker = ({ onZoomChange }) => {
  const map = useMap();
  
  useEffect(() => {
    if (map) {
      const handleZoom = () => {
        onZoomChange(map.getZoom());
      };
      
      // Set initial zoom
      onZoomChange(map.getZoom());
      
      // Add zoom event listener
      map.on('zoom', handleZoom);
      
      return () => {
        map.off('zoom', handleZoom);
      };
    }
  }, [map, onZoomChange]);
  
  return null;
};

const MapComponent = () => {
  const mapRef = useRef();
  const [markers, setMarkers] = useState([]);
  const [tempPosition, setTempPosition] = useState(null);
  const [lastAction, setLastAction] = useState('');
  const [selectedEmotion, setSelectedEmotion] = useState(null);
  const [userCandles, setUserCandles] = useState(() => {
    const saved = localStorage.getItem(USER_CANDLES_KEY);
    return saved ? JSON.parse(saved) : [];
  });
  const [zoomLevel, setZoomLevel] = useState(defaultZoom);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

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

  // Add debug logging for markers
  useEffect(() => {
    console.log('Markers updated:', markers.map(m => ({
      id: m.id,
      emotion: m.emotion,
      position: m.position,
      isUserCandle: m.isUserCandle
    })));
  }, [markers]);

  const handleMapClick = (position) => {
    console.log('handleMapClick called with position:', position);
    if (currentStep === 2 && selectedEmotion) {
      setTempPosition(position);
      setLastAction(`Candle placed at ${position[0].toFixed(4)}, ${position[1].toFixed(4)}`);
    }
  };

  const handleCreateCandle = () => {
    // Toggle behavior: click once to open, click again to close
    if (isPopupOpen) {
      handleClosePopup();
      return;
    }

    console.log('Create candle button clicked, setting isPopupOpen to true');
    setIsPopupOpen(true);
    setCurrentStep(1);
    setSelectedEmotion(null);
    setTempPosition(null);
  };

  const handleEmotionSelect = (emotion) => {
    console.log('Emotion selected:', emotion);
    setSelectedEmotion(emotion);
  };

  const handlePlaceCandle = () => {
    console.log('Place candle clicked, selected emotion:', selectedEmotion);
    if (!selectedEmotion) {
      console.log('No emotion selected, cannot proceed');
      return;
    }
    console.log('Moving to step 2, resetting temp position');
    setCurrentStep(2);
    setTempPosition(null);
  };

  const handleBackToEmotionStep = () => {
    // Go back one step in the candle-creation flow (keep popup open + keep selected emotion)
    setTempPosition(null);
    setCurrentStep(1);
  };

  const handleConfirmPlacement = async () => {
    console.log('Confirm placement clicked'); // Debug log
    if (!tempPosition || !selectedEmotion) return;

    const nowIso = new Date().toISOString();
    const newCandle = {
      position: tempPosition,
      emotion: selectedEmotion,
      timestamp: nowIso,
      user_timestamp: nowIso,
      user_id: currentUserID,
    };

    try {
      // IMPORTANT: This assumes you've created the RPC `create_marker_rate_limited`
      // (see `supabase/sql/markers_rate_limit.sql`) and enabled RLS to block direct inserts.
      // inside handleConfirmPlacement, where you currently save the candle
    const { data, error } = await supabase.rpc('create_marker_rate_limited', {
      _emotion: selectedEmotion,
      _position: tempPosition,
      _timestamp: nowIso,
      _user_id: currentUserID,
      _user_timestamp: nowIso,
    });

      if (error) throw error;

      if (data) {
        const newMarker = {
          ...data,
          userTimestamp: new Date(data.user_timestamp),
          isUserCandle: true
        };
        setMarkers(prev => [...prev, newMarker]);
        setUserCandles(prev => [...prev, data.id]);
        setLastAction('Candle placed successfully');
      }
    } catch (error) {
      console.error('Error saving candle:', error);
      // Postgres exceptions come back as `error.message`
      setLastAction(error?.message || 'Error saving candle');
    }

    // Clean up
    setTempPosition(null);
    setSelectedEmotion(null);
    setIsPopupOpen(false);
    setCurrentStep(1);
  };

  const handleClosePopup = () => {
    console.log('Close popup clicked'); // Debug log
    setTempPosition(null);
    setSelectedEmotion(null);
    setIsPopupOpen(false);
    setCurrentStep(1);
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
    <div className="map-component-wrapper">
      <div className="marker-actions-panel">
        <button onClick={async () => {
          try {
            // Delete all markers from Supabase
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
        }}>
          Clear All Markers
        </button>

        <button onClick={async () => {
          try {
            const randomOffset = (scale = 20) => (Math.random() - 0.5) * scale;
            const sampleMarker = {
              position: [
                38.9072 + randomOffset(),
                -77.0369 + randomOffset()
              ],
              emotion: getRandomLeafEmotion(),
              timestamp: new Date().toISOString(),
              user_timestamp: new Date().toISOString(),
              user_id: currentUserID,
            };

            console.log('Adding random marker:', sampleMarker);

            const { data, error } = await supabase
              .from('markers')
              .insert([sampleMarker])
              .select()
              .single();

            if (error) {
              console.error('Error adding random marker:', error);
              setLastAction('Error adding random marker');
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
        }}>
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
        <div>Candle Size: {(() => {
          const baseSize = 12;
          const scaleFactor = 1.1;
          const size = Math.max(12, Math.min(20, baseSize * Math.pow(scaleFactor, zoomLevel - 8)));
          return `${size}px (${size <= 14 ? 'small' : size <= 17 ? 'medium' : 'large'})`;
        })()}</div>
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
        className={`MapContainer map-container ${currentStep === 2 ? 'placing-candle' : ''}`}
      >
        <TileLayer
          className='tile-layer'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {/* Add zoom tracking */}
        <ZoomTracker onZoomChange={setZoomLevel} />

        {/* Add the MapClickHandler component */}
        <MapClickHandler 
          onMapClick={handleMapClick}
          currentStep={currentStep}
        />

        {/* Render permanent markers with debug logging */}
        {markers.map(marker => {
          console.log('Rendering marker:', {
            id: marker.id,
            emotion: marker.emotion,
            position: marker.position,
            isUserCandle: marker.isUserCandle
          });
          
          return marker && (
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
          );
        })}

        {/* Debug log for temporary candle rendering */}
        {console.log('Checking temp candle render conditions:', {
          currentStep,
          hasTempPosition: !!tempPosition,
          selectedEmotion,
          shouldRender: currentStep === 2 && !!tempPosition && !!selectedEmotion
        })}

        {/* Render temporary candle */}
        {currentStep === 2 && tempPosition && selectedEmotion && (
          <Candle
            key="temp-marker"
            id="temp-marker"
            position={tempPosition}
            emotion={selectedEmotion}
            timestamp={new Date().toISOString()}
            userTimestamp={new Date()}
            isTemp={true}
            setTempMarker={setTempPosition}
            handleSave={handleConfirmPlacement}
          />
        )}

      </MapContainer>

      <CreateCandleControls
        isPopupOpen={isPopupOpen}
        onCreateCandle={handleCreateCandle}
        onClosePopup={handleClosePopup}
        onBackFromPlacement={handleBackToEmotionStep}
        selectedEmotion={selectedEmotion}
        onEmotionSelect={handleEmotionSelect}
        onPlaceCandle={handlePlaceCandle}
        onConfirmPlacement={handleConfirmPlacement}
        currentStep={currentStep}
      />
    </div>
  );
};

export default MapComponent;
