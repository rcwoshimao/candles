import React from 'react';

const emotions = [
  'happy',
  'sad',
  'angry',
  'surprised',
  'disgusted',
  'fearful',
  'tired',
];

const CreateCandlePopup = ({
  isOpen,
  onClose,
  onEmotionSelect,
  selectedEmotion,
  onPlaceCandle,
  onConfirmPlacement,
  currentStep,
}) => {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 'calc(100% + 8px)',
        left: '50%',
        transform: 'translateX(-50%)',
        background: '#111',
        color: 'white',
        padding: 12,
        borderRadius: 8,
        width: 320,
      }}
    >
      {currentStep === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <h3 style={{ margin: 0 }}>How are you feeling?</h3>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {emotions.map((emotion) => (
              <button
                key={emotion}
                onClick={() => onEmotionSelect(emotion)}
                style={{
                  padding: '6px 10px',
                  border: '1px solid #ccc',
                  borderRadius: 4,
                  background: selectedEmotion === emotion ? 'white' : 'transparent',
                  color: selectedEmotion === emotion ? 'black' : 'white',
                  cursor: 'pointer',
                }}
              >
                {emotion}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={onClose}>Cancel</button>
            <button onClick={onPlaceCandle} disabled={!selectedEmotion}>
              Continue
            </button>
          </div>
        </div>
      )}

      {currentStep === 2 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <h3 style={{ margin: 0 }}>Place your candle</h3>
          <p style={{ margin: 0 }}>Click anywhere on the map to place your candle.</p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={onClose}>Cancel</button>
            <button onClick={onConfirmPlacement}>Confirm Placement</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateCandlePopup;


