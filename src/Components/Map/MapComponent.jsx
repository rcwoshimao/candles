import React, { useState, useRef, useEffect } from 'react';
import { MapContainer, TileLayer, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './MapComponent.css'; 
import Sidebar from '../Sidebar/Sidebar';
import LocateButton from '../LocateButton/LocateButton'; 
import Candle from '../Candle/Candle';
import CreateCandleControls from '../CreateCandle/CreateCandleControls';
import DebugPanel from '../DebugPanel/DebugPanel';
import LoadingScreen from '../LoadingScreen/LoadingScreen';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import emotions from '../../lib/emotions.json';
import { supabase } from '../../lib/supabase';
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
  const [isLoading, setIsLoading] = useState(true);
  const [showLoadingScreen, setShowLoadingScreen] = useState(true);
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
  const [toastMessage, setToastMessage] = useState('');
  const toastTimerRef = useRef(null);

  const showToast = (message) => {
    if (!message) return;
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    setToastMessage(message);
    toastTimerRef.current = window.setTimeout(() => {
      setToastMessage('');
      toastTimerRef.current = null;
    }, 3200);
  };

  // Save user's candles to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(USER_CANDLES_KEY, JSON.stringify(userCandles));
  }, [userCandles]);

  // Fetch markers from Supabase on component mount
  useEffect(() => {
    setIsLoading(true);
    const fetchMarkers = async () => {
      try {
        // Supabase defaults to 1000 row limit per query. Fetch in batches to get all markers.
        // Use smaller batches (1000) to work within Supabase's default limits
        const BATCH_SIZE = 1000;
        const MAX_BATCHES = 1; // Max 100k rows for testing
        let allMarkers = [];
        
        // First, get total count to know how many batches we need
        const { count: totalCount, error: countError } = await supabase
          .from('markers')
          .select('*', { count: 'exact', head: true });
        
        if (countError) {
          console.warn('Could not get total count:', countError);
        } else {
          console.log(`Total markers in database: ${totalCount}`);
        }
        
        for (let batch = 0; batch < MAX_BATCHES; batch++) {
          const from = batch * BATCH_SIZE;
          const to = from + BATCH_SIZE - 1;
          
          console.log(`Fetching markers batch ${batch + 1}: range(${from}, ${to})`);
          
          const { data, error } = await supabase
          .from('markers')
          .select('*')
            .order('created_at', { ascending: false })
            .range(from, to);

          if (error) {
            console.error(`Error in batch ${batch + 1}:`, error);
            throw error;
          }

          if (data && data.length > 0) {
            allMarkers = allMarkers.concat(data);
            console.log(`Batch ${batch + 1}: Fetched ${data.length} markers (Total so far: ${allMarkers.length})`);
            
            // If we got less than BATCH_SIZE, we've reached the end
            if (data.length < BATCH_SIZE) {
              console.log(`Reached end of data at batch ${batch + 1}`);
              break;
            }
          } else {
            console.log(`Batch ${batch + 1}: No more data available`);
            break;
          }
        }

        console.log(`Total markers fetched: ${allMarkers.length}`);

        if (allMarkers.length > 0) {
          const markersWithUserInfo = allMarkers.map(marker => ({
            ...marker,
            userTimestamp: new Date(marker.user_timestamp),
            isUserCandle: marker.user_id === currentUserID
          }));
          setMarkers(markersWithUserInfo);
          setLastAction(`Loaded ${markersWithUserInfo.length} markers`);
        } else {
          setLastAction('No markers found');
        }
        setIsLoading(false);
        // Fade out loading screen after a brief delay
        setTimeout(() => {
          setShowLoadingScreen(false);
        }, 300);
      } catch (error) {
        console.error('Error fetching markers:', error);
        setLastAction(`Error fetching markers: ${error.message}`);
        setIsLoading(false);
        setTimeout(() => {
          setShowLoadingScreen(false);
        }, 300);
      }
    };

    fetchMarkers();
  }, []);

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

        // Clean up ONLY on success
        setTempPosition(null);
        setSelectedEmotion(null);
        setIsPopupOpen(false);
        setCurrentStep(1);
      }
    } catch (error) {
      console.error('Error saving candle:', error);
      console.error('Error details:', {
        code: error?.code,
        message: error?.message,
        details: error?.details,
        hint: error?.hint,
      });
      // Postgres exceptions come back as `error.message`
      const msg = error?.message || 'Error saving candle';
      setLastAction(msg);
      showToast(msg);

      // Log rejections (especially rate-limit errors) to database
      // Supabase wraps Postgres errors, so check message content
      const isRateLimit = msg.toLowerCase().includes('rate limit') || 
                          error?.code === 'P0001' ||
                          error?.details?.includes('P0001');
      
      console.log('Error analysis:', {
        isRateLimit,
        msg,
        errorCode: error?.code,
        errorDetails: error?.details,
        fullError: error
      });
      
      if (isRateLimit) {
        console.log('Logging rejection to database...', { 
          user_id: currentUserID, 
          reason: msg,
          payload: {
            emotion: selectedEmotion,
            position: tempPosition,
            timestamp: nowIso,
          }
        });
        
        if (!currentUserID) {
          console.error('Cannot log rejection: currentUserID is null/undefined');
          return;
        }
        
        supabase.rpc('log_marker_rejection', {
          _user_id: currentUserID,
          _reason: msg,
          _payload: {
            emotion: selectedEmotion,
            position: tempPosition,
            timestamp: nowIso,
          },
        }).then(({ data, error: logError }) => {
          if (logError) {
            console.error('Failed to log rejection - RPC error:', logError);
            console.error('RPC error details:', {
              code: logError.code,
              message: logError.message,
              details: logError.details,
              hint: logError.hint
            });
          } else {
            console.log('Rejection logged successfully', data);
          }
        }).catch((logError) => {
          console.error('Exception while logging rejection:', logError);
        });
      } else {
        console.log('Not a rate-limit error, skipping logging. Message:', msg);
      }
    }
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

  // Leaflet uses Web Mercator projection with valid bounds:
  // Latitude: -85.0511287798 to 85.0511287798 (Mercator limit)
  // Longitude: -180 to 180
  const worldBounds = [
    [-85.0511287798, -180], // Southwest
    [85.0511287798, 180]    // Northeast
  ];

  return (
    <div className="map-component-wrapper">
      <LoadingScreen isLoading={isLoading} showLoadingScreen={showLoadingScreen} />
      {toastMessage ? <div className="toast top-center">{toastMessage}</div> : null}
      
      <DebugPanel
        currentUserID={currentUserID}
        markers={markers}
        lastAction={lastAction}
        isPopupOpen={isPopupOpen}
        currentStep={currentStep}
        selectedEmotion={selectedEmotion}
        tempPosition={tempPosition}
        zoomLevel={zoomLevel}
        setMarkers={setMarkers}
        setUserCandles={setUserCandles}
        setLastAction={setLastAction}
        getRandomLeafEmotion={getRandomLeafEmotion}
      />

      <Sidebar markers={markers}/>
      
      <MapContainer
        ref={mapRef}
        center={defaultCenter}
        zoom={defaultZoom}
        minZoom={2.5}
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
        {/* Add locate button */}
        <LocateButton onLocationFound={(error) => {
          if (error) {
            showToast(error);
          }
        }} />

        {/* Add the MapClickHandler component */}
        <MapClickHandler 
          onMapClick={handleMapClick}
          currentStep={currentStep}
        />

        {/* Render permanent markers with debug logging */}
        {markers.map(marker => {          
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
              zoomLevel={zoomLevel}
            />
          );
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
            zoomLevel={zoomLevel}
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
        tempPosition={tempPosition}
      />

      {/* Help Icon Button - positioned below Leaflet zoom controls */}
      <button
        onClick={() => window.open('/about.html', '_blank')}
        style={{
          position: 'fixed',
          bottom: '30px', // Below zoom controls (10px top + 60px zoom height + 10px gap)
          left: '10px', // Align with zoom controls
          zIndex: 1100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
          transition: 'all 0.2s ease',
        }}
        aria-label="Help - Learn more about this app"
      >
        <HelpOutlineIcon sx={{ fontSize: 35 }} />
      </button>
    </div>
  );
};

export default MapComponent;
