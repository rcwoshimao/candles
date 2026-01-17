import React from 'react';
import { useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import LocationPinIcon from '@mui/icons-material/LocationPin';

// Locate button component (uses browser geolocation)
const LocateButton = ({ onLocationFound }) => {
    const map = useMap();
    const [isLocating, setIsLocating] = React.useState(false);
  
    const handleLocate = () => {
      if (!navigator.geolocation) {
        onLocationFound?.('Geolocation is not supported by your browser');
        return;
      }
  
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          map.setView([latitude, longitude], 18);
          setIsLocating(false);
          onLocationFound?.(null);
        },
        (error) => {
          setIsLocating(false);
          let message = 'Unable to get your location';
          if (error.code === error.PERMISSION_DENIED) {
            message = 'Location permission denied. Please enable location access in your browser settings.';
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            message = 'Location information unavailable.';
          } else if (error.code === error.TIMEOUT) {
            message = 'Location request timed out.';
          }
          onLocationFound?.(message);
        }
      );
    };
  
    return (
      <button
        onClick={handleLocate}
        disabled={isLocating}
        style={{
          position: 'absolute',
          bottom: '20px',
          right: '20px',
          zIndex: 1000,
          padding: '10px 16px',
          background: isLocating ? 'rgba(100, 100, 100, 0.85)' : 'rgba(0, 0, 0, 0.85)',
          color: '#fff',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '6px',
          cursor: isLocating ? 'wait' : 'pointer',
          fontSize: '14px',
          fontWeight: 500,
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(8px)',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => {
          if (!isLocating) e.target.style.background = 'rgba(255, 255, 255, 0.15)';
        }}
        onMouseLeave={(e) => {
          if (!isLocating) e.target.style.background = 'rgba(0, 0, 0, 0.85)';
        }}
      >
        {isLocating ? ('Locating...') :(<><LocationPinIcon/> Locate Me </>)}
      </button>
    );
  };

export default LocateButton; 