import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/ui/Navbar';
import { Footer } from './components/ui/Footer';

import { Landing } from './pages/Landing';
import { EventDetail } from './pages/EventDetail';
import { TicketPass } from './pages/TicketPass';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { DashboardContainer } from './pages/dashboards/DashboardContainer';

/** Gate for authenticated-only routes; sends anonymous visitors to the login page. */
const RequireAuth = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-forge-bg flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-forge-accent border-t-transparent animate-spin" />
      </div>
    );
  }

  return user ? children : <Navigate to="/login" replace />;
};

export function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="flex flex-col min-h-screen bg-forge-bg text-slate-900 font-sans">
          <Navbar />

          <div className="flex-1">
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/events/:slug" element={<EventDetail />} />
              <Route path="/ticket-pass/:id" element={<TicketPass />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route
                path="/dashboard"
                element={
                  <RequireAuth>
                    <DashboardContainer />
                  </RequireAuth>
                }
              />
            </Routes>
          </div>

          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
