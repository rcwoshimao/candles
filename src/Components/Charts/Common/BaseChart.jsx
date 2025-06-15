import React from 'react';
import './BaseChart.css';

const BaseChart = ({ title, children, className = '' }) => {
  return (
    <div className={`base-chart ${className}`}>
      <div className="chart-header">
        <h3>{title}</h3>
      </div>
      <div className="chart-content">
        {children}
      </div>
    </div>
  );
};

export default BaseChart; 