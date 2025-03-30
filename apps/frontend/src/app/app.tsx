// Uncomment this line to use CSS modules
import styles from './app.module.css';
import NxWelcome from './nx-welcome';

import { Route, Routes, Link } from 'react-router-dom';

export function App() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-4">
          Welcome to Frontend!
        </h1>
        <p className="text-red-500 text-center mb-6">
          This project is using Tailwind CSS v3.4
        </p>
        <div className="flex justify-center">
          <button className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-md transition-colors">
            Get Started
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
