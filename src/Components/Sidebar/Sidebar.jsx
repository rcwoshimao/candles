import * as React from "react";
import { useRef, useState, useEffect, Suspense } from "react";
import { AnimatePresence, motion, useCycle } from "framer-motion";
import { useDimensions } from "./use-dimensions";
import { MenuToggle } from "./MenuToggle";
import './Sidebar.css';

// Lazy load ChartContainer for code splitting
const ChartContainer = React.lazy(() => import("../Charts/ChartContainer/ChartContainer"));

const sidebar = {
  open: (height = 1000) => ({
    clipPath: `circle(${height * 2 + 200}px at calc(100% - 40px) 40px)`,
    transition: {
      type: "spring",
      stiffness: 20,
      restDelta: 2
    }
  }),
  closed: {
    clipPath: "circle(30px at calc(100% - 40px) 40px)",
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 40
    }
  }
};

// Add variants for the resize handle
const resizeHandleVariants = {
  open: {
    opacity: 1,
    transition: {
      delay: 0.3, // Wait for the circular animation to be mostly complete
      duration: 0.2
    }
  },
  closed: {
    opacity: 0,
    transition: {
      duration: 0.1 // Quick fade out when closing starts
    }
  }
};

const DEFAULT_SIDEBAR_WIDTH = 500;
const MIN_WIDTH = 500;
// const MAX_WIDTH = 600;
const MAX_WIDTH = 1000;

export const Sidebar = ({ markers, isOpen: controlledIsOpen, onToggle, isPhone }) => {

  // Support both controlled and uncontrolled usage.
  const [uncontrolledIsOpen, toggleOpen] = useCycle(false, true);
  const isOpen = controlledIsOpen ?? uncontrolledIsOpen;
  const handleToggle = onToggle ?? (() => toggleOpen());

  const isMobile = Boolean(isPhone);

  // If the sidebar mounts already open (controlled), `onAnimationComplete` may not fire.
  const [isFullyOpen, setIsFullyOpen] = useState(isOpen);
  const containerRef = useRef(null);
  const { height } = useDimensions(containerRef);
  
  // Initialize sidebar width from localStorage or use default
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const savedWidth = localStorage.getItem('sidebarWidth');
    return savedWidth ? parseInt(savedWidth, 10) : DEFAULT_SIDEBAR_WIDTH;
  });
  
  if (import.meta.env.DEV) {
    console.count('[render] Sidebar');
    console.log('[Sidebar props/state]', {
      controlledIsOpen,
      uncontrolledIsOpen,
      isOpen,
      isFullyOpen,
      sidebarWidth,
    });
  }
  
  const [isResizing, setIsResizing] = useState(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  // Save width to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('sidebarWidth', sidebarWidth.toString());
  }, [sidebarWidth]);

  // // Handle the animation completion
  // const handleAnimationComplete = () => {
  //   setIsFullyOpen(isOpen);
  // };
  const handleAnimationComplete = () => {
    if (import.meta.env.DEV) {
      console.log('[Sidebar] onAnimationComplete. isOpen currently:', isOpen);
    }
    setIsFullyOpen(isOpen);
  };

  // When closing, immediately stop rendering heavy charts.
  // useEffect(() => {
  //   if (!isOpen) setIsFullyOpen(false);
  // }, [isOpen]);
  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log('[Sidebar] isOpen changed:', isOpen);
    }
    if (!isOpen) {
      if (import.meta.env.DEV) {
        console.log('[Sidebar] closing -> setIsFullyOpen(false)');
      }
      setIsFullyOpen(false);
    }
  }, [isOpen]);

  const handleMouseDown = (e) => {
    setIsResizing(true);
    startXRef.current = e.clientX;
    startWidthRef.current = sidebarWidth;
    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing) return;

      const deltaX = startXRef.current - e.clientX;
      const newWidth = Math.min(Math.max(startWidthRef.current + deltaX, MIN_WIDTH), MAX_WIDTH);
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  // Process markers data for visualization
  const processedMarkers = React.useMemo(() => {
    if (!markers) return null;
    
    const emotions = {};
    markers.forEach(marker => {
      const emotion = marker.emotion;
      emotions[emotion] = (emotions[emotion] || 0) + 1;
    });

    return {
      total: markers.length,
      emotions: emotions
    };
  }, [markers]);

  return (
    <>
      {/* Keep the toggle always tappable and independent of sidebar pointer-events */}
      <motion.div
        className="sidebar-toggle-button"
        initial={false}
        animate={isOpen ? "open" : "closed"}
      >
        <MenuToggle toggle={handleToggle} />
      </motion.div>

      {isMobile ? (
        <AnimatePresence>
          {isOpen ? (
            <motion.div
              className="sidebar-mobile-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              <motion.div
                className="sidebar-mobile-panel"
                role="dialog"
                aria-modal="true"
                aria-label="Candle analytics"
                initial={{ y: 18, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 18, opacity: 0 }}
                transition={{ type: "spring", stiffness: 420, damping: 38 }}
              >
                <div className="sidebar-mobile-header">
                  <div className="sidebar-mobile-title">Candle Analytics</div>
                  <button
                    type="button"
                    className="sidebar-mobile-close"
                    onClick={handleToggle}
                    aria-label="Close analytics"
                  >
                    Close
                  </button>
                </div>

                <div className="sidebar-mobile-stats">
                  <div className="stat-item">
                    <span className="stat-label">Total Candles:</span>
                    <span className="stat-value">{processedMarkers?.total || 0}</span>
                  </div>
                </div>

                <div className="sidebar-mobile-content">
                  {markers ? (
                    <Suspense fallback={<div className="chart-loading">Loading charts...</div>}>
                      <ChartContainer markers={markers} />
                    </Suspense>
                  ) : null}
                </div>
              </motion.div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      ) : (
        <motion.nav
          className={`sidebar-nav${!isOpen ? ' closed' : ''}`}
          initial={false}
          animate={isOpen ? "open" : "closed"}
          custom={height}
          ref={containerRef}
          onAnimationComplete={handleAnimationComplete}
          style={{ width: isOpen ? sidebarWidth : 0 }}
        >
          <motion.div
            className={`sidebar-background${isFullyOpen ? ' blurred' : ''}`}
            variants={sidebar}
            initial={false}
            animate={isOpen ? "open" : "closed"}
            custom={height}
          >
            <div className="sidebar-content">
              <div className="sidebar-header">
                <h2>Candle Analytics</h2>
                <div className="sidebar-stats">
                  <div className="stat-item">
                    <span className="stat-label">Total Candles:</span>
                    <span className="stat-value">{processedMarkers?.total || 0}</span>
                  </div>
                </div>
              </div>
              
              <div className="sidebar-charts-container">
                {isFullyOpen && markers && (
                  <Suspense fallback={<div className="chart-loading">Loading charts...</div>}>
                    <ChartContainer markers={markers} />
                  </Suspense>
                )}
              </div>
            </div>
          </motion.div>
          <motion.div 
            className="sidebar-resize-handle"
            variants={resizeHandleVariants}
            initial="closed"
            animate={isOpen ? "open" : "closed"}
            onMouseDown={handleMouseDown}
          />
        </motion.nav>
      )}
    </>
  );
};

export default Sidebar;
