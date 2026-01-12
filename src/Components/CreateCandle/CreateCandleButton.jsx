import React from 'react';
import styled from '@emotion/styled';

const Button = styled.button`
  width: 48px;
  height: 48px;
  border-radius: 0;
  background: #111;
  border: 1px solid #fff;
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


