import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import AppLayout from "./components/AppLayout";
import LandingPage from "./pages/LandingPage";
import AuthPage from "./pages/AuthPage";
import TodayPage from "./pages/TodayPage";
import IncidentsPage from "./pages/IncidentsPage";
import ProgramPage from "./pages/ProgramPage";
import TasksPage from "./pages/TasksPage";
import CheatsheetPage from "./pages/CheatsheetPage";
import MapPage from "./pages/MapPage";
import ReputationPage from "./pages/ReputationPage";
import DataQualityPage from "./pages/DataQualityPage";
import ExcelUploadPage from "./pages/ExcelUploadPage";
import ModerationPage from "./pages/ModerationPage";
import AIExtractPage from "./pages/AIExtractPage";
import TelegramInboxPage from "./pages/TelegramInboxPage";
import PublicDashboard from "./pages/PublicDashboard";
import SlaMatrixPage from "./pages/SlaMatrixPage";
import UsersPage from "./pages/UsersPage";
import AuditLogPage from "./pages/AuditLogPage";
import FeatureFlagsPage from "./pages/FeatureFlagsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Загрузка...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <ProtectedRoute>
      <AppLayout>
        <Routes>
          <Route path="/" element={<TodayPage />} />
          <Route path="/incidents" element={<IncidentsPage />} />
          <Route path="/program" element={<ProgramPage />} />
          <Route path="/tasks" element={<TasksPage />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/reputation" element={<ReputationPage />} />
          <Route path="/data-quality" element={<DataQualityPage />} />
          <Route path="/excel-upload" element={<ExcelUploadPage />} />
          <Route path="/moderation" element={<ModerationPage />} />
          <Route path="/ai-extract" element={<AIExtractPage />} />
          <Route path="/telegram-inbox" element={<TelegramInboxPage />} />
          <Route path="/cheatsheet" element={<CheatsheetPage />} />
          <Route path="/sla-matrix" element={<SlaMatrixPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/audit-log" element={<AuditLogPage />} />
          <Route path="/feature-flags" element={<FeatureFlagsPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AppLayout>
    </ProtectedRoute>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/public" element={<PublicDashboard />} />
            <Route path="/app/*" element={<AppRoutes />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
