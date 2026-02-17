import React, { useMemo, useState, useRef, useEffect } from 'react';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { motion } from 'framer-motion';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

const DEFAULT_LOTTIE_SRC =
  // Using a JSON source makes runtime recoloring possible.
  'https://lottie.host/c6684599-897c-4d01-8257-bfffc903aadd/tVqxsYO8Tg.json';

function clamp01(n) {
  return Math.max(0, Math.min(1, n));
}

function parseCssColorToRgba01(color) {
  if (!color || typeof color !== 'string') return null;

  // Common named colors we actually use here
  if (color === 'white') return { r: 1, g: 1, b: 1, a: 1 };
  if (color === 'black') return { r: 0, g: 0, b: 0, a: 1 };

  const hex = color.trim();
  if (hex[0] === '#') {
    const h = hex.slice(1);
    const isShort = h.length === 3 || h.length === 4;
    const isLong = h.length === 6 || h.length === 8;
    if (isShort || isLong) {
      const norm = (s) => (isShort ? s.split('').map((c) => c + c).join('') : s);
      const full = norm(h);
      const r = parseInt(full.slice(0, 2), 16) / 255;
      const g = parseInt(full.slice(2, 4), 16) / 255;
      const b = parseInt(full.slice(4, 6), 16) / 255;
      const a = full.length === 8 ? parseInt(full.slice(6, 8), 16) / 255 : 1;
      return { r, g, b, a };
    }
  }

  const rgbMatch = color
    .trim()
    .match(/^rgba?\(\s*([.\d]+)\s*,\s*([.\d]+)\s*,\s*([.\d]+)(?:\s*,\s*([.\d]+))?\s*\)$/i);
  if (rgbMatch) {
    const r = clamp01(Number(rgbMatch[1]) / 255);
    const g = clamp01(Number(rgbMatch[2]) / 255);
    const b = clamp01(Number(rgbMatch[3]) / 255);
    const a = rgbMatch[4] == null ? 1 : clamp01(Number(rgbMatch[4]));
    return { r, g, b, a };
  }

  return null;
}

function deepClone(obj) {
  // structuredClone is supported in modern browsers; fall back for safety.
  if (typeof structuredClone === 'function') return structuredClone(obj);
  return JSON.parse(JSON.stringify(obj));
}

function recolorLottieFillsTo(animationData, rgba01) {
  if (!animationData || !rgba01) return animationData;
  const clone = deepClone(animationData);
  const fillK = [rgba01.r, rgba01.g, rgba01.b, rgba01.a];

  const recolorShapes = (shapes) => {
    if (!Array.isArray(shapes)) return;
    for (const shape of shapes) {
      if (!shape || typeof shape !== 'object') continue;
      // Fill
      if (shape.ty === 'fl' && shape.c && typeof shape.c === 'object' && Array.isArray(shape.c.k)) {
        shape.c.k = fillK;
      }
      // Recurse into groups
      if (shape.ty === 'gr' && Array.isArray(shape.it)) {
        recolorShapes(shape.it);
      }
    }
  };

  const recolorLayers = (layers) => {
    if (!Array.isArray(layers)) return;
    for (const layer of layers) {
      if (!layer || typeof layer !== 'object') continue;
      if (Array.isArray(layer.shapes)) recolorShapes(layer.shapes);
      // Some animations nest layers under assets (precomps)
      if (layer.refId && clone.assets) {
        // handled below in assets traversal
      }
    }
  };

  recolorLayers(clone.layers);
  if (Array.isArray(clone.assets)) {
    for (const asset of clone.assets) {
      if (asset && Array.isArray(asset.layers)) {
        recolorLayers(asset.layers);
      }
    }
  }

  return clone;
}

const HoldToConfirmButton = ({
  onConfirm,
  disabled,
  activeColor,
  children = 'Place candle',
  lottieSrc = DEFAULT_LOTTIE_SRC,
}) => {
  const [progress, setProgress] = useState(0);
  const [isHolding, setIsHolding] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [baseRippleJson, setBaseRippleJson] = useState(null);
  const animationFrameRef = useRef(null);
  const startTimeRef = useRef(null);
  const progressCircleRef = useRef(null);
  const HOLD_DURATION = 2500; // 2 seconds
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

  // Load JSON ripple once (enables true runtime recoloring)
  useEffect(() => {
    const isJsonSrc = typeof lottieSrc === 'string' && lottieSrc.toLowerCase().endsWith('.json');
    if (!isJsonSrc) {
      setBaseRippleJson(null);
      return;
    }

    const controller = new AbortController();
    (async () => {
      try {
        const res = await fetch(lottieSrc, { signal: controller.signal });
        if (!res.ok) throw new Error(`Failed to fetch lottie JSON (${res.status})`);
        const json = await res.json();
        setBaseRippleJson(json);
      } catch (err) {
        if (controller.signal.aborted) return;
        // If fetch fails, we'll fall back to rendering from src directly.
        setBaseRippleJson(null);
      }
    })();

    return () => controller.abort();
  }, [lottieSrc]);

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
  // Ripple should show during idle + holding, but never during the confirmed state.
  const showRipple = !disabled && !isConfirmed;
  const rippleColor =
    isHolding && activeColor ? activeColor : 'rgba(255, 255, 255, 0.95)';
  const rippleRgba01 = useMemo(() => parseCssColorToRgba01(rippleColor), [rippleColor]);
  const baseRippleJsonString = useMemo(() => {
    if (!baseRippleJson) return null;
    return JSON.stringify(baseRippleJson);
  }, [baseRippleJson]);
  const tintedRippleJsonString = useMemo(() => {
    // Only recolor when holding with an actual emotion color.
    if (!baseRippleJson) return null;
    if (!(isHolding && activeColor)) return null;
    if (!rippleRgba01) return null;
    return JSON.stringify(recolorLottieFillsTo(baseRippleJson, rippleRgba01));
  }, [activeColor, baseRippleJson, isHolding, rippleRgba01]);
  const isJsonSrc = typeof lottieSrc === 'string' && lottieSrc.toLowerCase().endsWith('.json');
  const rippleDataString =
    (isHolding && activeColor && tintedRippleJsonString) ? tintedRippleJsonString : baseRippleJsonString;
  const RIPPLE_SIZE = 200;

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
        {showRipple ? (
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              width: RIPPLE_SIZE,
              height: RIPPLE_SIZE,
              pointerEvents: 'none',
              opacity: 0.95,
              // If we can't recolor the vectors (e.g. .lottie src), we at least tint via glow.
              //filter: `drop-shadow(0 0 10px ${rippleColor}) drop-shadow(0 0 22px ${rippleColor})`,
            }}
          >
            {isJsonSrc && rippleDataString ? (
              <DotLottieReact
                data={rippleDataString}
                loop
                autoplay
                style={{ width: '100%', height: '100%', display: 'block' }}
              />
            ) : (
              <DotLottieReact
                src={lottieSrc}
                loop
                autoplay
                style={{ width: '100%', height: '100%', display: 'block' }}
              />
            )}
          </div>
        ) : null}
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
