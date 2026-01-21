import React from 'react';
import './LoadingScreen.css';

const LoadingScreen = ({ isLoading, showLoadingScreen }) => {
  if (!showLoadingScreen) return null;

  return (
    <div className={`loading-screen ${!isLoading ? 'fade-out' : ''}`}>
      <div className="loading-content">
        <div className="loading-spinner"></div>
        <h2>Loading Candles...</h2>
        <p>Gathering all the emotions from around the world</p>
      </div>
    </div>
  );
};

export default LoadingScreen;
