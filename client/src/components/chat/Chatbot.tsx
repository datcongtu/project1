import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Send, Bot, User, Loader2, Heart, MessageSquare } from "lucide-react";

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

const predefinedResponses = {
  greeting: [
    "Hello! I'm your MOMazing AI assistant. I'm here to support you on your postpartum wellness journey. How can I help you today?",
    "Hi there! Welcome to MOMazing. I'm here to provide guidance, support, and encouragement. What would you like to talk about?",
    "Hey! Great to see you. I'm your personal wellness companion. Whether you have questions about exercises, need emotional support, or want tips for your recovery, I'm here for you."
  ],
  exercise: [
    "Exercise is so important for postpartum recovery! Are you looking for specific exercises, wondering about when to start, or need help with form? I can guide you through safe, effective workouts.",
    "I'd love to help you with your exercise routine! Whether it's pelvic floor strengthening, core recovery, or general fitness, we can work together to find what's right for your body.",
    "Physical activity can really boost your mood and energy levels. What type of exercise are you interested in? I can suggest modifications that are perfect for your recovery stage."
  ],
  mood: [
    "Your emotional well-being is just as important as your physical recovery. It's completely normal to experience a range of emotions after childbirth. Would you like to talk about how you're feeling?",
    "Thank you for being open about your feelings. Many new mothers experience emotional ups and downs - you're not alone. What's been on your mind lately?",
    "Postpartum emotions can be overwhelming, and that's okay. I'm here to listen and support you. Would you like some coping strategies or just someone to talk to?"
  ],
  support: [
    "Remember, you're doing an amazing job! Every mother's journey is unique, and it's okay to take things one day at a time. What support do you need most right now?",
    "You're stronger than you know! Recovery takes time, and every small step forward is progress. I'm here to cheer you on. How can I support you today?",
    "Being a new mom is one of the biggest life changes you'll ever experience. It's normal to feel overwhelmed sometimes. You're not alone in this journey."
  ],
  default: [
    "I understand you're looking for support. Could you tell me more about what's on your mind? I'm here to help with exercise guidance, emotional support, or any postpartum wellness questions.",
    "I'm here to help! Whether you're curious about exercise routines, need emotional support, want nutrition tips, or have questions about your recovery, I'm ready to assist.",
    "Thank you for reaching out. I'm designed to support new mothers with their wellness journey. What would be most helpful for you right now?"
  ]
};

export default function Chatbot() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [conversationId, setConversationId] = useState<number | null>(null);

  // Fetch latest conversation
  const { data: latestConversation } = useQuery({
    queryKey: ["/api/chat/conversations/latest"],
    retry: false,
  });

  // Load existing conversation
  useEffect(() => {
    if (latestConversation && latestConversation.id) {
      setConversationId(latestConversation.id);
      setMessages(latestConversation.messages || []);
    } else {
      // Start with welcome message
      const welcomeMessage: Message = {
        role: 'assistant',
        content: predefinedResponses.greeting[0],
        timestamp: new Date().toISOString()
      };
      setMessages([welcomeMessage]);
    }
  }, [latestConversation]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Create new conversation mutation
  const createConversationMutation = useMutation({
    mutationFn: async (messages: Message[]) => {
      return await apiRequest('POST', '/api/chat/conversations', { messages });
    },
    onSuccess: (data) => {
      setConversationId(data.id);
      queryClient.invalidateQueries({ queryKey: ['/api/chat/conversations'] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to save conversation. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Update conversation mutation
  const updateConversationMutation = useMutation({
    mutationFn: async ({ id, messages }: { id: number; messages: Message[] }) => {
      return await apiRequest('PUT', `/api/chat/conversations/${id}`, { messages });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/chat/conversations'] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
    },
  });

  const generateResponse = (userMessage: string): string => {
    const message = userMessage.toLowerCase();
    
    // Determine response category based on keywords
    if (message.includes('hello') || message.includes('hi') || message.includes('hey')) {
      return predefinedResponses.greeting[Math.floor(Math.random() * predefinedResponses.greeting.length)];
    }
    
    if (message.includes('exercise') || message.includes('workout') || message.includes('fitness') || message.includes('pelvic') || message.includes('core')) {
      return predefinedResponses.exercise[Math.floor(Math.random() * predefinedResponses.exercise.length)];
    }
    
    if (message.includes('mood') || message.includes('feel') || message.includes('sad') || message.includes('anxious') || message.includes('depressed') || message.includes('emotional')) {
      return predefinedResponses.mood[Math.floor(Math.random() * predefinedResponses.mood.length)];
    }
    
    if (message.includes('help') || message.includes('support') || message.includes('encourage') || message.includes('difficult') || message.includes('hard')) {
      return predefinedResponses.support[Math.floor(Math.random() * predefinedResponses.support.length)];
    }
    
    return predefinedResponses.default[Math.floor(Math.random() * predefinedResponses.default.length)];
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date().toISOString()
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputMessage("");

    // Simulate typing delay
    setTimeout(() => {
      const assistantResponse: Message = {
        role: 'assistant',
        content: generateResponse(userMessage.content),
        timestamp: new Date().toISOString()
      };

      const finalMessages = [...updatedMessages, assistantResponse];
      setMessages(finalMessages);

      // Save conversation
      if (conversationId) {
        updateConversationMutation.mutate({ id: conversationId, messages: finalMessages });
      } else {
        createConversationMutation.mutate(finalMessages);
      }
    }, 1000 + Math.random() * 1000); // 1-2 second delay for realism
  };

  const startNewConversation = () => {
    const welcomeMessage: Message = {
      role: 'assistant',
      content: predefinedResponses.greeting[Math.floor(Math.random() * predefinedResponses.greeting.length)],
      timestamp: new Date().toISOString()
    };
    
    setMessages([welcomeMessage]);
    setConversationId(null);
    setInputMessage("");
  };

  return (
    <Card className="border-mom-pink-light h-[600px] flex flex-col">
      <CardHeader className="border-b border-mom-pink-light">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl flex items-center space-x-2">
            <div className="w-10 h-10 bg-mom-pink-light rounded-full flex items-center justify-center">
              <Bot className="w-6 h-6 text-mom-pink" />
            </div>
            <div>
              <span>MOMazing AI Assistant</span>
              <div className="flex items-center space-x-2 mt-1">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm text-mom-gray font-normal">Online</span>
              </div>
            </div>
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={startNewConversation}
            className="text-mom-pink border-mom-pink-light hover:bg-mom-pink-light"
          >
            New Chat
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0">
        {/* Messages Area */}
        <ScrollArea className="flex-1 p-6">
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex items-start space-x-3 ${
                  message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  message.role === 'user'
                    ? 'bg-mom-pink text-white'
                    : 'bg-mom-pink-light text-mom-pink'
                }`}>
                  {message.role === 'user' ? (
                    <User className="w-4 h-4" />
                  ) : (
                    <Bot className="w-4 h-4" />
                  )}
                </div>
                
                <div className={`max-w-[80%] p-3 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-mom-pink text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}>
                  <p className="text-sm leading-relaxed">{message.content}</p>
                  <p className={`text-xs mt-2 ${
                    message.role === 'user' ? 'text-mom-pink-light' : 'text-gray-500'
                  }`}>
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
            
            {/* Typing indicator */}
            {(createConversationMutation.isPending || updateConversationMutation.isPending) && (
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-mom-pink-light text-mom-pink rounded-full flex items-center justify-center">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-gray-100 p-3 rounded-lg">
                  <div className="flex items-center space-x-1">
                    <Loader2 className="w-4 h-4 animate-spin text-mom-pink" />
                    <span className="text-sm text-gray-600">Assistant is typing...</span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Message Input */}
        <div className="border-t border-mom-pink-light p-4">
          <form onSubmit={handleSendMessage} className="flex space-x-2">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Type your message here..."
              className="flex-1"
              disabled={createConversationMutation.isPending || updateConversationMutation.isPending}
            />
            <Button
              type="submit"
              disabled={!inputMessage.trim() || createConversationMutation.isPending || updateConversationMutation.isPending}
              className="bg-mom-pink hover:bg-mom-pink-accent text-white"
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
          
          <div className="flex items-center justify-center mt-3 space-x-4 text-xs text-gray-500">
            <div className="flex items-center space-x-1">
              <Heart className="w-3 h-3 text-mom-pink" />
              <span>Always here to support you</span>
            </div>
            <span>•</span>
            <div className="flex items-center space-x-1">
              <MessageSquare className="w-3 h-3 text-mom-pink" />
              <span>Available 24/7</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
