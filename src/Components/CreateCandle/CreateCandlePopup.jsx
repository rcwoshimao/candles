import React, { useEffect, useMemo, useState, useRef } from 'react';
import { PieChart, pieArcClasses, pieArcLabelClasses } from '@mui/x-charts/PieChart';
import emotions from '../../lib/emotions.json';
import './CreateCandlePopup.css';

const CreateCandlePopup = ({
  isOpen,
  onClose,
  onEmotionSelect,
  onPlaceCandle,
  onConfirmPlacement,
  currentStep,
  tempPosition,
}) => {
  const [selectedMain, setSelectedMain] = useState(null);
  const [selectedMid, setSelectedMid] = useState(null);
  const [selectedLeaf, setSelectedLeaf] = useState(null);
  const panelRef = useRef(null);

  // Progressive expansion navigation state
  const [navigationLevel, setNavigationLevel] = useState('parent'); // 'parent' | 'mid' | 'leaf'

  useEffect(() => {
    if (!isOpen) {
      setSelectedMain(null);
      setSelectedMid(null);
      setSelectedLeaf(null);
      setNavigationLevel('parent'); // Reset navigation level
    }
  }, [isOpen]);


  const mainOptions = useMemo(() => Object.keys(emotions), []);

  // Helper function to get CSS variable color
  const getEmotionColor = (emotion) => {
    if (typeof window === 'undefined') return '#999';
    const color = getComputedStyle(document.documentElement)
      .getPropertyValue(`--emotion-${emotion}`)
      .trim();
    return color || '#999';
  };

  // Prepare data for PieChart based on navigation level
  const pieChartData = useMemo(() => {
    if (navigationLevel === 'parent') {
      // Parent level: show all main emotions
      return mainOptions.map((emotion) => ({
        id: emotion,
        label: emotion,
        value: 1, // Equal segments
        color: getEmotionColor(emotion),
      }));
    } else if (navigationLevel === 'mid' && selectedMain) {
      // Mid level: show mid emotions for selected parent
      const midEmotions = Object.keys(emotions[selectedMain] || {});
      return midEmotions.map((mid) => ({
        id: `${selectedMain}::${mid}`,
        label: mid,
        value: 1,
        color: getEmotionColor(selectedMain), // Use parent color
      }));
    } else if (navigationLevel === 'leaf' && selectedMain && selectedMid) {
      // Leaf level: show leaf emotions for selected mid
      const leafEmotions = emotions[selectedMain]?.[selectedMid] || [];
      return leafEmotions.map((leaf) => ({
        id: `${selectedMain}::${selectedMid}::${leaf}`,
        label: leaf,
        value: 1,
        color: getEmotionColor(selectedMain), // Use parent color
      }));
    }
    return [];
  }, [navigationLevel, selectedMain, selectedMid, mainOptions]);

  // Handle PieChart click events
  const handlePieChartClick = (event, params) => {
    const { dataIndex } = params;
    const clickedItem = pieChartData[dataIndex];
    
    if (!clickedItem) return;

    if (navigationLevel === 'parent') {
      // Clicked parent -> navigate to mid level
      setSelectedMain(clickedItem.id);
      setSelectedMid(null);
      setSelectedLeaf(null);
      setNavigationLevel('mid');
    } else if (navigationLevel === 'mid') {
      // Clicked mid -> navigate to leaf level
      const midName = clickedItem.id.split('::')[1];
      setSelectedMid(midName);
      setSelectedLeaf(null);
      setNavigationLevel('leaf');
    } else if (navigationLevel === 'leaf') {
      // Clicked leaf -> select emotion and enable map placement
      const leafName = clickedItem.id.split('::')[2];
      setSelectedLeaf(leafName);
      onEmotionSelect(leafName);
      // Enable map clicking to show temporary marker - pass emotion directly to avoid race condition
      onPlaceCandle(leafName);
    }
  };

  const breadcrumb = useMemo(() => {
    if (!selectedMain) return '';
    if (!selectedMid) return `${selectedMain} >`;
    if (!selectedLeaf) return `${selectedMain} > ${selectedMid} >`;
    return `${selectedMain} > ${selectedMid} > ${selectedLeaf}`;
  }, [selectedMain, selectedMid, selectedLeaf]);

  // Handle back navigation
  const handleLeft = () => {
    if (selectedLeaf) {
      // If we're in the placement UI, go back to leaf selection
      setSelectedLeaf(null);
      return;
    }
    if (navigationLevel === 'leaf') {
      setNavigationLevel('mid');
      setSelectedLeaf(null);
      return;
    }
    if (navigationLevel === 'mid') {
      setNavigationLevel('parent');
      setSelectedMid(null);
      setSelectedLeaf(null);
      setSelectedMain(null);
      return;
    }
  };

  const canGoLeft = navigationLevel !== 'parent' || selectedLeaf;

  if (!isOpen) return null;


    


  return (
    <div 
      className="create-candle-panel" 
      ref={panelRef}
      style={{
        height: selectedLeaf ? 'auto' : '340px',
        minHeight: selectedLeaf ? 'auto' : '340px',
      }}
    >
      <div className="create-candle-top-bar">
        {!selectedLeaf && <div className="create-candle-breadcrumb" style={{ fontSize: '14px' }}>{breadcrumb || ' '}</div>}
        {selectedLeaf && <div style={{ flex: 1 }}></div>}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (onClose) {
              onClose();
            }
          }}
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          aria-label="Close"
          style={{ 
            padding: '2px 10px', 
            background: 'transparent', 
            color: 'white', 
            cursor: 'pointer',
            border: 'none',
            fontSize: '20px',
            lineHeight: '1',
            flexShrink: 0,
            position: 'relative',
            zIndex: 100,
            pointerEvents: 'auto',
          }}
        >
          ×
        </button>
      </div>
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: 8,
        width: '100%', 
        height: selectedLeaf ? 'auto' : 'calc(340px - 12px - 12px - 40px)',
        minHeight: selectedLeaf ? 'auto' : 'calc(340px - 12px - 12px - 40px)',
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
        padding: selectedLeaf ? '20px 12px' : '0',
        overflow: 'hidden',
      }}>
        {!selectedLeaf && isOpen && pieChartData.length > 0 && (
          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              width: '340px',
              height: '340px',
              zIndex: 1,
              pointerEvents: 'auto',
            }}
          >
            <PieChart
                      series={[
                        {
                          id: 'emotion-wheel',
                          startAngle: 0,
                          endAngle: 360,
                          innerRadius: 56,
                          outerRadius: 138,
                          paddingAngle: 2,
                          cornerRadius: 3,
                          data: pieChartData,
                          highlightScope: { fade: 'global', highlight: 'item' },
                          arcLabel: (item) => item.label,
                          arcLabelMinAngle: 20,
                        },
                      ]}
                      slotProps={{tooltip: { trigger: 'none' } }}
                      hideTooltip={true}
                      width={340}
                      height={340}
                      margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
                      skipAnimation={false}
                      onItemClick={handlePieChartClick}
                      sx={{
                        [`& .${pieArcClasses.root}`]: {
                          stroke: 'none',
                          strokeWidth: 0,
                          cursor: 'pointer',
                        },
                        [`& .${pieArcLabelClasses.root}`]: {
                          fill: 'black',
                          fontSize: 14,
                          fontWeight: '500',
                          pointerEvents: 'none',
                        },
                      }}
                      hideLegend
                    />
                    {/* Center text overlay */}
                    <div
                      style={{
                        position: 'absolute',
                        left: '50%',
                        top: '50%',
                        transform: 'translate(-50%, -50%)',
                        pointerEvents: 'none',
                        textAlign: 'center',
                        color: 'white',
                        fontSize: '16px',
                        fontWeight: '500',
                        width: '100px',
                      }}
                    >
                      {navigationLevel === 'parent' && 'How are you feeling?'}
                      {navigationLevel === 'mid' && selectedMain && `Describe it in detail.`}
                      {navigationLevel === 'leaf' && selectedMid && `Describe it in detail.`}
            </div>
          </div>
        )}
        {selectedLeaf && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 24,
            width: '100%',
          }}>
            <div className="create-candle-breadcrumb" style={{ fontSize: '20px', marginBottom: '8px' }}>
              {breadcrumb}
            </div>
            <div style={{
              textAlign: 'center',
              color: 'rgba(255, 255, 255, 0.8)',
              fontSize: '14px',
              lineHeight: '1.5',
            }}>
              Choose a spot on the map. When ready, click Place Candle. 
            </div>
            <button
              onClick={onConfirmPlacement}
              disabled={!tempPosition}
              style={{
                padding: '12px 24px',
                fontSize: '16px',
                fontWeight: '600',
                background: tempPosition ? 'white' : 'rgba(255, 255, 255, 0.5)',
                color: tempPosition ? '#111' : 'rgba(255, 255, 255, 0.7)',
                border: 'none',
                borderRadius: '8px',
                cursor: tempPosition ? 'pointer' : 'not-allowed',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              }}
              onMouseEnter={(e) => {
                if (tempPosition) {
                  e.currentTarget.style.transform = 'scale(1.05)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 255, 255, 0.3)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              Place candle
            </button>
          </div>
        )}
        {canGoLeft && (
          <button 
            className="nav-btn" 
            onClick={handleLeft}
            style={{
              position: 'absolute',
              bottom: '0px',
              left: '0px',
              zIndex: '5002'
            }}
          >
            ← 
          </button>
        )}
      </div>
    </div>
  );
};

export default CreateCandlePopup;


