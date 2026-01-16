import React, { useEffect, useMemo, useState } from 'react';
import emotions from '../Candle/emotions.json';
import './CreateCandlePopup.css'; 

const CreateCandlePopup = ({
  isOpen,
  onClose,
  onEmotionSelect,
  selectedEmotion, // kept for future; selection is driven by internal state for now
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

  useEffect(() => {
    if (!isOpen) {
      setSelectStep(1);
      setSelectedMain(null);
      setSelectedMid(null);
      setSelectedLeaf(null);
    }
  }, [isOpen]);

  const mainOptions = useMemo(() => Object.keys(emotions), []);
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
    <div className="create-candle-panel">
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
              <h3 style={{ marginBottom: 10 }}>How are you feeling? </h3>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {mainOptions.map((emotion) => (
                  <button
                    key={emotion}
                    onClick={() => {
                      setSelectedMain(emotion);
                      setSelectedMid(null);
                      setSelectedLeaf(null);
                    }}
                    style={{
                      padding: '6px 10px',
                      border: '1px solid #ccc',
                      borderRadius: 4,
                      background: selectedMain === emotion ? 'white' : 'transparent',
                      color: selectedMain === emotion ? 'black' : 'white',
                      cursor: 'pointer',
                    }}
                  >
                    {emotion}
                  </button>
                ))}
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


