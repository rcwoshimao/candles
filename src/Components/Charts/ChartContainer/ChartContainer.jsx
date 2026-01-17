import React, { Suspense } from 'react';
import './ChartContainer.css';

// Lazy load chart components for code splitting
const EmotionDistributionChart = React.lazy(() => import('../Charts/EmotionDistributionChart'));
const EmotionMuiDonutChart = React.lazy(() => import('../Charts/EmotionMuiDonutChart'));
const EmotionTimeOfDayStackedChart = React.lazy(() => import('../Charts/EmotionTimeOfDayStackedChart'));
const EmotionWeekdayHeatmap = React.lazy(() => import('../Charts/EmotionWeekdayHeatmap'));

const ChartContainer = ({ markers }) => {
  if (!markers) {
    return <div className="chart-loading">Loading data...</div>;
  }

  return (
    <div className="chart-container">
      <Suspense fallback={<div className="chart-loading">Loading charts...</div>}>
        <EmotionDistributionChart data={markers} />
        <EmotionMuiDonutChart markers={markers} />
        <EmotionTimeOfDayStackedChart markers={markers} />
        <EmotionWeekdayHeatmap markers={markers} />
      </Suspense>
    </div>
  );
};

export default ChartContainer; 