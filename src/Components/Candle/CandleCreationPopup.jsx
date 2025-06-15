import React from 'react';
import styled from '@emotion/styled';

const PopupContainer = styled.div`
  position: fixed;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.95);
  color: white;
  padding: ${props => props.step === 1 ? '30px' : '20px'};
  z-index: 2000;
  display: flex;
  flex-direction: column;
  gap: ${props => props.step === 1 ? '20px' : '15px'};
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: ${props => props.step === 1 ? '20px' : '12px'};
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(8px);
  width: ${props => props.step === 1 ? '400px' : '300px'};
  transition: all 0.3s ease-in-out;
  margin-bottom: ${props => props.step === 1 ? '20px' : '10px'};
`;

const StepIndicator = styled.div`
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-bottom: ${props => props.step === 1 ? '10px' : '5px'};
`;

const Step = styled.div`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: ${props => props.active ? 'white' : 'rgba(255, 255, 255, 0.3)'};
  transition: all 0.3s ease;
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: 10px;
  justify-content: center;
  margin-top: ${props => props.step === 1 ? '10px' : '5px'};
`;

const Button = styled.button`
  padding: ${props => props.step === 1 ? '10px 20px' : '8px 16px'};
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  background: ${props => props.primary ? 'white' : 'transparent'};
  color: ${props => props.primary ? 'black' : 'white'};
  cursor: pointer;
  transition: all 0.2s;
  font-size: ${props => props.step === 1 ? '14px' : '13px'};
  font-weight: 500;

  &:hover {
    background: ${props => props.primary ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.1)'};
    border-color: ${props => props.primary ? 'white' : 'rgba(255, 255, 255, 0.5)'};
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const EmotionGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin: 10px 0;
  transition: all 0.3s ease;
`;

const EmotionButton = styled.button`
  padding: 12px;
  border: 1px solid ${props => props.selected ? 'white' : 'rgba(255, 255, 255, 0.2)'};
  border-radius: 12px;
  background: ${props => props.selected ? 'white' : 'transparent'};
  color: ${props => props.selected ? 'black' : 'white'};
  cursor: pointer;
  transition: all 0.2s;
  font-size: 14px;
  font-weight: 500;
  text-transform: capitalize;

  &:hover {
    background: ${props => props.selected ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.1)'};
    border-color: ${props => props.selected ? 'white' : 'rgba(255, 255, 255, 0.4)'};
    transform: translateY(-2px);
  }

  &:active {
    transform: translateY(0);
  }
`;

const Title = styled.h3`
  margin: 0;
  font-size: ${props => props.step === 1 ? '20px' : '16px'};
  text-align: center;
  font-weight: 500;
  color: white;
  transition: all 0.3s ease;
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
            <Title step={step}>Choose an emotion</Title>
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
            <ButtonContainer step={step}>
              <Button onClick={onCancel} step={step}>Cancel</Button>
              <Button 
                primary 
                onClick={onPlaceCandle}
                disabled={!selectedEmotion}
                step={step}
              >
                Choose Location
              </Button>
            </ButtonContainer>
          </>
        );
      case 2:
        return (
          <>
            <Title step={step}>Place your candle</Title>
            <p style={{ margin: '0 0 15px 0', fontSize: '14px', textAlign: 'center', opacity: 0.9 }}>
              Click anywhere on the map to place your candle. You can drag it to adjust the position.
            </p>
            <ButtonContainer step={step}>
              <Button onClick={onCancel} step={step}>Cancel</Button>
              {tempMarker && (
                <Button 
                  primary 
                  onClick={onConfirm}
                  step={step}
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
    <PopupContainer step={step}>
      <StepIndicator step={step}>
        <Step active={step === 1} />
        <Step active={step === 2} />
      </StepIndicator>
      {renderStepContent()}
    </PopupContainer>
  );
};

export default CandleCreationPopup; 