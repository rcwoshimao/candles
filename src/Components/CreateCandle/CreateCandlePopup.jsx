import React, { useEffect, useMemo, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Menu, MenuItem } from '@spaceymonk/react-radial-menu';
import emotions from '../../lib/emotions.json';
import './CreateCandlePopup.css';

const CreateCandlePopup = ({
  isOpen,
  onClose,
  onEmotionSelect,
  onPlaceCandle,
  onConfirmPlacement,
  onBack,
  currentStep,
  tempPosition,
}) => {
  const [selectStep, setSelectStep] = useState(1); // 1=parent, 2=category, 3=leaf (no confirm step)
  const [selectedMain, setSelectedMain] = useState(null);
  const [selectedMid, setSelectedMid] = useState(null);
  const [selectedLeaf, setSelectedLeaf] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const menuContainerRef = useRef(null);
  const panelRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      setSelectStep(1);
      setSelectedMain(null);
      setSelectedMid(null);
      setSelectedLeaf(null);
      setMenuPosition({ x: 0, y: 0 }); // Reset position when closed
    }
  }, [isOpen]);

  // Calculate center position of the menu container when it's ready
  useEffect(() => {
    if (isOpen && selectStep === 1 && menuContainerRef.current) {
      const updatePosition = () => {
        if (menuContainerRef.current && panelRef.current) {
          // Use the panel's center for more accurate positioning
          const panelRect = panelRef.current.getBoundingClientRect();
          const newPos = {
            x: panelRect.left + panelRect.width / 2,
            y: panelRect.top + panelRect.height / 2,
          };
          setMenuPosition(newPos);
        }
      };
      
      // Update immediately
      updatePosition();
      
      // Also update after a short delay to ensure layout is complete
      const timer = setTimeout(updatePosition, 100);
      
      // Add window resize listener to recalculate position
      const handleResize = () => {
        updatePosition();
      };
      
      window.addEventListener('resize', handleResize);
      
      return () => {
        clearTimeout(timer);
        window.removeEventListener('resize', handleResize);
      };
    }
  }, [isOpen, selectStep]);

  const mainOptions = useMemo(() => Object.keys(emotions), []);

  // Apply colors to radial menu SVG paths
  useEffect(() => {
    if (isOpen && selectStep === 1 && mainOptions.length > 0) {
      // Wait for menu to render, then apply colors
      const applyColors = () => {
        const paths = document.querySelectorAll('path.__rrm-base');
        if (paths.length === mainOptions.length) {
          paths.forEach((path, index) => {
            const emotion = mainOptions[index];
            const color = getComputedStyle(document.documentElement)
              .getPropertyValue(`--emotion-${emotion}`)
              .trim();
            if (color) {
              path.setAttribute('fill', color);
              path.style.fill = color;
            }
          });
        }
      };
      
      // Try immediately and after a short delay
      applyColors();
      const colorTimer = setTimeout(applyColors, 200);
      
      return () => clearTimeout(colorTimer);
    }
  }, [isOpen, selectStep, mainOptions]);

  const midOptions = useMemo(
    () => (selectedMain ? Object.keys(emotions[selectedMain] || {}) : []),
    [selectedMain]
  );
  const leafOptions = useMemo(
    () => (selectedMain && selectedMid ? emotions[selectedMain]?.[selectedMid] || [] : []),
    [selectedMain, selectedMid]
  );

  const breadcrumb = useMemo(() => {
    if (!selectedMain) return '';
    if (!selectedMid) return `${selectedMain} >`;
    if (!selectedLeaf) return `${selectedMain} > ${selectedMid} >`;
    return `${selectedMain} > ${selectedMid} > ${selectedLeaf}`;
  }, [selectedMain, selectedMid, selectedLeaf]);

  if (!isOpen) return null;

  const canGoLeft = currentStep === 2 ? Boolean(onBack) : selectStep > 1;
  const canGoRight = (() => {
    if (currentStep === 2) return Boolean(tempPosition); // Disabled if no candle placed
    if (selectStep === 1) return Boolean(selectedMain);
    if (selectStep === 2) return Boolean(selectedMid);
    if (selectStep === 3) return Boolean(selectedLeaf);
    return false; // No step 4
  })();

  const handleLeft = () => {
    if (currentStep === 2) {
      onBack?.();
      return;
    }

    if (selectStep === 2) {
      setSelectStep(1);
      setSelectedMid(null);
      setSelectedLeaf(null);
      return;
    }

    if (selectStep === 3) {
      setSelectStep(2);
      setSelectedLeaf(null);
      return;
    }
  };

  const handleRight = () => {
    if (currentStep === 2) {
      onConfirmPlacement();
      return;
    }

    if (selectStep === 1) {
      if (!selectedMain) return;
      setSelectStep(2);
      return;
    }

    if (selectStep === 2) {
      if (!selectedMid) return;
      setSelectStep(3);
      return;
    }

    if (selectStep === 3) {
      if (!selectedLeaf) return;
      // Jump directly to placement instead of going to confirm step
      onPlaceCandle();
      return;
    }
  };

  return (
    <div className="create-candle-panel" ref={panelRef}>
      <div className="create-candle-top-bar">
        <div className="create-candle-breadcrumb">{breadcrumb || ' '}</div>
        <button
          onClick={onClose}
          aria-label="Close"
          style={{ padding: '2px 10px', background: 'transparent', color: 'white', cursor: 'pointer' }}
        >
          ×
        </button>
      </div>

      {currentStep === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {selectStep === 1 && (
            <>
              <div
                ref={(el) => {
                  if (menuContainerRef.current === el) return; // Prevent infinite loop
                  menuContainerRef.current = el;
                  if (el && isOpen && selectStep === 1) {
                    // Calculate position immediately when ref is set (synchronous)
                    // Use the panel's center for more accurate positioning
                    const panelRect = panelRef.current?.getBoundingClientRect();
                    const containerRect = el.getBoundingClientRect();
                    
                    let newPos;
                    if (panelRect) {
                      // Center based on the panel's dimensions
                      newPos = {
                        x: panelRect.left + panelRect.width / 2,
                        y: panelRect.top + panelRect.height / 2,
                      };
                    } else {
                      // Fallback to container rect
                      newPos = {
                        x: containerRect.left + containerRect.width / 2,
                        y: containerRect.top + containerRect.height / 2,
                      };
                    }
                    // Only update if position changed significantly (avoid infinite loops)
                    setMenuPosition(prev => {
                      // Always update if prev is (0,0) (initial state)
                      if (prev.x === 0 && prev.y === 0) {
                        return newPos;
                      }
                      const threshold = 10; // Only update if change is significant
                      if (Math.abs(prev.x - newPos.x) > threshold || Math.abs(prev.y - newPos.y) > threshold) {
                        return newPos;
                      }
                      return prev;
                    });
                  }
                }}
                style={{ 
                  width: '100%', 
                  height: 'calc(360px - 12px - 12px - 40px)', // Panel height minus padding (top+bottom) minus top bar height
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onClick={() => {
                  // Close menu when clicking outside (but don't prevent selection)
                }}
              >
                {createPortal(
                  <>
                    <Menu
                      centerX={menuPosition.x}
                      centerY={menuPosition.y}
                      innerRadius={75}
                      outerRadius={170}
                      show={isOpen && selectStep === 1}
                      animation={["fade"]}
                      animationTimeout={0}
                      drawBackground
                      style={{
                        zIndex: 5000,
                        position: 'fixed',
                      }}
                    >
                    {mainOptions.map((emotion) => (
                      <MenuItem
                        key={emotion}
                        onItemClick={(event, index, data) => {
                          setSelectedMain(data);
                          setSelectedMid(null);
                          setSelectedLeaf(null);
                        }}
                        data={emotion}
                        style={{
                          color: `var(--emotion-${emotion})`,
                        }}
                      >
                        {emotion}
                      </MenuItem>
                    ))}
                  </Menu>
                  {/* Center text overlay */}
                  {isOpen && selectStep === 1 && menuPosition.x !== 0 && menuPosition.y !== 0 && (
                    <div
                      style={{
                        position: 'fixed',
                        left: `${menuPosition.x}px`,
                        top: `${menuPosition.y}px`,
                        transform: 'translate(-50%, -50%)',
                        zIndex: 5001,
                        pointerEvents: 'none',
                        textAlign: 'center',
                        color: 'white',
                        fontSize: '16px',
                        fontWeight: '500',
                        width: "100px",
                        margin: '5px'
                      }}
                    >
                      How are you feeling?
                    </div>
                  )}
                  </>,
                  document.body
                )}
              </div>
            </>
          )}

          {selectStep === 2 && (
            <>
              <h3 style={{ margin: 0 }}>How would you describe it? </h3>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {midOptions.map((mid) => (
                  <button
                    key={mid}
                    onClick={() => {
                      setSelectedMid(mid);
                      setSelectedLeaf(null);
                    }}
                    style={{
                      padding: '6px 10px',
                      border: '1px solid #ccc',
                      borderRadius: 4,
                      background: selectedMid === mid ? 'white' : 'transparent',
                      color: selectedMid === mid ? 'black' : 'white',
                      cursor: 'pointer',
                    }}
                  >
                    {mid}
                  </button>
                ))}
              </div>
            </>
          )}

          {selectStep === 3 && (
            <>
              <h3 style={{ margin: 0 }}>Choose a specific feeling</h3>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {leafOptions.map((leaf) => (
                  <button
                    key={leaf}
                    onClick={() => {
                      setSelectedLeaf(leaf);
                      onEmotionSelect(leaf);
                    }}
                    style={{
                      padding: '6px 10px',
                      border: '1px solid #ccc',
                      borderRadius: 4,
                      background: selectedLeaf === leaf ? 'white' : 'transparent',
                      color: selectedLeaf === leaf ? 'black' : 'white',
                      cursor: 'pointer',
                    }}
                  >
                    {leaf}
                  </button>
                ))}
              </div>
            </>
          )}

          <div className="create-candle-nav-row">
            <button className="nav-btn" onClick={handleLeft} disabled={!canGoLeft}>
              ←
            </button>
            <button className="nav-btn" onClick={handleRight} disabled={!canGoRight}>
              →
            </button>
          </div>
        </div>
      )}

      {currentStep === 2 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <h3 style={{ margin: 0 }}>Place your candle</h3>
          <p style={{ margin: 0 }}>Click anywhere on the map to place your candle.</p>
          <div className="create-candle-nav-row">
            <button className="nav-btn" onClick={handleLeft} disabled={!canGoLeft}>
              ←
            </button>
            <button className="nav-btn" onClick={handleRight} disabled={!canGoRight}>
              Place candle
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateCandlePopup;


