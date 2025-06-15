import React from 'react';
import styled from '@emotion/styled';

const PopupContainer = styled.div`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.9);
  color: white;
  padding: 20px;
  z-index: 2000;
  display: flex;
  flex-direction: column;
  gap: 15px;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
`;

const StepIndicator = styled.div`
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-bottom: 10px;
`;

const Step = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${props => props.active ? 'white' : 'rgba(255, 255, 255, 0.3)'};
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: 10px;
  justify-content: center;
`;

const Button = styled.button`
  padding: 8px 16px;
  border: 1px solid white;
  border-radius: 4px;
  background: ${props => props.primary ? 'white' : 'transparent'};
  color: ${props => props.primary ? 'black' : 'white'};
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: ${props => props.primary ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.1)'};
  }
`;

const EmotionGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 10px;
  margin: 10px 0;
`;

const EmotionButton = styled.button`
  padding: 10px;
  border: 1px solid ${props => props.selected ? 'white' : 'rgba(255, 255, 255, 0.3)'};
  border-radius: 4px;
  background: ${props => props.selected ? 'white' : 'transparent'};
  color: ${props => props.selected ? 'black' : 'white'};
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: ${props => props.selected ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.1)'};
  }
`;

const emotions = [
  'happy', 'sad', 'angry', 'surprised', 
  'disgusted', 'fearful', 'tired'
];

const CandleCreationPopup = ({ 
  step, 
  selectedEmotion, 
  onEmotionSelect, 
  onConfirm, 
  onCancel,
  onPlaceCandle,
  tempMarker
}) => {
  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <>
            <h3>Step 1: Choose an emotion</h3>
            <EmotionGrid>
              {emotions.map(emotion => (
                <EmotionButton
                  key={emotion}
                  selected={selectedEmotion === emotion}
                  onClick={() => onEmotionSelect(emotion)}
                >
                  {emotion}
                </EmotionButton>
              ))}
            </EmotionGrid>
            <ButtonContainer>
              <Button onClick={onCancel}>Cancel</Button>
              <Button 
                primary 
                onClick={onPlaceCandle}
                disabled={!selectedEmotion}
              >
                Next: Choose Location
              </Button>
            </ButtonContainer>
          </>
        );
      case 2:
        return (
          <>
            <h3>Step 2: Place your candle</h3>
            <p>Click anywhere on the map to place your {selectedEmotion} candle. You can drag it to adjust the position.</p>
            <ButtonContainer>
              <Button onClick={onCancel}>Cancel</Button>
              {tempMarker && (
                <Button 
                  primary 
                  onClick={onConfirm}
                >
                  Confirm Placement
                </Button>
              )}
            </ButtonContainer>
          </>
        );
    }
  };

  return (
    <PopupContainer>
      <StepIndicator>
        <Step active={step === 1} />
        <Step active={step === 2} />
      </StepIndicator>
      {renderStepContent()}
    </PopupContainer>
  );
};

export default CandleCreationPopup; 