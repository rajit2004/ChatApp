import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ChatLayout from "./pages/ChatLayout";
import ProtectedRoute from "./components/ProtectedRoute";

function PublicRoute({ children }: { children: any }) {
  const token = localStorage.getItem("token");
  if (token) return <Navigate to="/chat" />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        } />
        <Route path="/signup" element={
          <PublicRoute>
            <Signup />
          </PublicRoute>
        } />
        <Route path="/chat" element={
          <ProtectedRoute>
            <ChatLayout />
          </ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}