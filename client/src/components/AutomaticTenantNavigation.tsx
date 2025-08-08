import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';

interface AutomaticTenantNavigationProps {
  userId: number;
  userType: string;
}

export function AutomaticTenantNavigation({ userId, userType }: AutomaticTenantNavigationProps) {
  const [location, navigate] = useLocation();
  
  // Only works for tenants
  const { data: notifications = [] } = useQuery({
    queryKey: ['/api/notifications'],
    enabled: userType === 'tenant',
    refetchInterval: 5000 // Check every 5 seconds
  });

  useEffect(() => {
    if (userType !== 'tenant') return;
    
    // Look for new contract management request notifications
    const managementNotifications = notifications.filter((notification: any) => 
      (notification.type === 'contract_modification_request' || 
       notification.type === 'contract_termination_request') &&
      notification.isRead === false
    );

    // If there's a new management request notification and we're not already on the response page
    if (managementNotifications.length > 0 && !location.includes('/tenant-requests/')) {
      const latestNotification = managementNotifications[0];
      
      // Determine request type and navigate to response page
      const requestType = latestNotification.type === 'contract_modification_request' 
        ? 'modification' 
        : 'termination';
      
      // Navigate to the tenant response page
      navigate(`/tenant-requests/${requestType}/${latestNotification.relatedId}`);
    }
  }, [notifications, userType, location, navigate]);

  return null; // This component doesn't render anything
}