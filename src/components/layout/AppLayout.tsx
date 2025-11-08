import { Outlet } from "react-router-dom";
import TopNav from "./TopNav";
import LeftSidebar from "./LeftSidebar";
import RightSidebar from "./RightSidebar";
import MobileSidebar from "./MobileSidebar";
import { useSidebarState } from "@/hooks/useSidebarState";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";

const AppLayout = () => {
  const { isCollapsed } = useSidebarState();
  useKeyboardShortcuts(); // Enable keyboard shortcuts

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background/95 to-background/90 flex flex-col w-full overflow-x-hidden relative">
      {/* Floating blur orbs for ambiance */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 -left-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-float" />
        <div className="absolute top-40 right-10 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-accent/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '4s' }} />
      </div>

      {/* Top Navigation Bar */}
      <TopNav />
      
      {/* Mobile Sidebar */}
      <MobileSidebar />
      
      {/* Main Layout: Sidebar + Content + Right Sidebar */}
      <div className="flex flex-1 w-full relative z-10">
        {/* Left Sidebar */}
        <LeftSidebar />
        
        {/* Main Content Area */}
        <main 
          className={`flex-1 min-w-0 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] pt-16 ${
            isCollapsed ? 'lg:ml-16' : 'lg:ml-64'
          } xl:mr-80`}
        >
          <Outlet />
        </main>
        
        {/* Right Sidebar (Optional) */}
        <RightSidebar />
      </div>
    </div>
  );
};

export default AppLayout;
