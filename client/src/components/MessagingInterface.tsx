import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Upload, Image, FileText, X, Download, Eye, FileIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: number;
  sender: string;
  content: string;
  timestamp: string;
  type: 'text' | 'image' | 'file' | 'pdf';
  fileName?: string;
  fileUrl?: string;
  fileSize?: number;
}

interface MessagingInterfaceProps {
  contactName: string;
  messages: Message[];
  onSendMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void;
}

const MessagingInterface = ({ contactName, messages, onSendMessage }: MessagingInterfaceProps) => {
  const [newMessage, setNewMessage] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
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

    // Enhanced file type detection
    const isImage = file.type.startsWith('image/');
    const isPDF = file.type === 'application/pdf';
    
    // Create object URL for file preview (in real app, upload to server)
    const fileUrl = URL.createObjectURL(file);
    
    let messageType: 'text' | 'image' | 'file' | 'pdf' = 'file';
    if (isImage) messageType = 'image';
    else if (isPDF) messageType = 'pdf';
    
    onSendMessage({
      sender: currentUser,
      content: `${file.name}`,
      type: messageType,
      fileName: file.name,
      fileUrl: fileUrl,
      fileSize: file.size
    });

    toast({
      title: "Fichier envoyé",
      description: `${file.name} (${(file.size / 1024).toFixed(1)} KB) a été envoyé`,
    });

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const getFileIcon = (fileName: string, type: string) => {
    if (type === 'image') return <Image className="h-4 w-4" />;
    if (type === 'pdf') return <FileText className="h-4 w-4 text-red-500" />;
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (['doc', 'docx'].includes(ext || '')) return <FileText className="h-4 w-4 text-blue-500" />;
    if (['xls', 'xlsx'].includes(ext || '')) return <FileIcon className="h-4 w-4 text-green-500" />;
    return <FileText className="h-4 w-4" />;
  };
  
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
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
                {/* Enhanced file rendering */}
                {message.type === 'image' && message.fileUrl && (
                  <div className="mb-2">
                    <div className="flex items-center space-x-2 mb-2">
                      <Image className="h-4 w-4" />
                      <span className="text-xs">Image</span>
                    </div>
                    <img
                      src={message.fileUrl}
                      alt={message.fileName || 'Image'}
                      className="max-w-48 max-h-32 rounded cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => setSelectedImage(message.fileUrl!)}
                    />
                    <p className="text-xs mt-1">{message.fileName}</p>
                    {message.fileSize && (
                      <p className="text-xs opacity-70">{formatFileSize(message.fileSize)}</p>
                    )}
                  </div>
                )}
                {message.type === 'pdf' && (
                  <div className="mb-2">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4 text-red-500" />
                        <span className="text-xs">PDF</span>
                      </div>
                      <div className="flex space-x-1">
                        {message.fileUrl && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => window.open(message.fileUrl, '_blank')}
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => {
                                const a = document.createElement('a');
                                a.href = message.fileUrl!;
                                a.download = message.fileName || 'document.pdf';
                                a.click();
                              }}
                            >
                              <Download className="h-3 w-3" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="bg-red-50 border border-red-200 rounded p-2">
                      <p className="text-xs font-medium">{message.fileName || 'Document PDF'}</p>
                      {message.fileSize && (
                        <p className="text-xs text-gray-500">{formatFileSize(message.fileSize)}</p>
                      )}
                    </div>
                  </div>
                )}
                {(message.type === 'file' || (message.type !== 'image' && message.type !== 'pdf' && message.type !== 'text')) && (
                  <div className="mb-2">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        {getFileIcon(message.fileName || '', message.type)}
                        <span className="text-xs">Fichier</span>
                      </div>
                      {message.fileUrl && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => {
                            const a = document.createElement('a');
                            a.href = message.fileUrl!;
                            a.download = message.fileName || 'file';
                            a.click();
                          }}
                        >
                          <Download className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded p-2">
                      <p className="text-xs font-medium">{message.fileName || 'Fichier'}</p>
                      {message.fileSize && (
                        <p className="text-xs text-gray-500">{formatFileSize(message.fileSize)}</p>
                      )}
                    </div>
                  </div>
                )}
                {message.type === 'text' && (
                  <p className="text-sm">{message.content}</p>
                )}
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
      
      {/* Full-screen image modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl max-h-full p-4">
            <Button
              variant="ghost"
              size="sm"
              className="absolute -top-2 -right-2 bg-white text-black rounded-full h-8 w-8 p-0"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedImage(null);
              }}
            >
              <X className="h-4 w-4" />
            </Button>
            <img
              src={selectedImage}
              alt="Image en plein écran"
              className="max-w-full max-h-full object-contain rounded"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </Card>
  );
};

export default MessagingInterface;