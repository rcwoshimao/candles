import React from 'react';
import './BaseChart.css';

const BaseChart = ({children, className = '' }) => {
  return (
    <div className={`base-chart ${className}`}>
      <div className="chart-header">
      
      </div>
      <div className="chart-content">
        {children}
      </div>
    </div>
  );
};

export default BaseChart; 