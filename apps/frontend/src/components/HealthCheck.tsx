import { useState, useEffect } from 'react';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/solid';
import axios from 'axios';

export const HealthCheck = () => {
  const [isBackendConnected, setIsBackendConnected] = useState<boolean | null>(null);

  useEffect(() => {
    const checkBackendHealth = async () => {
      try {
        const response = await axios.get('/api/healthcheck');
        setIsBackendConnected(response.data.backend === true);
      } catch (error) {
        setIsBackendConnected(false);
        console.error('Failed to connect to backend:', error);
      }
    };

    checkBackendHealth();
    
    // Check every 30 seconds
    const interval = setInterval(checkBackendHealth, 30000);
    
    return () => clearInterval(interval);
  }, []);

  if (isBackendConnected === null) {
    return null; // Don't show anything until we get a response
  }

  return (
    <div className="fixed bottom-4 right-4 flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-lg">
      {isBackendConnected ? (
        <CheckCircleIcon className="h-5 w-5 text-green-500" />
      ) : (
        <XCircleIcon className="h-5 w-5 text-red-500" />
      )}
      <span className="text-sm font-medium">Veretragna Server</span>
    </div>
  );
};

export default HealthCheck; 