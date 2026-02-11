import React from 'react';
import './DebugPanel.css';

const DebugPanel = ({
  currentUserID,
  markerCount,
  lastAction,
  isPopupOpen,
  currentStep,
  selectedEmotion,
  tempPosition,
  zoomLevel,
  onClearMyMarkers,
  onAddRandomMarker,
  onHide,
}) => {
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
      <div className="debug-panel__header">
        <div className="debug-panel__title"><strong>Debug Panel</strong></div>
        <button className="debug-panel__hide" onClick={onHide} type="button" aria-label="Hide debug panel">
          Hide
        </button>
      </div>

      <div className="debug-panel__actions">
        <button onClick={onClearMyMarkers} type="button">
          Clear My Markers
        </button>
        <button onClick={onAddRandomMarker} type="button">
          Add Random Sample Marker
        </button>
      </div>

      <div className="debug-panel__grid">
        <div>User ID: {currentUserID || '—'}</div>
        <div>Markers: {markerCount ?? 0}</div>
        <div>Last Action: {lastAction || 'No action yet'}</div>
        <div>Popup Open: {isPopupOpen ? 'Yes' : 'No'}</div>
        <div>Current Step: {currentStep}</div>
        <div>Selected Emotion: {selectedEmotion || 'None'}</div>
        <div>Temp Position: {tempPosition ? `${tempPosition[0].toFixed(4)}, ${tempPosition[1].toFixed(4)}` : 'None'}</div>
        <div>Zoom Level: {zoomLevel}</div>
        <div>Candle Size: {calculateCandleSize()}</div>
      </div>
    </div>
  );
};

export default DebugPanel;
