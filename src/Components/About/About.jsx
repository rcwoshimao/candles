import React from 'react';
import ReactMarkdown from 'react-markdown';
import './About.css';
import { appDescription } from './app-description.js';

const About = () => {
  return (
    <div className="about-page">
      <div className="about-container">
        <div className="about-content">
          <ReactMarkdown>{appDescription}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
};

export default About;
