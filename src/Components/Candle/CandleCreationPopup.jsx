import React from 'react';
import styled from '@emotion/styled';
import { motion, AnimatePresence } from 'framer-motion';
import EmotionWheel from './EmotionWheel';

const PopupContainer = styled(motion.div)`
  position: fixed;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.95);
  color: white;
  padding: 20px;
  z-index: 2000;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(8px);
  width: 400px;
  transition: all 0.3s ease-in-out;
`;

const PopupContent = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
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

const StepContent = styled.div`
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  width: 100%;
`;

const StepTitle = styled.h3`
  margin: 0;
  color: white;
  font-size: 18px;
  font-weight: 500;
`;

const StepDescription = styled.p`
  margin: 0;
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
  text-align: center;
  max-width: 80%;
`;

const emotions = [
  'happy', 'sad', 'angry', 'surprised', 
  'disgusted', 'fearful', 'tired'
];

const CandleCreationPopup = ({ isOpen, onClose, onEmotionSelect, selectedEmotion, onPlaceCandle, onConfirmPlacement, currentStep }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <PopupContainer
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        >
          <PopupContent>
            <AnimatePresence mode="wait">
              {currentStep === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <StepContent>
                    <StepTitle>How are you feeling?</StepTitle>
                    <StepDescription>
                      Select an emotion to place your candle
                    </StepDescription>
                    <EmotionWheel
                      selectedEmotion={selectedEmotion}
                      onEmotionSelect={onEmotionSelect}
                    />
                    <Button
                      onClick={onPlaceCandle}
                      disabled={!selectedEmotion}
                      style={{ opacity: selectedEmotion ? 1 : 0.5 }}
                    >
                      Continue
                    </Button>
                  </StepContent>
                </motion.div>
              )}

              {currentStep === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <StepContent>
                    <StepTitle>Place your candle</StepTitle>
                    <StepDescription>
                      Click anywhere on the map to place your candle
                    </StepDescription>
                    <Button onClick={onConfirmPlacement}>
                      Confirm Placement
                    </Button>
                  </StepContent>
                </motion.div>
              )}
            </AnimatePresence>
          </PopupContent>
        </PopupContainer>
      )}
    </AnimatePresence>
  );
};

export default CandleCreationPopup; 