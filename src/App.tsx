import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { WalletContextProvider } from "@/contexts/WalletContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppLayout from "@/components/layout/AppLayout";
import { RouteTransition } from "@/components/RouteTransition";
import Index from "./pages/Index";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import PublicProfile from "./pages/PublicProfile";
import Chat from "./pages/Chat";
import CreatorDashboard from "./pages/CreatorDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import Badges from "./pages/Badges";
import Purchases from "./pages/Purchases";
import Marketplace from "./pages/Marketplace";
import Messages from "./pages/Messages";
import Notifications from "./pages/Notifications";
import Friends from "./pages/Friends";
import Discover from "./pages/Discover";
import Matches from "./pages/Matches";
import ChatRequests from "./pages/ChatRequests";
import LikesSent from "./pages/LikesSent";
import LikesReceived from "./pages/LikesReceived";
import Connections from "./pages/Connections";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <WalletContextProvider>
          <AuthProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
            <Routes>
              {/* Landing Page (No Layout) */}
              <Route path="/" element={
                <RouteTransition>
                  <Index />
                </RouteTransition>
              } />
              
              {/* Auth Page (No Layout) */}
              <Route path="/auth" element={
                <RouteTransition>
                  <Auth />
                </RouteTransition>
              } />
              
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
                <Route path="/connections" element={
                  <ProtectedRoute>
                    <Connections />
                  </ProtectedRoute>
                } />
                <Route path="/discover" element={
                  <ProtectedRoute>
                    <Discover />
                  </ProtectedRoute>
                } />
                <Route path="/likes-sent" element={
                  <ProtectedRoute>
                    <LikesSent />
                  </ProtectedRoute>
                } />
                <Route path="/likes-received" element={
                  <ProtectedRoute>
                    <LikesReceived />
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
                <Route path="/badges" element={
                  <ProtectedRoute>
                    <Badges />
                  </ProtectedRoute>
                } />
                <Route path="/chat-requests" element={
                  <ProtectedRoute>
                    <ChatRequests />
                  </ProtectedRoute>
                } />
              </Route>
              
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={
                <RouteTransition>
                  <NotFound />
                </RouteTransition>
              } />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </WalletContextProvider>
    </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
