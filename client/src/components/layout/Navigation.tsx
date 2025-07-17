import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { 
  Heart, 
  Bell, 
  Menu, 
  X, 
  Dumbbell, 
  Brain, 
  TrendingUp, 
  MessageSquare,
  LogOut
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function Navigation() {
  const [location] = useLocation();
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { path: "/exercises", label: "Exercises", icon: Dumbbell },
    { path: "/wellness", label: "Wellness", icon: Brain },
    { path: "/progress", label: "Progress", icon: TrendingUp },
    { path: "/chat", label: "Support", icon: MessageSquare },
  ];

  const isActive = (path: string) => location === path;

  return (
    <nav className="bg-white shadow-sm border-b border-mom-pink-light">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/">
            <div className="flex items-center space-x-3 cursor-pointer">
              <div className="w-10 h-10 bg-mom-pink-light rounded-lg flex items-center justify-center">
                <Heart className="text-mom-pink w-5 h-5" />
              </div>
              <span className="text-xl font-bold text-mom-pink">MOMazing</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {navItems.map((item) => {
              const IconComponent = item.icon;
              return (
                <Link key={item.path} href={item.path}>
                  <Button
                    variant="ghost"
                    className={`flex items-center space-x-2 transition-colors ${
                      isActive(item.path)
                        ? "text-mom-pink bg-mom-pink-light"
                        : "text-mom-gray hover:text-mom-pink"
                    }`}
                  >
                    <IconComponent className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Button>
                </Link>
              );
            })}
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-3">
            {/* Notifications */}
            <Button variant="ghost" size="sm" className="relative p-2">
              <Bell className="w-5 h-5 text-mom-gray hover:text-mom-pink" />
              <Badge className="absolute -top-1 -right-1 bg-mom-pink text-white text-xs h-5 w-5 rounded-full flex items-center justify-center">
                3
              </Badge>
            </Button>

            {/* User Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-2 p-2">
                  <Avatar className="w-8 h-8">
                    <AvatarImage 
                      src={user?.profileImageUrl || ""} 
                      alt={user?.firstName || "User"} 
                    />
                    <AvatarFallback className="bg-mom-pink-light text-mom-pink">
                      {user?.firstName?.charAt(0) || user?.email?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium text-mom-gray hidden sm:block">
                    {user?.firstName || "User"}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{user?.firstName} {user?.lastName}</p>
                  <p className="text-xs text-mom-gray">{user?.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/progress" className="cursor-pointer">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    View Progress
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/wellness" className="cursor-pointer">
                    <Brain className="w-4 h-4 mr-2" />
                    Mental Wellness
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => window.location.href = '/api/logout'}
                  className="text-red-600 cursor-pointer"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5 text-mom-gray" />
              ) : (
                <Menu className="w-5 h-5 text-mom-gray" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-mom-pink-light">
            <div className="space-y-2">
              {navItems.map((item) => {
                const IconComponent = item.icon;
                return (
                  <Link key={item.path} href={item.path}>
                    <Button
                      variant="ghost"
                      className={`w-full justify-start space-x-2 ${
                        isActive(item.path)
                          ? "text-mom-pink bg-mom-pink-light"
                          : "text-mom-gray"
                      }`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <IconComponent className="w-4 h-4" />
                      <span>{item.label}</span>
                    </Button>
                  </Link>
                );
              })}
              <div className="pt-2 border-t border-mom-pink-light">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-red-600"
                  onClick={() => window.location.href = '/api/logout'}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign out
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
