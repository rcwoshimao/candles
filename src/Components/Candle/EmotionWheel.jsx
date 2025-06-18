import React, { useState } from 'react';
import styled from '@emotion/styled';
import { motion, AnimatePresence } from 'framer-motion';

const WheelContainer = styled.div`
  position: relative;
  width: 100%;
  height: 200px;
  display: flex;
  justify-content: center;
  align-items: center;
  perspective: 1000px;
`;

const EmotionCircle = styled(motion.div)`
  position: absolute;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${props => props.selected ? 'white' : 'rgba(255, 255, 255, 0.1)'};
  color: ${props => props.selected ? 'black' : 'white'};
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  text-transform: capitalize;
  border: 1px solid ${props => props.selected ? 'white' : 'rgba(255, 255, 255, 0.2)'};
  backdrop-filter: blur(8px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  user-select: none;
`;

const SubEmotionContainer = styled(motion.div)`
  position: absolute;
  display: flex;
  gap: 8px;
  justify-content: center;
  align-items: center;
  width: 100%;
  bottom: -40px;
`;

const SubEmotion = styled(motion.button)`
  padding: 6px 12px;
  border-radius: 20px;
  background: ${props => props.selected ? 'white' : 'rgba(255, 255, 255, 0.1)'};
  color: ${props => props.selected ? 'black' : 'white'};
  border: 1px solid ${props => props.selected ? 'white' : 'rgba(255, 255, 255, 0.2)'};
  font-size: 12px;
  cursor: pointer;
  text-transform: capitalize;
  backdrop-filter: blur(8px);
  white-space: nowrap;
`;

const emotionData = {
  happy: {
    color: '#FFD700',
    subEmotions: ['amused', 'delighted', 'jovial', 'blissful']
  },
  sad: {
    color: '#4682B4',
    subEmotions: ['depressed', 'sorrow', 'grief', 'lonely']
  },
  angry: {
    color: '#FF4500',
    subEmotions: ['frustrated', 'annoyed', 'irritated', 'enraged']
  },
  surprised: {
    color: '#FFA500',
    subEmotions: ['amazed', 'astonished', 'shocked', 'confused']
  },
  disgusted: {
    color: '#32CD32',
    subEmotions: ['revolted', 'contempt', 'aversion', 'repulsed']
  },
  fearful: {
    color: '#9932CC',
    subEmotions: ['anxious', 'scared', 'terrified', 'nervous']
  },
  tired: {
    color: '#A9A9A9',
    subEmotions: ['exhausted', 'drained', 'weary', 'fatigued']
  }
};

// Helper function to get parent emotion for a sub-emotion
const getParentEmotion = (subEmotion) => {
  for (const [parent, data] of Object.entries(emotionData)) {
    if (data.subEmotions.includes(subEmotion)) {
      return parent;
    }
  }
  return null;
};

const EmotionWheel = ({ selectedEmotion, onEmotionSelect }) => {
  const [hoveredEmotion, setHoveredEmotion] = useState(null);
  const [selectedSubEmotion, setSelectedSubEmotion] = useState(null);
  const [hoveredSubEmotion, setHoveredSubEmotion] = useState(null);
  const [activeParentEmotion, setActiveParentEmotion] = useState(null);

  const handleEmotionHover = (emotion) => {
    setHoveredEmotion(emotion);
    setHoveredSubEmotion(null);
  };

  const handleEmotionClick = (emotion) => {
    // If clicking the active parent emotion, deactivate it
    if (activeParentEmotion === emotion) {
      setActiveParentEmotion(null);
    } else {
      // Otherwise, set it as the active parent emotion
      setActiveParentEmotion(emotion);
    }
  };

  const handleSubEmotionHover = (subEmotion) => {
    setHoveredSubEmotion(subEmotion);
  };

  const handleSubEmotionClick = (subEmotion) => {
    if (selectedEmotion === subEmotion) {
      onEmotionSelect(null);
      setSelectedSubEmotion(null);
    } else {
      onEmotionSelect(subEmotion);
      setSelectedSubEmotion(subEmotion);
    }
  };

  const calculatePosition = (index, total) => {
    const angle = (index * 2 * Math.PI) / total;
    const radius = 100;
    return {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
      z: 0
    };
  };

  return (
    <WheelContainer>
      {Object.entries(emotionData).map(([emotion, data], index) => {
        const position = calculatePosition(index, Object.keys(emotionData).length);
        const isHovered = hoveredEmotion === emotion;
        const isActive = activeParentEmotion === emotion;
        const hasSelectedSubEmotion = data.subEmotions.includes(selectedEmotion);
        const parentEmotion = getParentEmotion(selectedEmotion);

        return (
          <React.Fragment key={emotion}>
            <EmotionCircle
              selected={isActive || hasSelectedSubEmotion}
              style={{
                x: position.x,
                y: position.y,
                z: isHovered ? 50 : 0,
                scale: isHovered ? 1.1 : 1,
                backgroundColor: data.color,
                color: 'white',
                cursor: 'pointer', // Keep pointer cursor since parent emotions are clickable for filtering
                opacity: isHovered || isActive || hasSelectedSubEmotion ? 1 : 0.7
              }}
              whileHover={{ scale: 1.1, z: 50 }}
              onHoverStart={() => handleEmotionHover(emotion)}
              onHoverEnd={() => handleEmotionHover(null)}
              onClick={() => handleEmotionClick(emotion)}
            >
              {emotion}
            </EmotionCircle>

            <AnimatePresence>
              {(isHovered || isActive || hasSelectedSubEmotion) && (
                <SubEmotionContainer
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ duration: 0.2 }}
                >
                  {data.subEmotions.map((subEmotion) => {
                    const isSelected = selectedEmotion === subEmotion;
                    const isHovered = hoveredSubEmotion === subEmotion;
                    
                    return (
                      <SubEmotion
                        key={subEmotion}
                        selected={isSelected}
                        onClick={() => handleSubEmotionClick(subEmotion)}
                        onHoverStart={() => handleSubEmotionHover(subEmotion)}
                        onHoverEnd={() => handleSubEmotionHover(null)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        style={{
                          backgroundColor: isSelected ? 'white' : 'rgba(255, 255, 255, 0.1)',
                          color: isSelected ? 'black' : 'white',
                          transform: isHovered ? 'scale(1.05)' : 'scale(1)',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        {subEmotion}
                      </SubEmotion>
                    );
                  })}
                </SubEmotionContainer>
              )}
            </AnimatePresence>
          </React.Fragment>
        );
      })}
    </WheelContainer>
  );
};

export default EmotionWheel; 