import { useState, useEffect } from 'react';
import { CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/solid';
import { Tooltip } from '@heroui/react';
import axios from 'axios';

export function HealthCheck() {
  const [isBackendConnected, setIsBackendConnected] = useState<boolean | null>(null);
  const [isDatabaseConnected, setIsDatabaseConnected] = useState<boolean | null>(null);
  const [isUserLoggedIn, setIsUserLoggedIn] = useState<boolean>(false);
  const [userEmail, setUserEmail] = useState<string>('');
  const [userRole, setUserRole] = useState<string>('');

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

    const checkUserAuth = () => {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');

      if (token && userStr) {
        try {
          const userData = JSON.parse(userStr);
          setIsUserLoggedIn(true);
          setUserEmail(userData.email || '');
          setUserRole(userData.type || '');
        } catch (e) {
          console.error('Error parsing user data:', e);
          setIsUserLoggedIn(false);
        }
      } else {
        setIsUserLoggedIn(false);
      }
    };

    checkHealth();
    checkUserAuth();

    // Check every 30 seconds
    const interval = setInterval(checkHealth, 30000);

    // Also check auth status every 30 seconds in case it changes
    const authInterval = setInterval(checkUserAuth, 30000);

    return () => {
      clearInterval(interval);
      clearInterval(authInterval);
    };
  }, []);

  if (isBackendConnected === null || isDatabaseConnected === null) {
    return null; // Don't show anything until we get a response
  }

  // Tooltip content for user information
  const userTooltipContent = isUserLoggedIn ? (
    <div className="p-1">
      <div className="mb-1">
        <strong>Email:</strong>
        {' '}
        {userEmail}
      </div>
      <div>
        <strong>Role:</strong>
        {' '}
        {userRole}
      </div>
    </div>
  ) : null;

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

      <Tooltip
        content={userTooltipContent}
        placement="top"
        showArrow
        isDisabled={!isUserLoggedIn}
        closeDelay={0}
        className="max-w-none"
      >
        <div className="flex items-center gap-2">
          {isUserLoggedIn ? (
            <CheckCircleIcon className="h-5 w-5 text-green-500" />
          ) : (
            <ExclamationTriangleIcon className="h-5 w-5 text-amber-500" />
          )}
          <span className="text-sm font-medium">User logged in</span>
        </div>
      </Tooltip>
    </div>
  );
}

export default HealthCheck;
