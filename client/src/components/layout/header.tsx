import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  title?: string;
  description?: string;
}

export default function Header({ 
  title = "Dashboard", 
  description = "Monitor your Twitter growth and manage content" 
}: HeaderProps) {
  const { data: user } = useQuery({
    queryKey: ["/api/auth/user"],
  });

  return (
    <header className="bg-white shadow-sm border-b border-slate-200 px-6 py-4" data-testid="header">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800" data-testid="text-title">{title}</h2>
          <p className="text-slate-600 mt-1" data-testid="text-description">{description}</p>
        </div>
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <Button variant="ghost" size="sm" className="relative" data-testid="button-notifications">
            <i className="fas fa-bell text-lg"></i>
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
          </Button>
          
          {/* User Menu */}
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex items-center space-x-2"
            onClick={() => window.location.href = '/settings'}
            data-testid="button-user-menu"
          >
            {(user as any)?.profileImageUrl ? (
              <img 
                src={(user as any).profileImageUrl} 
                alt="User avatar" 
                className="w-8 h-8 rounded-full" 
                data-testid="img-user-avatar"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
                <i className="fas fa-user text-slate-400"></i>
              </div>
            )}
            <i className="fas fa-chevron-down text-slate-400 text-xs"></i>
          </Button>
        </div>
      </div>
    </header>
  );
}
