import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import { FileText, Clock, CheckCircle, XCircle } from 'lucide-react';

interface TenantRequestsDropdownProps {
  userId: number;
  userType: string;
}

interface Request {
  id: number;
  type: 'termination';
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  createdAt: string;
  contractId: number;
}

export function TenantRequestsDropdown({ userId, userType }: TenantRequestsDropdownProps) {
  const [, navigate] = useLocation();
  
  // Only show for tenants
  if (userType !== 'tenant') {
    return null;
  }

  // Fetch termination requests created by this tenant
  const { data: allRequests = [], isLoading: requestsLoading, error } = useQuery<Request[]>({
    queryKey: [`/api/tenant-requests/${userId}`],
    queryFn: async () => {
      const response = await fetch(`/api/tenant-requests/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch tenant requests: ${response.statusText}`);
      }
      
      return response.json();
    },
    enabled: userType === 'tenant' && !!userId,
    refetchInterval: 5000,
    retry: 3,
    staleTime: 0
  });

  if (requestsLoading || error) {
    return (
      <Button 
        variant="outline" 
        size="sm" 
        className="relative"
        data-testid="button-tenant-requests-loading"
      >
        <FileText className="h-4 w-4 mr-2" />
        Mes demandes
        {requestsLoading && <Badge variant="secondary" className="ml-2">...</Badge>}
      </Button>
    );
  }

  const pendingRequests = allRequests.filter(req => req.status === 'pending');
  const pendingCount = pendingRequests.length;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'accepted':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'En attente de réponse';
      case 'accepted':
        return 'Acceptée - En cours';
      case 'rejected':
        return 'Refusée';
      case 'completed':
        return 'Terminée';
      default:
        return status;
    }
  };

  const handleRequestClick = (requestId: number, status: string) => {
    if (status === 'accepted') {
      navigate(`/tenant-termination-workflow/${requestId}`);
    } else {
      // For other statuses, navigate to a general request view
      navigate(`/tenant-requests/termination/${requestId}`);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="relative"
          data-testid="button-tenant-requests"
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
                onClick={() => handleRequestClick(request.id, request.status)}
                className="cursor-pointer"
                data-testid={`menu-item-request-${request.id}`}
              >
                <div className="flex items-start space-x-3 w-full">
                  {getStatusIcon(request.status)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      Arrêt de contrat
                    </p>
                    <p className="text-sm text-gray-500">
                      {getStatusText(request.status)}
                    </p>
                    <p className="text-xs text-gray-400">
                      Contrat #{request.contractId} • {new Date(request.createdAt).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
              </DropdownMenuItem>
            ))}
            
            {allRequests.length > 5 && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => navigate('/tenant-requests')}
                  className="text-center cursor-pointer"
                  data-testid="menu-item-view-all"
                >
                  Voir toutes mes demandes
                </DropdownMenuItem>
              </>
            )}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default TenantRequestsDropdown;