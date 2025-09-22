import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { FolderKanban, Bell, ChevronDown, LayoutDashboard, FolderOpen, PlayCircle, Users, Hash, Code, Menu, X, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link, useLocation } from "wouter";

export function NavigationHeader() {
  const { user } = useAuth();
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const navigationItems = [
    { path: "/", icon: LayoutDashboard, label: "Dashboard" },
    { path: "/projects", icon: FolderOpen, label: "Projects" },
    { path: "/keywords", icon: Hash, label: "Keywords" },
    { path: "/campaigns", icon: PlayCircle, label: "Campaigns" },
    { path: "/advertisers", icon: Users, label: "Advertisers" },
    { path: "/traffic-sources", icon: Users, label: "Traffic Sources" },
    { path: "/meta-ads", icon: Globe, label: "Meta Ads" },
    { path: "/api", icon: Code, label: "API" },
  ];

  const getInitials = (user: any) => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`;
    }
    if (user?.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return "U";
  };

  const getDisplayName = (user: any) => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    if (user?.email) {
      return user.email;
    }
    return "User";
  };

  const isActiveLink = (path: string) => {
    if (path === "/" || path === "/dashboard") {
      return location === "/" || location === "/dashboard";
    }
    return location === path;
  };

  return (
    <nav className="bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
                <FolderKanban className="text-white text-sm" />
              </div>
              <Link href="/" className="ml-2 text-xl font-semibold text-slate-900 cursor-pointer">
                Traffid
              </Link>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:ml-10 md:flex md:space-x-8">
              {navigationItems.map((item) => (
                <Link 
                  key={item.path}
                  href={item.path} 
                  className={`${isActiveLink(item.path) ? "border-primary text-slate-900" : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Mobile menu button */}
            <div className="md:hidden">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2"
              >
                {isMobileMenuOpen ? (
                  <X className="h-6 w-6 text-slate-600" />
                ) : (
                  <Menu className="h-6 w-6 text-slate-600" />
                )}
              </Button>
            </div>

            {/* Notification button - hidden on mobile */}
            <Button variant="ghost" size="sm" className="hidden sm:flex">
              <Bell className="h-5 w-5 text-slate-400" />
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.profileImageUrl} alt="User avatar" />
                    <AvatarFallback>{getInitials(user)}</AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:block text-slate-700 font-medium">{getDisplayName(user)}</span>
                  <ChevronDown className="h-4 w-4 text-slate-400 hidden sm:block" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem>Profile</DropdownMenuItem>
                <DropdownMenuItem>Settings</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => window.location.href = '/api/logout'}>
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t border-slate-200">
              {navigationItems.map((item) => {
                const IconComponent = item.icon;
                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    className={`${
                      isActiveLink(item.path)
                        ? "bg-primary/10 border-primary text-primary"
                        : "border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    } block pl-3 pr-4 py-2 border-l-4 text-base font-medium flex items-center space-x-3`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <IconComponent className="h-5 w-5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
