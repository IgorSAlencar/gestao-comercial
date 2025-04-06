
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import PrivateRoute from "@/components/PrivateRoute";
import Layout from "@/components/Layout";
import LoginPage from "@/pages/Login";
import AgendaPage from "@/pages/Agenda";
import HotlistPage from "@/pages/Hotlist";
import OpportunidadesPage from "@/pages/Oportunidades";
import DashboardPage from "@/pages/Dashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<Navigate to="/agenda" replace />} />
            <Route 
              path="/agenda" 
              element={
                <PrivateRoute>
                  <Layout><AgendaPage /></Layout>
                </PrivateRoute>
              } 
            />
            <Route 
              path="/hotlist" 
              element={
                <PrivateRoute>
                  <Layout><HotlistPage /></Layout>
                </PrivateRoute>
              } 
            />
            <Route 
              path="/oportunidades" 
              element={
                <PrivateRoute>
                  <Layout><OpportunidadesPage /></Layout>
                </PrivateRoute>
              } 
            />
            <Route 
              path="/dashboard" 
              element={
                <PrivateRoute>
                  <Layout><DashboardPage /></Layout>
                </PrivateRoute>
              } 
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
