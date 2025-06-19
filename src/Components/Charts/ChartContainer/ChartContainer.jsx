import React from 'react';
import EmotionDistributionChart from '../Charts/EmotionDistributionChart';
import './ChartContainer.css';

const ChartContainer = ({ markers }) => {
  if (!markers) {
    return <div className="chart-loading">Loading data...</div>;
  }

  return (
    <div className="chart-container">
      <EmotionDistributionChart data={markers} />
    </div>
  );
};

export default ChartContainer; 