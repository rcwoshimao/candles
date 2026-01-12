import React, { useEffect, useMemo, useState } from 'react';
import emotions from '../Candle/emotions.json';

const CreateCandlePopup = ({
  isOpen,
  onClose,
  onEmotionSelect,
  selectedEmotion, // kept for future; selection is driven by internal state for now
  onPlaceCandle,
  onConfirmPlacement,
  onBack,
  currentStep,
}) => {
  const [selectStep, setSelectStep] = useState(1); // 1=parent, 2=category, 3=leaf, 4=confirm
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
    if (currentStep === 2) return true;
    if (selectStep === 1) return Boolean(selectedMain);
    if (selectStep === 2) return Boolean(selectedMid);
    if (selectStep === 3) return Boolean(selectedLeaf);
    return true; // step 4 confirm
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

    if (selectStep === 4) {
      setSelectStep(3);
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
      setSelectStep(4);
      return;
    }

    // selectStep === 4
    onPlaceCandle();
  };

  const panelStyle = {
    position: 'absolute',
    bottom: 'calc(100% + 8px)',
    left: '50%',
    transform: 'translateX(-50%)',
    background: '#111',
    color: 'white',
    padding: 12,
    borderRadius: 8,
    width: 320,
  };

  const topBarStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  };

  const crumbStyle = {
    fontSize: 12,
    opacity: 0.9,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    maxWidth: 260,
  };

  const navRowStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 10,
  };

  return (
    <div style={panelStyle}>
      <div style={topBarStyle}>
        <div style={crumbStyle}>{breadcrumb || ' '}</div>
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

          {selectStep === 4 && (
            <>
              <h3 style={{ margin: 0 }}>Confirm</h3>
              <div>
                Selected: {selectedMain} &gt; {selectedMid} &gt; {selectedLeaf}
              </div>
              <div style={{ opacity: 0.7, fontSize: 12 }}>Stored emotion: {selectedEmotion || selectedLeaf}</div>
            </>
          )}

          <div style={navRowStyle}>
            <button onClick={handleLeft} disabled={!canGoLeft}>
              ←
            </button>
            <button onClick={handleRight} disabled={!canGoRight}>
              →
            </button>
          </div>
        </div>
      )}

      {currentStep === 2 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <h3 style={{ margin: 0 }}>Place your candle</h3>
          <p style={{ margin: 0 }}>Click anywhere on the map to place your candle.</p>
          <div style={navRowStyle}>
            <button onClick={handleLeft} disabled={!canGoLeft}>
              ←
            </button>
            <button onClick={handleRight} disabled={!canGoRight}>
              →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateCandlePopup;


