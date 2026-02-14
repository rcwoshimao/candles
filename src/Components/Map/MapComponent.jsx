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
import { Turnstile } from '@marsidev/react-turnstile';
const defaultCenter = [38.9072, -77.0369];
// Start zoomed out so the initial view shows more area.
const defaultZoom = 3.5;

// Simplest possible deployment-safe debug flag:
// - Set `VITE_DEBUG_PANEL_ENABLED=true` in `.env.local` (dev) to see it.
// - Set it to `false` (or omit it) in production to hide it completely.
const DEBUG_PANEL_ENABLED = String(import.meta.env.VITE_DEBUG_PANEL_ENABLED ?? '')
  .replace(/['"]/g, '')
  .trim()
  .toLowerCase() === 'true';

const TURNSTILE_SITE_KEY = String(import.meta.env.VITE_TURNSTILE_SITE_KEY ?? '')
  .replace(/['"]/g, '')
  .trim();

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
      // Allow map clicks when in step 2 (placement mode)
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

const MapControls = ({ onLocateError }) => {
  return (
    <div className="map-controls">
      <LocateButton
        className="map-controls__button"
        tooltip="Locate me"
        onLocationFound={(error) => {
          if (error) onLocateError?.(error);
        }}
      />
      <button
        className="map-control-button map-controls__button map-help-button"
        type="button"
        onClick={() => window.open('/about.html', '_blank')}
        aria-label="Help - Learn more about this app"
        title="About this site"
        data-tooltip="About this site"
      >
        <HelpOutlineIcon sx={{ fontSize: 22 }} />
      </button>
    </div>
  );
};



const MapComponent = () => {
  const mapRef = useRef();
  const [currentUserId, setCurrentUserId] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [needsCaptcha, setNeedsCaptcha] = useState(false);
  const [captchaToken, setCaptchaToken] = useState('');
  const [captchaError, setCaptchaError] = useState('');
  const [markers, setMarkers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showLoadingScreen, setShowLoadingScreen] = useState(true);
  const [tempPosition, setTempPosition] = useState(null);
  const [lastAction, setLastAction] = useState('');
  const [selectedEmotion, setSelectedEmotion] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(defaultZoom);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [toastMessage, setToastMessage] = useState('');
  const [sameEmotionCount, setSameEmotionCount] = useState(null);
  const toastTimerRef = useRef(null);
  const [showDebugPanel, setShowDebugPanel] = useState(DEBUG_PANEL_ENABLED);

  const showToast = (message) => {
    if (!message) return;
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    setToastMessage(message);
    toastTimerRef.current = window.setTimeout(() => {
      setToastMessage('');
      toastTimerRef.current = null;
    }, 3200);
  };

  useEffect(() => {
    let mounted = true;

    const setUidFromSession = (session) => {
      const uid = session?.user?.id ?? null;
      if (!mounted) return;
      setCurrentUserId(uid);
    };

    const ensureAnonymousSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) console.warn('getSession error:', error);

        if (data?.session) {
          setUidFromSession(data.session);
          if (mounted) setAuthReady(true);
          return;
        }

        // If Supabase CAPTCHA is enabled, we need a Turnstile token before calling signInAnonymously.
        if (!TURNSTILE_SITE_KEY) {
          console.error('Missing VITE_TURNSTILE_SITE_KEY');
          showToast('Missing Turnstile site key. Check environment variables.');
          if (mounted) setAuthReady(true);
          return;
        }

        if (mounted) {
          setNeedsCaptcha(true);
          setAuthReady(true);
        }
      } catch (err) {
        console.error('Anonymous auth bootstrap exception:', err);
        showToast('Auth error. Please refresh.');
        if (mounted) setAuthReady(true);
      }
    };

    ensureAnonymousSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUidFromSession(session);
    });

    return () => {
      mounted = false;
      authListener?.subscription?.unsubscribe?.();
    };
  }, []);

  // When we have a captcha token, attempt anonymous sign-in with it.
  useEffect(() => {
    if (!needsCaptcha) return;
    if (!captchaToken) return;

    let mounted = true;
    const signIn = async () => {
      setCaptchaError('');
      try {
        const { data: signInData, error: signInError } = await supabase.auth.signInAnonymously({
          options: { captchaToken },
        });
        if (!mounted) return;

        if (signInError) {
          console.error('Anonymous sign-in failed:', signInError);
          setCaptchaError(signInError.message || 'Captcha sign-in failed');
          return;
        }

        setNeedsCaptcha(false);
        setCaptchaToken('');
        setCurrentUserId(signInData?.session?.user?.id ?? null);
      } catch (err) {
        if (!mounted) return;
        console.error('Anonymous sign-in exception:', err);
        setCaptchaError('Captcha sign-in failed');
      }
    };

    signIn();
    return () => {
      mounted = false;
    };
  }, [needsCaptcha, captchaToken]);

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
    setSameEmotionCount(null);
  };

  const handleEmotionSelect = (emotion) => {
    console.log('Emotion selected:', emotion);
    setSelectedEmotion(emotion);
  };

  const handlePlaceCandle = (emotion = null) => {
    // Use provided emotion or fall back to selectedEmotion
    const emotionToUse = emotion || selectedEmotion;
    console.log('Place candle clicked, selected emotion:', emotionToUse);
    if (!emotionToUse) {
      console.log('No emotion selected, cannot proceed');
      return;
    }
    console.log('Moving to step 2, resetting temp position');
    setCurrentStep(2);
    setTempPosition(null);
    // Ensure emotion is set if it wasn't already
    if (emotion && emotion !== selectedEmotion) {
      setSelectedEmotion(emotion);
    }
  };

  const handleBackToEmotionStep = () => {
    // Go back one step in the candle-creation flow (keep popup open + keep selected emotion)
    setTempPosition(null);
    setCurrentStep(1);
  };

  const handleConfirmPlacement = async () => {
    console.log('Confirm placement clicked'); // Debug log
    if (!tempPosition || !selectedEmotion) return;
    if (!authReady || !currentUserId) {
      showToast('Signing you in… try again in a moment.');
      return;
    }

    const nowIso = new Date().toISOString();

    try {
      // IMPORTANT: This assumes you've created the RPC `create_marker_rate_limited`
      // (see `supabase/sql/markers_rate_limit.sql`) and enabled RLS to block direct inserts.
      // inside handleConfirmPlacement, where you currently save the candle
    const { data, error } = await supabase.rpc('create_marker_rate_limited', {
      _emotion: selectedEmotion,
      _position: tempPosition,
      _timestamp: nowIso,
      _user_timestamp: nowIso,
    });

      if (error) throw error;

      if (data) {
        const newMarker = {
          ...data,
          userTimestamp: new Date(data.user_timestamp),
        };
        setMarkers(prev => [...prev, newMarker]);
        setLastAction('Candle placed successfully');

        // Query for candles with same emotion in the last hour
        const oneHourAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const { count, error: countError } = await supabase
          .from('markers')
          .select('*', { count: 'exact', head: true })
          .eq('emotion', selectedEmotion)
          .gte('created_at', oneHourAgo);

        if (!countError && count !== null) {
          setSameEmotionCount(count);
        } else {
          console.error('Error fetching same emotion count:', countError);
          setSameEmotionCount(0);
        }

        // Clean up ONLY on success
        setTempPosition(null);
        // Don't reset selectedEmotion here - keep it to show the count
        // Don't close popup automatically - let user close it manually
        // setIsPopupOpen(false);
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
          user_id: currentUserId, 
          reason: msg,
          payload: {
            emotion: selectedEmotion,
            position: tempPosition,
            timestamp: nowIso,
          }
        });
        
        if (!currentUserId) {
          console.error('Cannot log rejection: currentUserId is null/undefined');
          return;
        }
        
        supabase.rpc('log_marker_rejection', {
          _user_id: currentUserId,
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
    setSameEmotionCount(null);
  };

  const handleDelete = async (idToDelete) => {
    // Find the marker to check ownership
    const markerToDelete = markers.find(marker => marker.id === idToDelete);
    
    if (!authReady || !currentUserId) {
      showToast('Signing you in… try again in a moment.');
      return;
    }

    if (!markerToDelete || markerToDelete.user_id !== currentUserId) {
      setLastAction('You can only delete your own candles');
      return;
    }

    try {
      const { error } = await supabase
        .from('markers')
        .delete()
        .eq('id', idToDelete)
        .eq('user_id', currentUserId); // Extra safety check on the database level

      if (error) throw error;

      setMarkers(prev => prev.filter(marker => marker.id !== idToDelete));
      setLastAction(`Your candle deleted`);
    } catch (error) {
      console.error('Error deleting marker:', error);
      setLastAction('Error deleting marker');
    }
  };

  const handleClearMyMarkers = async () => {
    if (!authReady || !currentUserId) {
      setLastAction('Signing you in…');
      showToast('Signing you in… try again in a moment.');
      return;
    }

    try {
      const { error } = await supabase
        .from('markers')
        .delete()
        .eq('user_id', currentUserId);

      if (error) throw error;

      setMarkers((prev) => prev.filter((m) => m?.user_id !== currentUserId));
      setLastAction('Cleared your markers');
    } catch (error) {
      console.error('Error clearing user markers:', error);
      const msg = error?.message || 'Error clearing markers';
      setLastAction(msg);
      showToast(msg);
    }
  };

  const handleAddRandomMarker = async () => {
    if (!authReady || !currentUserId) {
      setLastAction('Signing you in…');
      showToast('Signing you in… try again in a moment.');
      return;
    }

    try {
      const randomOffset = (scale = 20) => (Math.random() - 0.5) * scale;
      const nowIso = new Date().toISOString();
      const sampleMarker = {
        position: [38.9072 + randomOffset(), -77.0369 + randomOffset()],
        emotion: getRandomLeafEmotion(),
        timestamp: nowIso,
        user_timestamp: nowIso,
        user_id: currentUserId,
      };

      const { data, error } = await supabase.rpc('create_marker_rate_limited', {
        _emotion: sampleMarker.emotion,
        _position: sampleMarker.position,
        _timestamp: sampleMarker.timestamp,
        _user_timestamp: sampleMarker.user_timestamp,
      });

      if (error) {
        console.error('Error adding random marker:', error);
        const msg = error?.message || 'Error adding random marker';
        setLastAction(msg);
        showToast(msg);

        const isRateLimit =
          msg.toLowerCase().includes('rate limit') ||
          error?.code === 'P0001' ||
          error?.details?.includes('P0001');

        if (isRateLimit && currentUserId) {
          supabase
            .rpc('log_marker_rejection', {
              _user_id: currentUserId,
              _reason: msg,
              _payload: {
                emotion: sampleMarker.emotion,
                position: sampleMarker.position,
                timestamp: sampleMarker.timestamp,
              },
            })
            .then(({ error: logError }) => {
              if (logError) console.error('Failed to log rejection - RPC error:', logError);
            })
            .catch((logError) => {
              console.error('Exception while logging rejection:', logError);
            });
        }
        return;
      }

      if (data) {
        const newMarker = {
          ...data,
          userTimestamp: new Date(data.user_timestamp),
        };
        setMarkers((prev) => [...prev, newMarker]);
        setLastAction('Random sample marker added');
      }
    } catch (error) {
      console.error('Error in random marker button:', error);
      const msg = error?.message || 'Error adding random marker';
      setLastAction(msg);
      showToast(msg);
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
      {needsCaptcha ? (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 5000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(6px)',
            padding: 16,
          }}
        >
          <div
            style={{
              width: 'min(420px, 100%)',
              background: 'rgba(0, 0, 0, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.16)',
              borderRadius: 12,
              padding: 14,
              color: 'rgba(255, 255, 255, 0.92)',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.55)',
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: 8 }}>Verifying you’re human</div>
            <div style={{ fontSize: 12, opacity: 0.9, marginBottom: 12 }}>
              This might take a few seconds. Thank you for your patience. 
            </div>
            <Turnstile
              siteKey={TURNSTILE_SITE_KEY}
              options={{ theme: 'dark' }}
              onSuccess={(token) => setCaptchaToken(token)}
              onError={() => setCaptchaError('Captcha failed. Please try again.')}
              onExpire={() => setCaptchaError('Captcha expired. Please try again.')}
            />
            {captchaError ? (
              <div style={{ marginTop: 10, fontSize: 12, color: '#ffb4b4' }}>{captchaError}</div>
            ) : null}
          </div>
        </div>
      ) : null}
      
      {DEBUG_PANEL_ENABLED ? (
        showDebugPanel ? (
          <DebugPanel
            currentUserID={currentUserId}
            markerCount={markers.length}
            lastAction={lastAction}
            isPopupOpen={isPopupOpen}
            currentStep={currentStep}
            selectedEmotion={selectedEmotion}
            tempPosition={tempPosition}
            zoomLevel={zoomLevel}
            onClearMyMarkers={handleClearMyMarkers}
            onAddRandomMarker={handleAddRandomMarker}
            onHide={() => setShowDebugPanel(false)}
          />
        ) : (
          <button
            className="debug-panel-toggle"
            type="button"
            onClick={() => setShowDebugPanel(true)}
            aria-label="Show debug panel"
          >
            Debug
          </button>
        )
      ) : null}

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
        <MapControls onLocateError={showToast} />

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
              isUserCandle={Boolean(currentUserId && marker.user_id === currentUserId)}
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
        sameEmotionCount={sameEmotionCount}
      />

    </div>
  );
};

export default MapComponent;
