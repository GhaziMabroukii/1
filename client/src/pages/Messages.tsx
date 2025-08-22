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
  Video, FileText, MoreHorizontal, Phone, Search,
  Paperclip, Smile, X
} from "lucide-react";
import Header from "@/components/Header";

// WebSocket hook for real-time messaging
function useWebSocket(userId: number) {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
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
  const [, navigate] = useLocation();
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get current user from localStorage
  const currentUser = JSON.parse(localStorage.getItem("user") || '{"id": 1, "userType": "tenant"}');
  
  // WebSocket connection for real-time messaging
  const { isConnected } = useWebSocket(currentUser.id);

  // Fetch conversations
  const { data: conversations = [], isLoading: loadingConversations } = useQuery({
    queryKey: ["/api/conversations", currentUser.id],
    queryFn: () => fetch(`/api/conversations?userId=${currentUser.id}`).then(res => res.json()),
    refetchInterval: 5000, // Refetch every 5 seconds as fallback
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

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    uploadFile.mutate(file);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold gradient-text flex items-center">
              <MessageCircle className="h-8 w-8 mr-3" />
              Messages
            </h1>
            <p className="text-muted-foreground flex items-center mt-2">
              {isConnected ? (
                <><span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>En ligne</>
              ) : (
                <><span className="w-2 h-2 bg-gray-400 rounded-full mr-2"></span>Hors ligne</>
              )}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
          {/* Conversations List */}
          <div className="lg:col-span-1">
            <Card className="h-full glass">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Conversations</CardTitle>
                  <Badge variant="secondary">{conversations.length}</Badge>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                    data-testid="search-conversations"
                  />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[calc(100vh-320px)]">
                  {loadingConversations ? (
                    <div className="p-4 text-center text-muted-foreground">
                      <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto" />
                      <p className="mt-2">Chargement...</p>
                    </div>
                  ) : filteredConversations.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground">
                      <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Aucune conversation</p>
                      <p className="text-sm">Vos conversations apparaîtront ici</p>
                    </div>
                  ) : (
                    filteredConversations.map((conversation: any) => (
                      <div
                        key={conversation.id}
                        onClick={() => setSelectedConversationId(conversation.id)}
                        className={`p-4 border-b cursor-pointer hover:bg-muted/50 transition-colors ${
                          selectedConversationId === conversation.id ? 'bg-muted' : ''
                        }`}
                        data-testid={`conversation-${conversation.id}`}
                      >
                        <div className="flex items-start space-x-3">
                          <Avatar className="h-12 w-12">
                            <AvatarImage 
                              src={conversation.participant?.profilePicture} 
                              alt={conversation.participant?.name}
                            />
                            <AvatarFallback>
                              {conversation.participant?.name?.split(' ').map((n: string) => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="font-semibold text-sm truncate">
                                {conversation.participant?.name}
                              </p>
                              {conversation.lastMessage && (
                                <span className="text-xs text-muted-foreground">
                                  {formatMessageTime(conversation.lastMessage.createdAt)}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mb-1">
                              {conversation.participant?.role} • {conversation.property?.title}
                            </p>
                            {conversation.lastMessage ? (
                              <p className="text-sm text-muted-foreground truncate">
                                {conversation.lastMessage.content}
                              </p>
                            ) : (
                              <p className="text-sm text-muted-foreground italic">
                                Aucun message
                              </p>
                            )}
                            {conversation.unreadCount > 0 && (
                              <Badge variant="destructive" className="mt-1 text-xs">
                                {conversation.unreadCount}
                              </Badge>
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
              <Card className="h-full glass flex flex-col">
                {/* Chat Header */}
                <CardHeader className="pb-3 border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarImage 
                          src={selectedConversation?.participant?.profilePicture} 
                          alt={selectedConversation?.participant?.name}
                        />
                        <AvatarFallback>
                          {selectedConversation?.participant?.name?.split(' ').map((n: string) => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold">{selectedConversation?.participant?.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {selectedConversation?.participant?.role} • {selectedConversation?.property?.title}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="sm">
                        <Phone className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                {/* Messages */}
                <CardContent className="flex-1 p-0">
                  <ScrollArea className="h-[calc(100vh-400px)] p-4">
                    {loadingMessages ? (
                      <div className="flex justify-center py-8">
                        <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Aucun message pour le moment</p>
                        <p className="text-sm">Commencez la conversation !</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {messages.map((message: any) => (
                          <div
                            key={message.id}
                            className={`flex ${message.senderId === currentUser.id ? 'justify-end' : 'justify-start'}`}
                            data-testid={`message-${message.id}`}
                          >
                            <div className={`max-w-[70%] ${message.senderId === currentUser.id ? 'order-2' : 'order-1'}`}>
                              <div
                                className={`px-4 py-2 rounded-2xl ${message.senderId === currentUser.id
                                  ? 'bg-primary text-primary-foreground ml-auto'
                                  : 'bg-muted text-foreground'
                                }`}
                              >
                                {message.messageType === 'image' && message.fileUrl ? (
                                  <div>
                                    <img 
                                      src={message.fileUrl} 
                                      alt="Image partagée" 
                                      className="max-w-full h-auto rounded-lg mb-2"
                                    />
                                    <p className="text-sm">{message.content}</p>
                                  </div>
                                ) : message.messageType === 'video' && message.fileUrl ? (
                                  <div>
                                    <video 
                                      src={message.fileUrl} 
                                      controls 
                                      className="max-w-full h-auto rounded-lg mb-2"
                                    />
                                    <p className="text-sm">{message.content}</p>
                                  </div>
                                ) : message.messageType === 'file' && message.fileUrl ? (
                                  <div className="flex items-center space-x-2">
                                    <FileText className="h-4 w-4" />
                                    <span className="text-sm">{message.content}</span>
                                  </div>
                                ) : (
                                  <p className="text-sm">{message.content}</p>
                                )}
                              </div>
                              <p className={`text-xs text-muted-foreground mt-1 ${
                                message.senderId === currentUser.id ? 'text-right' : 'text-left'
                              }`}>
                                {formatMessageTime(message.createdAt)}
                              </p>
                            </div>
                            {message.senderId !== currentUser.id && (
                              <Avatar className="h-8 w-8 order-1 mr-2">
                                <AvatarImage 
                                  src={message.sender?.profilePicture} 
                                  alt={message.sender?.firstName}
                                />
                                <AvatarFallback className="text-xs">
                                  {message.sender?.firstName?.[0]}{message.sender?.lastName?.[0]}
                                </AvatarFallback>
                              </Avatar>
                            )}
                          </div>
                        ))}
                        <div ref={messagesEndRef} />
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>

                {/* Message Input */}
                <div className="p-4 border-t">
                  <div className="flex items-end space-x-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept="image/*,video/*,.pdf,.doc,.docx"
                      className="hidden"
                      data-testid="file-input"
                    />
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      data-testid="upload-button"
                    >
                      {isUploading ? (
                        <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                      ) : (
                        <Paperclip className="h-4 w-4" />
                      )}
                    </Button>

                    <div className="flex-1 relative">
                      <Textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                        placeholder="Tapez votre message..."
                        className="min-h-[40px] max-h-32 resize-none pr-12"
                        rows={1}
                        data-testid="message-input"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 bottom-2"
                      >
                        <Smile className="h-4 w-4" />
                      </Button>
                    </div>

                    <Button 
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim() || sendMessage.isPending}
                      data-testid="send-button"
                    >
                      {sendMessage.isPending ? (
                        <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </Card>
            ) : (
              <Card className="h-full glass flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <MessageCircle className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">Sélectionnez une conversation</h3>
                  <p>Choisissez une conversation dans la liste pour commencer à discuter</p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}