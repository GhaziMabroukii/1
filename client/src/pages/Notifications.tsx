import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Bell, 
  Clock, 
  CheckCircle, 
  XCircle, 
  HandHeart,
  FileText,
  Search,
  Filter,
  MarkAllRead,
  Eye,
  EyeOff,
  MessageSquare, 
  Home, 
  DollarSign
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface NotificationItem {
  id: number;
  type: 'offer' | 'contract' | 'termination' | 'general';
  title: string;
  message: string;
  status?: string;
  relatedId?: number;
  read: boolean;
  createdAt: string;
}

export default function Notifications() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  // Get current user
  const currentUserId = Number(localStorage.getItem("userId"));
  const userType = localStorage.getItem("userType") as 'owner' | 'tenant';

  // Fetch system notifications
  const { data: systemNotifications = [], isLoading: systemLoading } = useQuery<NotificationItem[]>({
    queryKey: [`/api/notifications`, currentUserId],
    queryFn: async () => {
      const response = await fetch(`/api/notifications?userId=${currentUserId}`);
      if (!response.ok) throw new Error('Failed to fetch notifications');
      return response.json();
    },
    enabled: !!currentUserId,
    staleTime: 1000 * 60 * 1 // 1 minute
  });

  // Fetch offers
  const { data: offers = [], isLoading: offersLoading } = useQuery({
    queryKey: [`/api/offers`, currentUserId, userType],
    queryFn: async () => {
      const response = await fetch(`/api/offers?userId=${currentUserId}&userType=${userType}`);
      if (!response.ok) throw new Error('Failed to fetch offers');
      const data = await response.json();
      return data.map((offer: any) => ({ ...offer, type: 'offer' }));
    },
    enabled: !!currentUserId,
    staleTime: 1000 * 60 * 1 // 1 minute
  });

  // Fetch contracts
  const { data: contracts = [], isLoading: contractsLoading } = useQuery({
    queryKey: [`/api/contracts`, currentUserId, userType],
    queryFn: async () => {
      const params = new URLSearchParams({
        userId: currentUserId.toString(),
        ownerOnly: (userType === 'owner').toString()
      });
      const response = await fetch(`/api/contracts?${params}`);
      if (!response.ok) throw new Error('Failed to fetch contracts');
      const data = await response.json();
      return data
        .filter((contract: any) => contract.status !== 'active') // Only show non-active contracts as notifications
        .map((contract: any) => ({ ...contract, type: 'contract' }));
    },
    enabled: !!currentUserId,
    staleTime: 1000 * 60 * 1 // 1 minute
  });

  // Fetch termination requests (sent by user)
  const { data: sentTerminations = [], isLoading: sentTerminationsLoading } = useQuery({
    queryKey: userType === 'owner' ? [`/api/owner-requests/${currentUserId}`] : [`/api/tenant-requests/${currentUserId}`],
    queryFn: async () => {
      const endpoint = userType === 'owner' ? `/api/owner-requests/${currentUserId}` : `/api/tenant-requests/${currentUserId}`;
      const response = await fetch(endpoint);
      if (!response.ok) throw new Error('Failed to fetch sent termination requests');
      const data = await response.json();
      return data.map((req: any) => ({ ...req, type: 'termination' }));
    },
    enabled: !!currentUserId,
    staleTime: 1000 * 60 * 1 // 1 minute
  });

  // Fetch termination requests (received by user)  
  const { data: receivedTerminations = [], isLoading: receivedTerminationsLoading } = useQuery({
    queryKey: userType === 'owner' ? [`/api/tenant-requests/received/${currentUserId}`] : [`/api/owner-requests/received/${currentUserId}`],
    queryFn: async () => {
      const endpoint = userType === 'owner' ? `/api/tenant-requests/received/${currentUserId}` : `/api/owner-requests/received/${currentUserId}`;
      const response = await fetch(endpoint);
      if (!response.ok) return []; // Silently fail for non-existent endpoints
      const data = await response.json();
      return data.map((req: any) => ({ ...req, type: 'termination' }));
    },
    enabled: !!currentUserId,
    staleTime: 1000 * 60 * 1 // 1 minute
  });

  const isLoading = systemLoading || offersLoading || contractsLoading || sentTerminationsLoading || receivedTerminationsLoading;

  // Combine all notifications and convert to unified format
  const allNotifications: NotificationItem[] = [
    ...systemNotifications,
    ...offers.map((offer: any) => ({
      id: offer.id,
      type: 'offer' as const,
      title: userType === 'owner' ? 'Nouvelle offre reçue' : 'Offre envoyée',
      message: `Offre pour ${offer.property?.title || 'la propriété'} - ${offer.monthlyRent}DT/mois`,
      status: offer.status,
      relatedId: offer.id,
      read: false, // Offers don't have read status in current system
      createdAt: offer.createdAt
    })),
    ...contracts.map((contract: any) => ({
      id: contract.id,
      type: 'contract' as const,
      title: `Contrat #${contract.id}`,
      message: getContractMessage(contract.status, userType),
      status: contract.status,
      relatedId: contract.id,
      read: false, // Contracts don't have read status in current system
      createdAt: contract.createdAt
    })),
    ...sentTerminations.map((termination: any) => ({
      id: termination.id,
      type: 'termination' as const,
      title: 'Demande d\'arrêt envoyée',
      message: `Contrat #${termination.contractId} - ${termination.status}`,
      status: termination.status,
      relatedId: termination.id,
      read: false,
      createdAt: termination.createdAt
    })),
    ...receivedTerminations.map((termination: any) => ({
      id: termination.id,
      type: 'termination' as const,
      title: 'Demande d\'arrêt reçue',
      message: `Contrat #${termination.contractId} - ${termination.status}`,
      status: termination.status,
      relatedId: termination.id,
      read: false,
      createdAt: termination.createdAt
    }))
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  function getContractMessage(status: string, userType: string): string {
    switch (status) {
      case 'draft': return 'Contrat en préparation';
      case 'owner_signed': return userType === 'owner' ? 'En attente de signature du locataire' : 'Contrat à signer';
      case 'fully_signed': return 'Contrat entièrement signé';
      case 'active': return 'Contrat actif';
      case 'expired': return 'Contrat expiré';
      case 'cancelled': return 'Contrat annulé';
      case 'terminated': return 'Contrat terminé';
      default: return status;
    }
  }

  // Filter notifications
  const filteredNotifications = allNotifications.filter(notification => {
    const matchesSearch = notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         notification.message.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'unread' && !notification.read) ||
                         (statusFilter === 'read' && notification.read);
    const matchesType = typeFilter === 'all' || notification.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  // Mark notification as read
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      return apiRequest(`/api/notifications/${notificationId}/read`, {
        method: 'PUT'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/notifications`, currentUserId] });
    }
  });

  // Mark all as read
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('/api/notifications/mark-all-read', {
        method: 'PUT',
        body: JSON.stringify({ userId: currentUserId })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/notifications`, currentUserId] });
      toast({
        title: "Notifications marquées comme lues",
        description: "Toutes vos notifications ont été marquées comme lues."
      });
    }
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'offer': return <HandHeart className="h-5 w-5 text-pink-500" />;
      case 'contract': return <FileText className="h-5 w-5 text-blue-500" />;
      case 'termination': return <XCircle className="h-5 w-5 text-red-500" />;
      case 'message': return <MessageSquare className="h-5 w-5 text-green-500" />;
      case 'property': return <Home className="h-5 w-5 text-purple-500" />;
      case 'payment': return <DollarSign className="h-5 w-5 text-green-500" />;
      default: return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'accepted': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return null;
    }
  };

  const handleNotificationClick = (notification: NotificationItem) => {
    // Mark as read if it's a system notification
    if (notification.type === 'general' && !notification.read) {
      markAsReadMutation.mutate(notification.id);
    }

    // Navigate to appropriate page
    if (notification.type === 'offer') {
      navigate('/offers');
    } else if (notification.type === 'contract') {
      navigate(`/contract/${notification.relatedId}`);
    } else if (notification.type === 'termination') {
      navigate('/contract-termination');
    } else {
      // Handle other notification types from the original system
      switch (notification.type) {
        case 'message':
          navigate('/messages');
          break;
        case 'property':
          navigate('/search');
          break;
        default:
          navigate('/dashboard');
      }
    }
  };

  const unreadCount = systemNotifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Bell className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Notifications</h1>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="text-sm">
                {unreadCount} non lues
              </Badge>
            )}
          </div>
          <Button
            onClick={() => markAllAsReadMutation.mutate()}
            disabled={markAllAsReadMutation.isPending || unreadCount === 0}
            variant="outline"
            size="sm"
            data-testid="button-mark-all-read"
          >
            <MarkAllRead className="h-4 w-4 mr-2" />
            Tout marquer comme lu
          </Button>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher dans les notifications..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                    data-testid="input-search-notifications"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-40" data-testid="select-status-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes</SelectItem>
                  <SelectItem value="unread">Non lues</SelectItem>
                  <SelectItem value="read">Lues</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full sm:w-40" data-testid="select-type-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous types</SelectItem>
                  <SelectItem value="offer">Offres</SelectItem>
                  <SelectItem value="contract">Contrats</SelectItem>
                  <SelectItem value="termination">Résiliations</SelectItem>
                  <SelectItem value="general">Général</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Notifications List */}
        <div className="space-y-4">
          {isLoading ? (
            <Card>
              <CardContent className="py-8 text-center">
                <Clock className="h-8 w-8 mx-auto mb-4 opacity-50 animate-spin" />
                <p className="text-muted-foreground">Chargement des notifications...</p>
              </CardContent>
            </Card>
          ) : filteredNotifications.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <Bell className="h-8 w-8 mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">
                  {searchTerm || statusFilter !== 'all' || typeFilter !== 'all' 
                    ? 'Aucune notification ne correspond à vos critères.'
                    : 'Aucune notification pour le moment.'
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredNotifications.map((notification) => (
              <Card 
                key={`${notification.type}-${notification.id}`}
                className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                  !notification.read ? 'border-l-4 border-l-primary bg-primary/5' : ''
                }`}
                onClick={() => handleNotificationClick(notification)}
                data-testid={`notification-item-${notification.type}-${notification.id}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      {getTypeIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-semibold text-foreground truncate">
                          {notification.title}
                        </p>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(notification.status)}
                          {notification.read ? (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <EyeOff className="h-4 w-4 text-primary" />
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {notification.message}
                      </p>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">
                          {new Date(notification.createdAt).toLocaleDateString('fr-FR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                        {notification.status && (
                          <Badge variant="outline" className="text-xs">
                            {notification.status}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}