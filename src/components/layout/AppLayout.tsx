import { Outlet } from "react-router-dom";
import TopNav from "./TopNav";
import LeftSidebar from "./LeftSidebar";
import RightSidebar from "./RightSidebar";

const AppLayout = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col w-full">
      {/* Top Navigation Bar */}
      <TopNav />
      
      {/* Main Layout: Sidebar + Content + Right Sidebar */}
      <div className="flex flex-1 pt-16 w-full">
        {/* Left Sidebar */}
        <LeftSidebar />
        
        {/* Main Content Area */}
        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
        
        {/* Right Sidebar (Optional) */}
        <RightSidebar />
      </div>
    </div>
  );
};

export default AppLayout;
