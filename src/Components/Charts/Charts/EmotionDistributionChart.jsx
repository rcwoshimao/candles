import React from 'react';
import BaseChart from '../Common/BaseChart';
import './EmotionDistributionChart.css';

const EmotionDistributionChart = ({ data }) => {
  // This is a placeholder for the actual chart implementation
  const emotions = data?.emotions || {
    joy: 0,
    sadness: 0,
    hope: 0,
    love: 0,
    peace: 0
  };

    console.log('Emotion Data:', data?.emotions);
    console.log('Max value:', Math.max(...Object.values(emotions)));
    console.log('Width calculations:', Object.entries(emotions).map(([emotion, count]) => ({
    emotion,
    count,
    maxValue: Math.max(...Object.values(emotions)),
    percentage: (count / Math.max(...Object.values(emotions))) * 100,
    width: `${(count / Math.max(...Object.values(emotions))) * 100}%`
    })));
    
  return (
    <BaseChart title="Emotion Distribution">
      <div className="emotion-chart">
        {Object.entries(emotions).map(([emotion, count]) => (
          <div key={emotion} className="emotion-bar">
            <div className="emotion-label">{emotion}</div>
            <div className="emotion-bar-container">
              <div 
                className="emotion-bar-fill"
                data-emotion={emotion}
                style={{ width: `${(count / Math.max(...Object.values(emotions))) * 100}%` }}
              />
            </div>
            <div className="emotion-count">{count}</div>
          </div>
        ))}
      </div>
    </BaseChart>
  );
};

export default EmotionDistributionChart; 