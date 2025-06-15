import React from 'react';
import { motion } from 'framer-motion';

const emotions = [
  { value: 'happy', label: 'Happy', color: 'var(--emotion-happy)' },
  { value: 'sad', label: 'Sad', color: 'var(--emotion-sad)' },
  { value: 'disgusted', label: 'Disgusted', color: 'var(--emotion-disgusted)' },
  { value: 'angry', label: 'Angry', color: 'var(--emotion-angry)' },
  { value: 'surprised', label: 'Surprised', color: 'var(--emotion-surprised)' },
  { value: 'tired', label: 'Tired', color: 'var(--emotion-tired)' },
  { value: 'fearful', label: 'Fearful', color: 'var(--emotion-fearful)' }
];

const EmotionGrid = ({ selectedEmotion, onSelectEmotion }) => {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '10px',
      padding: '10px',
      maxWidth: '300px',
      margin: '0 auto'
    }}>
      {emotions.map((emotion) => (
        <motion.button
          key={emotion.value}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={(e) => {
            e.stopPropagation(); 
            onSelectEmotion(emotion.value);
          }} // Stop triggering map click handler when clicking on the popup
          style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            border: 'none',
            backgroundColor: emotion.color,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 'bold',
            boxShadow: selectedEmotion === emotion.value ? 
              '0 0 10px rgba(0,0,0,0.3)' : 'none',
            transform: selectedEmotion === emotion.value ? 
              'scale(1.1)' : 'scale(1)',
            transition: 'all 0.2s ease'
          }}
        >
          {emotion.label}
        </motion.button>
      ))}
    </div>
  );
};

export default EmotionGrid; 