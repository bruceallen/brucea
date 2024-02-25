/* import logo from './logo.svg';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}

export default App;
*/



import React from 'react';
import './App.css';
import UploadComponent from './UploadComponent'; // Ensure this path matches where you've placed the UploadComponent

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <p>
          File Upload Example
        </p>
        <UploadComponent />
      </header>
    </div>
  );
}

export default App;
