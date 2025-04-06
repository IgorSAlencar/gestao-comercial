
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "@/components/Layout";
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
        <Routes>
          <Route path="/" element={<Navigate to="/agenda" replace />} />
          <Route path="/agenda" element={<Layout><AgendaPage /></Layout>} />
          <Route path="/hotlist" element={<Layout><HotlistPage /></Layout>} />
          <Route path="/oportunidades" element={<Layout><OpportunidadesPage /></Layout>} />
          <Route path="/dashboard" element={<Layout><DashboardPage /></Layout>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
