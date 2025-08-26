import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { 
  MessageCircle, 
  Send, 
  Bot, 
  User, 
  Home, 
  MapPin, 
  DollarSign, 
  Calendar,
  ThumbsUp,
  ThumbsDown,
  ExternalLink,
  Languages,
  Mic,
  MicOff
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useLocation } from 'wouter';

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  language?: string;
  properties?: any[];
  actions?: any[];
  feedback?: 'like' | 'dislike';
}

interface AIAssistantProps {
  userId: number;
  userType: string;
  userName?: string;
  className?: string;
}

const AIAssistant: React.FC<AIAssistantProps> = ({ 
  userId, 
  userType, 
  userName = 'Utilisateur',
  className = ''
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('auto');
  const [isExpanded, setIsExpanded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const [, navigate] = useLocation();

  // Language options
  const languages = [
    { code: 'auto', name: 'Détection automatique', flag: '🌐' },
    { code: 'ar', name: 'العربية', flag: '🇹🇳' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'tn', name: 'Derja Tounsia', flag: '🇹🇳' }
  ];

  // Welcome messages based on user type and language
  const getWelcomeMessage = () => {
    const welcomeMessages = {
      tenant: {
        ar: "مرحباً! أنا مساعدك الذكي للعقارات. يمكنني مساعدتك في البحث عن منازل مثالية وتقديم النصائح.",
        fr: "Bonjour ! Je suis votre assistant immobilier intelligent. Je peux vous aider à trouver des propriétés parfaites et donner des conseils.",
        en: "Hello! I'm your smart real estate assistant. I can help you find perfect properties and provide advice.",
        tn: "أهلاً وسهلاً! أنا المساعد متاعك للعقارات. نجم نعاونك تلقى دار مليحة ونعطيك مشورة."
      },
      owner: {
        ar: "مرحباً! أنا هنا لمساعدتك في إدارة عقاراتك وجذب المستأجرين المناسبين.",
        fr: "Bonjour ! Je suis là pour vous aider à gérer vos propriétés et attirer les bons locataires.",
        en: "Hello! I'm here to help you manage your properties and attract the right tenants.",
        tn: "أهلاً بيك! أنا موجود باش نعاونك تسير في ملكياتك وتجذب مستأجرين مليحين."
      }
    };

    const userMessages = welcomeMessages[userType as keyof typeof welcomeMessages] || welcomeMessages.tenant;
    return userMessages.fr; // Default to French
  };

  // Initialize with welcome message
  useEffect(() => {
    const welcomeMessage: Message = {
      id: 'welcome',
      type: 'ai',
      content: getWelcomeMessage(),
      timestamp: new Date(),
      language: 'fr'
    };
    setMessages([welcomeMessage]);
  }, [userType]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Voice recognition setup
  const startListening = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.lang = selectedLanguage === 'auto' ? 'ar-TN' : 
                        selectedLanguage === 'tn' ? 'ar-TN' :
                        selectedLanguage === 'ar' ? 'ar-SA' :
                        selectedLanguage === 'fr' ? 'fr-FR' : 'en-US';
      
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputMessage(transcript);
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
        toast({
          title: "Erreur de reconnaissance vocale",
          description: "Impossible d'activer la reconnaissance vocale",
          variant: "destructive"
        });
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } else {
      toast({
        title: "Non supporté",
        description: "La reconnaissance vocale n'est pas supportée par votre navigateur",
        variant: "destructive"
      });
    }
  };

  // Send message to AI
  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date(),
      language: selectedLanguage
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await apiRequest('/api/ai/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: inputMessage,
          userId,
          userType,
          language: selectedLanguage,
          conversationHistory: messages.slice(-5) // Send last 5 messages for context
        })
      });

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: response.message,
        timestamp: new Date(),
        language: response.language,
        properties: response.properties,
        actions: response.actions
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('AI Chat error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: selectedLanguage === 'ar' ? 'آسف، حدث خطأ. يرجى المحاولة مرة أخرى.' :
                selectedLanguage === 'tn' ? 'آسف، صار مشكل. جرب مرة أخرى.' :
                selectedLanguage === 'en' ? 'Sorry, an error occurred. Please try again.' :
                'Désolé, une erreur s\'est produite. Veuillez réessayer.',
        timestamp: new Date(),
        language: selectedLanguage
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle property click
  const handlePropertyClick = (propertyId: number) => {
    navigate(`/property/${propertyId}`);
  };

  // Handle feedback
  const provideFeedback = async (messageId: string, feedback: 'like' | 'dislike') => {
    setMessages(prev => 
      prev.map(msg => 
        msg.id === messageId ? { ...msg, feedback } : msg
      )
    );

    try {
      await apiRequest('/api/ai/feedback', {
        method: 'POST',
        body: JSON.stringify({
          messageId,
          feedback,
          userId
        })
      });
    } catch (error) {
      console.error('Feedback error:', error);
    }
  };

  // Quick action buttons
  const quickActions = [
    {
      text: userType === 'tenant' ? 'بحث عن شقة' : 'إدارة عقاراتي',
      textFr: userType === 'tenant' ? 'Chercher un appartement' : 'Gérer mes propriétés',
      textEn: userType === 'tenant' ? 'Find apartment' : 'Manage properties',
      textTn: userType === 'tenant' ? 'نقلب على دار' : 'نسير في ملكياتي',
      icon: Home
    },
    {
      text: 'في أي منطقة؟',
      textFr: 'Dans quel quartier ?',
      textEn: 'Which area?',
      textTn: 'في أنهي حومة؟',
      icon: MapPin
    },
    {
      text: 'كم السعر؟',
      textFr: 'Quel budget ?',
      textEn: 'What budget?',
      textTn: 'قداش الثمن؟',
      icon: DollarSign
    }
  ];

  if (!isExpanded) {
    return (
      <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
        <Button
          onClick={() => setIsExpanded(true)}
          className="rounded-full w-14 h-14 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg"
        >
          <MessageCircle className="h-6 w-6 text-white" />
        </Button>
      </div>
    );
  }

  return (
    <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
      <Card className="w-96 h-[600px] glass-card shadow-2xl border-0 overflow-hidden">
        <CardHeader className="pb-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Bot className="h-5 w-5" />
              <span>Assistant IA</span>
            </CardTitle>
            <div className="flex items-center space-x-2">
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="text-xs bg-white/20 border-0 rounded px-2 py-1 text-white"
              >
                {languages.map(lang => (
                  <option key={lang.code} value={lang.code} className="text-black">
                    {lang.flag} {lang.name}
                  </option>
                ))}
              </select>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(false)}
                className="text-white hover:bg-white/20 h-8 w-8 p-0"
              >
                ×
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0 flex flex-col h-[520px]">
          {/* Messages Area */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] ${message.type === 'user' ? 'order-2' : 'order-1'}`}>
                    <div className="flex items-start space-x-2">
                      {message.type === 'ai' && (
                        <Avatar className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600">
                          <Bot className="h-4 w-4 text-white" />
                        </Avatar>
                      )}
                      
                      <div className={`rounded-lg p-3 ${
                        message.type === 'user' 
                          ? 'bg-blue-500 text-white ml-2' 
                          : 'bg-gray-100 text-gray-800 mr-2'
                      }`}>
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        
                        {message.properties && message.properties.length > 0 && (
                          <div className="mt-3 space-y-2">
                            {message.properties.map((property: any) => (
                              <div
                                key={property.id}
                                onClick={() => handlePropertyClick(property.id)}
                                className="bg-white rounded-lg p-3 cursor-pointer hover:bg-gray-50 border border-gray-200 transition-colors"
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <h4 className="font-medium text-gray-900">{property.title}</h4>
                                    <p className="text-sm text-gray-600">{property.address}</p>
                                    <p className="text-lg font-bold text-blue-600">{property.price} DT/mois</p>
                                  </div>
                                  <ExternalLink className="h-4 w-4 text-gray-400" />
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {message.actions && message.actions.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {message.actions.map((action: any, index: number) => (
                              <Button
                                key={index}
                                variant="outline"
                                size="sm"
                                onClick={() => action.onClick && action.onClick()}
                                className="text-xs"
                              >
                                {action.label}
                              </Button>
                            ))}
                          </div>
                        )}

                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs opacity-60">
                            {message.timestamp.toLocaleTimeString()}
                          </span>
                          
                          {message.type === 'ai' && (
                            <div className="flex items-center space-x-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => provideFeedback(message.id, 'like')}
                                className={`h-6 w-6 p-0 ${message.feedback === 'like' ? 'text-green-500' : 'text-gray-400'}`}
                              >
                                <ThumbsUp className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => provideFeedback(message.id, 'dislike')}
                                className={`h-6 w-6 p-0 ${message.feedback === 'dislike' ? 'text-red-500' : 'text-gray-400'}`}
                              >
                                <ThumbsDown className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>

                      {message.type === 'user' && (
                        <Avatar className="w-8 h-8 bg-blue-500">
                          <User className="h-4 w-4 text-white" />
                        </Avatar>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex items-start space-x-2">
                    <Avatar className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600">
                      <Bot className="h-4 w-4 text-white" />
                    </Avatar>
                    <div className="bg-gray-100 rounded-lg p-3">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Quick Actions */}
          {messages.length <= 1 && (
            <div className="p-3 border-t border-gray-200">
              <p className="text-xs text-gray-500 mb-2">Actions rapides :</p>
              <div className="flex flex-wrap gap-2">
                {quickActions.map((action, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => setInputMessage(action.textFr)}
                    className="text-xs flex items-center space-x-1"
                  >
                    <action.icon className="h-3 w-3" />
                    <span>{action.textFr}</span>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={startListening}
                disabled={isListening}
                className={`h-10 w-10 p-0 ${isListening ? 'bg-red-100 border-red-300' : ''}`}
              >
                {isListening ? (
                  <MicOff className="h-4 w-4 text-red-500" />
                ) : (
                  <Mic className="h-4 w-4" />
                )}
              </Button>
              
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder={
                  selectedLanguage === 'ar' ? 'اكتب رسالتك...' :
                  selectedLanguage === 'tn' ? 'اكتب رسالتك...' :
                  selectedLanguage === 'en' ? 'Type your message...' :
                  'Tapez votre message...'
                }
                disabled={isLoading}
                className="flex-1"
                dir={selectedLanguage === 'ar' || selectedLanguage === 'tn' ? 'rtl' : 'ltr'}
              />
              
              <Button
                onClick={sendMessage}
                disabled={!inputMessage.trim() || isLoading}
                className="h-10 w-10 p-0 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
              >
                <Send className="h-4 w-4 text-white" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AIAssistant;