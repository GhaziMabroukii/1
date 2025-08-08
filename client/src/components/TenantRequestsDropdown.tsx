import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, Clock, CheckCircle, XCircle, FileText } from 'lucide-react';
import { useLocation } from 'wouter';

interface TenantRequestsDropdownProps {
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

export function TenantRequestsDropdown({ userId, userType }: TenantRequestsDropdownProps) {
  const [, navigate] = useLocation();
  
  console.log("TenantRequestsDropdown: userType check:", userType, "userId:", userId);
  console.log("TenantRequestsDropdown: Current localStorage:", {
    isAuthenticated: localStorage.getItem("isAuthenticated"),
    userData: localStorage.getItem("userData"),
    userType: localStorage.getItem("userType")
  });
  
  // Only show for tenants
  if (userType !== 'tenant') {
    console.log("TenantRequestsDropdown: Not showing - userType is not tenant");
    return null;
  }

  // Fetch pending requests for this tenant
  const { data: allRequests = [], isLoading: requestsLoading, error } = useQuery<Request[]>({
    queryKey: [`/api/tenant-requests/${userId}`],
    queryFn: async () => {
      console.log("TenantRequestsDropdown: Making API request to", `/api/tenant-requests/${userId}`);
      const response = await fetch(`/api/tenant-requests/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        console.error("TenantRequestsDropdown: API error", response.status, response.statusText);
        throw new Error(`Failed to fetch tenant requests: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log("TenantRequestsDropdown: Received data", data);
      return data;
    },
    enabled: userType === 'tenant' && !!userId,
    refetchInterval: 5000, // Refetch every 5 seconds for real-time updates
    retry: 3,
    staleTime: 0 // Always fetch fresh data
  });
  
  console.log("TenantRequestsDropdown query result:", { 
    allRequests, 
    requestsLoading, 
    error,
    queryEnabled: userType === 'tenant' && !!userId 
  });

  const pendingCount = allRequests.filter(r => r.status === 'pending').length;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-3 h-3" />;
      case 'accepted':
        return <CheckCircle className="w-3 h-3" />;
      case 'rejected':
        return <XCircle className="w-3 h-3" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-50 text-yellow-700 border-yellow-300';
      case 'accepted':
        return 'bg-green-50 text-green-700 border-green-300';
      case 'rejected':
        return 'bg-red-50 text-red-700 border-red-300';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-300';
    }
  };

  const formatRequestType = (type: string) => {
    return type === 'modification' ? 'Modification' : 'Arrêt anticipé';
  };

  console.log("TenantRequestsDropdown rendering for userId:", userId, "userType:", userType);
  console.log("Requests data:", allRequests);
  console.log("Pending count:", pendingCount);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="relative">
          <FileText className="w-4 h-4 mr-2" />
          Mes demandes
          {pendingCount > 0 && (
            <Badge variant="outline" className="ml-2 bg-red-50 text-red-700 border-red-300 text-xs px-1 py-0">
              {pendingCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center gap-2">
          <Bell className="w-4 h-4" />
          Demandes de gestion de contrat
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {requestsLoading ? (
          <DropdownMenuItem disabled>
            Chargement...
          </DropdownMenuItem>
        ) : allRequests.length === 0 ? (
          <DropdownMenuItem disabled>
            Aucune demande
          </DropdownMenuItem>
        ) : (
          allRequests.map((request) => (
            <DropdownMenuItem
              key={`${request.type}-${request.id}`}
              onClick={() => navigate(`/tenant-requests/${request.type}/${request.id}`)}
              className="flex items-center justify-between p-3 cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  {getStatusIcon(request.status)}
                  <span className="font-medium">
                    {formatRequestType(request.type)}
                  </span>
                </div>
                <Badge variant="outline" className={`text-xs ${getStatusColor(request.status)}`}>
                  {request.status === 'pending' ? 'En attente' :
                   request.status === 'accepted' ? 'Acceptée' : 'Refusée'}
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground">
                {new Date(request.createdAt).toLocaleDateString('fr-FR')}
              </div>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}