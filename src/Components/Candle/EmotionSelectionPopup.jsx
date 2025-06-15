import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import EmotionGrid from './EmotionGrid';

const EmotionSelectionPopup = ({
  emotion,
  setTempMarker,
  handleSave,
  onClose,
  isOpen
}) => {
  if (!isOpen) return null;

  const handleEmotionSelect = (selectedEmotion) => {
    console.log('Before update - Current temp marker:', emotion); // log current state
    setTempMarker((prev) => {
      console.log('Previous state:', prev); // log what we're spreading
      const updated = { ...prev, emotion: selectedEmotion };
      console.log('Updated state:', updated); // log what we're setting
      return updated;
    });
  };

  return (
    <AnimatePresence>
      <motion.div
        onClick={(e) => e.stopPropagation()} // Stop triggering map click handler when clicking on the popup
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: 'white',
          padding: '20px',
          boxShadow: '0 -2px 10px rgba(0,0,0,0.1)',
          zIndex: 1000,
          borderTopLeftRadius: '20px',
          borderTopRightRadius: '20px'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: '0 0 10px 0' }}>How are you feeling?</h3>
          <p style={{ margin: '0', color: '#666' }}>Select an emotion for your candle</p>
        </div>

        <EmotionGrid 
          selectedEmotion={emotion} 
          onSelectEmotion={handleEmotionSelect} 
        />

        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          gap: '10px',
          marginTop: '20px'
        }}>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSave}
            disabled={!emotion}
            style={{
              padding: '10px 20px',
              backgroundColor: emotion ? '#4CAF50' : '#ccc',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: emotion ? 'pointer' : 'not-allowed',
              fontWeight: 'bold'
            }}
          >
            Place Candle
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClose}
            style={{
              padding: '10px 20px',
              backgroundColor: '#f44336',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Cancel
          </motion.button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default EmotionSelectionPopup; 