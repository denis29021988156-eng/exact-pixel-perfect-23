import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppLayout from "./components/AppLayout";
import LandingPage from "./pages/LandingPage";
import TodayPage from "./pages/TodayPage";
import IncidentsPage from "./pages/IncidentsPage";
import ProgramPage from "./pages/ProgramPage";
import TasksPage from "./pages/TasksPage";
import CheatsheetPage from "./pages/CheatsheetPage";
import MapPage from "./pages/MapPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AppRoutes() {
  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<TodayPage />} />
        <Route path="/incidents" element={<IncidentsPage />} />
        <Route path="/program" element={<ProgramPage />} />
        <Route path="/tasks" element={<TasksPage />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/cheatsheet" element={<CheatsheetPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AppLayout>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/app/*" element={<AppRoutes />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
