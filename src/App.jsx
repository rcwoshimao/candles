import React from 'react';
import './App.css';
import MapComponent from './Components/Map/MapComponent';
import Sidebar from './Components/Sidebar/Sidebar';

function App() {
  return (
    <div className="App">
      <Sidebar />
      <MapComponent />
    </div>
  );
}

export default App;
