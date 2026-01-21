import React from 'react';
import ReactMarkdown from 'react-markdown';
import './About.css';
import { appDescription } from './app-description.js';

const About = ({ onClose }) => {
  const handleClose = () => {
    if (onClose) {
      // If onClose is provided (modal mode), use it
      onClose();
    } else {
      // If no onClose (new tab mode), close the window
      window.close();
    }
  };

  return (
    <div className="about-page">
      <div className="about-container">
        {!onClose && (
          <button 
            className="about-close-button"
            onClick={handleClose}
            aria-label="Close"
          >
            ×
          </button>
        )}
        <div className="about-content">
          <ReactMarkdown>{appDescription}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
};

export default About;
