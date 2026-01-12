import React from 'react';
import styled from '@emotion/styled';

const Button = styled.button`
  width: 48px;
  height: 48px;
  border-radius: 10;
  background: rgba(0, 0, 0, 0.6);
  box-shadow: 0 0 18px rgba(0, 0, 0, 0.7);
  color: #fff;
  font-size: 24px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const CreateCandleButton = ({ onClick }) => {
  return (
    <Button onClick={onClick} aria-label="Create new candle">
      +
    </Button>
  );
};

export default CreateCandleButton;


