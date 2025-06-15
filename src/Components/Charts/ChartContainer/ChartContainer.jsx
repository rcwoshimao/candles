import React from 'react';
import EmotionDistributionChart from '../Charts/EmotionDistributionChart';
import './ChartContainer.css';

const ChartContainer = ({ markers }) => {
  // Process markers data for charts
  const processEmotionData = (markers) => {
    const emotions = markers.reduce((acc, marker) => {
      const emotion = marker.emotion?.toLowerCase() || 'unknown';
      acc[emotion] = (acc[emotion] || 0) + 1;
      return acc;
    }, {});

    return { emotions };
  };

  const emotionData = processEmotionData(markers || []);

  return (
    <div className="chart-container">
      <h2>Counts</h2>
      <div className="charts-grid">
        <EmotionDistributionChart data={emotionData} />
        <div className="chart-placeholder">
          <p>Temporal Analysis</p>
        </div>
        <div className="chart-placeholder">
          <p>Geographic Patterns</p>
        </div>
        <div className="chart-placeholder">
          <p>User Activity</p>
        </div>
      </div>
    </div>
  );
};

export default ChartContainer; 