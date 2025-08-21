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
import { FileText, Clock, CheckCircle, XCircle, ArrowRightIcon, Search } from 'lucide-react';

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

  // Fetch termination requests SENT by this tenant
  const { data: sentRequests = [], isLoading: sentLoading, error: sentError } = useQuery<Request[]>({
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

  // Fetch termination requests RECEIVED by this tenant (sent by owners)
  const { data: receivedRequests = [], isLoading: receivedLoading, error: receivedError } = useQuery<Request[]>({
    queryKey: [`/api/owner-requests/${userId}`],
    queryFn: async () => {
      const response = await fetch(`/api/owner-requests/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch owner requests: ${response.statusText}`);
      }
      
      return response.json();
    },
    enabled: userType === 'tenant' && !!userId,
    refetchInterval: 5000,
    retry: 3,
    staleTime: 0
  });

  if (sentLoading || receivedLoading || sentError || receivedError) {
    return (
      <Button 
        variant="outline" 
        size="sm" 
        className="relative"
        data-testid="button-tenant-requests-loading"
      >
        <FileText className="h-4 w-4 mr-2" />
        Mes demandes
        {(sentLoading || receivedLoading) && <Badge variant="secondary" className="ml-2">...</Badge>}
      </Button>
    );
  }

  const allRequests = [...sentRequests, ...receivedRequests];
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

  const handleRequestClick = (requestId: number, status: string, isSent: boolean) => {
    if (status === 'accepted') {
      navigate(`/tenant-termination-workflow/${requestId}`);
    } else if (isSent) {
      // Request sent by tenant
      navigate(`/tenant-requests/termination/${requestId}`);
    } else {
      // Request received from owner
      navigate(`/tenant-request-response/${requestId}`);
    }
  };

  const handleInvestigateRequest = (requestId: number) => {
    navigate(`/contract-termination-status/${requestId}`);
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
        
        {/* Demandes reçues (sent by owners) */}
        {receivedRequests.length > 0 && (
          <>
            <DropdownMenuLabel className="flex items-center text-orange-600">
              <ArrowRightIcon className="h-4 w-4 mr-2" />
              Demandes de résiliation reçues ({receivedRequests.length})
            </DropdownMenuLabel>
            {receivedRequests.slice(0, 3).map((request) => (
              <DropdownMenuItem 
                key={`received-${request.id}`}
                className="cursor-pointer"
                data-testid={`menu-item-received-request-${request.id}`}
              >
                <div className="flex items-start space-x-3 w-full">
                  {getStatusIcon(request.status)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      Arrêt demandé par le propriétaire
                    </p>
                    <p className="text-sm text-gray-500">
                      {getStatusText(request.status)}
                    </p>
                    <p className="text-xs text-gray-400">
                      Contrat #{request.contractId} • {new Date(request.createdAt).toLocaleDateString('fr-FR')}
                    </p>
                    <div className="flex gap-1 mt-1">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-6 text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRequestClick(request.id, request.status, false);
                        }}
                      >
                        Répondre
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-6 text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleInvestigateRequest(request.id);
                        }}
                      >
                        <Search className="h-3 w-3 mr-1" />
                        État
                      </Button>
                    </div>
                  </div>
                </div>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
          </>
        )}

        {/* Demandes envoyées (sent by tenant) */}
        {sentRequests.length > 0 && (
          <>
            <DropdownMenuLabel className="flex items-center text-blue-600">
              <FileText className="h-4 w-4 mr-2" />
              Demandes de résiliation envoyées ({sentRequests.length})
            </DropdownMenuLabel>
            {sentRequests.slice(0, 3).map((request) => (
              <DropdownMenuItem 
                key={`sent-${request.id}`}
                className="cursor-pointer"
                data-testid={`menu-item-sent-request-${request.id}`}
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
                    <div className="flex gap-1 mt-1">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-6 text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRequestClick(request.id, request.status, true);
                        }}
                      >
                        Voir
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-6 text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleInvestigateRequest(request.id);
                        }}
                      >
                        <Search className="h-3 w-3 mr-1" />
                        État
                      </Button>
                    </div>
                  </div>
                </div>
              </DropdownMenuItem>
            ))}
          </>
        )}

        {/* Aucune demande */}
        {sentRequests.length === 0 && receivedRequests.length === 0 && (
          <div className="p-4 text-center text-gray-500">
            <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Aucune demande de résiliation</p>
          </div>
        )}

        {/* Voir toutes les demandes */}
        {(sentRequests.length > 3 || receivedRequests.length > 3) && (
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
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default TenantRequestsDropdown;