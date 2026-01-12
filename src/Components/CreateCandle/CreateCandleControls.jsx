import React from 'react';
import CreateCandleButton from './CreateCandleButton';
import CreateCandlePopup from './CreateCandlePopup';

const CreateCandleControls = ({
  isPopupOpen,
  onCreateCandle,
  onClosePopup,
  selectedEmotion,
  onEmotionSelect,
  onPlaceCandle,
  onConfirmPlacement,
  currentStep,
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
          selectedEmotion={selectedEmotion}
          onEmotionSelect={onEmotionSelect}
          onPlaceCandle={onPlaceCandle}
          onConfirmPlacement={onConfirmPlacement}
          currentStep={currentStep}
        />
        <CreateCandleButton onClick={onCreateCandle} />
      </div>
    </div>
  );
};

export default CreateCandleControls;


