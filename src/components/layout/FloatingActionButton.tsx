import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Plus, MessageCircle, Edit3, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

export const FloatingActionButton = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);

  // Don't show on mobile if not on main pages
  if (!isMobile) return null;

  // Don't show FAB on certain pages
  const hiddenRoutes = ['/auth', '/reset-password', '/chat/', '/discover'];
  const shouldHide = hiddenRoutes.some(route => location.pathname.includes(route));
  if (shouldHide) return null;

  const handleNewPost = () => {
    navigate('/home');
    setIsOpen(false);
    // Scroll to top where PostComposer is
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
  };

  const handleNewChat = () => {
    navigate('/messages');
    setIsOpen(false);
  };

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 animate-in fade-in duration-200"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* FAB Container */}
      <div className="fixed bottom-20 right-4 z-50 flex flex-col items-end gap-3">
        {/* Action Buttons - appear when open */}
        {isOpen && (
          <div className="flex flex-col gap-3 animate-in slide-in-from-bottom-2 duration-300">
            {/* New Post Button */}
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium bg-card/95 backdrop-blur-sm px-3 py-2 rounded-lg shadow-lg border border-border/50">
                New Post
              </span>
              <Button
                size="lg"
                className="h-14 w-14 rounded-full shadow-xl bg-secondary hover:bg-secondary/90"
                onClick={handleNewPost}
              >
                <Edit3 className="h-6 w-6" />
              </Button>
            </div>

            {/* New Chat Button */}
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium bg-card/95 backdrop-blur-sm px-3 py-2 rounded-lg shadow-lg border border-border/50">
                New Chat
              </span>
              <Button
                size="lg"
                className="h-14 w-14 rounded-full shadow-xl bg-primary hover:bg-primary/90"
                onClick={handleNewChat}
              >
                <MessageCircle className="h-6 w-6" />
              </Button>
            </div>
          </div>
        )}

        {/* Main FAB Button */}
        <Button
          size="lg"
          className={cn(
            "h-16 w-16 rounded-full shadow-2xl transition-all duration-300",
            isOpen 
              ? "bg-destructive hover:bg-destructive/90 rotate-45" 
              : "bg-gradient-primary hover:opacity-90"
          )}
          onClick={toggleMenu}
        >
          {isOpen ? (
            <X className="h-7 w-7" />
          ) : (
            <Plus className="h-7 w-7" />
          )}
        </Button>
      </div>
    </>
  );
};
