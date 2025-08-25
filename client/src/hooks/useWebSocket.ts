import { useEffect, useRef, useState, useCallback } from 'react';
import { queryClient } from '@/lib/queryClient';

interface WebSocketMessage {
  event: string;
  data: any;
}

interface UseWebSocketProps {
  onMessage?: (message: WebSocketMessage) => void;
}

export function useWebSocket({ onMessage }: UseWebSocketProps = {}) {
  const ws = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      console.log('No auth token found, skipping WebSocket connection');
      return;
    }

    try {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setConnectionAttempts(0);
        
        // Authenticate the connection
        ws.current?.send(JSON.stringify({
          type: 'auth',
          token: token
        }));
      };

      ws.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          
          // Handle built-in events
          handleBuiltInEvents(message);
          
          // Call custom message handler
          onMessage?.(message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.current.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        
        // Attempt to reconnect with exponential backoff
        const maxAttempts = 5;
        if (connectionAttempts < maxAttempts) {
          const delay = Math.min(1000 * Math.pow(2, connectionAttempts), 30000);
          console.log(`Attempting to reconnect in ${delay}ms...`);
          
          reconnectTimeout.current = setTimeout(() => {
            setConnectionAttempts(prev => prev + 1);
            connect();
          }, delay);
        }
      };

      ws.current.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

    } catch (error) {
      console.error('Failed to connect to WebSocket:', error);
    }
  }, [connectionAttempts, onMessage]);

  const disconnect = useCallback(() => {
    if (reconnectTimeout.current) {
      clearTimeout(reconnectTimeout.current);
      reconnectTimeout.current = null;
    }
    
    if (ws.current) {
      ws.current.close();
      ws.current = null;
    }
    setIsConnected(false);
  }, []);

  // Handle built-in real-time events
  const handleBuiltInEvents = (message: WebSocketMessage) => {
    const { event, data } = message;

    switch (event) {
      case 'auth_success':
        console.log('WebSocket authenticated successfully');
        break;

      case 'new_message':
        // Invalidate conversation messages
        queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
        queryClient.invalidateQueries({ queryKey: [`/api/conversations/${data.conversationId}/messages`] });
        break;

      case 'new_notification':
        // Invalidate notifications
        queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
        break;

      case 'notification_read':
        // Update specific notification
        queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
        break;

      case 'new_offer':
      case 'offer_sent':
      case 'offer_accepted':
      case 'offer_rejected':
      case 'offer_update':
        // Invalidate offers
        queryClient.invalidateQueries({ queryKey: ['/api/offers'] });
        break;

      case 'contract_created':
      case 'contract_updated':
      case 'contract_signed':
        // Invalidate contracts
        queryClient.invalidateQueries({ queryKey: ['/api/contracts'] });
        break;

      case 'property_created':
      case 'property_updated':
        // Invalidate properties
        queryClient.invalidateQueries({ queryKey: ['/api/properties'] });
        break;

      case 'request_created':
      case 'request_updated':
        // Invalidate requests
        queryClient.invalidateQueries({ queryKey: ['/api/tenant-requests'] });
        queryClient.invalidateQueries({ queryKey: ['/api/owner-requests'] });
        break;

      default:
        console.log('Received WebSocket event:', event, data);
    }
  };

  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, []);

  // Reconnect when auth token changes
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token && !isConnected && ws.current === null) {
      connect();
    } else if (!token && ws.current) {
      disconnect();
    }
  }, [connect, disconnect, isConnected]);

  return {
    isConnected,
    connect,
    disconnect
  };
}

// Global WebSocket connection hook - use this in your main App component
export function useGlobalWebSocket() {
  return useWebSocket({
    onMessage: (message) => {
      // All built-in event handling is done automatically
      // This can be extended for custom global event handling
      console.log('Global WebSocket message:', message);
    }
  });
}