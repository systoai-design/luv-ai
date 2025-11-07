import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { WalletContextProvider } from "@/contexts/WalletContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppLayout from "@/components/layout/AppLayout";
import Index from "./pages/Index";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import PublicProfile from "./pages/PublicProfile";
import Chat from "./pages/Chat";
import CreatorDashboard from "./pages/CreatorDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import Purchases from "./pages/Purchases";
import Marketplace from "./pages/Marketplace";
import Messages from "./pages/Messages";
import Notifications from "./pages/Notifications";
import Friends from "./pages/Friends";
import Discover from "./pages/Discover";
import Matches from "./pages/Matches";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <WalletContextProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Landing Page (No Layout) */}
              <Route path="/" element={<Index />} />
              
              {/* Web App Routes (With AppLayout) */}
              <Route element={<AppLayout />}>
                <Route path="/home" element={
                  <ProtectedRoute>
                    <Home />
                  </ProtectedRoute>
                } />
                <Route path="/profile" element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                } />
                <Route path="/profile/:username" element={<PublicProfile />} />
                <Route path="/marketplace" element={
                  <ProtectedRoute>
                    <Marketplace />
                  </ProtectedRoute>
                } />
                <Route path="/messages" element={
                  <ProtectedRoute>
                    <Messages />
                  </ProtectedRoute>
                } />
                <Route path="/notifications" element={
                  <ProtectedRoute>
                    <Notifications />
                  </ProtectedRoute>
                } />
                <Route path="/friends" element={
                  <ProtectedRoute>
                    <Friends />
                  </ProtectedRoute>
                } />
                <Route path="/chat/:companionId" element={
                  <ProtectedRoute>
                    <Chat />
                  </ProtectedRoute>
                } />
                <Route path="/purchases" element={
                  <ProtectedRoute>
                    <Purchases />
                  </ProtectedRoute>
                } />
                <Route path="/discover" element={
                  <ProtectedRoute>
                    <Discover />
                  </ProtectedRoute>
                } />
                <Route path="/matches" element={
                  <ProtectedRoute>
                    <Matches />
                  </ProtectedRoute>
                } />
                <Route path="/creator" element={
                  <ProtectedRoute>
                    <CreatorDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/admin" element={
                  <ProtectedRoute>
                    <AdminDashboard />
                  </ProtectedRoute>
                } />
              </Route>
              
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </WalletContextProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
