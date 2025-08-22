import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  ArrowLeft, Send, MessageCircle, Upload, Image as ImageIcon, 
  FileText, MoreHorizontal, Search, User, UserMinus,
  Paperclip, Smile, X, Mic, MicOff, Play, Pause, 
  Heart, ThumbsUp, Laugh, AlertCircle, Camera, Clock,
  Gift, Zap, MapPin, Plus, Settings, Bell, Phone, Video,
  Download, Volume2, VolumeX, FileVideo, FileImage, Eye
} from "lucide-react";
import Header from "@/components/Header";

// Voice recording hook
function useVoiceRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [duration, setDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];

      mediaRecorder.ondataavailable = (e) => {
        chunks.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/wav' });
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
        // Clear interval when recording stops
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
      setDuration(0);
      mediaRecorder.start();

      // Start the timer immediately after setting recording state
      intervalRef.current = setInterval(() => {
        setDuration(prev => {
          const newDuration = prev + 1;
          console.log('Voice recording duration:', newDuration, 'seconds');
          return newDuration;
        });
      }, 1000);
      
      console.log('Started voice recording with timer');
    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setAudioBlob(null);
    setDuration(0);
  };

  return {
    isRecording,
    audioBlob,
    duration,
    startRecording,
    stopRecording,
    cancelRecording,
    setAudioBlob
  };
}

// Typing indicator hook
function useTypingIndicator(conversationId: number | null, userId: number) {
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const startTyping = () => {
    setIsTyping(true);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 3000);
  };

  const stopTyping = () => {
    setIsTyping(false);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };

  return { isTyping, typingUsers, startTyping, stopTyping };
}

// Request notification permission
function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

// Show browser notification
function showNotification(title: string, body: string, icon?: string) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, {
      body,
      icon: icon || '/favicon.ico',
      tag: 'message-notification'
    });
  }
}

// WebSocket hook for real-time messaging
function useWebSocket(userId: number) {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    // Request notification permission on component mount
    requestNotificationPermission();

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      setIsConnected(true);
      ws.send(JSON.stringify({ type: 'auth', userId }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'new_message') {
          // Show browser notification for new messages
          if (data.message && data.message.senderId !== userId) {
            showNotification(
              'Nouveau message', 
              data.message.content || 'Vous avez reçu un nouveau message',
              '/favicon.ico'
            );
          }
          
          // Invalidate conversations and messages queries
          queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
          queryClient.invalidateQueries({ queryKey: ["/api/conversations", data.conversationId, "messages"] });
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
    };

    setSocket(ws);

    return () => {
      ws.close();
    };
  }, [userId, queryClient]);

  return { socket, isConnected };
}

export default function Messages() {
  const [location, navigate] = useLocation();
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [reactionPickerMessageId, setReactionPickerMessageId] = useState<number | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [playingVoiceId, setPlayingVoiceId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Additional state for new features
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get current user from localStorage
  const currentUser = JSON.parse(localStorage.getItem("userData") || '{"id": 1, "userType": "tenant"}');

  // Parse query parameters
  const urlParams = new URLSearchParams(location.split('?')[1] || '');
  const propertyIdParam = urlParams.get('propertyId');
  const ownerIdParam = urlParams.get('ownerId');
  const tenantIdParam = urlParams.get('tenantId');
  
  // Voice recording
  const {
    isRecording,
    audioBlob,
    duration,
    startRecording,
    stopRecording,
    cancelRecording,
    setAudioBlob
  } = useVoiceRecorder();
  
  // Typing indicator
  const { isTyping, startTyping, stopTyping } = useTypingIndicator(selectedConversationId, currentUser.id);
  
  // WebSocket connection for real-time messaging
  const { isConnected } = useWebSocket(currentUser.id);

  // Fetch conversations
  const { data: conversations = [], isLoading: loadingConversations } = useQuery({
    queryKey: ["/api/conversations", currentUser.id],
    queryFn: () => fetch(`/api/conversations?userId=${currentUser.id}`).then(res => res.json()),
    refetchInterval: 5000, // Refetch every 5 seconds as fallback
  });

  // Search users for new conversations
  const { data: searchedUsers = [], isLoading: loadingUserSearch } = useQuery({
    queryKey: ["/api/users/search", userSearchQuery, currentUser.id],
    queryFn: async () => {
      if (!userSearchQuery.trim()) return [];
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(userSearchQuery)}&userId=${currentUser.id}`);
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
    enabled: !!userSearchQuery.trim(),
  });

  // Block user mutation
  const blockUser = useMutation({
    mutationFn: async (userId: number) => {
      return await apiRequest(`/api/users/${userId}/block`, {
        method: "POST",
        body: JSON.stringify({ blockerId: currentUser.id }),
      });
    },
    onSuccess: () => {
      toast({
        title: "Utilisateur bloqué",
        description: "L'utilisateur a été bloqué avec succès",
      });
      setShowProfileMenu(false);
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de bloquer l'utilisateur",
        variant: "destructive",
      });
    }
  });

  // Fetch messages for selected conversation
  const { data: messages = [], isLoading: loadingMessages } = useQuery({
    queryKey: ["/api/conversations", selectedConversationId, "messages"],
    queryFn: () => fetch(`/api/conversations/${selectedConversationId}/messages`).then(res => res.json()),
    enabled: !!selectedConversationId,
    refetchInterval: 2000, // More frequent for active conversation
  });

  // Send message mutation
  const sendMessage = useMutation({
    mutationFn: async (messageData: { 
      conversationId: number; 
      senderId: number; 
      content: string; 
      messageType?: string;
      fileUrl?: string;
    }) => {
      return await apiRequest(`/api/conversations/${messageData.conversationId}/messages`, {
        method: "POST",
        body: JSON.stringify(messageData),
      });
    },
    onSuccess: () => {
      setNewMessage("");
      queryClient.invalidateQueries({ queryKey: ["/api/conversations", selectedConversationId, "messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/conversations", currentUser.id] });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer le message",
        variant: "destructive",
      });
    }
  });

  // File upload mutation
  const uploadFile = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/upload/message-file', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Upload failed');
      }
      
      return response.json();
    },
    onSuccess: (fileData) => {
      if (selectedConversationId) {
        const messageContent = fileData.type === 'image' ? '📷 Image' :
                             fileData.type === 'video' ? '🎥 Vidéo' : 
                             `📎 ${fileData.filename}`;
        
        sendMessage.mutate({
          conversationId: selectedConversationId,
          senderId: currentUser.id,
          content: messageContent,
          messageType: fileData.type,
          fileUrl: fileData.url
        });
      }
      setIsUploading(false);
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de télécharger le fichier",
        variant: "destructive",
      });
      setIsUploading(false);
    }
  });

  // Handle sending message
  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedConversationId) return;
    
    sendMessage.mutate({
      conversationId: selectedConversationId,
      senderId: currentUser.id,
      content: newMessage.trim(),
      messageType: 'text'
    });
  };

  // Smart conversation creation with proper user assignment
  const handleStartConversation = async (user: any, propertyId?: number, autoMessage?: boolean) => {
    try {
      // Smart user role assignment
      let tenantId, ownerId;
      
      if (currentUser.userType === 'tenant') {
        tenantId = currentUser.id;
        ownerId = user.id;
      } else {
        tenantId = user.id;
        ownerId = currentUser.id;
      }
      
      console.log('Creating conversation:', { tenantId, ownerId, propertyId, currentUserType: currentUser.userType });
      
      // Create conversation (may or may not include initial message)
      const requestData: any = {
        tenantId,
        ownerId,
        propertyId: propertyId || null
      };
      
      // Add initial message for property conversations
      if (propertyId && autoMessage !== false) {
        requestData.message = currentUser.userType === 'tenant' 
          ? "Bonjour! Je suis intéressé par votre propriété. Pouvons-nous discuter?" 
          : "Bonjour! Vous étiez intéressé par ma propriété. Comment puis-je vous aider?";
      }
      
      const response = await apiRequest('/api/conversations', {
        method: 'POST',
        body: JSON.stringify(requestData)
      });
      
      const conversationId = response.conversationId || response.conversation?.id || response.id;
      console.log('Created conversation with ID:', conversationId);
      
      setSelectedConversationId(conversationId);
      setShowUserSearch(false);
      setUserSearchQuery("");
      
      // Refresh conversations list
      queryClient.invalidateQueries({ queryKey: ["/api/conversations", currentUser.id] });
      
      // Small delay to ensure UI updates
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["/api/conversations", conversationId, "messages"] });
      }, 100);
      
    } catch (error) {
      console.error('Conversation creation error:', error);
      toast({
        title: "Erreur",
        description: "Impossible de démarrer la conversation",
        variant: "destructive",
      });
    }
  };

  // Smart conversation auto-selection and creation
  useEffect(() => {
    if (propertyIdParam && ownerIdParam && conversations !== undefined) {
      const propertyId = parseInt(propertyIdParam);
      const ownerId = parseInt(ownerIdParam);
      
      console.log('URL params detected:', { propertyId, ownerId, currentUserType: currentUser.userType, currentUserId: currentUser.id });
      
      // Determine who the other user is based on current user type
      const otherUserId = currentUser.userType === 'owner' ? 
        // If current user is owner, they want to talk to a tenant (this case shouldn't happen from property details)
        null : ownerId; // If current user is tenant, they want to talk to the owner
      
      if (otherUserId) {
        // First check if conversation already exists
        const existingConv = conversations.find((conv: any) => {
          // Match by property and participants
          const matchesProperty = conv.property?.id === propertyId || conv.propertyId === propertyId;
          const matchesParticipant = conv.participant?.id === otherUserId;
          console.log('Checking conversation:', conv.id, { matchesProperty, matchesParticipant, participantId: conv.participant?.id });
          return matchesProperty && matchesParticipant;
        });
        
        if (existingConv) {
          console.log('Found existing conversation:', existingConv.id);
          setSelectedConversationId(existingConv.id);
        } else {
          // Auto-create conversation
          console.log('Creating new conversation between', currentUser.id, 'and', otherUserId, 'for property', propertyId);
          handleStartConversation({ id: otherUserId }, propertyId);
        }
      }
    }
  }, [propertyIdParam, ownerIdParam, conversations, currentUser.id, currentUser.userType]);

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    handleMultipleFiles(files);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle multiple file uploads
  const handleMultipleFiles = (files: File[]) => {
    const validFiles = files.filter(file => {
      const maxSize = 10 * 1024 * 1024; // 10MB
      const validTypes = [
        'image/*', 'video/*', 'audio/*',
        'application/pdf', 'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain'
      ];
      
      if (file.size > maxSize) {
        toast({
          title: "Fichier trop volumineux",
          description: `${file.name} dépasse 10MB`,
          variant: "destructive"
        });
        return false;
      }
      
      const isValidType = validTypes.some(type => {
        if (type.endsWith('*')) {
          return file.type.startsWith(type.slice(0, -1));
        }
        return file.type === type;
      });
      
      if (!isValidType) {
        toast({
          title: "Type de fichier non supporté",
          description: `${file.name} n'est pas un type de fichier supporté`,
          variant: "destructive"
        });
        return false;
      }
      
      return true;
    });

    if (validFiles.length === 0) return;

    setIsUploading(true);
    
    // Upload files sequentially
    const uploadSequentially = async () => {
      for (const file of validFiles) {
        try {
          await uploadFile.mutateAsync(file);
        } catch (error) {
          console.error(`Failed to upload ${file.name}:`, error);
        }
      }
      setIsUploading(false);
    };
    
    uploadSequentially();
  };

  // Drag and drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleMultipleFiles(files);
    }
  };

  // Handle voice message
  const handleVoiceSend = async () => {
    if (!audioBlob || !selectedConversationId) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', audioBlob, 'voice_message.wav');
      
      const response = await fetch('/api/upload/message-file', {
        method: 'POST',
        body: formData,
      });
      
      const fileData = await response.json();
      
      sendMessage.mutate({
        conversationId: selectedConversationId,
        senderId: currentUser.id,
        content: `🎤 Message vocal (${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')})`,
        messageType: 'voice',
        fileUrl: fileData.url
      });
      
      setAudioBlob(null);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer le message vocal",
        variant: "destructive",
      });
    }
    setIsUploading(false);
  };

  // Handle emoji reactions
  const addReaction = (messageId: number, emoji: string) => {
    // In a real app, this would send to the server
    toast({
      title: "Réaction ajoutée",
      description: `Réaction ${emoji} ajoutée au message`,
    });
    setReactionPickerMessageId(null);
  };

  // Add emoji to message
  const addEmojiToMessage = (emoji: string) => {
    setNewMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  // Play voice message
  const playVoiceMessage = (messageId: number, audioUrl: string) => {
    if (playingVoiceId === messageId) {
      // Stop current playback
      setPlayingVoiceId(null);
      return;
    }
    
    setPlayingVoiceId(messageId);
    
    // Create audio element and play
    const audio = new Audio(audioUrl);
    audio.onended = () => setPlayingVoiceId(null);
    audio.onerror = () => {
      setPlayingVoiceId(null);
      toast({
        title: "Erreur de lecture",
        description: "Impossible de lire le message vocal",
        variant: "destructive"
      });
    };
    audio.play().catch(() => {
      setPlayingVoiceId(null);
      toast({
        title: "Erreur de lecture",
        description: "Impossible de lire le message vocal",
        variant: "destructive"
      });
    });
  };

  // Format duration for voice messages
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Filter conversations based on search
  const filteredConversations = conversations.filter((conv: any) =>
    conv.participant?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.property?.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedConversation = conversations.find((conv: any) => conv.id === selectedConversationId);

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMinutes < 1) return 'À l\'instant';
    if (diffInMinutes < 60) return `${diffInMinutes}min`;
    if (diffInHours < 24) return `${diffInHours}h`;
    if (diffInDays < 7) return `${diffInDays}j`;
    return date.toLocaleDateString('fr-FR');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Header />
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <MessageCircle className="h-6 w-6 text-white" />
              </div>
              {isConnected && (
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full animate-pulse"></div>
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Messages
              </h1>
              <p className="text-sm text-muted-foreground flex items-center">
                {isConnected ? (
                  <><Zap className="h-3 w-3 mr-1 text-green-500" />Connecté en temps réel</>
                ) : (
                  <><AlertCircle className="h-3 w-3 mr-1 text-amber-500" />Reconnexion...</>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" className="hover:bg-blue-50 dark:hover:bg-gray-800">
              <Settings className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="hover:bg-blue-50 dark:hover:bg-gray-800">
              <Bell className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-180px)]">
          {/* Conversations List */}
          <div className="lg:col-span-1">
            <Card className="h-full border-0 shadow-xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl">
              <CardHeader className="pb-3 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CardTitle className="text-lg font-semibold">Chats</CardTitle>
                    <Badge variant="secondary" className="bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300">
                      {conversations.length}
                    </Badge>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="rounded-full hover:bg-blue-50 dark:hover:bg-gray-800"
                    onClick={() => setShowUserSearch(true)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher dans les conversations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 border-0 bg-gray-50 dark:bg-gray-800 rounded-full focus:ring-2 focus:ring-blue-500"
                    data-testid="search-conversations"
                  />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[calc(100vh-300px)]">
                  {loadingConversations ? (
                    <div className="p-6 text-center">
                      <div className="animate-spin h-8 w-8 border-3 border-blue-500 border-t-transparent rounded-full mx-auto" />
                      <p className="mt-3 text-muted-foreground">Chargement des conversations...</p>
                    </div>
                  ) : filteredConversations.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                      <div className="relative">
                        <MessageCircle className="h-16 w-16 mx-auto mb-4 opacity-30" />
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                          <Plus className="h-4 w-4 text-white" />
                        </div>
                      </div>
                      <h3 className="font-semibold text-lg mb-2">Aucune conversation</h3>
                      <p className="text-sm">Commencez à discuter avec les propriétaires</p>
                    </div>
                  ) : (
                    filteredConversations.map((conversation: any) => (
                      <div
                        key={conversation.id}
                        onClick={() => {
                          console.log('Selected conversation:', conversation.id);
                          setSelectedConversationId(conversation.id);
                        }}
                        className={`p-4 cursor-pointer transition-all duration-200 hover:bg-blue-50 dark:hover:bg-gray-800 ${
                          selectedConversationId === conversation.id 
                            ? 'bg-blue-100 dark:bg-gray-800 border-r-4 border-blue-500' 
                            : 'border-b border-gray-50 dark:border-gray-800'
                        }`}
                        data-testid={`conversation-${conversation.id}`}
                      >
                        <div className="flex items-start space-x-3">
                          <div className="relative">
                            <Avatar className="h-14 w-14 ring-2 ring-white dark:ring-gray-700">
                              <AvatarImage 
                                src={conversation.participant?.profilePicture} 
                                alt={conversation.participant?.name}
                                className="object-cover"
                              />
                              <AvatarFallback className="bg-gradient-to-br from-blue-400 to-purple-500 text-white font-semibold">
                                {conversation.participant?.name?.split(' ').map((n: string) => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <p className="font-semibold text-base truncate text-gray-900 dark:text-gray-100">
                                {conversation.participant?.name}
                              </p>
                              {conversation.lastMessage && (
                                <span className="text-xs text-blue-500 font-medium">
                                  {formatMessageTime(conversation.lastMessage.createdAt)}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center space-x-2 mb-1">
                              <Badge variant="outline" className="text-xs border-blue-200 text-blue-600">
                                {conversation.participant?.role}
                              </Badge>
                              <span className="text-xs text-muted-foreground truncate">
                                {conversation.property?.title}
                              </span>
                            </div>
                            {conversation.lastMessage ? (
                              <div className="flex items-center justify-between">
                                <p className={`text-sm truncate flex-1 ${
                                  conversation.unreadCount > 0 
                                    ? 'text-gray-900 dark:text-gray-100 font-medium' 
                                    : 'text-muted-foreground'
                                }`}>
                                  {conversation.lastMessage.content}
                                </p>
                                {conversation.unreadCount > 0 && (
                                  <div className="ml-2 min-w-0">
                                    <Badge className="bg-blue-500 hover:bg-blue-600 text-white text-xs h-5 w-5 rounded-full p-0 flex items-center justify-center">
                                      {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
                                    </Badge>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground italic">
                                Nouvelle conversation
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Chat Interface */}
          <div className="lg:col-span-2">
            {selectedConversationId ? (
              <Card className="h-full border-0 shadow-xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl flex flex-col">
                {/* Chat Header */}
                <CardHeader className="pb-3 border-b border-gray-100 dark:border-gray-800 bg-white/90 dark:bg-gray-900/90">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="relative">
                        <Avatar className="h-12 w-12 ring-2 ring-blue-200 dark:ring-blue-700">
                          <AvatarImage 
                            src={selectedConversation?.participant?.profilePicture} 
                            alt={selectedConversation?.participant?.name}
                            className="object-cover"
                          />
                          <AvatarFallback className="bg-gradient-to-br from-blue-400 to-purple-500 text-white font-semibold">
                            {selectedConversation?.participant?.name?.split(' ').map((n: string) => n[0]).join('') || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">
                          {selectedConversation?.participant?.name || 'Utilisateur'}
                        </h3>
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                          <span>Actif maintenant</span>
                          <span>•</span>
                          <span>{selectedConversation?.participant?.role}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Button variant="ghost" size="sm" className="hover:bg-blue-50 dark:hover:bg-gray-800 rounded-full">
                        <Phone className="h-4 w-4 text-blue-600" />
                      </Button>
                      <Button variant="ghost" size="sm" className="hover:bg-blue-50 dark:hover:bg-gray-800 rounded-full">
                        <Video className="h-4 w-4 text-blue-600" />
                      </Button>
                      <Button variant="ghost" size="sm" className="hover:bg-blue-50 dark:hover:bg-gray-800 rounded-full">
                        <MoreHorizontal className="h-4 w-4 text-blue-600" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                {/* Messages */}
                <CardContent className="flex-1 p-0 bg-gradient-to-b from-blue-50/30 to-purple-50/30 dark:from-gray-800/30 dark:to-gray-900/30">
                  <ScrollArea className="h-[calc(100vh-380px)] p-6">
                    {loadingMessages ? (
                      <div className="flex justify-center py-12">
                        <div className="text-center">
                          <div className="animate-spin h-8 w-8 border-3 border-blue-500 border-t-transparent rounded-full mx-auto" />
                          <p className="mt-3 text-muted-foreground">Chargement des messages...</p>
                        </div>
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <div className="relative mb-6">
                          <div className="w-20 h-20 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center mx-auto">
                            <MessageCircle className="h-10 w-10 text-white" />
                          </div>
                          <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
                            <Zap className="h-4 w-4 text-white" />
                          </div>
                        </div>
                        <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100">Commencez à discuter !</h3>
                        <p className="text-sm">Envoyez un message pour démarrer la conversation</p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {messages.map((message: any, index: number) => {
                          const isOwn = message.senderId === currentUser.id;
                          const showAvatar = !isOwn && (index === 0 || messages[index - 1]?.senderId !== message.senderId);
                          console.log('Message:', message.id, 'SenderId:', message.senderId, 'CurrentUserId:', currentUser.id, 'IsOwn:', isOwn);
                          
                          return (
                            <div
                              key={message.id}
                                className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group`}
                              data-testid={`message-${message.id}`}
                            >
                              {!isOwn && showAvatar && (
                                <Avatar className="h-8 w-8 mr-2 self-end">
                                  <AvatarImage 
                                    src={message.sender?.profilePicture} 
                                    alt={message.sender?.firstName}
                                    className="object-cover"
                                  />
                                  <AvatarFallback className="bg-gradient-to-br from-green-400 to-blue-500 text-white text-xs">
                                    {message.sender?.firstName?.[0]}{message.sender?.lastName?.[0]}
                                  </AvatarFallback>
                                </Avatar>
                              )}
                              {!isOwn && !showAvatar && <div className="w-10" />}
                              
                              <div className={`max-w-[75%] ${isOwn ? 'ml-auto' : ''}`}>
                                <div className="relative group">
                                  <div
                                    className={`px-4 py-3 rounded-3xl shadow-sm transition-all duration-200 hover:shadow-md ${
                                      isOwn
                                        ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                                        : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-100 dark:border-gray-600'
                                    }`}
                                    onContextMenu={(e) => {
                                      e.preventDefault();
                                      setReactionPickerMessageId(message.id);
                                    }}
                                    onTouchStart={(e) => {
                                      const touchTimer = setTimeout(() => {
                                        setReactionPickerMessageId(message.id);
                                      }, 500);
                                      
                                      const endTouch = () => {
                                        clearTimeout(touchTimer);
                                        e.currentTarget.removeEventListener('touchend', endTouch);
                                        e.currentTarget.removeEventListener('touchcancel', endTouch);
                                      };
                                      
                                      e.currentTarget.addEventListener('touchend', endTouch);
                                      e.currentTarget.addEventListener('touchcancel', endTouch);
                                    }}
                                  >
                                    {message.messageType === 'image' && message.fileUrl ? (
                                      <div className="space-y-2">
                                        <img 
                                          src={message.fileUrl} 
                                          alt="Image partagée" 
                                          className="max-w-full h-auto rounded-2xl shadow-sm cursor-pointer hover:opacity-90 transition-opacity"
                                          onClick={() => window.open(message.fileUrl, '_blank')}
                                        />
                                        {message.content !== '📷 Image' && (
                                          <p className="text-sm">{message.content}</p>
                                        )}
                                      </div>
                                    ) : message.messageType === 'video' && message.fileUrl ? (
                                      <div className="space-y-2">
                                        <video 
                                          src={message.fileUrl} 
                                          controls 
                                          preload="metadata"
                                          className="max-w-full h-auto rounded-2xl shadow-sm"
                                        />
                                        {message.content !== '🎥 Vidéo' && (
                                          <p className="text-sm">{message.content}</p>
                                        )}
                                      </div>
                                    ) : message.messageType === 'voice' && message.fileUrl ? (
                                      <div className="flex items-center space-x-3 py-2">
                                        <Button 
                                          variant="ghost" 
                                          size="sm" 
                                          onClick={() => playVoiceMessage(message.id, message.fileUrl)}
                                          className={`w-12 h-12 rounded-full flex items-center justify-center ${
                                            isOwn ? 'bg-white/20 hover:bg-white/30 text-white' : 'bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:hover:bg-blue-800 text-blue-600'
                                          }`}
                                        >
                                          {playingVoiceId === message.id ? (
                                            <Pause className="h-6 w-6" />
                                          ) : (
                                            <Play className="h-6 w-6" />
                                          )}
                                        </Button>
                                        <div className="flex-1">
                                          <div className="flex items-center space-x-2">
                                            <div className={`h-2 flex-1 rounded-full overflow-hidden ${
                                              isOwn ? 'bg-white/30' : 'bg-gray-200 dark:bg-gray-600'
                                            }`}>
                                              <div className={`h-full rounded-full transition-all duration-300 ${
                                                playingVoiceId === message.id ? 'w-full' : 'w-1/3'
                                              } ${
                                                isOwn ? 'bg-white' : 'bg-blue-500'
                                              }`}></div>
                                            </div>
                                          </div>
                                          <p className={`text-sm mt-1 font-medium ${isOwn ? 'text-white' : 'text-gray-900 dark:text-gray-100'}`}>
                                            {message.content}
                                          </p>
                                        </div>
                                      </div>
                                    ) : message.messageType === 'file' && message.fileUrl ? (
                                      <div className="space-y-3">
                                        <div className="flex items-center justify-between space-x-3">
                                          <div className="flex items-center space-x-3 flex-1">
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                                              isOwn ? 'bg-white/20' : 'bg-blue-50 dark:bg-blue-900/50'
                                            }`}>
                                              {message.fileUrl?.toLowerCase().includes('.pdf') ? (
                                                <FileText className={`h-6 w-6 ${isOwn ? 'text-white' : 'text-red-500'}`} />
                                              ) : (
                                                <FileText className={`h-6 w-6 ${isOwn ? 'text-white' : 'text-blue-600'}`} />
                                              )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                              <p className="text-sm font-medium truncate">{message.content}</p>
                                              <p className={`text-xs ${isOwn ? 'text-white/70' : 'text-muted-foreground'}`}>
                                                {message.fileUrl?.toLowerCase().includes('.pdf') ? 'Document PDF' : 'Fichier partagé'}
                                              </p>
                                            </div>
                                          </div>
                                        </div>
                                        <div className="flex space-x-2">
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                              // For PDFs, create a proper blob URL
                                              if (message.fileUrl?.toLowerCase().includes('.pdf')) {
                                                fetch(message.fileUrl)
                                                  .then(response => response.blob())
                                                  .then(blob => {
                                                    const url = URL.createObjectURL(blob);
                                                    const link = document.createElement('a');
                                                    link.href = url;
                                                    link.target = '_blank';
                                                    link.rel = 'noopener noreferrer';
                                                    document.body.appendChild(link);
                                                    link.click();
                                                    document.body.removeChild(link);
                                                    // Clean up the blob URL
                                                    setTimeout(() => URL.revokeObjectURL(url), 100);
                                                  })
                                                  .catch(() => {
                                                    // Fallback to direct link
                                                    window.open(message.fileUrl, '_blank');
                                                  });
                                              } else {
                                                window.open(message.fileUrl, '_blank');
                                              }
                                            }}
                                            className={`flex-1 rounded-xl py-2 text-xs ${isOwn ? 'bg-white/20 hover:bg-white/30 text-white' : 'bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-600'}`}
                                          >
                                            <Eye className="h-3 w-3 mr-1" />
                                            Ouvrir
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                              const link = document.createElement('a');
                                              link.href = message.fileUrl;
                                              link.download = message.content.split(' ')[1] || 'fichier';
                                              link.click();
                                            }}
                                            className={`flex-1 rounded-xl py-2 text-xs ${isOwn ? 'bg-white/20 hover:bg-white/30 text-white' : 'bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-600'}`}
                                          >
                                            <Download className="h-3 w-3 mr-1" />
                                            Télécharger
                                          </Button>
                                        </div>
                                      </div>
                                    ) : (
                                      <p className="text-sm leading-relaxed">{message.content}</p>
                                    )}
                                  </div>
                                  
                                </div>
                                
                                <div className={`flex items-center mt-1 space-x-2 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                                  <span className="text-xs text-muted-foreground">
                                    {formatMessageTime(message.createdAt)}
                                  </span>
                                  {isOwn && (
                                    <span className="text-xs text-blue-500">✓✓</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        )}
                        
                        {/* Typing Indicator */}
                        {isTyping && (
                          <div className="flex justify-start">
                            <div className="flex items-center space-x-2 px-4 py-3 bg-white dark:bg-gray-700 rounded-3xl shadow-sm">
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={selectedConversation?.participant?.profilePicture} />
                                <AvatarFallback className="bg-gradient-to-br from-green-400 to-blue-500 text-white text-xs">
                                  {selectedConversation?.participant?.name?.split(' ').map((n: string) => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex space-x-1">
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        <div ref={messagesEndRef} />
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>

                {/* Message Input */}
                <div 
                  className={`p-4 border-t border-gray-100 dark:border-gray-800 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm relative ${
                    dragActive ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20' : ''
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  {dragActive && (
                    <div className="absolute inset-0 bg-blue-500/10 border-2 border-dashed border-blue-500 rounded-lg flex items-center justify-center z-10">
                      <div className="text-center">
                        <Upload className="h-12 w-12 text-blue-500 mx-auto mb-2" />
                        <p className="text-blue-600 font-semibold">Déposez vos fichiers ici</p>
                        <p className="text-sm text-blue-500">Images, vidéos, documents supportés</p>
                      </div>
                    </div>
                  )}
                  {/* Voice Recording Interface */}
                  {isRecording && (
                    <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-2xl border-2 border-red-200 dark:border-red-800">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
                            <Mic className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <p className="font-semibold text-red-700 dark:text-red-300">Enregistrement vocal</p>
                            <p className="text-sm text-red-600 dark:text-red-400 font-mono text-lg">
                              {Math.floor(duration / 60).toString().padStart(2, '0')}:{(duration % 60).toString().padStart(2, '0')}
                            </p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={cancelRecording}
                            className="text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/40"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            onClick={stopRecording}
                            className="bg-red-500 hover:bg-red-600 text-white"
                          >
                            <MicOff className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* File Upload Preview */}
                  {selectedFiles.length > 0 && (
                    <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-2xl border-2 border-green-200 dark:border-green-800">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-green-700 dark:text-green-300">Fichiers sélectionnés</h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedFiles([])}
                          className="text-green-600 hover:bg-green-100 dark:text-green-400 dark:hover:bg-green-900/40"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {selectedFiles.map((file, index) => (
                          <div key={index} className="flex items-center space-x-3 p-2 bg-white dark:bg-gray-800 rounded-lg">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-green-100 dark:bg-green-900">
                              {file.type.startsWith('image/') ? (
                                <FileImage className="h-4 w-4 text-green-600" />
                              ) : file.type.startsWith('video/') ? (
                                <FileVideo className="h-4 w-4 text-green-600" />
                              ) : (
                                <FileText className="h-4 w-4 text-green-600" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{file.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {(file.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Voice Message Preview */}
                  {audioBlob && !isRecording && (
                    <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border-2 border-blue-200 dark:border-blue-800">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                            <Mic className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <p className="font-semibold text-blue-700 dark:text-blue-300">Message vocal prêt</p>
                            <p className="text-sm text-blue-600 dark:text-blue-400 font-mono text-lg">
                              {Math.floor(duration / 60).toString().padStart(2, '0')}:{(duration % 60).toString().padStart(2, '0')}
                            </p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setAudioBlob(null)}
                            className="text-blue-600 hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-900/40"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            onClick={handleVoiceSend}
                            disabled={isUploading}
                            className="bg-blue-500 hover:bg-blue-600 text-white"
                          >
                            {isUploading ? (
                              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                            ) : (
                              <Send className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Upload Progress */}
                  {isUploading && (
                    <div className="mb-4 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-2xl border-2 border-orange-200 dark:border-orange-800">
                      <div className="flex items-center space-x-3">
                        <div className="animate-spin h-6 w-6 border-2 border-orange-500 border-t-transparent rounded-full"></div>
                        <div>
                          <p className="font-semibold text-orange-700 dark:text-orange-300">Envoi en cours...</p>
                          <p className="text-sm text-orange-600 dark:text-orange-400">Veuillez patienter</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-end space-x-3">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
                      multiple
                      className="hidden"
                      data-testid="file-input"
                    />
                    
                    {/* Attachment Button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading || isRecording}
                      className="rounded-full w-10 h-10 p-0 hover:bg-blue-50 dark:hover:bg-gray-800"
                      data-testid="upload-button"
                    >
                      {isUploading ? (
                        <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full" />
                      ) : (
                        <Plus className="h-4 w-4 text-blue-600" />
                      )}
                    </Button>

                    {/* Message Input */}
                    <div className="flex-1 relative bg-gray-50 dark:bg-gray-800 rounded-3xl">
                      <Textarea
                        ref={messageInputRef}
                        value={newMessage}
                        onChange={(e) => {
                          setNewMessage(e.target.value);
                          startTyping();
                        }}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                        placeholder="Écrivez un message..."
                        className="min-h-[44px] max-h-32 resize-none border-0 bg-transparent focus:ring-0 px-4 py-3 pr-20 rounded-3xl"
                        rows={1}
                        disabled={isRecording}
                        data-testid="message-input"
                      />
                      
                      {/* Emoji & Camera Buttons */}
                      <div className="absolute right-2 bottom-2 flex items-center space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (fileInputRef.current) {
                              fileInputRef.current.accept = "image/*";
                              fileInputRef.current.click();
                            }
                          }}
                          className="rounded-full w-8 h-8 p-0 hover:bg-gray-200 dark:hover:bg-gray-700"
                        >
                          <Camera className="h-4 w-4 text-blue-600" />
                        </Button>
                        <div className="relative">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                            className="rounded-full w-8 h-8 p-0 hover:bg-gray-200 dark:hover:bg-gray-700"
                          >
                            <Smile className="h-4 w-4 text-blue-600" />
                          </Button>
                          {showEmojiPicker && (
                            <div className="absolute bottom-10 right-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-2xl p-4 shadow-lg z-20 w-80">
                              <div className="grid grid-cols-8 gap-2 max-h-60 overflow-y-auto">
                                {[
                                  '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣',
                                  '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰',
                                  '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜',
                                  '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏',
                                  '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣',
                                  '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠',
                                  '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨',
                                  '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥',
                                  '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧',
                                  '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐',
                                  '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑',
                                  '🤠', '👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘',
                                  '🤙', '👈', '👉', '👆', '👇', '☝️', '✋', '🤚',
                                  '🖐️', '🖖', '👋', '🤙', '💪', '🖕', '✍️', '🙏',
                                  '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍',
                                  '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖',
                                  '💘', '💝', '💟', '☮️', '✝️', '☪️', '🕉️', '☸️',
                                  '✡️', '🔯', '🕎', '☯️', '☦️', '🛐', '⛎', '♈',
                                  '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐',
                                  '♑', '♒', '♓', '🆔', '⚛️', '🉑', '☢️', '☣️'
                                ].map((emoji) => (
                                  <button
                                    key={emoji}
                                    onClick={() => addEmojiToMessage(emoji)}
                                    className="w-8 h-8 text-lg hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                                  >
                                    {emoji}
                                  </button>
                                ))}
                              </div>
                              <div className="flex justify-end mt-3">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setShowEmojiPicker(false)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Send/Voice Button */}
                    {newMessage.trim() ? (
                      <Button 
                        onClick={handleSendMessage}
                        disabled={sendMessage.isPending}
                        className="rounded-full w-12 h-12 p-0 bg-blue-500 hover:bg-blue-600 shadow-lg"
                        data-testid="send-button"
                      >
                        {sendMessage.isPending ? (
                          <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                        ) : (
                          <Send className="h-5 w-5 text-white" />
                        )}
                      </Button>
                    ) : (
                      <Button 
                        onMouseDown={startRecording}
                        onMouseUp={stopRecording}
                        onMouseLeave={stopRecording}
                        className={`rounded-full w-12 h-12 p-0 transition-all duration-200 ${
                          isRecording 
                            ? 'bg-red-500 hover:bg-red-600 scale-110' 
                            : 'bg-blue-500 hover:bg-blue-600'
                        } shadow-lg`}
                        data-testid="voice-button"
                      >
                        <Mic className={`h-5 w-5 text-white ${isRecording ? 'animate-pulse' : ''}`} />
                      </Button>
                    )}
                  </div>
                  
                  <div className="mt-2 text-center">
                    <p className="text-xs text-muted-foreground">
                      Maintenez le bouton micro pour enregistrer un message vocal
                    </p>
                  </div>
                </div>
              </Card>
            ) : (
              <Card className="h-full border-0 shadow-xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl flex items-center justify-center">
                <div className="text-center text-muted-foreground max-w-md">
                  <div className="relative mb-8">
                    <div className="w-24 h-24 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center mx-auto">
                      <MessageCircle className="h-12 w-12 text-white" />
                    </div>
                    <div className="absolute -top-2 -right-8 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center animate-bounce">
                      <Zap className="h-4 w-4 text-white" />
                    </div>
                    <div className="absolute -bottom-2 -left-8 w-8 h-8 bg-green-400 rounded-full flex items-center justify-center animate-pulse">
                      <Heart className="h-4 w-4 text-white" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Sélectionnez une conversation
                  </h3>
                  <p className="text-lg mb-6">Choisissez une conversation dans la liste pour commencer à discuter</p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center space-x-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                      <Mic className="h-5 w-5 text-blue-500" />
                      <span>Messages vocaux</span>
                    </div>
                    <div className="flex items-center space-x-2 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                      <ImageIcon className="h-5 w-5 text-purple-500" />
                      <span>Photos & Vidéos</span>
                    </div>
                    <div className="flex items-center space-x-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-xl">
                      <Heart className="h-5 w-5 text-green-500" />
                      <span>Réactions rapides</span>
                    </div>
                    <div className="flex items-center space-x-2 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-xl">
                      <Zap className="h-5 w-5 text-orange-500" />
                      <span>Temps réel</span>
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* User Search Modal */}
      {showUserSearch && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Chercher un utilisateur</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setShowUserSearch(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Nom, prénom ou email..."
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  className="pl-10"
                  autoFocus
                />
              </div>
              
              <ScrollArea className="h-64">
                {loadingUserSearch ? (
                  <div className="text-center py-8">
                    <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto" />
                    <p className="mt-2 text-sm text-muted-foreground">Recherche...</p>
                  </div>
                ) : searchedUsers.length === 0 && userSearchQuery.trim() ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>Aucun utilisateur trouvé</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {searchedUsers.map((user: any) => (
                      <div
                        key={user.id}
                        onClick={() => handleStartConversation(user)}
                        className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                      >
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={user.profilePicture} />
                          <AvatarFallback className="bg-gradient-to-br from-blue-400 to-purple-500 text-white">
                            {user.firstName?.[0]}{user.lastName?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-medium">{user.firstName} {user.lastName}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                          <Badge variant="outline" className="text-xs mt-1">
                            {user.userType === 'owner' ? 'Propriétaire' : 'Locataire'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}