import { useState, useEffect } from 'react';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/solid';
import axios from 'axios';

export const HealthCheck = () => {
  const [isBackendConnected, setIsBackendConnected] = useState<boolean | null>(null);
  const [isDatabaseConnected, setIsDatabaseConnected] = useState<boolean | null>(null);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await axios.get('/api/healthcheck');
        setIsBackendConnected(response.data.backend === true);
        setIsDatabaseConnected(response.data.database === true);
      } catch (error) {
        setIsBackendConnected(false);
        setIsDatabaseConnected(false);
        console.error('Failed to connect to backend:', error);
      }
    };

    checkHealth();
    
    // Check every 30 seconds
    const interval = setInterval(checkHealth, 30000);
    
    return () => clearInterval(interval);
  }, []);

  if (isBackendConnected === null || isDatabaseConnected === null) {
    return null; // Don't show anything until we get a response
  }

  return (
    <div className="fixed bottom-4 right-4 flex flex-col gap-2 bg-white px-4 py-3 rounded-lg shadow-lg">
      <div className="flex items-center gap-2">
        {isBackendConnected ? (
          <CheckCircleIcon className="h-5 w-5 text-green-500" />
        ) : (
          <XCircleIcon className="h-5 w-5 text-red-500" />
        )}
        <span className="text-sm font-medium">Veretragna Server</span>
      </div>
      
      <div className="flex items-center gap-2">
        {isDatabaseConnected ? (
          <CheckCircleIcon className="h-5 w-5 text-green-500" />
        ) : (
          <XCircleIcon className="h-5 w-5 text-red-500" />
        )}
        <span className="text-sm font-medium">MySQL Database</span>
      </div>
    </div>
  );
};

export default HealthCheck; 