import React from 'react';
import { useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import LocationPinIcon from '@mui/icons-material/LocationPin';

// Locate button component (uses browser geolocation)
const LocateButton = ({ onLocationFound, className = '', tooltip = 'Locate me' }) => {
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
        className={`map-control-button locate-button ${className}`.trim()}
        aria-label="Locate me"
        title={tooltip}
        data-tooltip={tooltip}
      >
        <LocationPinIcon />
      </button>
    );
  };

export default LocateButton; 