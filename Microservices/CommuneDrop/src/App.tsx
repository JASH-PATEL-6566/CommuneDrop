"use client";

import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import routes from "./routes/Index";

export default function App() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      {routes
        .filter((route) => !route.protected)
        .map((route) => (
          <Route
            key={route.path}
            path={route.path}
            element={
              isAuthenticated && route.redirectIfAuthenticated ? (
                <Navigate to="/home" replace />
              ) : (
                route.element
              )
            }
          />
        ))}
      <Route element={<ProtectedRoute />}>
        {routes
          .filter((route) => route.protected)
          .map((route) => (
            <Route key={route.path} path={route.path} element={route.element} />
          ))}
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
