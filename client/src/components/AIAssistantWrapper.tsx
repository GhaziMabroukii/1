import React, { useState, useEffect } from 'react';
import AIAssistant from './AIAssistant';

const AIAssistantWrapper: React.FC = () => {
  const [userId, setUserId] = useState<number | null>(null);
  const [userType, setUserType] = useState<string>('');
  const [userName, setUserName] = useState<string>('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check authentication status
    const checkAuth = () => {
      const isAuth = localStorage.getItem('isAuthenticated');
      const userData = localStorage.getItem('user');
      
      if (isAuth === 'true' && userData) {
        try {
          const user = JSON.parse(userData);
          setUserId(user.id);
          setUserType(user.userType);
          setUserName(user.firstName ? `${user.firstName} ${user.lastName}`.trim() : user.username);
          setIsAuthenticated(true);
        } catch (error) {
          console.error('Error parsing user data:', error);
          setIsAuthenticated(false);
        }
      } else {
        setIsAuthenticated(false);
      }
    };

    // Check initially
    checkAuth();

    // Check on storage changes (when user logs in/out)
    const handleStorageChange = () => {
      checkAuth();
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Also check periodically in case localStorage changes in same tab
    const interval = setInterval(checkAuth, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  // Only show AI assistant if user is authenticated
  if (!isAuthenticated || !userId || !userType) {
    return null;
  }

  return (
    <AIAssistant
      userId={userId}
      userType={userType}
      userName={userName}
    />
  );
};

export default AIAssistantWrapper;