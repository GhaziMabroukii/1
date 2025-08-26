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
    queryKey: ['/api/notifications', userId],
    queryFn: async () => {
      const response = await fetch(`/api/notifications?userId=${userId}`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: userType === 'tenant',
    refetchInterval: 5000 // Check every 5 seconds
  });

  useEffect(() => {
    if (userType !== 'tenant') return;
    
    // Look for new contract management request notifications
    const managementNotifications = (notifications as any[]).filter((notification: any) => 
      (notification.type === 'contract_modification_request' || 
       notification.type === 'contract_termination_request') &&
      notification.read === false
    );

    // Only auto-navigate if there are new notifications and user is on the dashboard
    // This prevents interfering with manual navigation from notification clicks
    if (managementNotifications.length > 0 && 
        location === '/dashboard' && 
        !location.includes('/tenant-requests/') &&
        !location.includes('/contract-termination')) {
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