import React from 'react';
import BaseChart from '../Common/BaseChart';
import './EmotionDistributionChart.css';
import emotionParentMap from './emotionParentMap';

const EmotionDistributionChart = ({ data }) => {
  // `data` is the `markers` array.
  const emotions = React.useMemo(() => {
    const counts = {};

    for (const marker of data || []) {
      const leaf = marker?.emotion;
      if (!leaf) continue;
      const parent = emotionParentMap[leaf] || leaf;
      counts[parent] = (counts[parent] || 0) + 1;
    }

    return counts;
  }, [data]);

  const maxValue = React.useMemo(() => {
    const vals = Object.values(emotions);
    return vals.length ? Math.max(...vals) : 0;
  }, [emotions]);

  return (
    <BaseChart title="Emotion Distribution">
      <div className="emotion-chart">
        {Object.entries(emotions)
          .sort((a, b) => b[1] - a[1])
          .map(([emotion, count]) => (
          <div key={emotion} className="emotion-bar">
            <div className="emotion-label">{emotion}</div>
            <div className="emotion-bar-container">
              <div 
                className="emotion-bar-fill"
                data-emotion={emotionParentMap[emotion] || emotion}
                style={{ width: maxValue ? `${(count / maxValue) * 100}%` : '0%' }}
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