import React from 'react';
import EmotionDistributionChart from '../Charts/EmotionDistributionChart';
import EmotionMuiDonutChart from '../Charts/EmotionMuiDonutChart';
import EmotionTimeOfDayStackedChart from '../Charts/EmotionTimeOfDayStackedChart';
import './ChartContainer.css';

const ChartContainer = ({ markers }) => {
  if (!markers) {
    return <div className="chart-loading">Loading data...</div>;
  }

  return (
    <div className="chart-container">
      <EmotionDistributionChart data={markers} />
      <EmotionMuiDonutChart markers={markers} />
      <EmotionTimeOfDayStackedChart markers={markers} />
    </div>
  );
};

export default ChartContainer; 