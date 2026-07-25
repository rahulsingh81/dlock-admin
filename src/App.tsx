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
import { ConfirmProvider } from "@/components/confirm-provider";
import { ErrorBoundary } from "@/components/error-boundary";
import Ticket  from "@/pages/TicketManagement";
import IpPoolPage from "@/pages/IpPoolPage"
import ContentPages from "@/pages/ContentPages"
import BlogsPage from "@/pages/BlogsPage"
import TransactionsPage from "@/pages/TransactionsPage"
import CAInvoicePage from "@/pages/CAInvoicePage"
import DatabaseBackupPage from "@/pages/DatabaseBackupPage"
import NotificationsPage from "@/pages/NotificationsPage"
import SettingsPage from "@/pages/SettingsPage"
import CouponPage from "@/pages/CouponPage"
import PortfolioPage from "@/pages/PortfolioPage"
import ContactPage from "@/pages/ContactPage"
import RenewalsExpiryPage from "@/pages/RenewalsExpiryPage"
import ReportsPage from "@/pages/ReportsPage"
import CampaignsPage from "@/pages/CampaignsPage"
import DeveloperPage from "@/pages/DeveloperPage"
import PosterGeneratorPage from "@/pages/PosterGeneratorPage"

function App() {
  return (
    <TooltipProvider>
      <ConfirmProvider>
      <BrowserRouter basename="/admin">
        <ErrorBoundary>
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

          <Route path="/content" element={
            <DashboardLayout>
              <ContentPages />
            </DashboardLayout>
          } />

          <Route path="/blogs" element={
            <DashboardLayout>
              <BlogsPage />
            </DashboardLayout>
          } />

          <Route path="/transactions" element={
            <DashboardLayout>
              <TransactionsPage />
            </DashboardLayout>
          } />

          <Route path="/ca-invoices" element={
            <DashboardLayout>
              <CAInvoicePage />
            </DashboardLayout>
          } />

          <Route path="/backup" element={
            <DashboardLayout>
              <DatabaseBackupPage />
            </DashboardLayout>
          } />

          <Route path="/notifications" element={
            <DashboardLayout>
              <NotificationsPage />
            </DashboardLayout>
          } />

          <Route path="/settings" element={
            <DashboardLayout>
              <SettingsPage />
            </DashboardLayout>
          } />

          <Route path="/coupons" element={
            <DashboardLayout>
              <CouponPage />
            </DashboardLayout>
          } />

          <Route path="/poster" element={
            <DashboardLayout>
              <PosterGeneratorPage />
            </DashboardLayout>
          } />

          <Route path="/development" element={
            <DashboardLayout>
              <PortfolioPage />
            </DashboardLayout>
          } />

          <Route path="/enquiries" element={
            <DashboardLayout>
              <ContactPage />
            </DashboardLayout>
          } />

          <Route path="/renewals" element={
            <DashboardLayout>
              <RenewalsExpiryPage />
            </DashboardLayout>
          } />

          <Route path="/reports" element={
            <DashboardLayout>
              <ReportsPage />
            </DashboardLayout>
          } />

          <Route path="/campaigns" element={
            <DashboardLayout>
              <CampaignsPage />
            </DashboardLayout>
          } />

          <Route path="/developer" element={
            <DashboardLayout>
              <DeveloperPage />
            </DashboardLayout>
          } />

          {/* Fallback Routes */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
        </ErrorBoundary>
      </BrowserRouter>
      <Toaster />
      </ConfirmProvider>
    </TooltipProvider>
  );
}

export default App;