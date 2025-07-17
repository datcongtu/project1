import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import Navigation from "@/components/layout/Navigation";
import Chatbot from "@/components/chat/Chatbot";
import { MessageSquare } from "lucide-react";

export default function Chat() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
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
  }, [isAuthenticated, isLoading, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-mom-pink rounded-2xl flex items-center justify-center mb-4 mx-auto animate-pulse">
            <MessageSquare className="text-white w-8 h-8" />
          </div>
          <p className="text-mom-gray">Loading your AI assistant...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Assistant</h1>
          <p className="text-mom-gray text-lg">
            Your 24/7 companion for postpartum support, guidance, and motivation
          </p>
        </div>

        {/* Chatbot Component */}
        <Chatbot />
      </div>
    </div>
  );
}
