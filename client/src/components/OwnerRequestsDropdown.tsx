import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, Clock, CheckCircle, XCircle, FileText } from 'lucide-react';
import { useLocation } from 'wouter';

interface OwnerRequestsDropdownProps {
  userId: number;
  userType: string;
}

interface Request {
  id: number;
  type: 'modification' | 'termination';
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
  contractId: number;
}

export function OwnerRequestsDropdown({ userId, userType }: OwnerRequestsDropdownProps) {
  const [, navigate] = useLocation();
  
  console.log("OwnerRequestsDropdown: userType check:", userType, "userId:", userId);
  
  // Only show for owners
  if (userType !== 'owner') {
    console.log("OwnerRequestsDropdown: Not showing - userType is not owner");
    return null;
  }

  // Fetch pending requests for this owner
  const { data: allRequests = [], isLoading: requestsLoading, error } = useQuery<Request[]>({
    queryKey: [`/api/owner-requests/${userId}`],
    queryFn: async () => {
      console.log("OwnerRequestsDropdown: Making API request to", `/api/owner-requests/${userId}`);
      const response = await fetch(`/api/owner-requests/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        console.error("OwnerRequestsDropdown: API error", response.status, response.statusText);
        throw new Error(`Failed to fetch owner requests: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log("OwnerRequestsDropdown: Received data", data);
      return data;
    },
    enabled: userType === 'owner' && !!userId,
    refetchInterval: 5000, // Refetch every 5 seconds for real-time updates
    retry: 3,
    staleTime: 0 // Always fetch fresh data
  });
  
  console.log("OwnerRequestsDropdown query result:", { 
    allRequests, 
    requestsLoading, 
    error,
    queryEnabled: userType === 'owner' && !!userId 
  });

  if (requestsLoading || error) {
    console.log("OwnerRequestsDropdown: Loading or error state", { requestsLoading, error });
    return (
      <Button 
        variant="outline" 
        size="sm" 
        className="relative"
        data-testid="button-owner-requests-loading"
      >
        <FileText className="h-4 w-4 mr-2" />
        Mes demandes
        {requestsLoading && <Badge variant="secondary" className="ml-2">...</Badge>}
      </Button>
    );
  }

  const pendingRequests = allRequests.filter(req => req.status === 'pending');
  const pendingCount = pendingRequests.length;

  console.log("OwnerRequestsDropdown: Filtering requests", {
    totalRequests: allRequests.length,
    pendingCount,
    pendingRequests
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'accepted':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'En attente de réponse';
      case 'accepted':
        return 'Acceptée';
      case 'rejected':
        return 'Refusée';
      default:
        return status;
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'termination':
        return 'Arrêt de contrat';
      case 'modification':
        return 'Modification';
      default:
        return type;
    }
  };

  const handleRequestClick = (requestType: string, requestId: number) => {
    console.log("OwnerRequestsDropdown: Navigating to request", { requestType, requestId });
    navigate(`/owner-request-response/${requestType}/${requestId}`);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="relative"
          data-testid="button-owner-requests"
        >
          <FileText className="h-4 w-4 mr-2" />
          Mes demandes
          {pendingCount > 0 && (
            <Badge variant="destructive" className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
              {pendingCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center">
          <FileText className="h-4 w-4 mr-2" />
          Mes demandes ({allRequests.length})
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {allRequests.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Aucune demande</p>
          </div>
        ) : (
          <>
            {allRequests.slice(0, 5).map((request) => (
              <DropdownMenuItem 
                key={request.id}
                onClick={() => handleRequestClick(request.type, request.id)}
                className="cursor-pointer"
                data-testid={`menu-item-request-${request.id}`}
              >
                <div className="flex items-start space-x-3 w-full">
                  {getStatusIcon(request.status)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {getTypeText(request.type)}
                    </p>
                    <p className="text-sm text-gray-500">
                      {getStatusText(request.status)}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(request.createdAt).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
              </DropdownMenuItem>
            ))}
            
            {allRequests.length > 5 && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => navigate('/owner-requests')}
                  className="text-center cursor-pointer"
                  data-testid="menu-item-view-all-owner-requests"
                >
                  Voir toutes les demandes ({allRequests.length})
                </DropdownMenuItem>
              </>
            )}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}