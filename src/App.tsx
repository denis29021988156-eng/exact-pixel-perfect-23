import { lazy, Suspense, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { homeFor, useAuth } from "@/contexts/auth";
import { Toaster } from "@/components/ios/Toaster";
import { Splash, FullScreenError } from "@/components/gov/Splash";
import type { Role } from "@/lib/types";
import { ApiError } from "@/lib/api";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import NoAccess from "./pages/NoAccess";
import NotFound from "./pages/NotFound";

const TabletLayout = lazy(() => import("./pages/tablet/TabletLayout"));
const Today = lazy(() => import("./pages/tablet/Today"));
const Signals = lazy(() => import("./pages/tablet/Signals"));
const Instructions = lazy(() => import("./pages/tablet/Instructions"));
const Agenda = lazy(() => import("./pages/tablet/Agenda"));

const TeamLayout = lazy(() => import("./pages/team/TeamLayout"));
const TeamSignals = lazy(() => import("./pages/team/TeamSignals"));
const TeamInstructions = lazy(() => import("./pages/team/TeamInstructions"));
const TeamAgenda = lazy(() => import("./pages/team/TeamAgenda"));
const TeamSettings = lazy(() => import("./pages/team/TeamSettings"));
const TeamUsers = lazy(() => import("./pages/team/TeamUsers"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Нет доступа или сессия истекла — повторять бессмысленно.
      retry: (count, err) => count < 2 && !(err instanceof ApiError && (err.code === "42501" || err.status === 401)),
      refetchOnWindowFocus: true,
    },
  },
});

function RequireRole({ roles, children }: { roles: Role[]; children: ReactNode }) {
  const { status, role, roleError, reloadRole } = useAuth();
  const location = useLocation();

  if (status === "loading") return <Splash />;
  if (status === "signed_out") {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?next=${next}`} replace />;
  }
  if (roleError) return <FullScreenError message={roleError} onRetry={reloadRole} />;
  if (!role) return <Navigate to="/no-access" replace />;
  if (!roles.includes(role)) return <Navigate to={homeFor(role)} replace />;
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        <Toaster />
        <Suspense fallback={<Splash />}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/auth" element={<Navigate to="/login" replace />} />
            <Route path="/no-access" element={<NoAccess />} />

            <Route
              path="/app"
              element={
                <RequireRole roles={["governor", "team", "admin"]}>
                  <TabletLayout />
                </RequireRole>
              }
            >
              <Route index element={<Today />} />
              <Route path="signals" element={<Signals />} />
              <Route path="instructions" element={<Instructions />} />
              <Route path="agenda" element={<Agenda />} />
              <Route path="*" element={<Navigate to="/app" replace />} />
            </Route>

            <Route
              path="/team"
              element={
                <RequireRole roles={["team", "admin"]}>
                  <TeamLayout />
                </RequireRole>
              }
            >
              <Route index element={<Navigate to="signals" replace />} />
              <Route path="signals" element={<TeamSignals />} />
              <Route path="instructions" element={<TeamInstructions />} />
              <Route path="agenda" element={<TeamAgenda />} />
              <Route path="settings" element={<TeamSettings />} />
              <Route path="users" element={<TeamUsers />} />
              <Route path="*" element={<Navigate to="/team" replace />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
