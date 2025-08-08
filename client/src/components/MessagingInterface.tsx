import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Upload, Image, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: number;
  sender: string;
  content: string;
  timestamp: string;
  type: 'text' | 'image' | 'file';
  fileName?: string;
}

interface MessagingInterfaceProps {
  contactName: string;
  messages: Message[];
  onSendMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void;
}

const MessagingInterface = ({ contactName, messages, onSendMessage }: MessagingInterfaceProps) => {
  const [newMessage, setNewMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const currentUser = localStorage.getItem("userEmail") || "Vous";

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    onSendMessage({
      sender: currentUser,
      content: newMessage,
      type: 'text'
    });

    setNewMessage("");
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Mock file upload
    const isImage = file.type.startsWith('image/');
    
    onSendMessage({
      sender: currentUser,
      content: `${file.name} (${(file.size / 1024).toFixed(1)} KB)`,
      type: isImage ? 'image' : 'file',
      fileName: file.name
    });

    toast({
      title: "Fichier envoyé",
      description: `${file.name} a été envoyé avec succès`,
    });

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Card className="glass-card h-96 flex flex-col">
      <CardHeader className="flex-shrink-0">
        <CardTitle className="text-lg">
          Conversation avec {contactName}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.sender === currentUser ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg ${
                  message.sender === currentUser
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground'
                }`}
              >
                {message.type === 'image' && (
                  <div className="flex items-center space-x-2 mb-1">
                    <Image className="h-4 w-4" />
                    <span className="text-xs">Image</span>
                  </div>
                )}
                {message.type === 'file' && (
                  <div className="flex items-center space-x-2 mb-1">
                    <FileText className="h-4 w-4" />
                    <span className="text-xs">Fichier</span>
                  </div>
                )}
                <p className="text-sm">{message.content}</p>
                <p className="text-xs opacity-70 mt-1">
                  {new Date(message.timestamp).toLocaleTimeString('fr-FR', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
          ))}
          
          {messages.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              <p>Aucun message pour le moment</p>
              <p className="text-sm">Commencez la conversation !</p>
            </div>
          )}
        </div>

        {/* Message Input */}
        <div className="p-4 border-t border-border/50">
          <div className="flex items-center space-x-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*,.pdf,.doc,.docx"
              className="hidden"
            />
            
            <Button
              variant="outline"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-4 w-4" />
            </Button>

            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Tapez votre message..."
              className="flex-1"
            />

            <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MessagingInterface;