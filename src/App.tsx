
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import VacancyReferral from "./pages/VacancyReferral";
import VacancyApply from "./pages/VacancyApply";
import EmployeeInvite from "./pages/EmployeeInvite";
import EmployeeRegister from "./pages/EmployeeRegister";
import VerifyEmail from "./pages/VerifyEmail";
import NotFound from "./pages/NotFound";
import Admin from "./pages/Admin";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/r/:token" element={<VacancyReferral />} />
          <Route path="/vacancy/:vacancyId" element={<VacancyApply />} />
          <Route path="/invite/:token" element={<EmployeeInvite />} />
          <Route path="/employee-register" element={<EmployeeRegister />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/admin" element={<Admin />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;