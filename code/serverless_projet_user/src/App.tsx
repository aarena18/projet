import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Team from "./pages/Team";
import Project from "./pages/Project";

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { token, loading } = useAuth();
  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        Chargement...
      </div>
    );
  return token ? <>{children}</> : <Navigate to="/login" />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        }
      />
      <Route
        path="/teams/:teamId"
        element={
          <PrivateRoute>
            <Team />
          </PrivateRoute>
        }
      />
      <Route
        path="/projects/:projectId"
        element={
          <PrivateRoute>
            <Project />
          </PrivateRoute>
        }
      />
      <Route path="/" element={<Navigate to="/dashboard" />} />
    </Routes>
  );
}
