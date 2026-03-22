import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "@/pages/HomePage";
import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/DashboardPage";
import UsersPage from "@/pages/UsersPage";
import PlansPage from "@/pages/PlansPage";
import OrdersPage from "@/pages/OrdersPage";
import ProfilePage from "@/pages/ProfilePage";
import NotFoundPage from "@/pages/NotFoundPage";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Ticket  from "@/pages/TicketManagement";
import LiveChat from "@/pages/LiveChatManagement";
import IpPoolPage from "@/pages/IpPoolPage"

function App() {
  return (
    <TooltipProvider>
      <BrowserRouter basename="/admin">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          
          {/* Protected Dashboard Routes */}
          <Route path="/dashboard" element={
            <DashboardLayout>
              <DashboardPage />
            </DashboardLayout>
          } />
          
          <Route path="/users" element={
            <DashboardLayout>
              <UsersPage />
            </DashboardLayout>
          } />
          
          <Route path="/plans" element={
            <DashboardLayout>
              <PlansPage />
            </DashboardLayout>
          } />
          <Route path="/ips" element={
            <DashboardLayout>
              <IpPoolPage />
            </DashboardLayout>
          } />
          
          <Route path="/orders" element={
            <DashboardLayout>
              <OrdersPage />
            </DashboardLayout>
          } />
          
          <Route path="/profile" element={
            <DashboardLayout>
              <ProfilePage />
            </DashboardLayout>
          } />
           <Route path="/ticket" element={
            <DashboardLayout>
              <Ticket />
            </DashboardLayout>
          } />
          <Route path="/live" element={
            <DashboardLayout>
              <LiveChat />
            </DashboardLayout>
          } />
          {/* Fallback Routes */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
      <Toaster />
    </TooltipProvider>
  );
}

export default App;
