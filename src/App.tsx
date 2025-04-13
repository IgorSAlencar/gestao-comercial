import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import PrivateRoute from "@/components/PrivateRoute";
import Layout from "@/components/Layout";
import LoginPage from "@/pages/Login";
import IndexPage from "@/pages/Index";
import AgendaPage from "@/pages/Agenda";
import EstrategiaComercial from "@/pages/EstrategiaComercial";
import DetalhesEstrategia from "@/pages/DetalhesEstrategia";

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
            <Route path="/" element={
              <PrivateRoute>
                <Layout><IndexPage /></Layout>
              </PrivateRoute>
            } />
            <Route 
              path="/agenda" 
              element={
                <PrivateRoute>
                  <Layout><AgendaPage /></Layout>
                </PrivateRoute>
              } 
            />

            <Route 
              path="/estrategia-comercial" 
              element={
                <PrivateRoute>
                  <Layout><EstrategiaComercial /></Layout>
                </PrivateRoute>
              } 
            />
            <Route 
              path="/estrategia/:produto" 
              element={
                <PrivateRoute>
                  <Layout><DetalhesEstrategia /></Layout>
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
