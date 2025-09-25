import React, { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle, 
  ArrowRightIcon, 
  Search,
  HandHeart,
  Home,
  Bell
} from 'lucide-react';
import { useGlobalWebSocket } from '@/hooks/useWebSocket';

interface UnifiedNotificationsDropdownProps {
  userId: number;
  userType: 'owner' | 'tenant';
}

interface OfferNotification {
  id: number;
  type: 'offer';
  status: 'pending' | 'accepted' | 'rejected' | 'contract_requested';
  createdAt: string;
  propertyId: number;
  property?: {
    title: string;
    address: string;
  };
  monthlyRent: number;
  startDate: string;
  endDate: string;
}

interface ContractNotification {
  id: number;
  type: 'contract';
  status: 'draft' | 'owner_signed' | 'fully_signed' | 'active' | 'expired' | 'cancelled' | 'terminated';
  createdAt: string;
  propertyId: number;
  contractData?: any;
  ownerSignature?: string;
  tenantSignature?: string;
  tenantSignDeadline?: string;
}

interface TerminationRequest {
  id: number;
  type: 'termination';
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  createdAt: string;
  contractId: number;
  reason?: string;
  terminationType?: string;
}

type NotificationItem = OfferNotification | ContractNotification | TerminationRequest;

export function UnifiedNotificationsDropdown({ userId, userType }: UnifiedNotificationsDropdownProps) {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  
  // Connect to WebSocket for real-time updates with specific event handling
  const { isConnected } = useWebSocket({
    onMessage: (message) => {
      const { event, data } = message;
      
      // Additional invalidations specific to this component's queries
      switch (event) {
        case 'new_offer':
        case 'offer_sent':
        case 'offer_accepted':
        case 'offer_rejected':
        case 'offer_update':
          // Invalidate offers queries with user-specific keys
          queryClient.invalidateQueries({ queryKey: [`/api/offers`, userId, userType] });
          break;
          
        case 'contract_created':
        case 'contract_updated':
        case 'contract_signed':
          // Invalidate contracts queries with user-specific keys
          queryClient.invalidateQueries({ queryKey: [`/api/contracts`, userId, userType] });
          break;
          
        case 'request_created':
        case 'request_updated':
          // Invalidate termination request queries with user-specific keys
          if (userType === 'owner') {
            queryClient.invalidateQueries({ queryKey: [`/api/owner-requests/${userId}`] });
            queryClient.invalidateQueries({ queryKey: [`/api/tenant-requests/received/${userId}`] });
          } else {
            queryClient.invalidateQueries({ queryKey: [`/api/tenant-requests/${userId}`] });
            queryClient.invalidateQueries({ queryKey: [`/api/owner-requests/received/${userId}`] });
          }
          break;
      }
    }
  });

  // Fetch offers based on user type
  const { data: offers = [], isLoading: offersLoading } = useQuery<OfferNotification[]>({
    queryKey: [`/api/offers`, userId, userType],
    queryFn: async () => {
      const response = await fetch(`/api/offers?userId=${userId}&userType=${userType}`);
      if (!response.ok) throw new Error('Failed to fetch offers');
      const data = await response.json();
      return data.map((offer: any) => ({ ...offer, type: 'offer' }));
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 2 // 2 minutes
  });

  // Fetch contracts
  const { data: contracts = [], isLoading: contractsLoading } = useQuery<ContractNotification[]>({
    queryKey: [`/api/contracts`, userId, userType],
    queryFn: async () => {
      const params = new URLSearchParams({
        userId: userId.toString(),
        ownerOnly: (userType === 'owner').toString()
      });
      const response = await fetch(`/api/contracts?${params}`);
      if (!response.ok) throw new Error('Failed to fetch contracts');
      const data = await response.json();
      return data
        .filter((contract: any) => contract.status !== 'active') // Only show non-active contracts as notifications
        .map((contract: any) => ({ ...contract, type: 'contract' }));
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 2 // 2 minutes
  });

  // Fetch termination requests (sent by user)
  const { data: sentTerminations = [], isLoading: sentTerminationsLoading } = useQuery<TerminationRequest[]>({
    queryKey: userType === 'owner' ? [`/api/owner-requests/${userId}`] : [`/api/tenant-requests/${userId}`],
    queryFn: async () => {
      const endpoint = userType === 'owner' ? `/api/owner-requests/${userId}` : `/api/tenant-requests/${userId}`;
      const response = await fetch(endpoint);
      if (!response.ok) throw new Error('Failed to fetch sent termination requests');
      const data = await response.json();
      return data.map((req: any) => ({ ...req, type: 'termination' }));
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 2 // 2 minutes
  });

  // Fetch termination requests (received by user)
  const { data: receivedTerminations = [], isLoading: receivedTerminationsLoading } = useQuery<TerminationRequest[]>({
    queryKey: userType === 'owner' ? [`/api/tenant-requests/received/${userId}`] : [`/api/owner-requests/received/${userId}`],
    queryFn: async () => {
      const endpoint = userType === 'owner' ? `/api/tenant-requests/received/${userId}` : `/api/owner-requests/received/${userId}`;
      const response = await fetch(endpoint);
      if (!response.ok) throw new Error('Failed to fetch received termination requests');
      const data = await response.json();
      return data.map((req: any) => ({ ...req, type: 'termination' }));
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 2 // 2 minutes
  });

  const isLoading = offersLoading || contractsLoading || sentTerminationsLoading || receivedTerminationsLoading;

  // Combine and sort all notifications
  const allNotifications: NotificationItem[] = [
    ...offers,
    ...contracts,
    ...sentTerminations,
    ...receivedTerminations
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Filter notifications that need attention (pending status)
  const pendingNotifications = allNotifications.filter(notification => {
    if (notification.type === 'offer') {
      if (userType === 'owner') {
        return notification.status === 'pending'; // Owners see pending offers from tenants
      } else {
        return ['accepted', 'rejected'].includes(notification.status); // Tenants see responses to their offers
      }
    }
    if (notification.type === 'contract') {
      return ['draft', 'owner_signed'].includes(notification.status); // Contracts awaiting signatures
    }
    if (notification.type === 'termination') {
      return notification.status === 'pending'; // Pending termination requests
    }
    return false;
  });

  const getStatusIcon = (notification: NotificationItem) => {
    switch (notification.status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'accepted':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'contract_requested':
        return <FileText className="h-4 w-4 text-blue-500" />;
      case 'draft':
        return <Clock className="h-4 w-4 text-orange-500" />;
      case 'owner_signed':
        return <Clock className="h-4 w-4 text-blue-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusText = (notification: NotificationItem) => {
    if (notification.type === 'offer') {
      switch (notification.status) {
        case 'pending': return userType === 'owner' ? 'Nouvelle offre reçue' : 'Offre envoyée';
        case 'accepted': return 'Offre acceptée';
        case 'rejected': return 'Offre refusée';
        case 'contract_requested': return 'Contrat demandé';
      }
    }
    if (notification.type === 'contract') {
      switch (notification.status) {
        case 'draft': return 'Contrat en préparation';
        case 'owner_signed': return userType === 'owner' ? 'En attente signature locataire' : 'À signer';
        case 'fully_signed': return 'Contrat signé';
      }
    }
    if (notification.type === 'termination') {
      switch (notification.status) {
        case 'pending': return 'Demande d\'arrêt en attente';
        case 'accepted': return 'Demande d\'arrêt acceptée';
        case 'rejected': return 'Demande d\'arrêt refusée';
      }
    }
    return notification.status;
  };

  const getTypeIcon = (notification: NotificationItem) => {
    switch (notification.type) {
      case 'offer': return <HandHeart className="h-4 w-4 text-pink-500" />;
      case 'contract': return <FileText className="h-4 w-4 text-blue-500" />;
      case 'termination': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const handleNotificationClick = (notification: NotificationItem) => {
    if (notification.type === 'offer') {
      navigate('/offers');
    } else if (notification.type === 'contract') {
      navigate(`/contract/${notification.id}`);
    } else if (notification.type === 'termination') {
      if (userType === 'owner') {
        // Check if it's sent or received
        const isSent = sentTerminations.some(req => req.id === notification.id);
        if (isSent) {
          navigate(`/owner-termination-workflow/${notification.id}`);
        } else {
          navigate(`/owner-termination-review/${notification.id}`);
        }
      } else {
        // Check if it's sent or received
        const isSent = sentTerminations.some(req => req.id === notification.id);
        if (isSent) {
          navigate(`/tenant-termination-workflow/${notification.id}`);
        } else {
          navigate(`/tenant-request-response/${notification.id}`);
        }
      }
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="relative"
          data-testid="button-unified-notifications"
        >
          <Bell className="h-4 w-4 mr-2" />
          Mes demandes
          {pendingNotifications.length > 0 && (
            <Badge variant="destructive" className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
              {pendingNotifications.length}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96">
        <DropdownMenuLabel className="flex items-center">
          <Bell className="h-4 w-4 mr-2" />
          Mes notifications ({allNotifications.length})
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* Show offers section */}
        {offers.length > 0 && (
          <>
            <DropdownMenuLabel className="flex items-center text-pink-600">
              <HandHeart className="h-4 w-4 mr-2" />
              {userType === 'owner' ? 'Offres reçues' : 'Mes offres'} ({offers.length})
            </DropdownMenuLabel>
            {offers.slice(0, 3).map((offer) => (
              <DropdownMenuItem 
                key={`offer-${offer.id}`}
                className="cursor-pointer"
                onClick={() => handleNotificationClick(offer)}
                data-testid={`menu-item-offer-${offer.id}`}
              >
                <div className="flex items-start space-x-3 w-full">
                  {getStatusIcon(offer)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {offer.property?.title || 'Propriété'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {getStatusText(offer)}
                    </p>
                    <p className="text-xs text-gray-400">
                      {offer.monthlyRent}DT/mois • {new Date(offer.createdAt).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
          </>
        )}

        {/* Show contracts section */}
        {contracts.length > 0 && (
          <>
            <DropdownMenuLabel className="flex items-center text-blue-600">
              <FileText className="h-4 w-4 mr-2" />
              Contrats en cours ({contracts.length})
            </DropdownMenuLabel>
            {contracts.slice(0, 3).map((contract) => (
              <DropdownMenuItem 
                key={`contract-${contract.id}`}
                className="cursor-pointer"
                onClick={() => handleNotificationClick(contract)}
                data-testid={`menu-item-contract-${contract.id}`}
              >
                <div className="flex items-start space-x-3 w-full">
                  {getStatusIcon(contract)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      Contrat #{contract.id}
                    </p>
                    <p className="text-sm text-gray-500">
                      {getStatusText(contract)}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(contract.createdAt).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
          </>
        )}

        {/* Show termination requests section */}
        {(sentTerminations.length > 0 || receivedTerminations.length > 0) && (
          <>
            <DropdownMenuLabel className="flex items-center text-red-600">
              <XCircle className="h-4 w-4 mr-2" />
              Demandes d'arrêt ({sentTerminations.length + receivedTerminations.length})
            </DropdownMenuLabel>
            {[...sentTerminations, ...receivedTerminations].slice(0, 3).map((request) => {
              const isSent = sentTerminations.some(req => req.id === request.id);
              return (
                <DropdownMenuItem 
                  key={`termination-${request.id}`}
                  className="cursor-pointer"
                  onClick={() => handleNotificationClick(request)}
                  data-testid={`menu-item-termination-${request.id}`}
                >
                  <div className="flex items-start space-x-3 w-full">
                    {getStatusIcon(request)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {isSent ? 'Demande envoyée' : 'Demande reçue'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {getStatusText(request)}
                      </p>
                      <p className="text-xs text-gray-400">
                        Contrat #{request.contractId} • {new Date(request.createdAt).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                </DropdownMenuItem>
              );
            })}
            <DropdownMenuSeparator />
          </>
        )}

        {/* No notifications */}
        {allNotifications.length === 0 && !isLoading && (
          <div className="p-4 text-center text-gray-500">
            <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Aucune notification</p>
          </div>
        )}

        {/* Loading state */}
        {isLoading && (
          <div className="p-4 text-center text-gray-500">
            <Clock className="h-8 w-8 mx-auto mb-2 opacity-50 animate-spin" />
            <p>Chargement...</p>
          </div>
        )}

        {/* View all notifications */}
        {allNotifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => navigate('/notifications')}
              className="text-center cursor-pointer font-medium"
              data-testid="menu-item-view-all-notifications"
            >
              Voir toutes les notifications
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}