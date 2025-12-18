import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import Sessions from "./pages/Sessions";
import TimeSlots from "./pages/TimeSlots";
import Rooms from "./pages/Rooms";
import Constraints from "./pages/Constraints";
import Generate from "./pages/Generate";
import Reports from "./pages/Reports";
import NotFound from "./pages/NotFound";
import Home from "./pages/Home";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import React from "react";

const queryClient = new QueryClient();


// Simple auth check
function RequireAuth({ children }: { children: React.ReactNode }) {
  const isAuth = Boolean(localStorage.getItem("auth"));
  if (!isAuth) {
    window.location.href = "/signin";
    return null;
  }
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route element={<RequireAuth><AppLayout /></RequireAuth>}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/sessions" element={<Sessions />} />
            <Route path="/time-slots" element={<TimeSlots />} />
            <Route path="/rooms" element={<Rooms />} />
            <Route path="/constraints" element={<Constraints />} />
            <Route path="/generate" element={<Generate />} />
            <Route path="/reports" element={<Reports />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
