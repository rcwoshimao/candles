import React from 'react';
import styled from '@emotion/styled';

const ButtonContainer = styled.div`
  position: fixed;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
`;

const PlusButton = styled.button`
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: var(--primary-color);
  border: none;
  color: white;
  font-size: 2rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
  
  &:hover {
    transform: scale(1.1);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
  }
  
  &:active {
    transform: scale(0.95);
  }
`;

const CreateCandleButton = ({ onCandleCreate }) => {
  return (
    <ButtonContainer>
      <PlusButton onClick={onCandleCreate} aria-label="Create new candle">
        +
      </PlusButton>
    </ButtonContainer>
  );
};

export default CreateCandleButton; 