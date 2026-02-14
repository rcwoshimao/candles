import React, { useState, useRef, useEffect } from 'react';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { motion } from 'framer-motion';

const HoldToConfirmButton = ({ onConfirm, disabled, activeColor, children = 'Place candle' }) => {
  const [progress, setProgress] = useState(0);
  const [isHolding, setIsHolding] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const animationFrameRef = useRef(null);
  const startTimeRef = useRef(null);
  const progressCircleRef = useRef(null);
  const HOLD_DURATION = 3000; // 2 seconds
  const circleRadius = 50;
  const circumference = 2 * Math.PI * circleRadius;

  // Initialize circle on mount
  useEffect(() => {
    if (progressCircleRef.current) {
      progressCircleRef.current.style.strokeDashoffset = circumference;
      progressCircleRef.current.style.opacity = '0';
    }
  }, [circumference]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Update progress using requestAnimationFrame for smooth animation
  useEffect(() => {
    if (!isHolding) {
      return;
    }

    const updateProgress = () => {
      if (!startTimeRef.current) {
        return;
      }

      const elapsed = Date.now() - startTimeRef.current;
      const newProgress = Math.min((elapsed / HOLD_DURATION) * 100, 100);
      
      // Update state for button scale
      setProgress(newProgress);
      
      // Directly update SVG for immediate visual feedback
      if (progressCircleRef.current) {
        const newOffset = circumference * (1 - newProgress / 100);
        progressCircleRef.current.style.strokeDashoffset = newOffset;
        progressCircleRef.current.style.opacity = newProgress > 0 ? '1' : '0';
      }

      if (newProgress >= 100) {
        // Hold complete
        setIsHolding(false);
        animationFrameRef.current = null;
        setIsConfirmed(true);
        onConfirm();
        // Reset after a brief delay
        setTimeout(() => {
          setProgress(0);
          setIsConfirmed(false);
          if (progressCircleRef.current) {
            progressCircleRef.current.style.strokeDashoffset = circumference;
            progressCircleRef.current.style.opacity = '0';
          }
        }, 2000); // Show checkmark for 2 seconds
      } else {
        animationFrameRef.current = requestAnimationFrame(updateProgress);
      }
    };

    // Start immediately
    animationFrameRef.current = requestAnimationFrame(updateProgress);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [isHolding, onConfirm, circumference]);

  const startHold = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;

    setIsHolding(true);
    startTimeRef.current = Date.now();
    setProgress(0);
  };

  const stopHold = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!isHolding) return;

    setIsHolding(false);
    startTimeRef.current = null;

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    // Reset progress smoothly
    setProgress(0);
    if (progressCircleRef.current) {
      progressCircleRef.current.style.strokeDashoffset = circumference;
      progressCircleRef.current.style.opacity = '0';
    }
  };

  // Calculate button scale based on progress (1.0 to 0.85)
  const buttonScale = 1.0 - (progress / 100) * 0.25;
  const activeStrokeColor = activeColor || 'white';
  const contentColor =
    disabled ? 'rgba(255, 255, 255, 0.4)' : (isHolding && activeColor ? activeColor : 'white');

  return (
    <div
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* SVG Progress Circle */}
      <svg
        width="120"
        height="120"
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
        }}
      >
        {/* Background circle */}
        <circle
          cx="60"
          cy="60"
          r={circleRadius}
          fill="none"
          stroke="rgba(255, 255, 255, 0.2)"
          strokeWidth="3"
        />
        {/* Progress circle */}
        <circle
          ref={progressCircleRef}
          cx="60"
          cy="60"
          r={circleRadius}
          fill="none"
          stroke={activeStrokeColor}
          strokeWidth="3"
          strokeDasharray={circumference}
          strokeDashoffset={circumference}
          strokeLinecap="round"
          transform="rotate(-90 60 60)" // Start from top
          style={{
            opacity: 0,
          }}
        />
      </svg>

      {/* Button */}
      <motion.button
        onMouseDown={startHold}
        onMouseUp={stopHold}
        onMouseLeave={stopHold}
        onTouchStart={startHold}
        onTouchEnd={stopHold}
        disabled={disabled || isConfirmed}
        animate={{
          scale: buttonScale,
        }}
        transition={{
          type: 'spring',
          stiffness: 300,
          damping: 30,
        }}
        style={{
          padding: '12px 24px',
          background: 'transparent', 
          color: contentColor,
          border: 'none',
          borderRadius: '8px',
          cursor: disabled || isConfirmed ? 'not-allowed' : 'pointer',
          position: 'relative',
          zIndex: 1,
          userSelect: 'none',
          WebkitUserSelect: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {isConfirmed ? (
          <motion.div
            key="confirmed"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, ease: [0.42, 0, 1, 1] }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CheckCircleIcon sx={{ fontSize: 50, color: '#4caf50' }} />
          </motion.div>
        ) : (
          <motion.div
            animate={isHolding ? {
              opacity: [1, 0.5, 1],
            } : {
              opacity: 1,
            }}
            transition={isHolding ? {
              duration: 1,
              repeat: Infinity,
              ease: 'easeInOut',
            } : {
              duration: 0.5,
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: contentColor }}>
              {children}
            </span>
          </motion.div>
        )}
      </motion.button>
    </div>
  );
};

export default HoldToConfirmButton;
