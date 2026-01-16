import React from 'react';
import CreateCandleButton from './CreateCandleButton';
import CreateCandlePopup from './CreateCandlePopup';

const CreateCandleControls = ({
  isPopupOpen,
  onCreateCandle,
  onClosePopup,
  onBackFromPlacement,
  selectedEmotion,
  onEmotionSelect,
  onPlaceCandle,
  onConfirmPlacement,
  currentStep,
  tempPosition,
}) => {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 20,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 2000,
      }}
    >
      <div style={{ position: 'relative' }}>
        <CreateCandlePopup
          isOpen={isPopupOpen}
          onClose={onClosePopup}
          onBack={onBackFromPlacement}
          selectedEmotion={selectedEmotion}
          onEmotionSelect={onEmotionSelect}
          onPlaceCandle={onPlaceCandle}
          onConfirmPlacement={onConfirmPlacement}
          currentStep={currentStep}
          tempPosition={tempPosition}
        />
        <CreateCandleButton onClick={onCreateCandle} />
      </div>
    </div>
  );
};

export default CreateCandleControls;


