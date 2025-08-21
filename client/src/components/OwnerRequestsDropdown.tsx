import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, Clock, CheckCircle, XCircle, FileText, Search, ArrowRightIcon } from 'lucide-react';
import { useLocation } from 'wouter';

interface OwnerRequestsDropdownProps {
  userId: number;
  userType: string;
}

interface Request {
  id: number;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
  contractId: number;
  reason?: string;
  terminationType?: string;
  requestedChanges?: string;
}

export function OwnerRequestsDropdown({ userId, userType }: OwnerRequestsDropdownProps) {
  const [, navigate] = useLocation();
  
  console.log("OwnerRequestsDropdown: userType check:", userType, "userId:", userId);
  
  // Only show for owners
  if (userType !== 'owner') {
    console.log("OwnerRequestsDropdown: Not showing - userType is not owner");
    return null;
  }

  // Fetch termination requests SENT by this owner
  const { data: sentRequests = [], isLoading: sentLoading, error: sentError } = useQuery<Request[]>({
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

  // Fetch termination requests RECEIVED by this owner (sent by tenants)
  const { data: receivedRequests = [], isLoading: receivedLoading, error: receivedError } = useQuery<Request[]>({
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
    enabled: userType === 'owner' && !!userId,
    refetchInterval: 5000,
    retry: 3,
    staleTime: 0
  });
  
  console.log("OwnerRequestsDropdown query result:", { 
    sentRequests,
    receivedRequests,
    allRequests, 
    sentLoading,
    receivedLoading, 
    sentError,
    receivedError,
    queryEnabled: userType === 'owner' && !!userId 
  });

  if (sentLoading || receivedLoading || sentError || receivedError) {
    console.log("OwnerRequestsDropdown: Loading or error state", { sentLoading, receivedLoading, sentError, receivedError });
    return (
      <Button 
        variant="outline" 
        size="sm" 
        className="relative"
        data-testid="button-owner-requests-loading"
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

  const determineRequestType = (request: Request): string => {
    // If it has terminationType or reason (termination-specific fields), it's a termination request
    if (request.terminationType || request.reason) {
      return 'termination';
    }
    // If it has requestedChanges, it's a modification request
    if (request.requestedChanges) {
      return 'modification';
    }
    // Default fallback
    return 'termination'; // Most requests in this system are termination requests
  };

  const handleRequestClick = (request: Request, isSent: boolean) => {
    const requestType = determineRequestType(request);
    console.log("OwnerRequestsDropdown: Navigating to request", { requestType, requestId: request.id, request, isSent });
    if (requestType === 'termination') {
      if (isSent) {
        // Request sent by owner - go to workflow to manage it
        navigate(`/owner-termination-workflow/${request.id}`);
      } else {
        // Request received from tenant - go to review to respond
        navigate(`/owner-termination-review/${request.id}`);
      }
    } else {
      navigate(`/owner-request-response/${requestType}/${request.id}`);
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
        
        {/* Demandes envoyées (sent by owner) */}
        {sentRequests.length > 0 && (
          <>
            <DropdownMenuLabel className="flex items-center text-orange-600">
              <ArrowRightIcon className="h-4 w-4 mr-2" />
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
                      Arrêt demandé au locataire
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
                          handleRequestClick(request, true);
                        }}
                      >
                        Gérer
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

        {/* Demandes reçues (sent by tenants) */}
        {receivedRequests.length > 0 && (
          <>
            <DropdownMenuLabel className="flex items-center text-blue-600">
              <FileText className="h-4 w-4 mr-2" />
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
                      {getTypeText(determineRequestType(request))}
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
                          handleRequestClick(request, false);
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
              onClick={() => navigate('/owner-requests')}
              className="text-center cursor-pointer"
              data-testid="menu-item-view-all-owner-requests"
            >
              Voir toutes mes demandes
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}