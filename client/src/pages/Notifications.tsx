import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Bell, 
  MessageSquare, 
  Home, 
  DollarSign,
  FileText
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  relatedId?: number;
  read: boolean;
  createdAt: string;
}

const Notifications = () => {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const currentUserId = 1; // Should come from auth context

  // Fetch real notifications from API
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['/api/notifications', currentUserId],
    queryFn: async () => {
      const response = await fetch(`/api/notifications?userId=${currentUserId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('Failed to fetch notifications');
      return response.json();
    },
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  // Mark notification as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      return apiRequest(`/api/notifications/${notificationId}/read`, {
        method: 'PUT'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    }
  });

  // Mark all notifications as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('/api/notifications/mark-all-read', {
        method: 'PUT',
        body: JSON.stringify({ userId: currentUserId }),
        headers: { 'Content-Type': 'application/json' }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      toast({
        title: "Notifications marquées comme lues",
        description: "Toutes vos notifications ont été marquées comme lues.",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de marquer toutes les notifications comme lues.",
        variant: "destructive",
      });
    }
  });

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'contract':
      case 'contract_signature_required':
      case 'contract_expired':
      case 'contract_modified':
      case 'contract_active':
      case 'contract_terminated':
        return <FileText className="h-4 w-4" />;
      case 'message':
      case 'new_message':
        return <MessageSquare className="h-4 w-4" />;
      case 'property':
      case 'property_updated':
      case 'property_favorite':
        return <Home className="h-4 w-4" />;
      case 'offer':
      case 'offer_accepted':
      case 'offer_rejected':
        return <DollarSign className="h-4 w-4" />;
      case 'payment':
      case 'payment_received':
      case 'payment_due':
        return <DollarSign className="h-4 w-4" />;
      case 'verification':
      case 'user_verified':
        return <Bell className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'contract':
      case 'contract_signature_required':
      case 'contract_active':
        return 'text-blue-600';
      case 'contract_expired':
      case 'contract_terminated':
        return 'text-red-600';
      case 'contract_modified':
        return 'text-yellow-600';
      case 'message':
      case 'new_message':
        return 'text-green-600';
      case 'property':
      case 'property_updated':
      case 'property_favorite':
        return 'text-purple-600';
      case 'offer':
      case 'offer_accepted':
        return 'text-blue-600';
      case 'offer_rejected':
        return 'text-red-600';
      case 'payment':
      case 'payment_received':
        return 'text-green-600';
      case 'payment_due':
        return 'text-orange-600';
      case 'verification':
      case 'user_verified':
        return 'text-indigo-600';
      default:
        return 'text-gray-600';
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read
    if (!notification.read) {
      markAsReadMutation.mutate(notification.id);
    }

    // Smart navigation based on type and context
    try {
      switch (notification.type) {
        case 'contract':
        case 'contract_signature_required':
        case 'contract_modified':
        case 'contract_active':
        case 'contract_expired':
          if (notification.relatedId) {
            navigate(`/contract/${notification.relatedId}`);
          } else {
            navigate('/contracts');
          }
          break;
          
        case 'message':
        case 'new_message':
          if (notification.relatedId) {
            // Navigate to specific conversation
            navigate(`/conversation/${notification.relatedId}`);
          } else {
            navigate('/messages');
          }
          break;
          
        case 'property':
        case 'property_updated':
        case 'property_favorite':
          if (notification.relatedId) {
            navigate(`/property/${notification.relatedId}`);
          } else {
            navigate('/search');
          }
          break;
          
        case 'offer':
        case 'offer_accepted':
        case 'offer_rejected':
          if (notification.relatedId) {
            navigate(`/offer/${notification.relatedId}`);
          } else {
            navigate('/dashboard');
          }
          break;
          
        case 'verification':
        case 'user_verified':
          navigate('/profile');
          break;
          
        case 'payment':
        case 'payment_received':
        case 'payment_due':
          navigate('/payments');
          break;
          
        default:
          // Fallback to dashboard for unknown types
          navigate('/dashboard');
          break;
      }
    } catch (error) {
      console.error('Navigation error:', error);
      toast({
        title: "Erreur de navigation",
        description: "Impossible de naviguer vers le contenu. Essayez de nouveau.",
        variant: "destructive",
      });
    }
  };

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInHours = Math.floor((now.getTime() - time.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "À l'instant";
    if (diffInHours < 24) return `Il y a ${diffInHours}h`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `Il y a ${diffInDays}j`;
    
    return time.toLocaleDateString('fr-FR');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-20 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const unreadCount = notifications.filter((n: Notification) => !n.read).length;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center space-x-3">
              <Bell className="h-8 w-8 text-primary" />
              <span>Notifications</span>
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {unreadCount}
                </Badge>
              )}
            </h1>
            <p className="text-muted-foreground">
              Restez informé de toutes vos activités de location
            </p>
          </div>
          {unreadCount > 0 && (
            <Button
              onClick={() => markAllAsReadMutation.mutate()}
              disabled={markAllAsReadMutation.isPending}
              variant="outline"
            >
              {markAllAsReadMutation.isPending ? 'Marquage...' : 'Tout marquer comme lu'}
            </Button>
          )}
        </div>

        {/* Notifications List */}
        <div className="space-y-4">
          {notifications.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Aucune notification</h3>
                <p className="text-muted-foreground">
                  Vous n'avez pas encore de notifications.
                </p>
              </CardContent>
            </Card>
          ) : (
            notifications.map((notification: Notification) => (
              <Card 
                key={notification.id} 
                className={`cursor-pointer transition-all hover:shadow-md ${
                  !notification.read ? 'border-primary bg-primary/5' : ''
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start space-x-4">
                    <div className={`p-2 rounded-full ${getNotificationColor(notification.type)}`}>
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-sm">{notification.title}</h4>
                        <span className="text-xs text-muted-foreground">
                          {getTimeAgo(notification.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {notification.message}
                      </p>
                      {!notification.read && (
                        <Badge variant="secondary" className="mt-2 text-xs">
                          Nouveau
                        </Badge>
                      )}
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
};

export default Notifications;