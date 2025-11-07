import { Outlet } from "react-router-dom";
import TopNav from "./TopNav";
import LeftSidebar from "./LeftSidebar";
import RightSidebar from "./RightSidebar";
import MobileSidebar from "./MobileSidebar";
import { useSidebarState } from "@/hooks/useSidebarState";

const AppLayout = () => {
  const { isCollapsed } = useSidebarState();

  return (
    <div className="min-h-screen bg-background flex flex-col w-full">
      {/* Top Navigation Bar */}
      <TopNav />
      
      {/* Mobile Sidebar */}
      <MobileSidebar />
      
      {/* Main Layout: Sidebar + Content + Right Sidebar */}
      <div className="flex flex-1 w-full">
        {/* Left Sidebar */}
        <LeftSidebar />
        
        {/* Main Content Area */}
        <main 
          className={`flex-1 min-w-0 transition-all duration-300 pt-16 ${
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
